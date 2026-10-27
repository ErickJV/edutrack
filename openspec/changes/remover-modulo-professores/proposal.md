# Proposal

## Why

O modal de edição de disciplinas (`SubjectEditModal`) na aba `"Disciplinas"` já permite selecionar professores existentes e cadastrar novos professores inline (`+ Cadastrar novo`). Com a remoção da aba separada `"Professores"`, é essencial permitir também **editar** ou **remover** um professor cadastrado diretamente ao lado de `"+ Cadastrar novo"` por meio de um popup, mantendo toda a gestão de professores centralizada na aba `"Disciplinas"`. Além disso, a aba de perfil no menu superior deve usar o rótulo `"Perfil"` posicionado no extremo oposto da barra.

## What Changes

- **Remoção da aba `"Professores"` da navegação principal (`AppNavigation`) e da rota `/professores`**:
  - Remover `{ to: '/professores', label: 'Professores' }` do menu superior e excluir `ProfessorsPage.tsx`.
- **Ajuste do rótulo e posicionamento da aba `"Perfil"` (`AppNavigation` e `ProfilePage`)**:
  - Renomear `"Meu Perfil"` para `"Perfil"` e posicioná-lo no extremo oposto da barra de navegação (`ml-auto`).
- **Opção de Editar e Remover Professor em Popup dentro de `SubjectEditModal`**:
  - Adicionar ao lado do botão `"+ Cadastrar novo"` a ação `"Editar"` em `frontend/src/components/SubjectEditModal.tsx`.
  - Ao clicar em `"Editar"`, exibir um popup permitindo **editar o nome** (`updateProfessor`) e/ou **remover** (`deleteProfessor`) professores cadastrados sem sair do modal da disciplina.

## Capabilities

### New Capabilities
- `inline-professor-management-only`: Centralização completa do cadastro, edição e remoção de professores dentro do modal de edição de disciplinas (`/disciplinas`), sem módulo `/professores` no menu superior, e posicionamento da aba `"Perfil"` no extremo oposto da barra de navegação.

### Modified Capabilities

## Impact

- **Frontend (`frontend/src/`)**:
  - `components/SubjectEditModal.tsx`: Adição do botão `"Editar"` ao lado de `"+ Cadastrar novo"` e popup de edição/remoção consumindo `updateProfessor` e `deleteProfessor`.
  - `components/AppNavigation.tsx`: Remoção de `"Professores"` e posicionamento de `"Perfil"` no extremo oposto (`ml-auto`).
  - `pages/ProfilePage.tsx`: Atualização do cabeçalho de seção para `"Perfil"`.
  - `App.tsx` & `pages/ProfessorsPage.tsx`: Remoção da rota `/professores` e exclusão de `ProfessorsPage.tsx`.
