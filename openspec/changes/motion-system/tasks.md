# Tasks

## 1. Fundação de movimento

- [x] 1.1 `frontend/src/styles.css`: token `--ease-out-expo` em `:root` e bloco final com keyframes (`page-in`, `rise`, `bar-grow`, `shimmer`, `modal-backdrop-in/out`, `modal-dialog-in/out`), utilitários (`.page-enter`, `.stagger-item`, `.bar-grow`, `.card-lift`, `.press`, `.skeleton-shimmer`, `.modal-backdrop`, `.modal-dialog`) e regra `@media (prefers-reduced-motion: reduce)` que desliga tudo.
- [x] 1.2 `frontend/src/components/RouteTransition.tsx`: wrapper por `pathname` com `.page-enter` + `window.scrollTo(0, 0)`; aplicado em `App.tsx` ao redor de `<Routes>`.
- [x] 1.3 `frontend/src/utils/usePresence.ts` (`usePresence`, `useLastDefined`, `prefersReducedMotion`) e `frontend/src/components/MotionPresence.tsx` (`MotionPresence`, wrapper `data-presence` + `display: contents`).
- [x] 1.4 `frontend/src/utils/useCountUp.ts` + `frontend/src/components/MetricValue.tsx` (contagem com `requestAnimationFrame`, valor final imediato sob movimento reduzido).

## 2. Overlays (entrada + saída)

- [x] 2.1 `LogPagesModal`, `SubjectEditModal` e lightbox de `PrintsPage`: retêm o último objeto/imagem via `useLastDefined` para o conteúdo não esvaziar durante o fade-out.
- [x] 2.2 `ReadingModal` e `TaskFormModal`: efeito de reset retorna cedo quando `isOpen`/`open` é falso, preservando os campos na saída.
- [x] 2.3 `SemesterSelectionModal`: presença aplicada; guard passa a ser `presence.mounted`.
- [x] 2.4 Overlays inline convertidos para `<MotionPresence>`: settings do `PomodoroTimer`, modal de pasta do `StudyNotesWorkspace`, novo evento e upload PDF do `CalendarPage`, IA e card manual do `FlashcardsPage`.

## 3. Listas, métricas e micro-interações

- [x] 3.1 `HomePage`: stagger em entregas/métricas/disciplinas, `MetricValue` nos 6 indicadores, `bar-grow` nas barras e `skeleton-shimmer` nos loaders.
- [x] 3.2 `TasksPage`: stagger em stats e cards, `MetricValue` nos 3 contadores, `press` nos botões e `Plus` girando em `group-hover`.
- [x] 3.3 `SubjectsPage`: stagger, `MetricValue` (inclui `%` e `h`), `bar-grow`, `press` e ícone girando.
- [x] 3.4 `FlashcardsPage` (baralhos e cards do gerenciamento) e `CalendarPage` (7 dias da semana): stagger com delay escalonado.
- [x] 3.5 `ReadingCard` e `ReadingStreakTracker`: `bar-grow` nas barras de progresso/meta.
- [x] 3.6 `AppNavigation` (NavLink) e `ThemeToggle`: `press` mantendo o outline de foco.

## 4. Verificação

- [x] 4.1 `node node_modules/typescript/bin/tsc -b --pretty false` sem erros.
- [x] 4.2 `node node_modules/vite/bin/vite.js build` concluído; CSS gerado contém `@media (prefers-reduced-motion:reduce){…animation:none!important}`.
- [x] 4.3 `eslint src` sem novas violações (restam apenas as pré-existentes em `StudyDocumentsHub`, `CalendarPage:345`, `FlashcardsPage:134`, `ProfilePage:31`).
- [x] 4.4 Navegação real: `.page-enter` com `page-in/0.32s`, scroll resetado (735 → 0) ao trocar de rota.
- [x] 4.5 Overlay real: backdrop/painel com `modal-backdrop-in`/`modal-dialog-in` ao abrir, `-out` ao fechar, nó removido após ~180ms.
- [x] 4.6 Retenção: nome da disciplina e `src` da imagem do lightbox permanecem durante o fade-out.
- [x] 4.7 Métricas: contadores sobem (4→5, 3→4, 68→130 min, 10%→20%) e `bar-grow` presente nas barras.
- [x] 4.8 Movimento reduzido (via stub de `matchMedia`): contadores já no valor final e overlay desmonta em 0ms.
- [x] 4.9 Hover: `card-lift` aplica `translateY(-2px)` mesmo após a animação de entrada (fill-mode `backwards`).
