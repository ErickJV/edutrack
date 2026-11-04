## Why
Para tornar a experiência de planejamento semanal e memorização ativa mais direta e fluida:
1. No módulo de **Calendário**, o estudante precisa enxergar logo na parte superior (abaixo do cabeçalho `"Calendário Acadêmico"`) tudo o que terá ao longo da **semana selecionada** com ações rápidas, além de um título mais limpo (sem o selo `"Visão Consolidada Multi-Tela"` e sem a palavra `"Integrado"`).
2. A aba `"Estudo"` deve se chamar **`"Anotações"`**, refletindo seu foco principal no bloco de anotações e leituras.
3. Logo em seguida de `"Anotações"`, o sistema precisa de um módulo dedicado de **`"Flashcards"`** inspirado no **Anki**, com baralhos (decks) por disciplina, repetição espaçada (SM-2 com botões *Errei / De novo*, *Difícil*, *Bom* e *Fácil*) e animação 3D de virar o cartão (*flipping*).

## What Changes
- **Calendário Acadêmico (`CalendarPage.tsx`)**:
  - Remover o badge `"Visão Consolidada Multi-Tela"` e alterar o título principal de `"Calendário Acadêmico Integrado"` para **`"Calendário Acadêmico"`**.
  - Reestruturar a antiga seção `"Detalhes e Ações Rápidas do Dia Selecionado"` para **`" Programação e Ações Rápidas da Semana"`** (trazendo todos os compromissos de Segunda a Domingo da semana do dia selecionado) e posicioná-la **na parte superior**, imediatamente abaixo do bloco `"Calendário Acadêmico"` e acima da grade mensal.
- **Renomeação de `"Estudo"` para `"Anotações"` (`AppNavigation.tsx`, `StudySessionPage.tsx`)**:
  - Alterar o rótulo no menu superior de `"Estudo"` para **`"Anotações"`**.
- **Novo Módulo `"Flashcards"` inspirado no Anki (`backend/apps/academic/` e `frontend/src/pages/FlashcardsPage.tsx`)**:
  - Adicionar a aba **`"Flashcards"`** (`/flashcards`) no menu superior logo em seguida de `"Anotações"`.
  - Criar modelo `Flashcard` no backend com campos `front`, `back`, `hint`, `deck_name`, `student_subject`, e parâmetros do algoritmo SM-2 do Anki (`state`: `new`, `learning`, `review`; `ease_factor`, `interval_days`, `repetitions`, `lapses`, `due_at`).
  - Criar endpoints `/api/v1/flashcards`, `/api/v1/flashcards/{id}` e `/api/v1/flashcards/{id}/review` (que calcula o próximo intervalo de revisão para `again`, `hard`, `good`, `easy`).
  - Criar `FlashcardsPage.tsx` com visão de Baralhos (Decks) estilo Anki (contadores `Novos`, `Aprender`, `Revisar`), modo de estudo com **animação 3D de flip (`rotateY(180deg)`)** ao virar o cartão frente/verso, botões de avaliação com previsão do próximo intervalo (`< 10 min`, `1d`, `3d`, `7d`...) e modal para criar/editar flashcards.

## Capabilities

### New Capabilities
- `anki-flashcards`: Módulo completo de Flashcards inspirado no Anki com baralhos por disciplina, repetição espaçada SM-2 e animação 3D de flip.

### Modified Capabilities
- `academic-calendar`: Cabeçalho limpo `"Calendário Acadêmico"` e seção superior de resumo e ações rápidas de toda a semana selecionada.

## Impact
- **Backend**: `backend/apps/academic/models.py`, `backend/apps/academic/migrations/`, `backend/apps/academic/serializers.py`, `backend/apps/academic/views.py`, `backend/apps/academic/urls.py`.
- **Frontend**: `frontend/src/components/AppNavigation.tsx`, `frontend/src/App.tsx`, `frontend/src/pages/CalendarPage.tsx`, `frontend/src/pages/StudySessionPage.tsx`, `frontend/src/pages/FlashcardsPage.tsx`, `frontend/src/api/types.ts`, `frontend/src/api/client.ts`.
