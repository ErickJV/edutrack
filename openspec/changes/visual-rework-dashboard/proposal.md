# Proposal

## Why
O pedido é testar, numa worktree separada, uma transição visual do EduTrack/Impatrack de “mobile-first com menu superior” para uma experiência responsiva de app: menu lateral colapsável, Home transformada em dashboard com calendário e widgets dinâmicos, no estilo das referências (sidebar escura, cartões claros, tiles pastel, acento lima, gráficos e microanimações). O nome, favicon, rotas e contratos de API permanecem; muda apenas a aparência e a composição da navegação/Home.

O objetivo desta worktree é provar a direção visual com dados reais e permitir comparação antes de promover a mudança. O shell e a Home ficam completos; as páginas internas existentes passam a viver dentro do shell, sem redesenho profundo do conteúdo nesta rodada.

## What Changes
- Worktree isolada `../edutrack-visual-rework` no branch `feat/visual-rework`, com `node_modules` reaproveitado por junction.
- Tokens visuais novos (`canvas`, `surface`, `ink`, `muted`, `line`, `sidebar`, `accent` lima, pastéis) e modo escuro correspondente.
- Shell autenticado persistente: sidebar fixa/colapsável no desktop, drawer no mobile, topbar com título, tema e avatar.
- Remoção do `AppNavigation` superior e do header duplicado de cada página; ações específicas (`Nova tarefa`, `Configurar semestre`) migram para o conteúdo.
- Home reescrita como dashboard: saudação, cartão de foco, 4 KPIs, gráfico de carga semanal, mini calendário com agenda, progresso por disciplina, próximas entregas com conclusão rápida e revisões pendentes.
- Microinterações CSS: colapso da sidebar, drawer, barras crescendo, anéis de progresso, contagem animada, blobs flutuantes e hover lift; tudo desligado sob `prefers-reduced-motion`.
- Nenhuma dependência nova; reaproveitar React, Tailwind 4, Lucide e o sistema de movimento existente.

## Capabilities

### New Capabilities
- `visual-rework-dashboard`: Implements capabilities and behavior for Rework visual: shell lateral colapsável + dashboard dinâmico

### Modified Capabilities

## Impact
- `frontend/src/App.tsx` — bloco de rotas protegidas (~31-49): aninhar `AppLayout`.
- `frontend/src/components/AppNavigation.tsx` — arquivo a remover; imports em 6 páginas.
- `frontend/src/pages/CalendarPage.tsx` — helpers (~56-190), grade (~250-290) e header (~866-889).
- `frontend/src/pages/HomePage.tsx` — reescrita integral (~37-285).
- `frontend/src/styles.css` — tokens no topo (~1-60) e bloco de movimento/reduced motion (~300-552).
