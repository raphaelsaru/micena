# Micena Piscinas — Arquitetura Técnica, System Prompt (Agentes) e Roadmap

> **Contexto**: Webapp para gerenciar **clientes**, **serviços**, **rotas** (agenda por dia útil) e **financeiro** (mensalistas, pagamentos e comprovantes), com **autenticação** (Supabase), **impressão de rotas** personalizável e **integração com Google Agenda** para lembretes de serviços. Requisitos confirmados em 12/08/2025.

---

## 1) Objetivos & Escopo

- Centralizar o cadastro de clientes e histórico de serviços.
- Planejar rotas de atendimento de **segunda a sexta**, com **n° máximo de clientes por dia**, **ordenação decrescente** e **drag & drop**, respeitando regras de preenchimento de colunas.
- Controle financeiro de mensalistas: meses pagos/em aberto, status do mês vigente, anexar comprovantes e marcação automática como pago se houver comprovante.
- Impressão de rotas em layout limpo, com **opções de fonte, tamanho e cor** (aplicada a bordas, números, textos) e ocultação de elementos de UI.
- Integração com Google Agenda para criar eventos de lembrete (próximo atendimento / validade de serviço/equipamento).

**Fora do escopo v1**: cobrança on-line, múltiplas organizações, app mobile nativo, analytics avançado.

---

## 2) Stack & Arquitetura de Alto Nível

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS; shadcn/ui.
- **Autenticação**: Supabase Auth (e-mail/senha) — 1 usuário admin (cliente) + 1 usuário nosso (suporte/maintenance opcional).
- **Banco de Dados**: Postgres (Supabase) com RLS mínima (escopo 1 organização) e chaves de serviço em rotas server-side.
- **Armazenamento**: Supabase Storage para comprovantes (PDF/JPG/PNG).
- **Integrações**: Google Calendar API (OAuth do cliente para criar eventos no calendário dele).
- **Implantação**: Vercel (frontend + rotas serverless), Supabase (DB/Storage/Auth).
- **Observabilidade**: Log de auditoria em tabela própria + Vercel Logs.

### Diagrama (conceitual)

```
[Browser]
   ⬇️ HTTPS
[Vercel / Next.js]
   ├── UI + App Router
   ├── API Routes (server actions)
   │     ├── Supabase (Postgres/RLS, Storage)
   │     └── Google Calendar (OAuth)
   └── Auth (Supabase)
```

---

## 3) Modelo de Dados (Proposta)

> Convenções: `id` UUID; timestamps `created_at`, `updated_at` (TZ). Índices para FKs e campos de consulta frequentes.

### 3.1 Tabela `clients`

- `id` (uuid, pk)
- `full_name` (text) — Nome/Razão Social
- `document` (text) — CPF ou CNPJ (normalizado, somente dígitos)
- `email` (text)
- `phone` (text)
- `address` (text)
- `neighborhood` (text) — Bairro
- `postal_code` (text)
- `pix_key` (text)
- `is_recurring` (boolean) — mensalista
- `notes` (text)

**Índices**: `idx_clients_document`, `idx_clients_name_trgm`.

### 3.2 Tabela `services`

Registra serviços prestados a um cliente.

- `id` (uuid, pk)
- `client_id` (uuid, fk -> clients)
- `service_date` (date)
- `service_type` (enum: `AREIA`, `EQUIPAMENTO`, `CAPA`, `OUTRO`)
- `equipment_details` (text) — quando `EQUIPAMENTO`
- `notes` (text)
- `next_service_date` (date) — usada p/ lembrete + Calendar
- `work_order_number` (text) — opcional para ordem/recibo

**Índices**: `idx_services_client_date`, `idx_services_next_date`.

### 3.3 Tabela `payments`

- `id` (uuid, pk)
- `client_id` (uuid, fk -> clients)
- `year` (int), `month` (int 1–12)
- `status` (enum: `PAGO`, `EM_ABERTO`)
- `receipt_url` (text, nullable)
- `marked_by_receipt` (boolean default false) — auto `true` se `receipt_url` setado
- `amount` (numeric(12,2), nullable) — opcional
- `paid_at` (timestamptz, nullable)

**Restrições**: unique `(client_id, year, month)`.

### 3.4 Tabela `route_settings`

Configurações por dia útil.

- `id` (uuid, pk)
- `weekday` (int 1=Seg … 5=Sex)
- `max_clients` (int >= 1)

**Restrições**: unique `weekday`.

### 3.5 Tabela `route_assignments`

Atribuições/ordem dos clientes por dia.

- `id` (uuid, pk)
- `client_id` (uuid, fk -> clients)
- `weekday` (int 1–5)
- `order_index` (int >= 1) — 1=primeiro na fila lógica

