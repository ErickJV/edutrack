## Purpose

Permitir que o estudante registre quando estudou e por quanto tempo, dando uma base verificável aos totais, gráficos e relatórios semanais.

## ADDED Requirements

### Requirement: Registros datados e correção
O sistema MUST oferecer `GET|POST /api/v1/study-records` e `GET|PATCH|DELETE /api/v1/study-records/{id}` com sessão e CSRF nas mutações. Entrada: `task_id`, `studied_on` (data no fuso America/Sao_Paulo, não futura), `minutes` inteiro 1–1440 e `client_id` UUID obrigatório no POST para idempotência. Saída: id, tarefa, disciplina, data, minutos, origem manual/cronômetro e datas de criação/edição. GET aceita `task_id`, `from`, `to` e paginação de 50 itens com máximo de 100. Consultas/edições retornam 200, criações 201, exclusão 204; erros de dados 400, sessão ausente 401, CSRF 403, referência alheia/inexistente 404. Idempotência com payload diferente retorna 409.

#### Scenario: Registrar estudo sem duplicar
- **WHEN** o aluno registra 45 minutos em uma tarefa e repete o mesmo POST após falha de conexão
- **THEN** há um único registro e o total acumulado cresce apenas 45 minutos
- **AND** alterar para 30 minutos ou excluir corrige os totais e a semana correspondente.

#### Scenario: Dados e referências inválidas
- **WHEN** o usuário envia minutos negativos, data futura ou tarefa alheia
- **THEN** recebe respectivamente 400, 400 ou 404 sem alterar registros ou expor dados de outro aluno.

### Requirement: Histórico legado e cronômetro
Tempo acumulado anterior MUST ser preservado como saldo sem data, identificado separadamente; MUST NOT ser atribuído à semana da migração. `actual_minutes` passa a ser saldo legado + soma de registros, somente leitura na tarefa. A UI MUST permitir corrigir o saldo legado em `PUT /api/v1/tasks/{id}/legacy-study-time` com `minutes >= 0`, sem convertê-lo em estudo datado; mesmas proteções das demais mutações. Novos apontamentos manuais/cronômetro MUST produzir registros datados. Cronômetro MUST sobreviver à recarga e confirmação repetida não pode duplicar tempo; término não confirmado não é lançado automaticamente após navegador fechado.

#### Scenario: Migrar total antigo
- **WHEN** uma tarefa possui 120 minutos acumulados antes da migração
- **THEN** mantém 120 no total e indica 120 sem data; relatórios semanais não contam esses minutos
- **AND** a reversão conserva esse total, sem inventar datas ou perder registros novos em rollback operacional.

#### Scenario: Apontamento após recarga
- **WHEN** o aluno recarrega com cronômetro iniciado e depois confirma o tempo estudado
- **THEN** pode revisar duração e data, salvar uma vez e ver o registro na semana escolhida
- **AND** erros de rede preservam o apontamento para nova tentativa.
