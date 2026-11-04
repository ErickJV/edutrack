## Purpose
Garantir que o módulo de calendário fique posicionado logo após a página inicial e apresente uma grade mensal responsiva de largura total com todos os dias e eventos visíveis, que o bloco de anotações na sessão de Estudo funcione como um caderno visual real (sem HTML puro exposto) e que a criação de tarefas vinculadas a disciplinas funcione sem erros.

## ADDED Requirements

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
