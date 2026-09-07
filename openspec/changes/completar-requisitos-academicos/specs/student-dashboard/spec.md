## MODIFIED Requirements

### Requirement: Feed de Prazos Iminentes e Alertas
O Dashboard MUST apresentar seções de tarefas pendentes/em andamento, atrasadas e urgentes. `GET /api/v1/dashboard/summary` MUST incluir `active_tasks`, `overdue_tasks`, `upcoming_tasks` e contadores totais de cada categoria; até cinco itens por lista, com link à lista filtrada completa. `upcoming_tasks` inclui somente status não concluído e `now <= due_date < now+48h`; atrasadas têm prazo <now; prazo exatamente 48h não é urgente. Ordenar por prazo, criação e id; sem prazo por último na lista ativa. Todas as listas usam matrículas selecionadas e dados do próprio aluno.

#### Scenario: Tarefas com vencimento próximo são destacadas
- **WHEN** o estudante abre a Home com uma tarefa a vencer em oito horas, outra atrasada e outra concluída
- **THEN** a primeira aparece como urgente, a segunda como atrasada e a concluída não aparece nos alertas
- **AND** são exibidos prazos relativos e ação rápida de concluir, com nomes acessíveis e sem depender apenas de cor.

#### Scenario: Limites e atualização
- **WHEN** um prazo está exatamente a 48h, não existe prazo ou o usuário conclui uma tarefa na Home
- **THEN** os dois primeiros casos não entram em urgentes e a tarefa concluída sai dos alertas após salvar
- **AND** falha de salvamento restaura o estado anterior e anuncia erro; cada lista vazia apresenta mensagem correspondente.

## ADDED Requirements

### Requirement: Indicadores pedagógicos separados
A Home MUST identificar “Progresso das tarefas”, “Progresso das aulas” e “Tempo estudado por disciplina” como medidas diferentes, usando analytics e métricas existentes. MUST oferecer explicação das bases de cálculo e acesso ao relatório semanal. Sessão e privacidade permanecem obrigatórias; interface MUST ter estados carregando/erro, ambos os temas e gráfico com tabela equivalente em 360/768/1280 px.

#### Scenario: Tarefas e aulas avançam independentemente
- **WHEN** o aluno conclui uma tarefa antes da próxima aula
- **THEN** somente progresso de tarefas muda e nenhuma contagem de aulas ou presenças é alterada.
