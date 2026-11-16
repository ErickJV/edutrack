## Purpose

Esta capacidade reúne indicadores acadêmicos, métricas consolidadas de progresso e prazos iminentes em um painel central na página inicial (`/home`), proporcionando ao estudante visibilidade imediata de sua rotina.

## ADDED Requirements

### Requirement: Consolidação de Métricas Acadêmicas
O sistema DEVE (`MUST`) fornecer um resumo unificado dos indicadores de estudo do estudante para exibição em cards de métricas no topo do Dashboard.

#### Scenario: Aluno com disciplinas e tarefas ativas consulta o dashboard
- **WHEN** o estudante autenticado requisita `GET /api/v1/dashboard/summary`
- **THEN** o sistema retorna HTTP 200 contendo:
  - Total de disciplinas ativas no semestre
  - Total de tarefas pendentes e total de tarefas concluídas
  - Horas de estudo planejadas vs. realizadas
  - Percentual global de progresso ponderado pela carga horária das disciplinas
- **AND** o tempo de resposta da API DEVE ser inferior a 1 segundo para a base do usuário.

#### Scenario: Aluno recém-cadastrado sem matérias configuradas
- **WHEN** um aluno sem disciplinas ativas requisita o resumo
- **THEN** o sistema retorna contadores zerados e indicador de que o perfil precisa selecionar matérias
- **AND** a UI exibe um banner de ação guiada para "Selecionar Matérias do Semestre".

### Requirement: Feed de Prazos Iminentes e Alertas
O Dashboard DEVE (`MUST`) apresentar uma lista priorizada com até 5 tarefas mais urgentes ordenadas crescentemente por data limite.

#### Scenario: Tarefas com vencimento próximo são destacadas
- **WHEN** o estudante abre o Dashboard e possui tarefas com prazo inferior a 48 horas
- **THEN** a lista exibe o tempo restante em formato relativo (ex.: "vence em 8 horas")
- **AND** destaca visualmente tarefas atrasadas com tag de perigo acessível
- **AND** oferece ação rápida para marcar a tarefa como concluída direto do Dashboard.

### Requirement: Interface Responsiva e Acessível do Dashboard na Home
A tela `/home` DEVE (`MUST`) substituir o estado provisório por seções de métricas, gráfico de progresso por disciplina e feed de entregas, com layout adaptável desde 360 px.

#### Scenario: Acesso ao Dashboard em viewport mobile (360 px)
- **WHEN** o estudante acessa a Home em dispositivo móvel
- **THEN** os cards de métricas se reorganizam em grid vertical sem overflow horizontal
- **AND** os elementos de controle mantêm área de toque mínima de 44x44 px e foco visível ao navegar por teclado.
