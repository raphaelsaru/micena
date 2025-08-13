-include .env

.PHONY: migrate-dev push-prod pull-dev

migrate-dev:
	@bash scripts/migrate-dev.sh

push-prod:
	@CONFIRM=YES bash scripts/push-prod.sh

pull-dev:
	@bash scripts/pull-dev-schema.sh

new-migration:
	@test -n "$(name)" || (echo "Use: make new-migration name=descricao"; exit 1)
	@supabase migration new "$(name)"
	@echo "📝 Editar o SQL criado em supabase/migrations/"

gen-types-dev:
	@supabase link --project-ref $(SUPABASE_DEV_REF) >/dev/null
	@supabase gen types typescript --linked > src/types/supabase.ts
	@echo "✅ Tipos TS atualizados em src/types/supabase.ts"