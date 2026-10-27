# Spec Delta

## Purpose

Simplificar a navegação principal do EduTrack removendo a aba e a rota dedicada "Professores", concentrando o cadastro de professores na aba "Disciplinas" e posicionando a aba "Perfil" no extremo oposto (à direita) da barra de navegação superior.

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

### Requirement: Cadastro e seleção de professores diretamente na aba Disciplinas
O modal de edição de disciplina (`SubjectEditModal`) na aba `"Disciplinas"` (`/disciplinas`) SHALL continuar permitindo selecionar um professor já cadastrado (`GET /api/v1/professors`), cadastrar um novo professor inline (`POST /api/v1/professors`) ou definir um nome personalizado ao editar uma disciplina.

#### Scenario: Cadastro inline de professor ao editar disciplina
- **WHEN** o estudante abre o modal `"Editar"` de uma matéria em `/disciplinas`, clica em `"+ Cadastrar novo"`, informa o nome do professor e salva
- **THEN** o professor é criado via `POST /api/v1/professors`, vinculado à disciplina via `PATCH /api/v1/student-subjects/<id>` e exibido no cartão da disciplina