> **Número exibido** = `display_number = max_clients - order_index + 1` (recalculado on-the-fly para refletir mudanças de `max_clients`).

**Índices**: unique `(weekday, order_index)`, `idx_route_day_client`.

### 3.6 Tabela `audit_log`

- `id` (uuid, pk)
- `actor_user_id` (uuid)
- `action` (text)
- `entity` (text)
- `entity_id` (uuid)
- `payload` (jsonb)
- `created_at` (timestamptz)

---

## 4) Regras de Ordenação & Layout (Rotas)

### 4.1 Regras de ordenação

- Ao **adicionar** cliente em um dia: se `order_index` não for especificado, inserir ao **final** (máximo `order_index + 1`).
- Ao **reordenar via drag & drop**: recalcular `order_index` de toda a faixa afetada (operar em transação para consistência, lock por `weekday`).
- Ao **inserir entre** dois itens: atribuir `order_index` alvo e deslocar demais +1.
- Ao **excluir**: compactar (decrementar itens após o gap).
- Ao **alterar **``: **não** precisa migrar dados; `display_number` é derivado.

### 4.2 Grade visual (colunas)

- Preenchimento por coluna com **5 linhas por coluna**. Os 5 primeiros ocupam coluna 1 (top→bottom), próximo bloco de 5 vai à coluna 2 e assim por diante.
- Após preencher 2 colunas, inserir alternadamente para manter equilíbrio visual (opcional v1). Implementação simples: CSS Grid com `grid-auto-flow: column` e `grid-auto-rows: minmax(…);` + lógica para quebrar a cada 5.

### 4.3 Impressão

- @media print com ocultação de botões e controles.
- **Customização**: CSS variables p/ `--print-font-family`, `--print-font-size`, `--print-color`. Colorir bordas, números e textos a partir de `--print-color`.
- Botões: “Imprimir (preto)”, “Imprimir colorido” (abre color picker e aplica var antes de `window.print()`).

---

## 5) Fluxos Principais

### 5.1 Clientes (CRUD)

1. Listagem com busca por nome/documento;
2. Criar/Editar com campos essenciais;
3. Marcador **Mensalista**;
4. Ações rápidas: “Histórico de serviços”, “Financeiro do cliente”.

### 5.2 Serviços

1. Adicionar serviço ao cliente;
2. Definir `service_type`, `equipment_details`, `service_date`;
3. Opcional: `next_service_date`;
4. Gerar **Ordem de Serviço/Recibo** (view PDF) e **enviar por e‑mail** (v2).

### 5.3 Google Calendar

- Conectar conta Google (OAuth) do cliente;
- Para cada `next_service_date`, criar evento com título padrão: `Atendimento Micena — {Cliente}` + notas;
- Atualizações/remoções sincronizam o evento correspondente (armazenar `google_event_id` na tabela `services`).

### 5.4 Financeiro

- Visão de mensalistas: grade por **ano/mês** com marcações `PAGO`/`EM_ABERTO`.
- Upload de **comprovante** define `marked_by_receipt = true` e muda `status` para `PAGO` automaticamente; editar manualmente também é possível.

### 5.5 Rotas (Dias úteis)

- Abas horizontais (Seg–Sex); input `max_clients` por dia;
- Lista DnD de clientes; inserir “Entre” (context menu); exclusão com compactação;
- Exibição com **número decrescente** derivado e colunas de 5.

---

## 6) Segurança, Permissões & Dados

- 1 organização única. RLS permissiva com `user_id` do cliente para leitura/escrita; nossa conta de **maintenance** com role elevada via chave de serviço (apenas em rotas server-side).
- Rate-limit leve nas APIs (middleware) e validação Zod no servidor.
- Sanitização de uploads (tamanho, extensão) e varredura básica se aplicável.

---

## 7) Endpoints / Server Actions (exemplos)

- `POST /api/clients` — criar cliente
- `GET /api/clients?query=` — busca
- `PUT /api/clients/:id` — atualizar
- `DELETE /api/clients/:id`
- `POST /api/services` — criar serviço (+ opcional criar evento Google)
- `PUT /api/services/:id` — atualizar (sincronizar Calendar)
- `DELETE /api/services/:id` — remover (cancelar evento)
- `POST /api/payments` — marcar pagamento / subir comprovante
- `POST /api/routes/:weekday/insert` — inserir em posição específica
- `POST /api/routes/:weekday/reorder` — reorder por faixa (drag & drop)
- `DELETE /api/routes/:weekday/:assignmentId` — remover e compactar

> Preferir **Server Actions** com tRPC/Next-safe-actions (se conveniente) e chamadas tipadas.

