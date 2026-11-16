# Tasks

## 1. Endpoints Backend (Atualização de Perfil e Curso)

- [x] 1.1 Criar `ProfileUpdateSerializer` em `backend/apps/accounts/serializers.py` e expor `PATCH /api/v1/profile` em `backend/apps/accounts/views.py` permitindo ao estudante autenticado alterar o `course_offering_id` (e opcionalmente `full_name`) mesmo após o perfil já estar concluído.

## 2. Telas & Componentes Frontend (Menu Superior, Início e Aba Meu Perfil)

- [x] 2.1 Atualizar `frontend/src/components/AppNavigation.tsx` substituindo o rótulo `"Home"` por `"Início"` e adicionando a aba `"Meu Perfil"` (`/perfil`), além de remover a seção `"Seu perfil / Informações acadêmicas"` de `frontend/src/pages/HomePage.tsx`.
- [x] 2.2 Adicionar `updateProfile` (`PATCH /api/v1/profile`) em `frontend/src/api/client.ts` (e tipagem em `frontend/src/api/types.ts`), criar `frontend/src/pages/ProfilePage.tsx` exibindo nome do aluno, e-mail cadastrado, curso atual e seletor de alteração de curso, e registrar a rota protegida `/perfil` em `frontend/src/App.tsx`.

## 3. Verificação Ponta a Ponta

- [x] 3.1 Executar verificação de tipos e build do frontend (`pnpm typecheck` e `pnpm build`), lint do backend (`ruff check .`) e validar na prática a navegação entre `"Início"` e `"Meu Perfil"` com alteração de curso.
