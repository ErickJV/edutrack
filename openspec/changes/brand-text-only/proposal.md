# Proposal

## Why
A marca do app é renderizada pelo componente compartilhado `frontend/src/components/Brand.tsx`: um `<svg>` (tile em gradiente com raio e círculo) seguido do texto "Impatrack". O usuário quer eliminar o símbolo gráfico e manter somente o texto, grafado exatamente como `impatrack`. Todos os cabeçalhos de páginas autenticadas, telas de autenticação e páginas institucionais usam esse mesmo componente, então a alteração em um único arquivo cobre toda a aplicação.

## What Changes
- Editar `frontend/src/components/Brand.tsx`:
- Não alterar `frontend/public/favicon.svg` nem o `<link rel="icon">` de `frontend/index.html`: é o ícone da aba do navegador, não o logo exibido dentro da interface.
- Nenhum outro arquivo contém o símbolo da marca; os demais usos de "Impatrack" são textos institucionais e permanecem como estão.

## Capabilities

### New Capabilities
- `brand-text-only`: Implements capabilities and behavior for Remove o logo/ícone da marca e exibe apenas o texto "impatrack"

### Modified Capabilities

## Impact
- `frontend/src/components/Brand.tsx` — componente inteiro; é o único ponto que desenha o logo. Chamadores: `AuthShell.tsx`, `AuthSliderPage.tsx` (2×), `CalendarPage.tsx`, `FlashcardsPage.tsx`, `HomePage.tsx`, `LegalPage.tsx`, `NotFoundPage.tsx`, `PrintsPage.tsx`, `ProfilePage.tsx`, `StudySessionPage.tsx`, `SubjectsPage.tsx`, `TasksPage.tsx`; todos usam `<Brand />` sem props e não precisam de edição.
