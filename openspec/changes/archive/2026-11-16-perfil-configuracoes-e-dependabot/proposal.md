# Proposal

## Why
O Perfil atual só edita nome, curso e modalidade e ainda troca o e-mail por um `PATCH /api/v1/profile` que grava o novo endereço como verificado, sem confirmação. Ao mesmo tempo, existem 8 PRs abertos pelo Dependabot (5 Python e 3 Node) que precisam ser analisados e integrados sem quebrar `uv lock`, `pnpm install`, `mypy`, `ruff` ou o build do Vite. A entrega precisa deixar a conta do estudante utilizável no dia a dia: e-mail verificado, senha, sessões ativas, status do Google, exportação de dados e exclusão de conta.

## What Changes
- Merge dos 8 PRs do Dependabot, com correção de compatibilidade `djangorestframework-stubs 3.18.2 → django-stubs>=6.1.2` e regeneração do `backend/uv.lock`.
- Backend: remoção da troca direta de e-mail no `PATCH /api/v1/profile`; troca de e-mail passa pelo fluxo do django-allauth (`ACCOUNT_CHANGE_EMAIL=True`).
- Backend: novos endpoints `DELETE /api/v1/profile` e `GET /api/v1/profile/export`; `allauth.usersessions` habilitado para listar/encerrar sessões.
- Frontend: duas novas seções em `/perfil` — “Conta e segurança” (e-mail, senha, Google) e “Privacidade e sessões” (sessões, exportação, exclusão).
- Frontend: `VerifyEmailPage` passa a confirmar também links de verificação (`/verificar-email/:key`) e a voltar para `/perfil` quando o usuário já está autenticado.
- Sem migração própria de modelo; apenas a migração nativa do `allauth.usersessions` será aplicada.

## Capabilities

### New Capabilities
- `perfil-configuracoes-e-dependabot`: Implements capabilities and behavior for Plano: Configurações de conta no Perfil + atualização das dependências (Dependabot)

### Modified Capabilities

## Impact
- `backend/apps/accounts/serializers.py` — `ProfileUpdateSerializer` (remover `email`); novo `ProfileDeleteSerializer`.
- `backend/apps/accounts/views.py` — `ProfileView` (novo `delete`), `ProfileExportView`.
- `backend/apps/accounts/export.py` (novo) — `build_user_export`, agrega os querysets do usuário.
- `frontend/src/api/client.ts` — clientes allauth (`/account/email`, `/account/password/change`, `/auth/sessions`, `/account/providers`) e download do export.
- `frontend/src/pages/ProfilePage.tsx` — remove e-mail do formulário acadêmico e renderiza as duas seções novas.
