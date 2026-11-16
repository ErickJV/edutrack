# Design Técnico: Destacar Itens Urgentes e Tarefas Vencidas na Home

## Context

A tela inicial (`/home`) é o ponto de entrada principal do estudante após a autenticação. Atualmente, o layout inicia com um banner hero de apresentação ("Seu espaço acadêmico") e relega o bloco de "Itens urgentes das próximas 48 horas" para a terceira seção da página. Adicionalmente, as métricas da rotina exibem 5 indicadores sem quantificar explicitamente tarefas que já ultrapassaram o prazo de entrega. Veja a motivação detalhada em `proposal.md` e os requisitos em `specs/student-dashboard/spec.md`.

## Goals / Non-Goals

**Goals:**
- Posicionar os itens urgentes das próximas 48 horas no topo visual da página `/home`, provendo visibilidade imediata das obrigações iminentes.
- Calcular e expor `overdue_tasks_count` através do endpoint `GET /api/v1/dashboard/summary`.
- Adicionar o card de "Tarefas vencidas" ao painel "Métricas ativas da sua rotina", com indicação visual acessível e sem quebra de layout responsivo (360 px a 1280 px+).
- Atualizar testes de backend e frontend mantendo cobertura e contratos de tipagem sincronizados.

**Non-Goals:**
- Não criar novos modelos ou migrações de banco de dados (o modelo `AcademicTask` já fornece `status` e `due_date`).
- Não alterar a lógica de filtros de tarefas em `/tarefas` ou criar notificações push.
- Não introduzir bibliotecas adicionais de UI ou dependências externas.

## Decisions

### 1. Substituição do Hero Banner pelo Feed de Urgências com Saudação Integrada
- **Decisão**: O container superior da Home passa a ser a seção de entregas urgentes das próximas 48 horas, preservando a saudação personalizada ao aluno ("Olá, {firstName}") integrada ao cabeçalho da seção ou em destaque visual complementar, mas eliminando o card estático "Seu espaço acadêmico".
- **Justificativa**: Reduz o ruído cognitivo, elimina elementos decorativos sem utilidade prática no dia a dia do estudante e traz a informação de maior valor (o que fazer agora) para o primeiro viewport.
- **Alternativas consideradas**:
  - *Manter o hero e colocar o feed de urgências dentro dele*: Descartado por poluição visual excessiva e dificuldade de adaptação em telas menores (360 px).
  - *Apenas inverter a ordem física das seções*: Descartado porque manter o bloco "Seu espaço acadêmico" empurrado para baixo deixaria um bloco de boas-vindas sem propósito no meio da tela.

### 2. Contagem de Tarefas Vencidas no Backend (`DashboardSummaryView`)
- **Decisão**: Calcular `overdue_tasks_count` em `DashboardSummaryView.get()` utilizando a data e hora atuais (`timezone.now()`) e filtrando tarefas da base ativa do usuário cujo `due_date < now` e `status != AcademicTask.Status.COMPLETED`.
- **Justificativa**: Centraliza o cálculo no backend com a mesma fonte de tempo utilizada para `upcoming_tasks`, evitando discrepâncias de fuso horário ou regras divergentes no cliente.
- **Alternativas consideradas**:
  - *Calcular no cliente React*: Descartado porque a API de resumo só retorna até 5 `upcoming_tasks` e não todas as tarefas completas do aluno, logo a contagem total de vencidas precisa ser computada no servidor.

### 3. Grid de Métricas com 6 Cards
- **Decisão**: Expandir o grid do painel "Métricas ativas da sua rotina" de 5 para 6 cards (`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`), posicionando o card "Tarefas vencidas" ao lado de "Tarefas pendentes".
- **Justificativa**: O layout de 6 itens se divide harmoniosamente em viewports de 1 coluna (mobile < 640 px), 2 colunas (sm), 3 colunas (lg) e 6 colunas (xl), mantendo a proporcionalidade dos cards e evitando quebras irregulares.
- **Estilização**: Quando `overdue_tasks_count > 0`, o valor recebe destaque sutil em tom vermelho/rose (`text-rose-600 dark:text-rose-400`) e texto explicativo, mantendo conformidade com WCAG AA (contraste superior a 4.5:1). Se for `0`, permanece no padrão neutro da tela.

## Risks / Trade-offs

- **[Risco] O usuário não possui nenhuma entrega urgente nas próximas 48h**:
  - *Mitigação*: A seção de topo exibe um estado visual de conforto ("Tudo em dia por aqui! Nenhuma entrega urgente nas próximas 48 horas"), mantendo a saudação e o acesso rápido às próximas ações.
- **[Risco] Quebra de layout em telas mobile estreitas (360 px)**:
  - *Mitigação*: O grid é construído com Tailwind com fluxo vertical de 1 coluna em telas menores, sem largura fixa que cause overflow horizontal, e com alvos de toque superiores a 44 px.
