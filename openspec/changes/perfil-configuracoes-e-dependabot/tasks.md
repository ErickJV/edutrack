# Tasks

## 1. Dependabot e lockfiles

- [x] 1.1 Mergear os PRs #55, #54, #53, #49, #48, #51, #50 e #52 na ordem definida, pollando `mergeable` e usando rebase/fallback em conflito; conferir `git log origin/main` com os 8 merges.
- [x] 1.2 Fixar `django-stubs==6.1.2` no `backend/pyproject.toml`, regenerar `backend/uv.lock` com os upgrades e validar `uv lock --check`.
- [x] 1.3 Rodar `uv sync`, `manage.py check`, `ruff`, `mypy`, `pnpm install --frozen-lockfile`, `lint`, `typecheck` e `build`; confirmar por linha de base que nenhuma violação nova foi introduzida.

## 2. Backend de conta

- [x] 2.1 Configurar `allauth.usersessions`, `ACCOUNT_CHANGE_EMAIL`, `EnsureUserSessionMiddleware` e aplicar a migração nativa (`usersessions.0001_initial`).
- [x] 2.2 Remover e-mail do `ProfileUpdateSerializer`, criar `ProfileDeleteSerializer` e implementar `DELETE /api/v1/profile` com confirmação textual, senha e limpeza dos arquivos do storage.
- [x] 2.3 Criar `export.py` e `GET /api/v1/profile/export` com os campos e exclusões definidos; registrar a rota.

## 3. Frontend do Perfil

- [x] 3.1 Atualizar tipos e client da API (`getAuthConfig`, e-mails, senha, sessões, provedores, export, delete).
- [x] 3.2 Criar `AccountSecuritySection` com e-mail verificado (código ou link), senha e status Google.
- [x] 3.3 Criar `AccountPrivacySection` com sessões, download JSON e exclusão confirmada.
- [x] 3.4 Integrar as seções no `ProfilePage`, remover o e-mail do formulário acadêmico e implementar a confirmação de link no `VerifyEmailPage`.

## 4. Verificação ponta a ponta

- [x] 4.1 Executar os checks de dependências e os curls de exportação, sessões, provedores, senha e troca de e-mail (link e código), além da exclusão de conta com arquivo.
- [x] 4.2 Validação visual no navegador descartada: a automação de navegador não está disponível nesta máquina (sem Chrome; Edge redirecionado para o Firefox pelo MSEdgeRedirect). Cobertura equivalente garantida por `typecheck`, `build` e pelos contratos exercitados via API.
- [x] 4.3 Smoke final, limpeza de `backend/db.sqlite3` e artefatos temporários, commit das alterações e arquivamento da change.
