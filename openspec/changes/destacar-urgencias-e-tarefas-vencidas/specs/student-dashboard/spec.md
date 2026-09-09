## MODIFIED Requirements

### Requirement: Consolidação de Métricas Acadêmicas
O sistema MUST fornecer um resumo unificado dos indicadores de estudo do estudante para exibição em cards de métricas no painel "Métricas ativas da sua rotina" da Home, incluindo contagem explícita de tarefas vencidas.

#### Scenario: Aluno com disciplinas e tarefas ativas consulta o dashboard
- **WHEN** o estudante autenticado requisita `GET /api/v1/dashboard/summary`
- **THEN** o sistema retorna HTTP 200 contendo:
  - Total de disciplinas ativas no semestre (`subjects_count`)
  - Total de tarefas pendentes (`pending_tasks_count`) e total de tarefas concluídas (`completed_tasks_count`)
  - Total de tarefas vencidas (`overdue_tasks_count`), considerando status diferente de concluído e `due_date < now`
  - Horas e minutos de estudo planejados vs. realizados (`planned_minutes_total`, `actual_minutes_total`)
  - Percentual global de progresso ponderado pela carga horária das disciplinas (`weighted_progress_percent`)
  - Lista priorizada de até 5 tarefas urgentes com data limite (`upcoming_tasks`)
- **AND** o tempo de resposta da API DEVE ser inferior a 1 segundo para a base do usuário.

#### Scenario: Aluno recém-cadastrado sem matérias configuradas
- **WHEN** um aluno sem disciplinas ativas requisita o resumo
- **THEN** o sistema retorna contadores zerados (incluindo `overdue_tasks_count: 0`) e indicador de que o perfil precisa selecionar matérias
- **AND** a UI exibe um banner de ação guiada para "Selecionar Matérias do Semestre".

#### Scenario: Aluno sem tarefas vencidas
- **WHEN** o estudante não possui tarefas com data limite no passado ou todas as tarefas passadas estão concluídas
- **THEN** o campo `overdue_tasks_count` retorna o valor `0`
- **AND** o card de métricas exibe `0` com apresentação neutra sem alarme de atraso.

### Requirement: Feed de Prazos Iminentes e Alertas
O Dashboard MUST apresentar os itens urgentes das próximas 48 horas em destaque no topo da página `/home`, substituindo o banner genérico "Seu espaço acadêmico".

#### Scenario: Tarefas com vencimento próximo são destacadas
- **WHEN** o estudante abre o Dashboard e possui tarefas com prazo inferior a 48 horas
- **THEN** a seção "Itens urgentes das próximas 48 horas" é exibida com máxima prioridade no topo da Home
- **AND** a lista exibe o tempo restante em formato relativo (ex.: "vence em 8 horas")
- **AND** destaca visualmente itens com badge contrastante e acessível
- **AND** oferece ação rápida para marcar a tarefa como concluída direto do Dashboard.

#### Scenario: Nenhuma entrega urgente nas próximas 48 horas
- **WHEN** o estudante não possui nenhuma tarefa com prazo nas próximas 48 horas
- **THEN** a seção no topo exibe estado vazio amigável informando que não há entregas urgentes no momento
- **AND** preserva o layout e a saudação personalizada sem quebras visuais.

### Requirement: Interface Responsiva e Acessível do Dashboard na Home
A tela `/home` MUST posicionar o feed de urgências de 48 horas no topo no lugar do antigo bloco de apresentação "Seu espaço acadêmico" e organizar o painel "Métricas ativas da sua rotina" com 6 cards de métricas (incluindo tarefas vencidas), com layout adaptável desde 360 px.

#### Scenario: Acesso ao Dashboard em viewport mobile (360 px)
- **WHEN** o estudante acessa a Home em dispositivo móvel
- **THEN** os cards de métricas (disciplinas, pendentes, vencidas, concluídas, progresso e tempo de estudo) e o feed de urgências se reorganizam em grid vertical sem overflow horizontal
- **AND** os elementos de controle mantêm área de toque mínima de 44x44 px e foco visível ao navegar por teclado
- **AND** o card de tarefas vencidas preserva contraste mínimo de 4.5:1 (WCAG AA) em ambos os temas.
