import { Pool, neonConfig, types as pgTypes, type PoolClient } from '@neondatabase/serverless'

neonConfig.poolQueryViaFetch = true

// numeric/decimal (OID 1700) e int8/bigint (OID 20) vêm como string por padrão
// no driver (evita perda de precisão), mas o app inteiro trata esses valores
// como number — e nada aqui (contagens, valores monetários) chega perto de
// Number.MAX_SAFE_INTEGER.
const NUMERIC_OID = 1700
const BIGINT_OID = 20
const parseNumeric = (value: string | null) => (value === null ? null : parseFloat(value))

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      types: {
        getTypeParser: (id, format) =>
          id === NUMERIC_OID || id === BIGINT_OID ? parseNumeric : pgTypes.getTypeParser(id, format),
      },
    })
  }
  return pool
}

type Queryable = { query: Pool['query'] }

async function run<T>(executor: Queryable, text: string, params: unknown[] = []): Promise<T[]> {
  const result = await executor.query(text, params)
  return result.rows as T[]
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  return run<T>(getPool(), text, params)
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

// Roda `callback` dentro de uma transação SQL (BEGIN/COMMIT/ROLLBACK) usando
// uma única conexão do pool. Use sempre que uma operação precisar de múltiplos
// INSERT/UPDATE/DELETE que devem ser tudo-ou-nada.
export async function withTransaction<T>(
  callback: (tx: { query: <R = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<R[]> }) => Promise<T>
): Promise<T> {
  const client: PoolClient = await getPool().connect()
  const tx = { query: <R = Record<string, unknown>>(text: string, params: unknown[] = []) => run<R>(client, text, params) }
  try {
    await client.query('BEGIN')
    const result = await callback(tx)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

type Executor = { query: <R = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<R[]> }

// Monta e executa `INSERT INTO table (...) VALUES (...) RETURNING *` a partir
// de um objeto simples — elimina a duplicação de "columns/values/placeholders"
// que existia em clients.ts, services.ts, expenses.ts e materials.ts.
export async function insertRow<T = Record<string, unknown>>(
  table: string,
  data: object,
  executor: Executor = { query }
): Promise<T | null> {
  const columns = Object.keys(data)
  const values = Object.values(data)
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
  const rows = await executor.query<T>(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values
  )
  return rows[0] ?? null
}

// Insere várias linhas na mesma tabela numa única viagem ao banco via
// multi-row VALUES, em vez de um INSERT por linha num loop.
export async function insertRows<T = Record<string, unknown>>(
  table: string,
  rows: Record<string, unknown>[],
  executor: Executor = { query }
): Promise<T[]> {
  if (rows.length === 0) return []
  const columns = Object.keys(rows[0])
  const values: unknown[] = []
  const valueGroups = rows.map((row) => {
    const placeholders = columns.map((col) => {
      values.push((row as Record<string, unknown>)[col])
      return `$${values.length}`
    })
    return `(${placeholders.join(', ')})`
  })
  return executor.query<T>(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valueGroups.join(', ')} RETURNING *`,
    values
  )
}

// Monta e executa `UPDATE table SET ... WHERE id = $n RETURNING *`.
export async function updateRow<T = Record<string, unknown>>(
  table: string,
  id: string,
  data: object,
  executor: Executor = { query }
): Promise<T | null> {
  const columns = Object.keys(data)
  const values = Object.values(data)
  const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ')
  const rows = await executor.query<T>(
    `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE id = $${columns.length + 1} RETURNING *`,
    [...values, id]
  )
  return rows[0] ?? null
}
