## Purpose

Reunir aulas, salas, horários, prazos e avaliações em um calendário pessoal, usando um semestre configurado pelo estudante como base verificável do progresso acadêmico.

## ADDED Requirements

### Requirement: Semestre e horários semanais
O sistema MUST oferecer `GET|POST /api/v1/academic-terms` e `GET|PATCH /api/v1/academic-terms/{id}`. Entrada: `name`, `start_date`, `end_date`, `timezone` IANA (padrão America/Sao_Paulo); saída inclui `id`. Datas são inclusivas, início não pode ser posterior ao fim e duração máxima é 366 dias. A matrícula pode receber `term_id`; um semestre por matrícula nesta entrega. Datas não são inferidas como oficiais.

Horários MUST usar `GET|POST /api/v1/class-schedules` e `GET|PATCH|DELETE /api/v1/class-schedules/{id}`, com `student_subject_id`, `weekday` (segunda=0), `start_time`, `end_time`, `room` opcional e vigência `valid_from`/`valid_until` dentro do semestre. Cada bloco semanal gera uma ocorrência por dia correspondente; dois blocos no mesmo dia contam como duas aulas. Fim deve ser posterior ao início, sem atravessar a meia-noite nesta entrega. Consultas podem filtrar por matrícula.

#### Scenario: Gerar calendário de semestre já iniciado
- **WHEN** o aluno informa seu semestre e um bloco semanal vigente desde o início
- **THEN** todas as ocorrências válidas, passadas e futuras, ficam disponíveis com início, fim, sala, disciplina e id estável
- **AND** aulas passadas ficam com frequência não informada; repetir a operação não duplica aulas.

#### Scenario: Horário inválido
- **WHEN** o aluno informa fim anterior ao início, fuso inválido ou vigência fora do semestre
- **THEN** a API responde 400 com erro por campo sem gravar parcialmente a configuração.

### Requirement: Cancelamentos e reposições preservam histórico
O sistema MUST oferecer `GET /api/v1/class-occurrences?from=...&to=...&student_subject_id=...`, `POST /api/v1/class-occurrences` para aula avulsa/reposição e `PATCH /api/v1/class-occurrences/{id}` para horário, sala e `cancelled`. Reposição recebe opcionalmente `replaces_id` de aula cancelada da mesma matrícula. Cancelamentos MUST excluir a ocorrência do total válido e do resumo de frequência sem apagar seus registros; reativação restaura sua contribuição. Provas e outros eventos não contam como aulas automaticamente.

#### Scenario: Cancelar e repor
- **WHEN** uma de 20 aulas é cancelada e uma reposição é cadastrada dentro do semestre
- **THEN** o calendário mantém a aula cancelada identificada e exibe a reposição, com total válido novamente em 20
- **AND** a reposição passa a contar como ocorrida somente depois do seu término.

#### Scenario: Editar série ou semestre com histórico
- **WHEN** o aluno altera horários recorrentes, vigência ou datas do semestre
- **THEN** a atualização preserva ids e ocorrências passadas, modificadas individualmente ou com frequência registrada
- **AND** alterações incompatíveis com esse histórico retornam 409 com orientação para edição individual; apagar um horário cancela apenas ocorrências futuras sem edição individual nem frequência.

### Requirement: Eventos acadêmicos e prazos integrados
Eventos pessoais MUST usar `GET|POST /api/v1/academic-events` e `GET|PATCH|DELETE /api/v1/academic-events/{id}`: `title` obrigatório (até 200 caracteres), `kind` em `exam|assignment|other`, `starts_at` obrigatório, `ends_at` opcional, `all_day`, `room`, `description` e `student_subject_id` opcional. Eventos de dia inteiro usam datas locais com fim exclusivo (sem fim, um dia); eventos com horário usam instantes com fuso (sem fim, pontuais). A resposta normaliza cada evento com id e tipo. Fim anterior ao início retorna 400; dia inteiro com fim igual ao início também retorna 400.

`GET /api/v1/calendar?from=...&to=...&student_subject_id=...&kind=...` MUST reunir eventos, aulas e prazos existentes de tarefas, sem cópias persistentes de tarefas. O intervalo obrigatório é fechado no início e aberto no fim, com máximo de 93 dias. Saída: `items` com `id`, `source_type`, `source_id`, título, datas, sala, disciplina e estado quando aplicável; incluir itens que intersectam o intervalo, ordenados por início e id. O limite não restringe a contagem de progresso do semestre inteiro.

#### Scenario: Alterar prazo de tarefa
- **WHEN** o prazo de uma tarefa é alterado ou removido
- **THEN** a próxima consulta do calendário reflete o novo prazo ou remove sua entrada, sem duplicação
- **AND** clicar no prazo abre a tarefa original; tarefas concluídas continuam identificadas como concluídas.

#### Scenario: Agendar prova
- **WHEN** o aluno cria uma prova chamada AP1, com horário, sala e disciplina
- **THEN** ela aparece como avaliação pessoal, sem gerar nota, média ou aula automaticamente.

### Requirement: Segurança e integridade do calendário
Todos os endpoints de calendário MUST exigir sessão; mutações exigem CSRF. Consultas/edições retornam 200, criações 201, exclusões 204; anônimos recebem 401, CSRF inválido 403, dados inválidos 400 e ids alheios/inexistentes 404 inclusive referências. Nenhum horário, reposição, evento ou filtro pode referenciar matrícula/semestre alheio. Migração MUST ser aditiva, sem inventar semestres para dados antigos; rollback MUST preservar backup dos dados novos antes de remover tabelas.

#### Scenario: Vincular evento a disciplina alheia
- **WHEN** um aluno cria evento usando a matrícula de outro aluno
- **THEN** recebe 404 sem divulgação de dados e nenhum evento é criado.

### Requirement: Calendário acessível
`/calendario` MUST oferecer mês, semana e agenda, navegação entre períodos, Hoje, filtros e criação/edição de eventos e aulas. Em 360 px, agenda é a visão inicial; grades têm alternativa equivalente por lista acessível. Horários são exibidos no fuso do semestre; eventos sem disciplina usam America/Sao_Paulo. Estados carregando, vazio, erro com nova tentativa e salvamento MUST ser distinguíveis nos temas claro/escuro.

#### Scenario: Navegar pelo celular e teclado
- **WHEN** o aluno acessa aulas e provas em 360, 768 ou 1280 px
- **THEN** consegue conhecer data, hora, sala, disciplina e tipo sem depender de cor, arraste ou mouse
- **AND** controles têm foco visível, nome acessível e alvo mínimo de 44 px, sem overflow da página.
