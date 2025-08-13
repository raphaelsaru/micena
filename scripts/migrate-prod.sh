#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_PROD_REF:?Defina SUPABASE_PROD_REF no .env}"

if [[ "${CONFIRM:-}" != "YES" ]]; then
  echo "🚫 Proteção: para aplicar em PRODUÇÃO execute:"
  echo "CONFIRM=YES ./scripts/push-prod.sh"
  exit 1
fi

echo "🔗 Linkando PROD (${SUPABASE_PROD_REF})..."
supabase link --project-ref "$SUPABASE_PROD_REF" >/dev/null

echo "⬆️  Aplicando migrações no PROD (db push)..."
supabase db push --linked

echo "✅ PROD atualizado. Recomendo validar logs e métricas."