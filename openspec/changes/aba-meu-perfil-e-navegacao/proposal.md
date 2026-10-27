# Proposal

## Why

Atualmente as informações acadêmicas do estudante ("Seu perfil / Informações acadêmicas") ficam exibidas no final da página inicial (`/home`) de forma somente leitura, sem permitir que o aluno visualize seus dados completos (nome, e-mail, curso) em uma área dedicada ou altere o curso matriculado após concluir o cadastro inicial. Além disso, o rótulo principal da barra de navegação superior está em inglês ("Home"), destoando do restante da interface em português ("Início").

## What Changes

- **Substituição de rótulo na navegação superior**: Renomear o item `"Home"` para `"Início"` em `AppNavigation`.
- **Remoção do bloco de perfil da página Início (`HomePage`)**: Remover a seção `"Seu perfil / Informações acadêmicas"` (Graduação, Modalidade, Vínculo) do final de `/home`.
- **Nova aba `"Meu Perfil"` (`/perfil`) no menu superior**:
  - Adicionar o item `{ to: '/perfil', label: 'Meu Perfil' }` na barra de navegação superior (`AppNavigation`).
  - Criar a página dedicada `ProfilePage` (`/perfil`) exibindo: **nome do aluno**, **e-mail cadastrado**, **nome do curso** (com modalidade/grau e vínculo verificado) e **opção para alterar o curso** (`course_offering`).
- **Suporte no Backend para alteração de curso no perfil**:
  - Permitir que estudantes com perfil já concluído atualizem seu curso (`course_offering_id`) e nome (`full_name`) via `PATCH /api/v1/profile` (em `ProfileView`).

## Capabilities

### New Capabilities
- `student-profile-management`: Visualização dedicada de dados cadastrais e acadêmicos na aba "Meu Perfil" (`/perfil`), atualização de curso pelo estudante autenticado (`PATCH /api/v1/profile`) e padronização do menu superior com "Início" e "Meu Perfil".

### Modified Capabilities

## Impact

- **Backend (`backend/apps/accounts/`)**:
  - `serializers.py`: Adição de `ProfileUpdateSerializer` para validar e persistir a troca de `course_offering_id` (e `full_name` opcional) em perfis ativos.
  - `views.py`: Inclusão do método `patch` em `ProfileView` (`/api/v1/profile`).
- **Frontend (`frontend/src/`)**:
  - `components/AppNavigation.tsx`: Alteração de `"Home"` para `"Início"` e inclusão da aba `"Meu Perfil"` (`/perfil`).
  - `pages/HomePage.tsx`: Remoção da seção `"Seu perfil / Informações acadêmicas"`.
  - `pages/ProfilePage.tsx`: Nova tela da aba `"Meu Perfil"` com exibição de nome, e-mail, curso atual e formulário de alteração de curso.
  - `api/client.ts` & `api/types.ts`: Função `updateProfile` (`PATCH /api/v1/profile`).
  - `App.tsx`: Registro da rota protegida `/perfil`.
