# Tasks: Calendário com Visão Semanal no Topo, Renomeação para Anotações e Módulo Flashcards (Anki)

## 1. Calendário Acadêmico e Visão Semanal no Topo
- [x] 1.1 Atualizar `frontend/src/pages/CalendarPage.tsx` removendo a badge `"Visão Consolidada Multi-Tela"` e alterando o título `"Calendário Acadêmico Integrado"` para `"Calendário Acadêmico"`.
- [x] 1.2 Reestruturar a antiga seção `"Detalhes e Ações Rápidas do Dia Selecionado"` para `"Detalhes e Ações Rápidas da Semana"` (exibindo os 7 dias da semana selecionada de Segunda a Domingo com todos os eventos/tarefas e ações rápidas) e posicioná-la na parte superior da página, logo abaixo do cabeçalho `"Calendário Acadêmico"`.

## 2. Renomear "Estudo" para "Anotações"
- [x] 2.1 Atualizar `frontend/src/components/AppNavigation.tsx` alterando o rótulo `"Estudo"` para `"Anotações"` e inserindo `"Flashcards"` (`to: '/flashcards'`) logo em seguida.
- [x] 2.2 Atualizar `frontend/src/pages/StudySessionPage.tsx` para refletir o nome `"Anotações"`.

## 3. Backend do Módulo Flashcards (Inspirado no Anki)
- [x] 3.1 Criar modelo `Flashcard` em `backend/apps/academic/models.py` e gerar/aplicar migration (`0011_flashcard.py`).
- [x] 3.2 Criar serializer e views (`FlashcardListCreateView`, `FlashcardDetailView`, `FlashcardReviewView`) em `backend/apps/academic/serializers.py`, `backend/apps/academic/views.py` e rotas em `backend/apps/academic/urls.py`.

## 4. Frontend do Módulo Flashcards com Animação 3D Flipping
- [x] 4.1 Adicionar tipos (`Flashcard`, `FlashcardPayload`, `FlashcardRating`) em `frontend/src/api/types.ts` e funções de API em `frontend/src/api/client.ts`.
- [x] 4.2 Criar `frontend/src/pages/FlashcardsPage.tsx` com visão de Baralhos (Decks), Modo de Estudo com animação 3D Flip (`rotateY(180deg)`), botões de repetição espaçada (`De novo`, `Difícil`, `Bom`, `Fácil`) e modal de criação/edição de cartões.
- [x] 4.3 Registrar a rota `/flashcards` em `frontend/src/App.tsx`.

## 5. Validação e Publicação
- [x] 5.1 Executar build TypeScript/Vite do frontend, validação do backend Django e validação OpenSpec.
- [x] 5.2 Realizar commit e push das alterações e dos arquivos Markdown para o fork `origin` (`KarinyAlves/edutrack`).
