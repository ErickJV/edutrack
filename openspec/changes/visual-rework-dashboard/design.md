# Design

## Context
O pedido é testar, numa worktree separada, uma transição visual do EduTrack/Impatrack de “mobile-first com menu superior” para uma experiência responsiva de app: menu lateral colapsável, Home transformada em dashboard com calendário e widgets dinâmicos, no estilo das referências (sidebar escura, cartões claros, tiles pastel, acento lima, gráficos e microanimações). O nome, favicon, rotas e contratos de API permanecem; muda apenas a aparência e a composição da navegação/Home.

O objetivo desta worktree é provar a direção visual com dados reais e permitir comparação antes de promover a mudança. O shell e a Home ficam completos; as páginas internas existentes passam a viver dentro do shell, sem redesenho profundo do conteúdo nesta rodada.

## Goals / Non-Goals
**Goals:**
- Implement Rework visual: shell lateral colapsável + dashboard dinâmico cleanly and reliably

**Non-Goals:**
- Scope outside the core requirements of Rework visual: shell lateral colapsável + dashboard dinâmico

## Decisions
Follow standard modular design conventions for Rework visual: shell lateral colapsável + dashboard dinâmico.
- Ensure clean cutover without redundant backward-compatibility shims.
- Reuse existing project utilities and patterns.

## Risks / Trade-offs
[Unforeseen edge cases or regression] → Mitigation: Comprehensive end-to-end and unit verification tests.
