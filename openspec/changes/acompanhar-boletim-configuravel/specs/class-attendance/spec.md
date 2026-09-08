## MODIFIED Requirements

### Requirement: Registro explícito por aula
`PUT /api/v1/class-occurrences/{id}/attendance` MUST receber `status` em `present|absent|unrecorded` e opcionalmente `missed_units`, retornando 200 com ocorrência e estado atualizado. Uma aula MUST possuir no máximo um estado de frequência, inicialmente unrecorded, corrigível e idempotente. Somente aula não cancelada cujo término já passou permite registro; futura/em andamento/cancelada retorna 400. Sessão/CSRF obrigatórios; anônimo 401, CSRF inválido 403 e ocorrência alheia/inexistente 404.

Cada ocorrência pode possuir `attendance_units` inteiro positivo ou nulo, configurado pelo aluno em `PATCH /api/v1/class-occurrences/{id}`; o horário recorrente pode fornecer esse padrão às novas ocorrências. Unidades MUST NOT ser inferidas da duração em minutos. Se unidades forem conhecidas, present implica missed_units=0, absent usa valor entre 1 e attendance_units (omitido significa todas as unidades), unrecorded implica nulo. Se unidades não forem conhecidas, preservar status com missed_units nulo e solicitar configuração; não assumir uma unidade. Reduzir unidades abaixo das faltas registradas retorna 409. Alterações de padrão não reescrevem ocorrências existentes com dados explícitos.

#### Scenario: Registrar e corrigir falta
- **WHEN** o aluno marca ausência numa aula de quatro unidades, repete a requisição e depois altera para presença
- **THEN** permanece um registro, as unidades perdidas passam de quatro para zero e o resumo de encontros passa a contar uma presença
- **AND** o progresso temporal da disciplina permanece igual.

#### Scenario: Aulas passadas importadas
- **WHEN** o aluno configura em setembro um semestre iniciado em agosto
- **THEN** aulas anteriores entram no progresso temporal, mas não geram presenças, faltas ou unidades presumidas.

#### Scenario: Mutação proibida
- **WHEN** o aluno tenta marcar aula futura ou de outra pessoa
- **THEN** a API responde respectivamente 400 ou 404 e não modifica frequência.

#### Scenario: Ausência parcial em encontro
- **WHEN** uma aula tem quatro unidades e o aluno registra duas perdidas
- **THEN** TF por calendário aumenta em duas unidades e o estado do encontro é absent, identificado como ausência parcial no detalhe.

### Requirement: Resumo e interface de frequência
`GET /api/v1/student-subjects/{id}` MUST preservar `attendance` com `present_count`, `absent_count`, `unrecorded_count` e `attendance_percent` de encontros ocorridos não cancelados: presenças/(presenças+ausências)×100, nulo sem registros. A UI MUST rotular esse percentual como presença integral entre encontros registrados, pois encontro com ausência parcial conta em absent. O boletim MUST mostrar separadamente resumo por unidades, origem de TF, cobertura e limite configurado, sem reutilizar percentual de encontros como frequência acadêmica por carga.

Detalhes da disciplina e da aula MUST permitir corrigir frequência/unidades com feedback, erro recuperável, acessibilidade e ambos os temas. Cancelamento exclui registros do resumo derivado sem apagar histórico; reativação restaura sua contribuição.

#### Scenario: Frequência parcial
- **WHEN** há seis encontros ocorridos, três presenças integrais, um com ausência e dois não informados
- **THEN** a tela mostra os contadores e 75% de presença integral entre quatro encontros registrados, com duas pendências
- **AND** o boletim só calcula frequência por unidades com a configuração e cobertura correspondentes; o progresso temporal usa seis aulas ocorridas.

#### Scenario: Preservação e reversão
- **WHEN** uma matéria é desmarcada/reativada ou uma aula é cancelada/reativada
- **THEN** os registros e unidades são preservados; canceladas deixam de contribuir temporariamente
- **AND** migração mantém status legado, unidades nulas e saldo sem inferência; reversão operacional preserva os dados novos.
