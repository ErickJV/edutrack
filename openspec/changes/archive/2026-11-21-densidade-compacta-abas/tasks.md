# Tasks

## 1. Implementation

- [x] 1.1 Substituir apenas as classes de tamanho; preservar cores, bordas, sombras, layout e ordem dos elementos. and verify changes

## 2. Verification

- [x] 2.1 Pré-requisitos: `cd frontend` e dependências já instaladas.
- [x] 2.2 `pnpm typecheck` → sem erros de TypeScript.
- [x] 2.3 `pnpm build` → build Vite conclui.
- [x] 2.4 `pnpm lint` → sem novos erros (o repositório acabou de zerar o lint).
- [x] 2.5 Subir `pnpm dev` e, com sessão autenticada (backend em `cd backend && uv run --no-sync python manage.py runserver`), abrir cada rota em 390×844 e 1280×800, nos temas claro e escuro:
- [x] 2.6 `/calendario`: `h1` computado = 20 px em 390 e 22 px em ≥640; cartão externo com `border-radius` 18 px e padding 16/17 px; grade mensal mantém 7 colunas e células com `min-height` 144 px (mobile) / 176 px (desktop); sem scroll horizontal (`document.documentElement.scrollWidth === clientWidth`).
- [x] 2.7 `/tarefas`: KPI computado 25 px; rótulo 10 px; botões com altura ≥36 px; nenhuma linha de formulário com overflow.
- [x] 2.8 `/disciplinas`: cards de disciplina com padding 16 px e título 13 px; capa 3D com dimensões inalteradas.
- [x] 2.9 `/estudo`: painel de leituras com padding 16 px e título 17 px; título do editor 18/20 px; corpo editável ainda 16 px com `line-height` 32 px.
- [x] 2.10 `/flashcards`: pergunta do card ainda 20 px (mobile) / 26 px (desktop); padding das faces 28/40 px; dock com botões ≥44 px (`min-h-11`).
- [x] 2.11 `/perfil`: cards com padding 16/17 px; `dd` 13 px; inputs ainda 44 px de altura.
- [x] 2.12 Regressão de exceções: comparar visualmente frente/verso de flashcard, capas 3D e mostrador do Pomodoro antes/depois; devem estar idênticos.
