# Proposal

## Why

O modal de edição de disciplinas (`SubjectEditModal`) na aba `"Disciplinas"` já permite selecionar professores existentes, cadastrar um novo professor inline (`+ Cadastrar novo`) ou informar um nome personalizado diretamente ao configurar a matéria. Por isso, manter um módulo/aba separado `"Professores"` (`/professores`) no menu superior é redundante. Além disso, a aba de perfil no menu superior deve ter o rótulo conciso `"Perfil"` e ficar posicionada no extremo oposto (à direita, afastada dos itens da esquerda) da barra de navegação.

## What Changes

- **Remoção da aba `"Professores"` da navegação principal (`AppNavigation`)**:
  - Remover o item `{ to: '/professores', label: 'Professores' }` do menu superior.
- **Ajuste do rótulo e posicionamento da aba `"Perfil"` (`AppNavigation` e `ProfilePage`)**:
  - Renomear o item `"Meu Perfil"` para `"Perfil"` e posicioná-lo no extremo oposto da barra de navegação (`ml-auto`, alinhado à direita da linha, oposto aos itens da esquerda `"Início"`, `"Disciplinas"`, `"Tarefas"` e `"Estudo"`).
- **Remoção da rota `/professores` e da página `ProfessorsPage`**:
  - Remover a rota protegida `/professores` de `frontend/src/App.tsx` e excluir `frontend/src/pages/ProfessorsPage.tsx`.
- **Preservação do cadastro e vínculo de professores na aba `"Disciplinas"`**:
  - Manter o funcionamento integral de listagem (`listProfessors`) e criação inline (`createProfessor`) dentro do `SubjectEditModal` em `/disciplinas`.

## Capabilities

### New Capabilities
- `inline-professor-management-only`: Centralização do cadastro e associação de professores exclusivamente dentro do fluxo de disciplinas (`/disciplinas`), sem módulo `/professores` no menu superior, e posicionamento da aba `"Perfil"` no extremo oposto da barra de navegação.

### Modified Capabilities

## Impact

- **Frontend (`frontend/src/`)**:
  - `components/AppNavigation.tsx`: Remoção do link `/professores`, alteração de `"Meu Perfil"` para `"Perfil"` e alinhamento no extremo oposto da linha (`ml-auto`).
  - `pages/ProfilePage.tsx`: Atualização do cabeçalho de seção para `"Perfil"`.
  - `App.tsx`: Remoção da rota `/professores` e do import de `ProfessorsPage`.
  - `pages/ProfessorsPage.tsx`: Exclusão do arquivo da página dedicada de professores.
