## Purpose
Unificar em um módulo de calendário interativo todas as aulas, entregas de tarefas, metas de leitura/provas de estudo e eventos acadêmicos do estudante, refletindo em tempo real as alterações feitas em qualquer tela do sistema.

## ADDED Requirements

### Requirement: Aba de Calendário na Navegação Superior
O sistema SHALL disponibilizar um item `"Calendário"` na barra de navegação superior (`AppNavigation`) apontando para a rota protegida `/calendario`, permitindo o acesso direto ao módulo de calendário acadêmico.

#### Scenario: Acesso à tela de calendário pelo menu superior
- **WHEN** o usuário autenticado clicar na aba `"Calendário"` no menu superior
- **THEN** o sistema navega para `/calendario` e exibe a grade mensal do mês vigente com os compromissos acadêmicos consolidados

### Requirement: Sincronização Multi-Tela de Eventos no Calendário
O endpoint `GET /api/v1/calendar` SHALL consolidar automaticamente no período consultado (`from` a `to`) os registros provenientes de todas as telas acadêmicas: ocorrências de aulas configuradas em `"Disciplinas"` (`source_type: "class"`), tarefas com prazo configuradas em `"Tarefas"` (`source_type: "task"`), metas de leitura e datas de prova cadastradas em `"Estudo"` (`source_type: "reading"`) e eventos avulsos (`source_type: "event"`), incluindo o nome da disciplina vinculada (`subject_name`).

#### Scenario: Alteração de horário de aula na tela de Disciplinas reflete no Calendário
- **WHEN** o usuário adicionar ou alterar os horários/datas de uma disciplina na tela `"Disciplinas"` e acessar `/calendario`
- **THEN** as ocorrências de aula (`ClassOccurrence`) geradas aparecem nos respectivos dias do calendário com o nome da disciplina, horário, sala e status de presença

#### Scenario: Criação ou edição de tarefa na tela de Tarefas reflete no Calendário
- **WHEN** o usuário criar, reagendar ou concluir uma tarefa com data de entrega na tela `"Tarefas"` e acessar `/calendario`
- **THEN** a tarefa aparece no dia do prazo correspondente com seu título, disciplina associada e status atualizado (`todo`, `in_progress` ou `done`)

#### Scenario: Cadastro de leitura ou data de prova na tela de Estudo reflete no Calendário
- **WHEN** o usuário cadastrar ou atualizar uma leitura acadêmica na tela `"Estudo"` contendo meta de conclusão (`target_date`) ou data de prova associada (`exam_date`)
- **THEN** o calendário exibe os respectivos marcos (`kind: "reading"` para meta de leitura e `kind: "exam"` para prova de leitura) nos dias correspondentes

### Requirement: Visualização Mensal, Filtros e Ações Rápidas no Calendário
A tela `CalendarPage` SHALL permitir navegar entre meses, filtrar itens por disciplina e por tipo de item (Aulas, Tarefas, Leituras/Estudo, Provas e Eventos), inspecionar os detalhes de um dia selecionado, executar ações rápidas (como alternar conclusão de tarefa ou registrar presença/falta em aula) e criar ou excluir eventos acadêmicos diretamente pelo calendário.

#### Scenario: Filtragem de itens e inspeção de um dia no calendário
- **WHEN** o usuário selecionar um dia na grade mensal ou aplicar filtro por disciplina/tipo
- **THEN** o painel lateral e a grade exibem apenas os itens correspondentes daquele dia/filtro, permitindo criar um novo evento acadêmico na data selecionada ou interagir com as aulas e tarefas listadas
