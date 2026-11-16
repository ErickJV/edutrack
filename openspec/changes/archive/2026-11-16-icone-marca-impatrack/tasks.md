# Tasks

## 1. Implementation

- [x] 1.1 Substituir o arquivo inteiro por (assinatura `Brand({ light = false })` preservada ⇒ **nenhum dos 13 call sites muda**): and verify changes

## 2. Verification

- [x] 2.1 `cd frontend && npx --yes pnpm@11.3.0 typecheck` → sem erros.
- [x] 2.2 `cd frontend && npx --yes pnpm@11.3.0 build` → conclui; em seguida `ls frontend/dist/favicon.svg` deve existir.
- [x] 2.3 `cd frontend && npx --yes pnpm@11.3.0 dev`, então `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/favicon.svg` → `200`; abrir `http://localhost:5173/entrar` e conferir que a **aba do navegador exibe o ladrilho teal com o raio** (não o ícone genérico de página).
- [x] 2.4 Na mesma tela `/entrar`: o logo aparece grande (48px, 56px a partir de `sm`) **sem texto ao lado**; alternar `ThemeToggle` para escuro e continuar legível; como há dois `<Brand />` (painéis login/cadastro), **ambos** devem estar preenchidos com o gradiente (prova de que o id não colidiu).
- [x] 2.5 Abrir `http://localhost:5173/prints` e `http://localhost:5173/home` (logado): logo alinhado à esquerda, sem quebra, sem espaço reservado para texto.
- [x] 2.6 Contingência: se não houver navegador utilizável na máquina (a automação de browser não funciona nesta estação — sem Chrome, Edge redirecionado ao Firefox pelo MSEdgeRedirect), entregar com 1-3 verdes via curl/build e registrar a confirmação visual dos passos 3-5 como pendente.
