## 1. Backend: Contagem de Tarefas Vencidas e Resumo do Dashboard

- [x] 1.1 Adicionar o campo `overdue_tasks_count = serializers.IntegerField()` em `DashboardSummarySerializer` (`backend/apps/academic/serializers.py`).
- [x] 1.2 Atualizar `DashboardSummaryView.get` em `backend/apps/academic/views.py` para calcular `overdue_tasks_count` considerando tarefas ativas (`status != COMPLETED`) com `due_date < timezone.now()`.
- [x] 1.3 Adicionar e executar testes em `backend/tests/` cobrindo o retorno de `overdue_tasks_count` com cenários de tarefas vencidas, tarefas futuras e tarefas concluídas.

## 2. Frontend: Tipagem e Mocks

- [x] 2.1 Adicionar o campo `overdue_tasks_count: number` na interface `DashboardSummary` em `frontend/src/api/types.ts`.
- [x] 2.2 Atualizar as fixtures e mocks em `frontend/src/pages/HomePage.test.tsx` para incluir `overdue_tasks_count`.

## 3. Frontend: Reestruturação da Home e Exibição de Métricas

- [x] 3.1 Substituir o bloco "Seu espaço acadêmico" pelo bloco "Itens urgentes das próximas 48 horas" no topo de `frontend/src/pages/HomePage.tsx`, integrando a saudação ao estudante ("Olá, {firstName}") e o estado vazio amigável quando não houver urgências.
- [x] 3.2 Adicionar o card de "Tarefas vencidas" no painel "Métricas ativas da sua rotina", expandindo o grid para acomodar os 6 cards responsivos (`sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`) e garantindo destaque visual acessível quando houver tarefas em atraso.
- [x] 3.3 Atualizar os skeletons de carregamento para 6 cards e ajustar os testes de tela em `HomePage.test.tsx` para validar a presença da nova seção no topo e o card de tarefas vencidas.

## 4. Validação Integrada e Acessibilidade

- [x] 4.1 Executar suíte de testes e verificação de tipos do frontend (`pnpm test --run` e `pnpm typecheck`).
- [x] 4.2 Executar suíte de testes e verificação estática do backend (`uv run pytest` e `uv run ruff check .`).
- [x] 4.3 Validar responsividade em viewport de 360 px, conferir que não há overflow horizontal e checar conformidade de acessibilidade (WCAG AA).
