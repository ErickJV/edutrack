# Proposal: Calendário com Visão Semanal no Topo, Anotações em Tela Cheia e Módulo Flashcards com IA

## Why
1. **Calendário Acadêmico**: O usuário solicitou reestruturar a seção `"Detalhes e Ações Rápidas do Dia Selecionado"` para trazer **tudo o que há ao longo daquela semana inteira**, posicionando essa visão semanal **na parte superior**, logo abaixo do bloco de cabeçalho `"Calendário Acadêmico"`. Além disso, pediu para remover o selo `"Visão Consolidada Multi-Tela"` e remover a palavra `"Integrado"` do título, deixando apenas `"Calendário Acadêmico"`.
2. **Anotações em Tela Máxima e Fonte em Menu Suspenso na Barra de Personalização**: O usuário pediu para mudar o nome do módulo `"Estudo"` para **`"Anotações"`**, fazer com que a área de anotações ocupe o **máximo possível da tela**, alinhar a folha pautada em passos exatos de `32px` e manter a escolha de **fonte como menu suspenso diretamente na barra de personalização**.
3. **Módulo Flashcards com Animação Flipping e Geração Inteligente por IA**: Logo em seguida de `"Anotações"`, o usuário solicitou criar um módulo chamado **`"Flashcards"`** com **animação 3D de virar o cartão (`flipping`)**, selo **`"Repetição Espaçada"`** (removendo `"Estilo Anki (SM-2)"`) e uma opção para **gerar flashcards de forma inteligente pela IA** a partir de temas, disciplinas ou páginas do Bloco de Anotações.

## What Changes
- **Calendário Acadêmico (`frontend/src/pages/CalendarPage.tsx`)**:
  - Remover a badge `"Visão Consolidada Multi-Tela"`.
  - Alterar o título principal de `"Calendário Acadêmico Integrado"` para **`"Calendário Acadêmico"`**.
  - Reestruturar a antiga seção `"Detalhes e Ações Rápidas do Dia Selecionado"` para uma seção de **Visão e Ações Rápidas da Semana** e posicioná-la **no topo da página**, imediatamente abaixo do bloco `"Calendário Acadêmico"` e acima da grade mensal.
- **Módulo Anotações (`frontend/src/components/AppNavigation.tsx`, `frontend/src/pages/StudySessionPage.tsx`, `frontend/src/components/StudyNotesWorkspace.tsx`)**:
  - Alterar o rótulo `"Estudo"` para **`"Anotações"`**.
  - Expandir o container de `Anotações` para ocupar o **máximo possível da tela** (`max-w-[1920px]`, `min-h-[calc(100dvh-135px)]` e folha com `min-h-[calc(100dvh-290px)]`), com botão de alternância rápida para ocultar o menu lateral de cadernos e focar 100% na folha.
  - Posicionar o seletor de **Fonte como menu suspenso** diretamente na barra de personalização (`role="toolbar"`), ao lado do seletor de folha (`Pautada`, `Pontilhada`, `Limpa`) e das ferramentas visuais.
  - Incluir botão **`"✨ Gerar Flashcards com IA"`** diretamente no Bloco de Anotações para transformar a nota atual em flashcards.
- **Módulo Flashcards com IA (`backend/apps/academic/` e `frontend/src/pages/FlashcardsPage.tsx`)**:
  - **Backend**: Modelo `Flashcard`, migração `0011_flashcard.py`, endpoints `/api/v1/flashcards`, `/api/v1/flashcards/<uuid:pk>/review` e `/api/v1/flashcards/generate-ai` (`FlashcardAIGenerateView`).
  - **Frontend**: Página `FlashcardsPage.tsx` com selo **`"Repetição Espaçada"`**, baralhos à esquerda, cartão 3D Flip à direita e modal **`"✨ Gerar com IA"`** para gerar flashcards inteligentes por tema, disciplina ou anotação salva.

## Capabilities

### Modified Capabilities
- `academic-calendar`: Título `"Calendário Acadêmico"`, remoção de `"Visão Consolidada Multi-Tela"` e seção semanal no topo.
- `study-notes-block`: Renomeado para `"Anotações"`, ocupando o máximo possível da tela, folha pautada alinhada em `32px`, fonte como menu suspenso na barra de personalização e geração de flashcards por IA a partir da nota.

### New Capabilities
- `anki-flashcards`: Módulo completo de Flashcards com repetição espaçada, animação 3D Flip e geração inteligente de cartões por IA (`/api/v1/flashcards/generate-ai`).
