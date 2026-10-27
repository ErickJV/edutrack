# Spec Delta

## Purpose

Simplificar a navegação principal do EduTrack removendo a aba e a rota dedicada "Professores", concentrando o cadastro, a edição e a remoção de professores diretamente no modal de edição de disciplinas (com popup de edição/remoção ao lado de "+ Cadastrar novo") e posicionando a aba "Perfil" no extremo oposto da barra superior.

## ADDED Requirements

### Requirement: Ausência da aba Professores e posicionamento de Perfil no extremo oposto
A barra de navegação principal (`AppNavigation`) MUST NOT exibir o item `"Professores"` (`/professores`), devendo exibir `"Início"`, `"Disciplinas"`, `"Tarefas"` e `"Estudo"` alinhados à esquerda e o item `"Perfil"` (`/perfil`) posicionado no extremo oposto da linha (à direita, com `ml-auto`).

#### Scenario: Renderização do menu superior com Perfil no extremo oposto
- **WHEN** um estudante autenticado visualiza a barra de navegação principal em qualquer página interna
- **THEN** o menu superior exibe `"Início"`, `"Disciplinas"`, `"Tarefas"` e `"Estudo"` à esquerda, sem `"Professores"`, e exibe `"Perfil"` no extremo oposto (direita) da linha

### Requirement: Remoção da rota dedicada /professores
O roteador do frontend (`App.tsx`) MUST NOT expor a rota dedicada `/professores` (`ProfessorsPage`), exibindo a página de rota não encontrada (`NotFoundPage`) caso a URL `/professores` seja acessada diretamente.

#### Scenario: Acesso direto à URL /professores
- **WHEN** o usuário navega diretamente para `/professores`
- **THEN** o sistema não renderiza `ProfessorsPage` e trata a URL pelo fallback de rota não encontrada

### Requirement: Cadastro, edição e remoção de professores via popup na aba Disciplinas
O modal de edição de disciplina (`SubjectEditModal`) na aba `"Disciplinas"` (`/disciplinas`) SHALL exibir, ao lado de `"+ Cadastrar novo"`, uma opção `"Editar"` que abre um popup permitindo editar o nome (`PATCH /api/v1/professors/<id>`) e/ou remover (`DELETE /api/v1/professors/<id>`) um professor cadastrado.

#### Scenario: Edição do nome de um professor cadastrado pelo popup
- **WHEN** o estudante clica em `"Editar"` ao lado de `"+ Cadastrar novo"` no modal da disciplina, altera o nome do professor no popup e salva
- **THEN** o sistema atualiza o professor via `PATCH /api/v1/professors/<id>` e reflete o novo nome imediatamente na lista de seleção da disciplina

#### Scenario: Remoção de um professor cadastrado pelo popup
- **WHEN** o estudante clica em `"Editar"` ao lado de `"+ Cadastrar novo"` no modal da disciplina e aciona a opção de remover o professor no popup
- **THEN** o sistema remove o professor via `DELETE /api/v1/professors/<id>`, retira-o da lista de seleção e limpa a seleção caso ele estivesse marcado
