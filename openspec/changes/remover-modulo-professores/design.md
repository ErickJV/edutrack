# Design

## Context

Atualmente o EduTrack possui uma aba `"Professores"` (`/professores`) renderizada por `frontend/src/pages/ProfessorsPage.tsx` e listada em `frontend/src/components/AppNavigation.tsx`, além da aba `"Meu Perfil"` logo após `"Estudo"`. O componente `frontend/src/components/SubjectEditModal.tsx` (em `/disciplinas`) já realiza a listagem e o cadastro inline de professores.

## Goals / Non-Goals

**Goals:**
- Remover `{ to: '/professores', label: 'Professores' }` de `frontend/src/components/AppNavigation.tsx`.
- Renomear `"Meu Perfil"` para `"Perfil"` e posicioná-lo no extremo oposto da barra de navegação (`ml-auto`, à direita da linha) em `frontend/src/components/AppNavigation.tsx`.
- Remover a rota `/professores` e a importação de `ProfessorsPage` em `frontend/src/App.tsx`, excluindo `frontend/src/pages/ProfessorsPage.tsx`.
- Manter intactos os endpoints `/api/v1/professors` e o fluxo inline de professores em `SubjectEditModal.tsx`.

**Non-Goals:**
- Remoção da tabela `Professor` ou dos endpoints `/api/v1/professors` no backend.

## Decisions

1. **Posicionamento da aba `"Perfil"` no extremo oposto com `ml-auto`**:
   - *Decisão*: No container flex de `AppNavigation.tsx`, aplicar `ml-auto` ao `NavLink` da rota `/perfil` (com rótulo `"Perfil"`), mantendo os demais itens (`"Início"`, `"Disciplinas"`, `"Tarefas"`, `"Estudo"`) agrupados à esquerda.
   - *Racional*: Garante que `"Perfil"` fique sempre na extremidade direita da barra (o máximo distante da esquerda), separando visualmente a conta do aluno dos módulos de estudo.

## Risks / Trade-offs

- **[Risk] Quebra de linha em telas muito estreitas (mobile)** → **Mitigação**: `ml-auto` dentro de `flex flex-wrap items-center gap-2` empurra `"Perfil"` para a extremidade direita sem causar overflow horizontal.
