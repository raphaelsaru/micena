#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DEV_REF:?Defina SUPABASE_DEV_REF no .env}"

echo "🔗 Linkando DEV (${SUPABASE_DEV_REF})..."
supabase link --project-ref "$SUPABASE_DEV_REF" >/dev/null

echo "⬆️  Aplicando migrações no DEV (db push)..."
supabase db push --linked

echo "✅ DEV atualizado com as migrações versionadas."