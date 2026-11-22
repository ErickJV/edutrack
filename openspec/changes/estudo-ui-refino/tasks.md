# Tasks

## 1. Marca e backdrop

- [x] 1.1 `Brand.tsx` sem mark; `Sidebar.tsx` usa `{compact ? null : <Brand light />}`; regra `[data-collapsed='true'] .brand-word` removida de `styles.css`.
- [x] 1.2 Tokens de backdrop neutros: claro `#F1F2F5`/`#E7E8EC`, escuro `#101014`/`#08080B`.

## 2. Card "Foco de Hoje"

- [x] 2.1 `FocusCard.tsx` usa `dashboard-card` (superfície, borda, raio e sombra semânticos) em vez de `bg-[var(--sidebar-bg)] text-white`; rótulo `#006768`/`--accent-lime`, título `--text-primary`, meta `--text-secondary`, tile `--pastel-green`; esqueletos em `bg-line`.

## 3. Cabeçalho compartilhado das abas de estudo

- [x] 3.1 Criar `frontend/src/components/StudySectionHeader.tsx` com o markup atual da barra (título por variante, tablist, Pomodoro, seletor "Foco:", botão primário parametrizado).
- [x] 3.2 `StudyNotesWorkspace` consome `StudySectionHeader` e tipa `activeTab`/`onSwitchTab` com `StudyTab`; imports ociosos removidos.
- [x] 3.3 `StudySessionPage` usa a mesma moldura e o mesmo header na aba Leituras; ferramentas de foco (Pomodoro/Metodologias) visíveis nas três abas.

## 4. Transições

- [x] 4.1 `frontend/src/utils/useTabTransition.ts` com `useLayoutEffect` + `prefersReducedMotion`.
- [x] 4.2 Painel de abas envolvido em `tabPanelRef`; `RouteTransition` sem véu/`page-enter` wrapper; `@keyframes page-in` 10px, `.page-enter` 420ms + `will-change`; `veil-pulse`/`.route-veil` removidos.

## 5. Verification

- [x] 5.1 `tsc -b --pretty false` e `vite build` passam; `eslint` nos arquivos alterados sem erros.
- [x] 5.2 Marca: link com `textContent` `impatrack`, sem `img`/`svg`; sidebar recolhida sem tile.
- [x] 5.3 Backdrop computado: claro `rgb(241,242,245) → rgb(231,232,236)`; escuro `rgb(16,16,20) → rgb(8,8,11)`; sem roxo.
- [x] 5.4 Foco de Hoje: `section.dashboard-card` com fundo branco e título `rgb(23,23,47)` no claro; `rgb(19,19,38)` com título claro no escuro.
- [x] 5.5 `/estudo`: as três abas exibem exatamente um `[role="tablist"]`, "Pomodoro & Metodologias" e o seletor "Foco:"; botão primário alterna entre "Nova Página" e "Nova Leitura"; moldura idêntica (18px, branco, borda 1px).
- [x] 5.6 Animação de 280ms no painel após troca de aba (`document.getAnimations()`); botão "Cadastrar primeira leitura" abre o modal.
- [x] 5.7 Navegação `/home` → `/tarefas` → `/disciplinas`: `.page-enter` com `page-in 0.42s` e sem `.route-veil`.
- [x] 5.8 Regressão: nota editada em Anotações continua com o texto após ir para Leituras, voltar e selecioná-la; conteúdo confirmado também no banco.

## 6. Notas de verificação

- [ ] 6.1 `prefers-reduced-motion: reduce` não pôde ser emulado no WebKit headless usado (`page.emulateMediaFeatures` indisponível); a guarda `prefersReducedMotion()` é um `return` antes de `el.animate(...)`, verificada por leitura de código.
- [ ] 6.2 O editor abre vazio no primeiro mount mesmo com nota existente; comportamento idêntico em `HEAD` (A/B com a versão anterior de `StudyNotesWorkspace`), portanto pré-existente e fora do escopo.
