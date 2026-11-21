# Tasks

## 1. Implementation

- [ ] 1.1 1. Editar `frontend/src/components/Brand.tsx`: and verify changes

## 2. Verification

- [ ] 2.1 `cd frontend && pnpm typecheck` — deve passar (garante que a remoção de `useId` não deixou import não utilizado).
- [ ] 2.2 `cd frontend && pnpm build` — deve concluir sem erros.
- [ ] 2.3 Prova visual/end-to-end: rodar `cd frontend && pnpm dev`, abrir a URL informada (ex.: `http://localhost:5173/`) e, na tela de login e na home autenticada, inspecionar o link da marca:
- [ ] 2.4 `document.querySelector('a[aria-label="Impatrack Início"]').textContent.trim()` deve retornar exatamente `impatrack`.
- [ ] 2.5 `document.querySelector('a[aria-label="Impatrack Início"] svg')` deve retornar `null`.
- [ ] 2.6 O link deve continuar navegando para `/`.
- [ ] 2.7 Capturar screenshot do cabeçalho confirmando a ausência do bloco gráfico.
