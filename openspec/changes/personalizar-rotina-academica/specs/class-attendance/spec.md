## Purpose

Registrar a frequência pessoal em cada aula já ocorrida, distinguindo ausência real de falta de informação e mantendo esse histórico independente do progresso temporal.

## ADDED Requirements

### Requirement: Registro explícito por aula
`PUT /api/v1/class-occurrences/{id}/attendance` MUST receber `status` em `present|absent|unrecorded` e retornar 200 com ocorrência e estado atualizado. Uma aula MUST possuir no máximo um estado de frequência, inicialmente `unrecorded`, corrigível e idempotente. Somente aula não cancelada cujo término já passou permite registro; futura/em andamento/cancelada retorna 400. Sessão e CSRF obrigatórios; anônimo 401, CSRF inválido 403 e ocorrência alheia/inexistente 404.

#### Scenario: Registrar e corrigir falta
- **WHEN** o aluno marca falta em uma aula ocorrida, repete a requisição e depois altera para presença
- **THEN** permanece um único registro, o resumo passa a contar uma presença e nenhuma falta nessa aula
- **AND** o progresso temporal da disciplina permanece igual.

#### Scenario: Aulas passadas importadas
- **WHEN** o aluno configura em setembro um semestre iniciado em agosto
- **THEN** aulas anteriores entram no progresso temporal, mas não geram presenças ou faltas presumidas.

#### Scenario: Mutação proibida
- **WHEN** o aluno tenta marcar aula futura ou de outra pessoa
- **THEN** a API responde respectivamente 400 ou 404 e não modifica frequência.

### Requirement: Resumo e interface de frequência
`GET /api/v1/student-subjects/{id}` MUST incluir `attendance` com `present_count`, `absent_count`, `unrecorded_count` e `attendance_percent`, considerando somente aulas ocorridas não canceladas. Percentual MUST ser presenças / (presenças + faltas) × 100, nulo se não há registros; a interface MUST informar a base registrada e pendências, sem simular limite oficial de faltas ou aprovação. O detalhe da disciplina e os detalhes de aula no calendário MUST permitir consultar/corrigir frequência com confirmação de salvamento, erro recuperável, acessibilidade e ambos os temas.

#### Scenario: Frequência parcial
- **WHEN** há seis aulas ocorridas, três presenças, uma falta e duas sem registro
- **THEN** a tela mostra esses três contadores e 75% de presença entre quatro aulas registradas, com duas pendências
- **AND** o progresso temporal usa seis aulas ocorridas independentemente desses registros.

#### Scenario: Preservação e reversão
- **WHEN** uma matéria é desmarcada e selecionada novamente ou uma aula é cancelada e reativada
- **THEN** seus registros são preservados; canceladas deixam de contribuir temporariamente para o resumo
- **AND** migrações não criam faltas para dados legados e a reversão exige preservar os registros novos em backup.
