# Design

## Context

Com a remoção de `ProfessorsPage.tsx`, toda a gestão de professores passa a ocorrer dentro de `frontend/src/components/SubjectEditModal.tsx`. As funções `updateProfessor` (`PATCH /api/v1/professors/<id>`) e `deleteProfessor` (`DELETE /api/v1/professors/<id>`) já existem em `frontend/src/api/client.ts` e no backend (`backend/apps/academic/`).

## Goals / Non-Goals

**Goals:**
- Remover `{ to: '/professores', label: 'Professores' }` de `AppNavigation.tsx` e posicionar `"Perfil"` no extremo oposto (`ml-auto`).
- Remover `/professores` de `App.tsx` e excluir `ProfessorsPage.tsx`.
- Adicionar ao lado de `"+ Cadastrar novo"` em `SubjectEditModal.tsx` um botão `"Editar"` que abre um popup sobreposto para editar o nome e/ou remover qualquer professor cadastrado na lista.

**Non-Goals:**
- Alterações no modelo de banco de dados `Professor` no backend.

## Decisions

1. **Popup de Edição e Remoção de Professor dentro do `SubjectEditModal`**:
   - *Decisão*: Ao lado de `"+ Cadastrar novo"`, exibir o botão `"Editar"` (habilitado quando houver ao menos um professor cadastrado na lista). Ao clicar, abrir um popup modal (`role="dialog"`) pré-selecionando o professor atual no dropdown (ou o primeiro da lista), permitindo trocar qual professor cadastrado deseja gerenciar, editar seu nome (`updateProfessor`) ou removê-lo (`deleteProfessor`).
   - *Racional*: Mantém a interface limpa no formulário principal da disciplina e oferece controle total de CRUD (criar, editar e excluir professores) diretamente em `/disciplinas`.

## Risks / Trade-offs

- **[Risk] Submissão acidental do formulário da disciplina ao salvar no popup do professor** → **Mitigação**: Renderizar o popup fora ou tratar a ação de salvar/remover professor de forma isolada (`type="button"` / `stopPropagation`), atualizando o estado local `professors` e `selectedProfId` sem fechar o modal da disciplina.