---

## 8) System Prompt — Agente de Codificação (rótulo: `builder_agent`)

**Objetivo**: Gerar código Next.js + Supabase que atenda este documento, com foco na qualidade do DB, lógica de ordenação das rotas e impressão personalizável.

### Instruções ao agente

1. **Projeto**: Next.js (TS), App Router, Tailwind, shadcn/ui. Configurar Supabase client (`server` e `client`).
2. **DB**: Criar migrações SQL para as tabelas **exactas** da Seção 3, inclusive enums; FKs com `ON DELETE CASCADE`; índices conforme indicado.
3. **Auth**: Supabase Auth; proteger rotas app; seed de 1 usuário admin.
4. **Rotas**: Implementar os endpoints/Server Actions (Seção 7) com validação Zod. Toda operação de ordenação deve ocorrer em **transação** para preservar unicidade `(weekday, order_index)`.
5. **UI**:
   - Abas Seg–Sex; input `max_clients`; lista DnD por dia; grid com colunas de 5 linhas cada; badge de **display\_number** (derivado).
   - Páginas de Clientes, Serviços (por cliente e geral), Financeiro (mensalistas por calendário mensal / tabela ano×mês).
6. **Impressão**: Implementar dois botões: “Imprimir (preto)” e “Imprimir colorido”; usar CSS variables e `@media print` para ocultar UI.
7. **Calendar**: Fluxo de OAuth; persistir `google_event_id`; criar/atualizar/deletar eventos em `next_service_date`.
8. **Testes**: Smoke tests de server actions; util de seed com dados fictícios.
9. **Qualidade**: ESLint + Prettier; checagem TypeScript `strict`.

### Critérios de aceite (amostra)

-

---

## 9) Roadmap de Implementação

### Milestone 0 — Fundamentos (0.5–1 sem)

- Bootstrap do projeto (Next + TS + Tailwind + shadcn/ui).
- Setup Supabase; migrações das tabelas; Auth configurado.
- Seed básico (clientes/rotas fictícias).

### Milestone 1 — Clientes & Serviços (1–2 sem)

- CRUD Clientes (listagem, busca, criação/edição).
- CRUD Serviços; histórico por cliente e visão geral.
- Geração de **Ordem de Serviço/Recibo** (view simples imprimível v1).

### Milestone 2 — Rotas (1–2 sem)

- Abas Seg–Sex; configuração `max_clients` por dia.
- Atribuições com inserir/drag&drop/excluir + regras de **order_index**.
- Grade visual com colunas de 5; **números decrescentes** derivados de `max_clients`.
- Impressão (preto/colorido) com `@media print` e CSS variables.

### Milestone 3 — Financeiro (1–1.5 sem)

- Tela de mensalistas por ano/mês (status `PAGO`/`EM_ABERTO`).
- Upload de comprovantes → marca automaticamente como `PAGO` (`marked_by_receipt = true`).
- Edição manual de status e `paid_at`; opção de lançar `amount`.

### Milestone 4 — Integração Google Calendar (0.5–1 sem)

- OAuth do Google; armazenamento de tokens seguros.
- Criar/atualizar/deletar eventos com base em `next_service_date`.
- Guardar `google_event_id` em `services`; tratar revogação/erro com fallback.

> **Extras v2**: envio de OS/recibo por e‑mail; exportação CSV; múltiplos usuários/roles; dashboard simples.

---

## 10) Riscos & Mitigações

- **Ordenação complexa** (inserir entre, DnD, exclusões): usar **transações** e locks por `weekday`; derivar número exibido para evitar migrações em massa.
- **Tokens do Calendar**: refresh token e tratamento de erros; fila de re‑tentativas; log de sincronização.
- **Impressão colorida consistente**: CSS variables + `-webkit-print-color-adjust: exact`; teste em navegadores comuns.
- **Uploads de comprovante**: limitar tamanho/MIME; varredura básica; storage com políticas restritivas.
- **RLS/Segurança**: escopo 1 organização; rotas server-side com chave de serviço; validação Zod em todas as entradas.

---

## 11) Próximos Passos

1. Validar este documento com o cliente (escopo v1).
2. Gerar **migrações SQL** conforme Seção 3 (enums, índices, FKs).
3. Bootstrap do projeto (Next + TS + Tailwind + shadcn + Supabase).
4. Implementar **Clientes/Serviços** (Milestone 1) com seed e testes de fumaça.
5. Implementar **Rotas** (Milestone 2), incluindo DnD e impressão.
6. Implementar **Financeiro** (Milestone 3) e upload de comprovantes.
7. Conectar **Google Calendar** (Milestone 4) e validar sincronismo.
