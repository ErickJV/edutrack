## 1. Aba Flashcards — Gerenciamento CRUD e Nomenclatura

- [x] 1.1 Substituir `"Baralhos (Decks)"` por `"Cards"` e `"Todos os Baralhos"` por `"Todos os Cards"` em `frontend/src/pages/FlashcardsPage.tsx` e ajustar textos correlatos.
- [x] 1.2 Adicionar confirmação antes de excluir flashcard (`window.confirm`) e botão de exclusão e visualização/edição direta tanto no card ativo quanto na listagem de gerenciamento, atualizando o estado imediatamente sem reload.

## 2. Aba Anotações — Correção das Disciplinas do Semestre Vigente

- [x] 2.1 Atualizar `StudentSubjectListCreateView` e `StudyNoteListCreateView` em `backend/apps/academic/views.py` para garantir que apenas disciplinas do semestre vigente fiquem ativas e desassociar `"Application Data Persistence"` de anotações do 2º semestre.
- [x] 2.2 Garantir filtro dinâmico de disciplinas do semestre vigente em `StudySessionPage.tsx`, `StudyNotesWorkspace.tsx` e `StudyDocumentsHub.tsx`.

## 3. Aba Calendário — Upload de PDF e Leitura Automática de Avaliações

- [x] 3.1 Implementar `CalendarPdfExtractView` (`POST /api/v1/calendar/extract-pdf`) e `CalendarPdfConfirmView` (`POST /api/v1/calendar/confirm-extracted`) em `backend/apps/academic/views.py` e registrar rotas em `backend/apps/academic/urls.py`.
- [x] 3.2 Adicionar funções de cliente (`extractCalendarPdf`, `confirmExtractedCalendarEvents`, `updateAcademicEvent`) e tipos em `frontend/src/api/client.ts` e `frontend/src/api/types.ts`.
- [x] 3.3 Implementar botão discreto de upload, modal de importação e conferência de datas extraídas (com edição, exclusão, adição manual e alertas de inconsistência/duplicidade), além de edição de eventos existentes em `frontend/src/pages/CalendarPage.tsx`.

## 4. Testes Automatizados e Validação Ponta a Ponta

- [x] 4.1 Adicionar testes automatizados em `backend/apps/academic/tests.py` cobrindo CRUD de Flashcards, filtro de disciplinas vigentes em Anotações e extração/confirmação de PDF de Calendário Acadêmico (incluindo o caso real de `Programming & Algorithms`).
- [x] 4.2 Executar suíte de testes do backend e build TypeScript/Vite do frontend.
