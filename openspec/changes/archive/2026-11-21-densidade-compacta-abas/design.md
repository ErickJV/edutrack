# Design

## Context
O usuário pediu, numa alteração anterior, para reduzir o "DPI" da página Início porque os elementos estavam grandes. O ajuste foi feito no commit `c2cccc1` e depois ampliado pelos commits `e78c498`/`66b149c` (novo dashboard tokenizado). Apenas a Home e o shell receberam a escala compacta; Calendário, Tarefas, Anotações, Flashcards, Disciplinas e Perfil continuam na escala antiga (`text-2xl/3xl`, KPIs `text-3xl`, cartões `rounded-3xl`/`rounded-[2rem]` com `p-5/6/8`, botões `min-h-11/12`).

Estado final: as sete abas autenticadas usam os mesmos tamanhos de título, texto, cartão, raio, espaçamento e botão da Home atual. Cores, bordas, sombras, estrutura e contratos de API não mudam.

## Goals / Non-Goals
**Goals:**
- Implement Densidade compacta em todas as abas autenticadas cleanly and reliably

**Non-Goals:**
- Scope outside the core requirements of Densidade compacta em todas as abas autenticadas

## Decisions
Follow standard modular design conventions for Densidade compacta em todas as abas autenticadas.
- Ensure clean cutover without redundant backward-compatibility shims.
- Reuse existing project utilities and patterns.

## Risks / Trade-offs
[Unforeseen edge cases or regression] → Mitigation: Comprehensive end-to-end and unit verification tests.
