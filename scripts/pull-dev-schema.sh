#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DEV_REF:?Defina SUPABASE_DEV_REF no .env}"

echo "🔗 Linkando DEV (${SUPABASE_DEV_REF})..."
supabase link --project-ref "$SUPABASE_DEV_REF" >/dev/null

echo "⬇️  Puxando schema atual do DEV (db pull)..."
supabase db pull --linked

echo "🔍 Gerando diff para migração reconciliadora (fix.sql)..."
supabase db diff --linked -f supabase/migrations/fix.sql

echo "📦 Arquivo criado: supabase/migrations/fix.sql (revise e renomeie)."