## MODIFIED Requirements

### Requirement: Consolidação de Métricas Acadêmicas
`GET /api/v1/dashboard/summary` MUST retornar métricas privadas de matérias ativas e tarefas preservadas, separando progresso temporal de tarefas. `weighted_progress_percent` MUST ponderar progresso de aulas por carga pessoal somente nas matérias com carga e calendário configurados; incluir `progress_subjects_count` e `progress_excluded_count`, e retornar nulo se nenhuma elegível. A UI MUST nomear “Progresso das aulas”, indicar cobertura parcial e não tratar dados ausentes como zero. Tarefas de matérias arquivadas permanecem no armazenamento e no acesso ao histórico, mas não entram nas métricas ativas.

#### Scenario: Aluno com disciplinas e tarefas ativas consulta o dashboard
- **WHEN** o estudante autenticado consulta o resumo
- **THEN** recebe 200 com total de matérias ativas, tarefas pendentes/concluídas, minutos planejados/realizados e progresso ponderado de aulas
- **AND** uma matéria com 60h a 50% e outra com 40h a 25% produzem 40%; tarefas concluídas não alteram esse percentual
- **AND** o tempo da API fica abaixo de 1 segundo na massa de aceite definida no design.

#### Scenario: Aluno recém-cadastrado sem matérias configuradas
- **WHEN** um aluno sem disciplinas ativas requisita o resumo
- **THEN** recebe contadores zerados, progresso nulo e a UI oferece selecionar matérias do semestre.

#### Scenario: Carga ou calendário incompleto
- **WHEN** somente uma de três matérias possui carga declarada e calendário válidos
- **THEN** o resumo indica cobertura 1/3, duas excluídas e ponderação somente da matéria elegível
- **AND** oferece completar dados sem inventar carga horária.

#### Scenario: Autorização e recarga
- **WHEN** um usuário anônimo requisita o resumo ou um aluno recarrega a Home
- **THEN** o primeiro recebe 401 e o segundo recebe somente suas métricas atuais
- **AND** erros são anunciados com nova tentativa, sem mascarar falha como contadores zerados.
