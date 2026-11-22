# Tasks

## 1. Implementation

- [x] 1.1 Remover o bloco gráfico da marca em `frontend/src/components/Brand.tsx` (prop `showMark`, `<img src="/favicon.svg">` e o `ml-2.5` condicional) e usá-la sem mark em `frontend/src/components/layout/Sidebar.tsx` (`{compact ? null : <Brand light />}`), mantendo `aria-label="Impatrack Início"`, o wordmark `impatrack` e as classes de `light`.
- [x] 1.2 Remover de `frontend/src/styles.css` a regra `[data-collapsed='true'] .brand-word` (código morto após a mudança).

## 2. Verification

- [x] 2.1 `tsc -b --pretty false` (equivalente a `pnpm typecheck`; `pnpm` não está no PATH desta máquina) — passou sem saída.
- [x] 2.2 `vite build` (equivalente a `pnpm build`) — 1899 módulos transformados, build concluído sem erros.
- [x] 2.3 Prova visual/end-to-end com `vite dev` + Django local, em `/entrar` e na home autenticada.
- [x] 2.4 `document.querySelector('a[aria-label="Impatrack Início"]').textContent.trim()` retornou `impatrack`.
- [x] 2.5 `document.querySelector('a[aria-label="Impatrack Início"] img')` e `... svg` retornaram `false`/`null`; o `innerHTML` do link contém apenas o `<span class="brand-word">impatrack</span>`.
- [x] 2.6 O link da marca continua apontando para `/` (clicar em `/home` permanece em `/home`; `/` redireciona para `/home` na sessão autenticada).
- [x] 2.7 Screenshot revisado: sidebar expandida mostra só o wordmark `IMPATRACK`; recolhida mostra só o botão "Expandir menu lateral", sem tile teal e sem imagem.
