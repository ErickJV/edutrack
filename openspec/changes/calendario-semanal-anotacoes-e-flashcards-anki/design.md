## Context
1. **Calendário**: O usuário pediu para remover `"Visão Consolidada Multi-Tela"`, mudar `"Calendário Acadêmico Integrado"` para `"Calendário Acadêmico"`, e transformar a seção `"Detalhes e Ações Rápidas do Dia Selecionado"` em uma visão que traga **tudo o que há ao longo daquela semana**, posicionada **na parte superior**, logo abaixo do bloco `"Calendário Acadêmico"`.
2. **Navegação**: Mudar `"Estudo"` para `"Anotações"` e incluir `"Flashcards"` logo em seguida.
3. **Flashcards (Anki)**: Inspirado na arquitetura de estudo do Anki (baralhos/decks, fila de cartões `Novos`, `Aprendendo` e `Revisão`, algoritmo SM-2 de repetição espaçada com 4 botões de resposta e animação CSS 3D `rotateY(180deg)` com `perspective` e `backface-visibility: hidden`).

## Goals / Non-Goals

**Goals:**
- Destacar toda a semana selecionada logo no topo do Calendário Acadêmico.
- Renomear `"Estudo"` para `"Anotações"`.
- Construir backend e frontend completos para o módulo `"Flashcards"` inspirado no Anki com animação 3D de flip.

**Non-Goals:**
- Importação de arquivos binários `.apkg` nesta sprint.

## Decisions

### 1. Modelo e Algoritmo SM-2 de Flashcards (`backend/apps/academic/`)
- **Modelo `Flashcard`**:
  - `user` (FK User), `student_subject` (FK StudentSubject opcional), `deck_name` (CharField, default `"Geral"`), `front` (TextField), `back` (TextField), `hint` (CharField opcional), `tags` (CharField opcional).
  - Campos Anki SM-2: `state` (`new`, `learning`, `review`), `ease_factor` (FloatField, default `2.5`), `interval_days` (PositiveIntegerField, default `0`), `repetitions` (PositiveIntegerField, default `0`), `lapses` (PositiveIntegerField, default `0`), `due_at` (DateTimeField, default `timezone.now`), `last_reviewed_at` (DateTimeField null).
- **Endpoint de Revisão (`POST /api/v1/flashcards/{id}/review`)**:
  - Recebe `rating` (`again` | `hard` | `good` | `easy`):
    - `again`: `repetitions = 0`, `lapses += 1`, `state = 'learning'`, `interval_days = 0`, `ease_factor = max(1.3, ease_factor - 0.2)`, `due_at = now + 10 min`.
    - `hard`: `state = 'review'`, `interval_days = max(1, round(interval_days * 1.2))` (ou `1` se `interval_days == 0`), `ease_factor = max(1.3, ease_factor - 0.15)`, `due_at = now + interval_days`.
    - `good`: `repetitions += 1`, `state = 'review'`, `interval_days = 1 if repetitions == 1 else (3 if repetitions == 2 else max(1, round(interval_days * ease_factor)))`, `due_at = now + interval_days`.
    - `easy`: `repetitions += 1`, `state = 'review'`, `ease_factor = ease_factor + 0.15`, `interval_days = 4 if repetitions == 1 else max(4, round(interval_days * ease_factor * 1.3))`, `due_at = now + interval_days`.

### 2. Animação 3D de Flipping no Frontend (`FlashcardsPage.tsx`)
- Container externo com `[perspective:1200px]`.
- Cartão interno com `transition-transform duration-500 [transform-style:preserve-3d]` que alterna entre `[transform:rotateY(0deg)]` (Frente / Pergunta) e `[transform:rotateY(180deg)]` (Verso / Resposta).
- Faces frontal e traseira com `[backface-visibility:hidden]` (e a face traseira com `[transform:rotateY(180deg)]`).
- Suporte a atalhos de teclado estilo Anki (`Espaço` para virar o cartão, `1`, `2`, `3`, `4` para responder `De novo`, `Difícil`, `Bom`, `Fácil`).

### 3. Visão Semanal no Topo do Calendário (`CalendarPage.tsx`)
- A partir de `selectedDateKey`, calcular a semana correspondente (Segunda a Domingo).
- Exibir essa seção logo abaixo do bloco `"Calendário Acadêmico"` (antes da grade mensal), agrupando os compromissos da semana por dia (ou listando os 7 dias da semana e seus eventos com botões de ação rápida para concluir tarefas, registrar presença/falta, criar ou excluir evento).
