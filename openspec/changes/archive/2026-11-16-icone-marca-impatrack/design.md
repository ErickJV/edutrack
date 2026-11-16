# Design

## Context
Hoje o cabeçalho mostra apenas o wordmark textual "Impatrack" (`frontend/src/components/Brand.tsx`), usado em 13 telas, e a aba do navegador não tem favicon (`frontend/index.html` não referencia nenhum ícone; `frontend/public/` só tem `clippy/` e `prints/`). O pedido: um **logo de marca grande, sem texto ao lado**, com **design próprio** — apenas inspirado no símbolo da Impacta (o "A"/raio energético) — seguindo o tema teal do Impatrack, e o **mesmo desenho servindo de favicon** da aba.

## Goals / Non-Goals
**Goals:**
- Implement Logo de marca grande (só ícone) + favicon da aba cleanly and reliably

**Non-Goals:**
- Scope outside the core requirements of Logo de marca grande (só ícone) + favicon da aba

## Decisions
Follow standard modular design conventions for Logo de marca grande (só ícone) + favicon da aba.
- Ensure clean cutover without redundant backward-compatibility shims.
- Reuse existing project utilities and patterns.

## Risks / Trade-offs
[Unforeseen edge cases or regression] → Mitigation: Comprehensive end-to-end and unit verification tests.
