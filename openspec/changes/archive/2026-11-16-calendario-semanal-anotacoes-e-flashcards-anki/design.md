## Context
1. **Calendário**: O usuário pediu para remover `"Visão Consolidada Multi-Tela"`, mudar `"Calendário Acadêmico Integrado"` para `"Calendário Acadêmico"`, e transformar a seção `"Detalhes e Ações Rápidas do Dia Selecionado"` em uma visão que traga **tudo o que há ao longo daquela semana**, posicionada **na parte superior**, logo abaixo do bloco `"Calendário Acadêmico"`.
2. **Navegação e Bloco de Anotações**: Mudar `"Estudo"` para `"Anotações"`, colocar o Bloco de Anotações em destaque no topo da tela, alinhar perfeitamente a folha pautada (`line-height: 32px`, `padding-top: 6px`, `background-attachment: local` e margem vertical esquerda) e disponibilizar todas as opções de fonte (`Inter`, `Merriweather`, `Montserrat`, `Comfortaa`, `Segoe UI`, `Arial`, `Mono`) e estilo de folha diretamente na própria barra de personalização do caderno.
3. **Flashcards (Anki)**: Inspirado na arquitetura de estudo do Anki (painel de baralhos/decks à esquerda e palco de estudo 3D à direita, fila de cartões `Novos`, `Aprendendo` e `Revisão`, algoritmo SM-2 de repetição espaçada com 4 botões de resposta e animação CSS 3D `rotateY(180deg)` empilhada via CSS Grid `grid-area: 1 / 1` com `translateZ(2px)` e `backface-visibility: hidden`).

## Goals / Non-Goals

**Goals:**
- Destacar toda a semana selecionada logo no topo do Calendário Acadêmico.
- Renomear `"Estudo"` para `"Anotações"`, alinhar a folha pautada em passos exatos de `32px` e incorporar as opções de fonte diretamente na barra de personalização.
- Construir backend e frontend completos para o módulo `"Flashcards"` inspirado no Anki com layout de 2 colunas alinhado e animação 3D de flip sem colapso nem sobreposição.

**Non-Goals:**
- Importação de arquivos binários `.apkg` nesta sprint.

## Decisions

### 1. Modelo e Algoritmo SM-2 de Flashcards (`backend/apps/academic/`)
- **Modelo `Flashcard`**:
  - `user` (FK User), `student_subject` (FK StudentSubject opcional), `deck_name` (CharField, default `"Geral"`), `front` (TextField), `back` (TextField), `hint` (CharField opcional), `tags` (CharField opcional).
  - Campos Anki SM-2: `state` (`new`, `learning`, `review`), `ease_factor` (FloatField, default `2.5`), `interval_days` (PositiveIntegerField, default `0`), `repetitions` (PositiveIntegerField, default `0`), `lapses` (PositiveIntegerField, default `0`), `due_at` (DateTimeField, default `timezone.now`), `last_reviewed_at` (DateTimeField null).
- **Endpoint de Revisão (`POST /api/v1/flashcards/{id}/review`)**:
  - Recebe `rating` (`again` | `hard` | `good` | `easy`).

### 2. Animação 3D de Flipping e Layout Anki (`FlashcardsPage.tsx` e `styles.css`)
- Layout de 2 colunas (`lg:grid-cols-12`): painel lateral de Baralhos (`lg:col-span-4`) à esquerda e palco do cartão 3D (`lg:col-span-8`) à direita.
- Cena `.anki-flip-scene` (`perspective: 1400px`) e `.anki-flip-card` (`display: grid; grid-template-columns: 1fr; transform-style: preserve-3d;`).
- Faces `.anki-flip-face-front` (`transform: rotateY(0deg) translateZ(2px)`) e `.anki-flip-face-back` (`transform: rotateY(180deg) translateZ(2px)`) compartilhando `grid-area: 1 / 1 / 2 / 2` e `backface-visibility: hidden`, evitando colapso de altura e z-fighting em navegadores Chromium.

### 3. Alinhamento da Folha Pautada e Fontes na Barra de Personalização (`StudyNotesWorkspace.tsx` e `styles.css`)
- Classe `.notebook-editor` com `line-height: 32px !important; padding-top: 6px !important; background-attachment: local;` e regras para `p, div, ul, ol, li, h1..h4, blockquote` com `margin: 0 !important; line-height: 32px !important;`, garantindo que todas as linhas de texto repousem exatamente sobre as pautas de `32px`.
- Barra de personalização (`role="toolbar"`) dividida em duas linhas:
  - Linha 1: Seletor direto de **Fonte** (`Inter`, `Merriweather`, `Montserrat`, `Comfortaa`, `Segoe UI`, `Arial`, `Mono`) e seletor de **Folha** (`Pautada`, `Pontilhada`, `Folha Limpa`).
  - Linha 2: Ferramentas visuais (`Título`, `Subtítulo`, `Texto`, `Negrito`, `Itálico`, `Sublinhado`, `Riscado`, `Marca-texto & Cor`, `Listas`, `Checklist`, `Bloco de Destaque`, `Tabela`, `Citação`).
