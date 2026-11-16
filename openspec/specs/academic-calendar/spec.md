# academic-calendar Specification

## Purpose
Unificar em um módulo de calendário interativo todas as aulas, entregas de tarefas, metas de leitura/provas de estudo e eventos acadêmicos do estudante, refletindo em tempo real as alterações feitas em qualquer tela do sistema.

## Requirements

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

### Requirement: Aba de Calendário Logo Após Início e Grade em Largura Total
O sistema SHALL posicionar o item `"Calendário"` imediatamente após `"Início"` na barra de navegação superior (`AppNavigation`) e exibir na rota `/calendario` uma grade mensal responsiva em largura total (`w-full` dentro de `max-w-7xl`), mostrando todos os dias do mês e listando os eventos correspondentes dentro de cada dia sem comprimir o calendário na lateral esquerda.

#### Scenario: Ordem do menu superior e visualização ampla do calendário
- **WHEN** o usuário autenticado visualizar o menu superior e acessar `"Calendário"`
- **THEN** a aba `"Calendário"` aparece logo em seguida de `"Início"` e a grade mensal ocupa toda a largura útil da tela com células amplas exibindo os eventos de cada dia

### Requirement: Bloco de Anotações Visual na Sessão de Estudo
A sessão `"Estudo"` (`StudyNotesWorkspace`) SHALL oferecer um bloco de anotações visual (WYSIWYG) voltado para anotações reais, aplicando formatações de títulos, negrito, itálico, sublinhado, marca-texto, cores, listas e blocos de destaque visualmente, sem exibir tags HTML brutas (`<span>`, `<mark>`, `<u>`) no campo de escrita.

#### Scenario: Escrita e formatação no bloco de anotações sem HTML puro
- **WHEN** o usuário escrever no bloco de anotações da tela `"Estudo"` e aplicar formatações como sublinhado, cor de texto, marca-texto ou títulos
- **THEN** o texto é formatado visualmente na folha de anotação sem inserir tags HTML visíveis no texto e é salvo automaticamente

### Requirement: Criação e Vínculo Confiável de Tarefas às Disciplinas
O sistema SHALL permitir criar novas tarefas e vinculá-las a qualquer disciplina ativa ou da matriz curricular do curso do estudante sem erros de validação, criando ou ativando automaticamente o vínculo `StudentSubject` caso necessário e exibindo mensagens claras de erro caso ocorra falha.

#### Scenario: Criar nova tarefa vinculada a uma disciplina do curso
- **WHEN** o usuário abrir o modal `"Nova tarefa"`, selecionar uma disciplina do seu curso, informar título e prazo e clicar em `"Criar tarefa"`
- **THEN** o backend vincula ou ativa automaticamente a disciplina para o estudante, salva a tarefa com status `201` e exibe a tarefa imediatamente na lista e no calendário
