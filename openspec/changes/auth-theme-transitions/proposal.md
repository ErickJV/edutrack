# Proposal

## Why
Pedido: (1) transições entre páginas, incluindo o caminho login → página principal (senha **e** Google); (2) fade ao trocar o tema; (3) mais transições em geral. Hoje o app só tem **entrada** de rota (`page-in` em `RouteTransition`), o botão Google é um `<form>` nativo que abandona a página sem nenhuma animação, e `applyTheme` troca a classe `dark` no `<html>` sem transição de cores (só dois elementos do `AuthShell` têm `transition-colors`).

Estado final: sair do login/cadastro/verificação/completar-perfil (e logout/exclusão de conta) faz fade-out antes de navegar; o Google idem antes do POST nativo; a troca Entrar ↔ Cadastro desliza dentro do card sem remontar a página; toda navegação de rota ganha um véu de fade que mascara a troca; o loader "Carregando…" faz cross-fade para o conteúdo; trocar o tema faz fade-in do `#root` + transição de cores de 380ms; e botões/links/inputs/linhas de lista ganham transição de cor padrão. Tudo desliga sob `prefers-reduced-motion`.

## What Changes
- Implement Transições de autenticação, tema e navegação — EduTrack frontend
- Add verification tests and documentation updates

## Capabilities

### New Capabilities
- `auth-theme-transitions`: Implements capabilities and behavior for Transições de autenticação, tema e navegação — EduTrack frontend

### Modified Capabilities

## Impact
- `frontend/src/components/RouteTransition.tsx` — arquivo de 15 linhas; substituição integral (véu + chave `'auth'` + remoção de `is-exiting`).
- `frontend/src/pages/AuthSliderPage.tsx` — `handleLoginSubmit` (~36-47), `handleSignupSubmit` (~105), form Google inline (~186-206), prop `initialMode` (:12, :18).
- `frontend/src/auth/RouteGuards.tsx` — 34 linhas, os três guards reescritos no passo 5.
- `frontend/src/utils/usePresence.ts` — `prefersReducedMotion` sai daqui; o restante (`usePresence`, `useLastDefined`) fica.
- `frontend/src/theme/ThemeProvider.tsx` + `frontend/src/theme/theme.ts` — `setPreference` e `startThemeTransition` (passo 6).
