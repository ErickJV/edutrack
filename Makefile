.PHONY: dev-api dev-web migrate seed superuser db-create lint build install

dev-api:
	cd backend && uv run python manage.py runserver 0.0.0.0:8000
dev-web:
	cd frontend && pnpm dev

migrate:
	cd backend && uv run python manage.py migrate

seed:
	cd backend && uv run python manage.py seed_initial_data

superuser:
	cd backend && uv run python manage.py createsuperuser
db-create:
	createdb -U $${DB_USER:-postgres} -h $${DB_HOST:-localhost} $${DB_NAME:-edutrack} 2>/dev/null || true

lint:
	cd backend && uv run ruff check .
	cd frontend && pnpm lint && pnpm typecheck

build:
	cd frontend && pnpm build

install:
	cd backend && uv sync
	cd frontend && pnpm install
