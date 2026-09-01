.PHONY: dev down logs migrate seed superuser test e2e lint build install

dev:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

migrate:
	docker compose run --rm api python manage.py migrate

seed:
	docker compose run --rm api python manage.py seed_initial_data

superuser:
	docker compose run --rm api python manage.py createsuperuser

test:
	docker compose run --rm api pytest
	docker compose run --rm web pnpm test --run

e2e:
	docker compose up --detach --build
	cd frontend && PLAYWRIGHT_EXTERNAL_SERVER=true pnpm e2e

lint:
	docker compose run --rm api ruff check .
	docker compose run --rm api mypy .
	docker compose run --rm web pnpm lint
	docker compose run --rm web pnpm typecheck

build:
	docker compose run --rm web pnpm build

install:
	cd backend && uv sync --all-groups
	cd frontend && pnpm install
