## MODIFIED Requirements

### Requirement: Registro de Tempo Real de Estudo
O sistema MUST permitir apontar tempo estudado manualmente ou pelo cronômetro, com data, usando os registros de estudo. O acumulado `actual_minutes` MUST ser derivado do saldo legado e dos registros; escrita direta desse campo em POST/PATCH de tarefa retorna 400 com orientação para usar registros. MUST manter `estimated_minutes` editável e apresentar desvio real − estimado, indicando base sem data quando existente. Permissões da tarefa permanecem privadas.

#### Scenario: Apontamento de tempo real gasto
- **WHEN** o estudante registra 30 minutos numa tarefa que acumulava 60
- **THEN** o total passa a 90 e a nova parcela pertence à data informada
- **AND** o desvio usa 90 menos a estimativa, sem duplicar tempo após nova tentativa.

#### Scenario: Escrita por cliente antigo
- **WHEN** um cliente tenta substituir `actual_minutes` diretamente
- **THEN** recebe 400 com instrução para o recurso de registros e nenhum total é alterado silenciosamente.

### Requirement: Visualização, Filtros e Acessibilidade na Página de Tarefas
`GET /api/v1/tasks` MUST aceitar filtros combinados `q` (até 200 caracteres, título/descrição), `student_subject` UUID, `status=pending|in_progress|completed|active` (active reúne pending e in_progress) e `due_from`/`due_to` datas locais [início,fim). `due_bucket=urgent|overdue` usa exatamente os limites do servidor da Home e exclui concluídas, permitindo abrir a lista completa dos alertas sem aproximar 48h para dias inteiros. Sem filtros de data, tarefas sem prazo permanecem listadas por último; com datas, são excluídas. Parâmetros inválidos retornam 400; id alheio/inexistente retorna 404. Ordenação estável por prazo, criação e id. A interface MUST filtrar sem recarga completa, persistir filtros na URL e conservar o formato de lista atual nesta entrega. Tarefas vencidas MUST ter rótulo de atraso e contraste AA; controles com teclado e alvo mínimo de 44 px.

#### Scenario: Filtrar tarefas por disciplina e status
- **WHEN** o usuário combina matéria, status pendente, texto e intervalo de prazo
- **THEN** vê somente tarefas próprias que atendam a todos os filtros e recupera a busca ao recarregar a URL
- **AND** resultado vazio é distinguido de erro de rede e possui ação de limpar filtros.

#### Scenario: Filtros inválidos
- **WHEN** a requisição contém UUID malformado, status desconhecido ou intervalo invertido
- **THEN** recebe 400 em vez de erro interno, sem retornar tarefas de outro aluno.

### Requirement: Alternância Rápida de Conclusão de Tarefas
A API e a interface MUST possibilitar concluir ou reabrir tarefa imediatamente por `POST /api/v1/tasks/{id}/toggle-complete` ou edição de status. Ao concluir, registrar `completed_at`; ao reabrir, limpá-lo. MUST recalcular progresso de tarefas sem alterar progresso de aulas, mantendo HTTP 200 com tarefa atualizada e atualização dos indicadores na interface.

#### Scenario: Marcar tarefa como concluída
- **WHEN** o estudante marca uma tarefa como concluída
- **THEN** o sistema registra conclusão, atualiza o percentual de tarefas e remove a tarefa dos alertas ativos
- **AND** o progresso de aulas permanece inalterado; a interface atualiza as métricas correspondentes.
