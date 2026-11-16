# academic-curriculum Specification

## Purpose
Esta capacidade gerencia o catálogo da matriz curricular das graduações da Impacta e permite que o estudante consulte as disciplinas do seu curso e defina quais matérias está cursando ativamente em cada ciclo letivo.

## Requirements

### Requirement: Consulta da Grade Curricular por Curso
O sistema MUST disponibilizar a matriz curricular completa associada à graduação do estudante autenticado, agrupada por semestres letivos recomendados, com nome, código da disciplina e carga horária oficial.

#### Scenario: Aluno autenticado consulta a matriz do seu curso
- **WHEN** o aluno autenticado requisita `GET /api/v1/curriculum`
- **THEN** o sistema retorna HTTP 200 com a lista de disciplinas vinculadas ao `CourseOffering` do seu perfil, ordenadas por semestre sugerido (1 a 8) e nome, informando id, nome, código e carga horária em horas
- **AND** a resposta não expõe dados de outros cursos ou dados privados de outros alunos.

#### Scenario: Usuário anônimo tenta acessar a matriz curricular
- **WHEN** uma requisição não autenticada é feita para `GET /api/v1/curriculum`
- **THEN** o sistema rejeita com HTTP 401 Unauthorized e mensagem de autenticação necessária.

#### Scenario: Aluno sem perfil acadêmico completo tenta acessar o currículo
- **WHEN** um usuário autenticado sem `course_offering` vinculado requisita `GET /api/v1/curriculum`
- **THEN** o sistema responde com HTTP 403 Forbidden e orienta o redirecionamento para `/completar-perfil`.

### Requirement: Seleção e Confirmação de Matérias Ativas do Aluno
O sistema MUST permitir que o estudante selecione seu semestre de referência e confirme quais disciplinas da matriz curricular está cursando no momento, persistindo seu conjunto de disciplinas ativas.

#### Scenario: Estudante seleciona matérias ativas do semestre
- **WHEN** o estudante envia `POST /api/v1/student-subjects` com o payload contendo a lista de identificadores das disciplinas (`subject_ids`) e o identificador do semestre letivo
- **THEN** o sistema valida que todos os `subject_ids` pertencem ao curso do estudante
- **AND** atualiza o conjunto de disciplinas ativas do usuário com HTTP 200/201
- **AND** cada disciplina ativa é registrada com status inicial `em_andamento` e percentual de progresso zero.

#### Scenario: Tentativa de vincular disciplina de curso diferente
- **WHEN** o estudante envia no payload um `subject_id` pertencente a outra graduação
- **THEN** o sistema rejeita a operação com HTTP 400 Bad Request informando que a disciplina não pertence à matriz do curso do aluno.

### Requirement: Listagem e Visualização de Minhas Disciplinas na UI
A interface web MUST exibir a página `/disciplinas` com o conjunto de disciplinas ativas do estudante, detalhando nome, carga horária, professor (quando informado) e barra de progresso individual baseada em tarefas.

#### Scenario: Visualização da página com disciplinas ativas
- **WHEN** o estudante acessa a rota `/disciplinas` autenticado
- **THEN** a tela exibe o estado de carregamento com esqueletos visuais acessíveis
- **AND** renderiza os cartões de disciplinas ativas com contraste acessível, carga horária total e botão de detalhes
- **AND** todos os botões e links possuem foco visível e alvo de toque de no mínimo 44 px.

#### Scenario: Visualização com nenhuma disciplina selecionada (estado vazio)
- **WHEN** o estudante ainda não confirmou nenhuma matéria ativa
- **THEN** a interface exibe um estado vazio ilustrado e amigável com botão de chamada para ação direcionando para "Configurar Matérias do Semestre".

### Requirement: Edição de Carga Horária Declarada e Professor na Disciplina Ativa
O sistema DEVE permitir que o estudante personalize a carga horária em horas (de 1 a 2000) e o nome do professor responsável em suas disciplinas ativas (`StudentSubject`), refletindo as alterações imediatamente na interface e nas métricas de progresso.

#### Scenario: Aluno atualiza professor e carga horária de uma matéria
- **WHEN** o estudante autenticado envia `PATCH /api/v1/student-subjects/{id}` com `professor_name` e `workload_hours`
- **THEN** o sistema valida que a matrícula pertence ao estudante logado
- **AND** atualiza os dados locais da matrícula sem alterar a matriz curricular base do curso
- **AND** retorna HTTP 200 com a matrícula atualizada.

#### Scenario: Validação de carga horária inválida
- **WHEN** o estudante envia carga horária menor que 1 ou maior que 2000 horas
- **THEN** a API rejeita a atualização com HTTP 400 Bad Request e mensagem clara de validação.
