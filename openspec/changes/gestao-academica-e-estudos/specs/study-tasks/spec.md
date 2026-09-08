## Purpose

Esta capacidade gerencia as tarefas, entregas e sessões de estudo vinculadas às disciplinas ativas do estudante, incluindo datas limites, status de conclusão e acompanhamento de tempo estimado versus tempo real de execução.

## ADDED Requirements

### Requirement: Criação e Edição de Tarefas com Isolamento de Usuário
O sistema DEVE (`MUST`) permitir a criação, consulta, atualização e remoção de tarefas acadêmicas vinculadas a disciplinas ativas do estudante logado, impedindo que outros usuários visualizem ou alterem suas tarefas.

#### Scenario: Criação de nova tarefa com sucesso
- **WHEN** o estudante autenticado envia `POST /api/v1/tasks` com título, disciplina ativa vinculada (`student_subject_id`), data/hora limite (`due_date`) e tempo estimado em minutos (`estimated_minutes`)
- **THEN** o sistema valida que a disciplina pertence ao estudante autenticado
- **AND** persiste a tarefa com status inicial `pendente` e retorna HTTP 201 Created com o payload da tarefa.

#### Scenario: Tentativa de vincular tarefa à disciplina de outro aluno
- **WHEN** um usuário tenta enviar `student_subject_id` pertencente a outro estudante
- **THEN** o sistema responde com HTTP 404 Not Found ou HTTP 403 Forbidden, sem vazar a existência da disciplina de terceiros.

#### Scenario: Edição e remoção de tarefa existente
- **WHEN** o estudante envia `PATCH /api/v1/tasks/{id}` ou `DELETE /api/v1/tasks/{id}` de uma tarefa criada por ele
- **THEN** o sistema aplica a modificação ou remove o registro com HTTP 200/204
- **AND** quando executado por outro usuário, a resposta DEVE ser HTTP 404 Not Found.

### Requirement: Alternância Rápida de Conclusão de Tarefas
A API e a interface DEVEM (`MUST`) possibilitar marcar uma tarefa como concluída ou reabri-la como pendente de forma imediata, recalculando os índices de progresso da disciplina associada.

#### Scenario: Marcar tarefa como concluída
- **WHEN** o estudante aciona o endpoint `POST /api/v1/tasks/{id}/toggle-complete` ou atualiza status para `concluida`
- **THEN** o sistema registra a data/hora de conclusão (`completed_at`)
- **AND** atualiza o percentual de conclusão da disciplina vinculada proporcionalmente ao total de tarefas
- **AND** responde com HTTP 200 contendo o novo status e as métricas atualizadas.

### Requirement: Registro de Tempo Real de Estudo
O sistema DEVE (`MUST`) permitir registrar o tempo real gasto na execução de uma tarefa, seja por apontamento manual de minutos dedicados ou por cronômetro na interface.

#### Scenario: Apontamento de tempo real gasto
- **WHEN** o estudante atualiza o campo `actual_minutes` de uma tarefa
- **THEN** o sistema persiste o valor em minutos acumulados
- **AND** calcula o desvio entre tempo estimado e tempo real executado.

### Requirement: Visualização, Filtros e Acessibilidade na Página de Tarefas
A interface na rota `/tarefas` DEVE (`MUST`) apresentar a lista de tarefas organizadas por urgência e permitir filtragem por disciplina, por status e por busca textual.

#### Scenario: Filtrar tarefas por disciplina e status
- **WHEN** o usuário seleciona um filtro de matéria específica e status `pendente`
- **THEN** a lista atualiza instantaneamente sem recarregar a página
- **AND** tarefas com prazo vencido recebem destaque visual de alerta com contraste WCAG AA
- **AND** todas as ações interativas possuem navegação fluida por teclado e alvos de toque maiores que 44 px.
