## MODIFIED Requirements

### Requirement: Registro de Tempo Real de Estudo
O sistema MUST permitir registrar o tempo real gasto na execução de uma tarefa, seja por apontamento manual de minutos dedicados ou por redirecionamento da tarefa para a tela dedicada de Sessão de Estudo Pomodoro, acumulando os minutos dedicados no término dos ciclos de foco.

#### Scenario: Apontamento de tempo real gasto
- **WHEN** o estudante atualiza o campo `actual_minutes` de uma tarefa
- **THEN** o sistema persiste o valor em minutos acumulados
- **AND** calcula o desvio entre tempo estimado e tempo real executado.

#### Scenario: Redirecionamento da tarefa para sessão de estudo Pomodoro
- **WHEN** o estudante clica na ação de iniciar estudo a partir de um card de tarefa na página `/tarefas`
- **THEN** a interface redireciona o usuário para a rota `/estudo` passando o identificador da tarefa como parâmetro
- **AND** a tela de estudo inicializa com a tarefa e a disciplina selecionadas como contexto do Pomodoro
- **AND** ao concluir ciclos de foco na sessão, os minutos transcorridos são persistidos e somados ao `actual_minutes` da respectiva tarefa.
