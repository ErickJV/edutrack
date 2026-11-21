# Design

## Context
A marca do app é renderizada pelo componente compartilhado `frontend/src/components/Brand.tsx`: um `<svg>` (tile em gradiente com raio e círculo) seguido do texto "Impatrack". O usuário quer eliminar o símbolo gráfico e manter somente o texto, grafado exatamente como `impatrack`. Todos os cabeçalhos de páginas autenticadas, telas de autenticação e páginas institucionais usam esse mesmo componente, então a alteração em um único arquivo cobre toda a aplicação.

## Goals / Non-Goals
**Goals:**
- Implement Remove o logo/ícone da marca e exibe apenas o texto "impatrack" cleanly and reliably

**Non-Goals:**
- Scope outside the core requirements of Remove o logo/ícone da marca e exibe apenas o texto "impatrack"

## Decisions
Follow standard modular design conventions for Remove o logo/ícone da marca e exibe apenas o texto "impatrack".
- Ensure clean cutover without redundant backward-compatibility shims.
- Reuse existing project utilities and patterns.

## Risks / Trade-offs
[Unforeseen edge cases or regression] → Mitigation: Comprehensive end-to-end and unit verification tests.
