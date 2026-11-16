# Proposal

## Why
Hoje o cabeçalho mostra apenas o wordmark textual "Impatrack" (`frontend/src/components/Brand.tsx`), usado em 13 telas, e a aba do navegador não tem favicon (`frontend/index.html` não referencia nenhum ícone; `frontend/public/` só tem `clippy/` e `prints/`). O pedido: um **logo de marca grande, sem texto ao lado**, com **design próprio** — apenas inspirado no símbolo da Impacta (o "A"/raio energético) — seguindo o tema teal do Impatrack, e o **mesmo desenho servindo de favicon** da aba.

## What Changes
- Implement Logo de marca grande (só ícone) + favicon da aba
- Add verification tests and documentation updates

## Capabilities

### New Capabilities
- `icone-marca-impatrack`: Implements capabilities and behavior for Logo de marca grande (só ícone) + favicon da aba

### Modified Capabilities

## Impact
- `frontend/src/components/Brand.tsx` — único componente alterado; conteúdo inteiro substituído.
- `frontend/public/favicon.svg` — arquivo novo; mesmo desenho do `Brand`.
- `frontend/index.html` — `<head>`: nova `<link rel="icon">` e `theme-color` corrigido (linha 6 hoje).
- `frontend/src/pages/AuthSliderPage.tsx` — dois `<Brand />` no mesmo DOM (~176 e ~316): origem da exigência do id único.
