# Referências Visuais e Análise de Interfaces — EduTrack

Este documento consolida a pesquisa de templates e sistemas de referência analisados para a concepção visual, organização de componentes e experiência de uso (UX/UI) da plataforma **EduTrack**.

---

## 1. Notion — Student & Academic Dashboard Template

* **Categoria**: Workspace de organização acadêmica, caderno de anotações e controle de disciplinas.
* **Referência**: [Notion Student Dashboard Templates](https://www.notion.so/templates/category/school)

### Pontos Positivos
* Excelente hierarquia tipográfica para leitura longa e anotações estruturadas por pastas e disciplinas.
* Visão consolidada que relaciona matérias do semestre com entregas próximas na mesma tela.
* Flexibilidade na formatação de texto (títulos, listas, blocos de destaque e cores suaves que não cansam a vista em sessões prolongadas de estudo).

### Pontos Negativos
* Curva de aprendizado inicial elevada quando há excesso de propriedades visíveis simultaneamente.
* Em telas menores (mobile), tabelas muito largas geram rolagem horizontal excessiva se não forem convertidas em cards.

### Aplicação no EduTrack
* Inspirou diretamente a aba **Anotações** (com organização em pastas laterais, folha pautada customizável, seletor de fontes e vínculo direto com as disciplinas do semestre vigente) e o painel executivo da aba **Início**.

---

## 2. TickTick / Todoist — Academic & Task Planner

* **Categoria**: Gestão de tarefas com prazos, prioridades, calendário integrado e cronômetro Pomodoro.
* **Referência**: [Todoist Education Templates](https://todoist.com/templates/category/education)

### Pontos Positivos
* Destaque imediato para itens urgentes (próximas 48 horas) e sinalização clara de tarefas vencidas.
* Integração fluida entre a lista de tarefas (`Tarefas`) e a visualização temporal (`Calendário` semanal e mensal).
* Ações rápidas com ícones diretos (concluir tarefa, editar prazo, filtrar por status ou disciplina) sem poluir o card com textos redundantes.
* Cronômetro de foco (Pomodoro) integrado ao fluxo de execução das atividades.

### Pontos Negativos
* Não possui conceito nativo de matriz curricular universitária, carga horária por semestre ou classificação específica de avaliações acadêmicas (AP, PAI, Avaliação Oficial, Prova Substitutiva).

### Aplicação no EduTrack
* Inspirou a arquitetura sincronizada entre as abas **Calendário** e **Tarefas**, o bloco de **Programação da Semana** no topo do calendário, os indicadores de urgência na **Home** e o cronômetro Pomodoro acoplado ao ambiente de estudo.

---

## 3. AnkiWeb / RemNote — Spaced Repetition & Flashcards

* **Categoria**: Revisão ativa por cartões de pergunta e resposta (frente e verso) com repetição espaçada.
* **Referência**: [AnkiWeb Shared Decks & UI](https://ankiweb.net/)

### Pontos Positivos
* Foco na retenção ativa do conteúdo com interação de virar o card (*flip 3D*) e classificação rápida de dificuldade (Errei, Difícil, Bom, Fácil).
* Associação direta entre o material estudado (anotações/apostilas em PDF) e a criação dos cards de revisão.

### Pontos Negativos
* A interface clássica do Anki é excessivamente técnica e pouco acolhedora para novos usuários, exigindo muitas telas para editar ou excluir um card individual.

### Aplicação no EduTrack
* Inspirou a aba **Flashcards** com visual moderno, efeito 3D de rotação entre frente e verso, filtros rápidos por disciplina do semestre vigente e gerenciamento direto (criar, visualizar, editar e excluir cards na própria interface, além do apoio de geração a partir dos materiais de estudo).
