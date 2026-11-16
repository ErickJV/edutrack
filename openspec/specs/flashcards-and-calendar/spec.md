# flashcards-and-calendar Specification

## Purpose
Oferecer visualização semanal imediata no topo do Calendário Acadêmico, renomear a área de Estudo para Anotações e disponibilizar um módulo de Flashcards inspirado no Anki com repetição espaçada SM-2 e animação 3D de virar o cartão (flipping).

## Requirements

### Requirement: Calendário Acadêmico com Visão Semanal no Topo
A página `CalendarPage` (`/calendario`) SHALL exibir o título `"Calendário Acadêmico"` (sem o subtítulo `"Visão Consolidada Multi-Tela"` e sem o termo `"Integrado"`) e posicionar logo abaixo do bloco principal a seção de detalhes e ações rápidas trazendo todos os compromissos ao longo da semana selecionada (Segunda a Domingo).

#### Scenario: Visualização dos compromissos da semana logo abaixo do cabeçalho
- **WHEN** o usuário acessar `/calendario` ou selecionar qualquer dia no calendário
- **THEN** o bloco imediatamente abaixo do cabeçalho `"Calendário Acadêmico"` exibe todos os eventos, aulas, tarefas e leituras programados ao longo daquela semana com suas respectivas ações rápidas

### Requirement: Aba Anotações e Aba Flashcards na Navegação Superior
O menu superior (`AppNavigation`) SHALL exibir a aba `"Anotações"` (em substituição a `"Estudo"`) seguida imediatamente pela aba `"Flashcards"` (`/flashcards`).

#### Scenario: Navegação para Anotações e Flashcards
- **WHEN** o usuário visualizar o menu superior
- **THEN** as abas aparecem na ordem `"Início"`, `"Calendário"`, `"Disciplinas"`, `"Tarefas"`, `"Anotações"`, `"Flashcards"` e `"Perfil"` (à direita)

### Requirement: Módulo de Flashcards Inspirado no Anki com Animação 3D Flip
O módulo `"Flashcards"` (`/flashcards`) SHALL permitir organizar cartões por baralho/disciplina, estudar cartões pendentes com animação 3D de virar o cartão (`flipping` frente e verso) e registrar o nível de recordação (`Errei / De novo`, `Difícil`, `Bom`, `Fácil`) aplicando agendamento de repetição espaçada estilo Anki (SM-2).

#### Scenario: Virar o flashcard com animação 3D e avaliar recordação no estilo Anki
- **WHEN** o usuário iniciar a revisão de um flashcard, clicar no cartão para virá-lo e escolher uma das 4 opções (`De novo`, `Difícil`, `Bom` ou `Fácil`)
- **THEN** o cartão executa uma rotação 3D no eixo Y (`rotateY(180deg)`) revelando o verso e, ao avaliar, atualiza o intervalo e a próxima data de revisão no backend
