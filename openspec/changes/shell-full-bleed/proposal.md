# Proposal

## Why
Implement Plano — Shell full-bleed: remover a camada de fundo (gutter cinza + frame branco) to meet project requirements and provide clean, maintainable behavior.

## What Changes
- Implement Plano — Shell full-bleed: remover a camada de fundo (gutter cinza + frame branco)
- Add verification tests and documentation updates

## Capabilities

### New Capabilities
- `shell-full-bleed`: Implements capabilities and behavior for Plano — Shell full-bleed: remover a camada de fundo (gutter cinza + frame branco)

### Modified Capabilities

## Impact
|Arquivo|Âncora|Motivo|
|---|---|---|
|`frontend/src/components/layout/AppLayout.tsx`|`return` do shell, linhas 95–97|remove gutter/frame e define `bg-surface` + wrapper `lg:p-3`|
|`frontend/src/components/layout/Sidebar.tsx`|`className` do `<aside>`, linha 45|recalcula `top`/altura sem o padding do frame|
|`frontend/src/styles.css`|tokens 67–68 e 109–110; regras 873–880|apaga a camada de fundo|
|`frontend/src/components/StudyNotesWorkspace.tsx`|`section` linha 775|`min-h` → `flex-1`|
|`frontend/src/pages/StudySessionPage.tsx`|`section` linha 271|`min-h` → `flex-1`|
