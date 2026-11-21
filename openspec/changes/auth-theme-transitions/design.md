# Design

## Context
Pedido: (1) transições entre páginas, incluindo o caminho login → página principal (senha **e** Google); (2) fade ao trocar o tema; (3) mais transições em geral. Hoje o app só tem **entrada** de rota (`page-in` em `RouteTransition`), o botão Google é um `<form>` nativo que abandona a página sem nenhuma animação, e `applyTheme` troca a classe `dark` no `<html>` sem transição de cores (só dois elementos do `AuthShell` têm `transition-colors`).

Estado final: sair do login/cadastro/verificação/completar-perfil (e logout/exclusão de conta) faz fade-out antes de navegar; o Google idem antes do POST nativo; a troca Entrar ↔ Cadastro desliza dentro do card sem remontar a página; toda navegação de rota ganha um véu de fade que mascara a troca; o loader "Carregando…" faz cross-fade para o conteúdo; trocar o tema faz fade-in do `#root` + transição de cores de 380ms; e botões/links/inputs/linhas de lista ganham transição de cor padrão. Tudo desliga sob `prefers-reduced-motion`.

## Goals / Non-Goals
**Goals:**
- Implement Transições de autenticação, tema e navegação — EduTrack frontend cleanly and reliably

**Non-Goals:**
- Scope outside the core requirements of Transições de autenticação, tema e navegação — EduTrack frontend

## Decisions
Follow standard modular design conventions for Transições de autenticação, tema e navegação — EduTrack frontend.
- Ensure clean cutover without redundant backward-compatibility shims.
- Reuse existing project utilities and patterns.

## Risks / Trade-offs
[Unforeseen edge cases or regression] → Mitigation: Comprehensive end-to-end and unit verification tests.
