# Tasks: Calendário com Visão Semanal no Topo, Anotações em Tela Máxima e Módulo Flashcards com IA

## 1. Calendário Acadêmico e Visão Semanal no Topo
- [x] 1.1 Atualizar `frontend/src/pages/CalendarPage.tsx` removendo a badge `"Visão Consolidada Multi-Tela"` e alterando o título `"Calendário Acadêmico Integrado"` para `"Calendário Acadêmico"`.
- [x] 1.2 Reestruturar a antiga seção `"Detalhes e Ações Rápidas do Dia Selecionado"` para `"Detalhes e Ações Rápidas da Semana"` e posicioná-la na parte superior da página, logo abaixo do cabeçalho `"Calendário Acadêmico"`.

## 2. Anotações em Tela Máxima e Fonte em Menu Suspenso na Barra de Personalização
- [x] 2.1 Atualizar `frontend/src/components/AppNavigation.tsx` alterando o rótulo `"Estudo"` para `"Anotações"` e inserindo `"Flashcards"` (`to: '/flashcards'`) logo em seguida.
- [x] 2.2 Reestruturar `frontend/src/pages/StudySessionPage.tsx` e `frontend/src/components/StudyNotesWorkspace.tsx` para que o Bloco de Anotações ocupe o máximo possível da largura e altura da tela (`max-w-[1920px]` e `min-h-[calc(100dvh-135px)]`).
- [x] 2.3 Alinhar a folha pautada (`32px`) em `frontend/src/styles.css` e configurar o seletor de fonte como menu suspenso dentro da própria barra de personalização em `frontend/src/components/StudyNotesWorkspace.tsx`.

## 3. Backend do Módulo Flashcards e Geração Inteligente por IA
- [x] 3.1 Criar modelo `Flashcard` em `backend/apps/academic/models.py` e gerar/aplicar migration (`0011_flashcard.py`).
- [x] 3.2 Criar serializer e views (`FlashcardListCreateView`, `FlashcardDetailView`, `FlashcardReviewView`, `FlashcardAIGenerateView`) em `backend/apps/academic/serializers.py`, `backend/apps/academic/views.py` e rotas em `backend/apps/academic/urls.py` (`/api/v1/flashcards/generate-ai`).

## 4. Frontend do Módulo Flashcards com 3D Flip e Geração por IA
- [x] 4.1 Adicionar tipos (`Flashcard`, `FlashcardPayload`, `FlashcardRating`, `FlashcardAIGeneratePayload`) em `frontend/src/api/types.ts` e funções de API (`generateFlashcardsWithAI`) em `frontend/src/api/client.ts`.
- [x] 4.2 Atualizar `frontend/src/pages/FlashcardsPage.tsx` com o selo `"Repetição Espaçada"`, animação 3D Flip (`.anki-flip-card`), botões de repetição espaçada e modal `"Gerar Flashcards com IA"`.
- [x] 4.3 Registrar a rota `/flashcards` em `frontend/src/App.tsx`.

## 5. Validação e Publicação
- [x] 5.1 Executar build TypeScript/Vite do frontend, validação do backend Django (`POST /api/v1/flashcards/generate-ai`) e validação OpenSpec.
- [x] 5.2 Realizar commit e push das alterações e dos arquivos Markdown para o fork `origin` (`KarinyAlves/edutrack`).
