# Design

## Context
Pedido: investigar e aplicar animações/transições na interface. Intensidade escolhida: **expressiva** (fade/slide + stagger + contadores/barras animadas + feedback de pressão + micro-movimento de ícones); superfície: **todo o app autenticado + login/cadastro**.

Auditoria do estado atual (verificada no código):

- Movimento existente: `transition` default de 150ms em hover/foco (dezenas de componentes), `animate-spin/pulse/ping` (loaders), flip 3D `.anki-flip-card` (`styles.css:232-256`), pop-in/float do Clippit (`components/clippit/clippy.css:3-25`).
- **Não existe**: transição entre rotas, animação de entrada/saída de nenhum dos 13 overlays, stagger de listas, contadores animados, tratamento de `prefers-reduced-motion`, reset de scroll na navegação.
- `App.tsx:22-63` usa `<Routes>` declarativo sob `<BrowserRouter>` (`main.tsx`), sem shell compartilhado; cada página monta seu próprio `<main>`/`<header>`.
- 13 overlays `fixed inset-0` sem primitiva compartilhada, sem portal, sem focus trap; todos desmontam no mesmo commit ao fechar.
- View Transitions API **não** será usada: o app roda em `BrowserRouter` declarativo e `react-router@7.18.3` só honra `viewTransition` via data router (`enableViewTransition` em `RouterProvider`); interceptar `document.startViewTransition` à mão daria o efeito só no Chromium. O efeito equivalente (fade+rise por rota) é entregue em CSS, igual em todos os browsers.

Estado final: toda navegação, abertura/fechamento de overlay, entrada de listas, métricas e barras de progresso animam com uma linguagem única (easing `cubic-bezier(0.16, 1, 0.3, 1)`), e tudo se desliga sob `prefers-reduced-motion`.

## Goals / Non-Goals
**Goals:**
- Implement Sistema de animações e transições — EduTrack frontend cleanly and reliably

**Non-Goals:**
- Scope outside the core requirements of Sistema de animações e transições — EduTrack frontend

## Decisions
Follow standard modular design conventions for Sistema de animações e transições — EduTrack frontend.
- Ensure clean cutover without redundant backward-compatibility shims.
- Reuse existing project utilities and patterns.

## Risks / Trade-offs
[Unforeseen edge cases or regression] → Mitigation: Comprehensive end-to-end and unit verification tests.
