# Proposta: Destacar Itens Urgentes e Tarefas Vencidas na Home

## Why

Atualmente, a página `/home` inicia com um card institucional de boas-vindas ("Seu espaço acadêmico"), empurrando a seção de prazos urgentes para o final da página. Para o aluno da Impacta, a informação mais crítica ao acessar o sistema é saber imediatamente o que está prestes a vencer nas próximas 48 horas ou o que já está em atraso. Além disso, o bloco de "Métricas ativas da sua rotina" lista apenas disciplinas, tarefas pendentes, concluídas, progresso ponderado e tempo de estudo, sem explicitar a contagem de tarefas vencidas, o que dificulta a rápida identificação de débitos acadêmicos.

Esta mudança substitui o bloco de "Seu espaço acadêmico" pelo bloco de "Itens urgentes das próximas 48 horas" no topo da Home e inclui o contador de tarefas vencidas no bloco de métricas ativas, proporcionando foco imediato na ação e no cumprimento dos prazos acadêmicos.

## What Changes

- **Substituição do bloco de destaque**: Remove o bloco genérico de boas-vindas ("Seu espaço acadêmico") do topo da página `/home` e posiciona a seção "Itens urgentes das próximas 48 horas" logo abaixo do cabeçalho de navegação.
- **Inclusão de tarefas vencidas nas métricas**: Adiciona a métrica de "Tarefas vencidas" (`overdue_tasks_count`) no painel "Métricas ativas da sua rotina", apresentando contagem de tarefas com prazo expirado (`due_date < now` e status não concluído) com sinalização visual clara e acessível.
- **Atualização do endpoint de resumo do Dashboard**: Ajusta `GET /api/v1/dashboard/summary` no backend para calcular e retornar o campo `overdue_tasks_count` junto aos dados consolidados do estudante autenticado.
- **Preservação de responsividade e acessibilidade**: O grid de métricas da rotina e o feed de urgências continuam responsivos a partir de 360 px, sem overflow, navegáveis por teclado e com contraste conforme WCAG AA.

### Não Objetivos

- Não altera regras de criação, edição ou exclusão de disciplinas e tarefas.
- Não adiciona novas integrações externas ou serviços em segundo plano de notificação (ex.: push notifications ou e-mails adicionais).
- Não altera o fluxo de autenticação, consentimento ou permissões de usuário.

## Capabilities

### Modified Capabilities
- `student-dashboard`: Altera a organização da página inicial `/home` promovendo o feed de urgências de 48 horas para o topo (substituindo o bloco "Seu espaço acadêmico") e estende os indicadores consolidados com a métrica de tarefas vencidas (`overdue_tasks_count`).

## Impact

- **Backend**:
  - `backend/apps/academic/views.py`: O cálculo no método `get` de `DashboardSummaryView` passa a computar `overdue_tasks` e enviar `overdue_tasks_count`.
  - `backend/apps/academic/serializers.py`: `DashboardSummarySerializer` adiciona o campo `overdue_tasks_count = serializers.IntegerField()`.
  - `backend/tests/`: Atualização dos testes de API do resumo do dashboard para cobrir tarefas vencidas.
- **Frontend**:
  - `frontend/src/api/types.ts`: Atualização do tipo `DashboardSummary` para incluir `overdue_tasks_count: number`.
  - `frontend/src/pages/HomePage.tsx`: Reordenação estrutural substituindo o bloco de boas-vindas pelo feed de urgências e inclusão do card de tarefas vencidas nas métricas.
  - `frontend/src/pages/HomePage.test.tsx`: Atualização dos testes de unidade para refletir a nova estrutura da tela e o card de tarefas vencidas.
- **Banco de Dados**: Nenhuma alteração estrutural nem migração necessária (o modelo `AcademicTask` já possui `due_date` e `status`).
- **Segurança e Privacidade**: Nenhuma nova superfície de risco. O cálculo é restrito às tarefas do próprio usuário autenticado via sessão protegida.
- **Operação e Infraestrutura**: Nenhuma alteração de infraestrutura ou variáveis de ambiente.
