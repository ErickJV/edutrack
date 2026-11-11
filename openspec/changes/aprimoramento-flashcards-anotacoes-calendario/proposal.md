## Why

A plataforma EduTrack precisa oferecer maior autonomia e precisão em três fluxos centrais do estudante:
1. **Aba Flashcards**: permitir o gerenciamento completo (criar, visualizar, editar frente/verso e excluir com confirmação) de cada card individualmente sem exigir recarregamento manual, além de padronizar a nomenclatura visual substituindo `"Baralhos (Decks)"` por `"Cards"` e `"Todos os Baralhos"` por `"Todos os Cards"`.
2. **Aba Anotações**: corrigir a listagem e associação de disciplinas na origem para exibir apenas as disciplinas efetivamente vinculadas ao semestre vigente do aluno, removendo qualquer associação incorreta da disciplina de 1º semestre `"Application Data Persistence"` às opções e anotações do semestre atual (2º semestre).
3. **Aba Calendário**: adicionar upload discreto de planos de aula / calendários acadêmicos em PDF vinculados a uma disciplina, com extração automática das avaliações (`AP1`, `AP2`, `PAI 1`/`I`, `PAI 2`/`II`, `PAI 3`/`III` e nomenclatura por extenso `Programa de Aprendizagem Interdisciplinar`), tela de conferência pré-cadastro, prevenção de duplicidades e tratamento de inconsistências.

## What Changes

- **Módulo de Flashcards (`FlashcardsPage.tsx` & API `/api/v1/flashcards`)**:
  - Substituição integral das expressões `"Baralhos (Decks)"` → `"Cards"` e `"Todos os Baralhos"` → `"Todos os Cards"` na interface.
  - Ações completas de **Criar**, **Visualizar**, **Editar/Atualizar** (frente, verso, dica, tags, disciplina/grupo) e **Excluir** (com confirmação) diretamente tanto no card em estudo quanto na lista gerencial, refletindo imediatamente no estado da interface e no banco de dados.
- **Módulo de Anotações (`StudyNotesWorkspace.tsx`, `StudyDocumentsHub.tsx`, `StudySessionPage.tsx` & `StudentSubjectListCreateView` / `StudyNoteListCreateView`)**:
  - Filtragem estrita no backend e no frontend pelo semestre vigente do estudante (`current_semester`), garantindo que `"Application Data Persistence"` (disciplina do 1º semestre) não apareça como opção nem fique associada a anotações do semestre vigente (2º semestre), preservando as anotações válidas.
- **Módulo de Calendário (`CalendarPage.tsx` & endpoints `/api/v1/calendar/extract-pdf` e `/api/v1/calendar/confirm-extracted`)**:
  - Botão discreto **"Importar Calendário (PDF)"** no cabeçalho da aba Calendário.
  - Leitor e extrator de PDF (`pypdf`) calibrado com documentos reais de planos de aula (ex.: `Disciplina: Programming & Algorithms`), reconhecendo `AP1`, `AP2`, `PAI 1`/`I`, `PAI 2`/`II`, `PAI 3`/`III` e `Programa de Aprendizagem Interdisciplinar`, diferenciando datas reais de aplicação de prova (`Aplicação da Avaliação Parcial 1 (AP1)` em `21/09`) de menções secundárias (`Resolução da AP1` em `24/09` ou `Critérios de Avaliação` sem data).
  - Modal de conferência permitindo editar título, tipo, data (`YYYY-MM-DD`), horário, excluir itens extraídos incorretamente ou adicionar avaliações ausentes antes de confirmar a gravação sincronizada em `AcademicEvent` e `AcademicTask`, além de permitir editar eventos já cadastrados no calendário.

## Capabilities

### New Capabilities
- `flashcards-notes-calendar`: Gerenciamento CRUD completo e ajuste de nomenclatura em Flashcards, filtragem estrita de disciplinas do semestre vigente em Anotações e importação inteligente de calendários acadêmicos em PDF na aba Calendário.

### Modified Capabilities

## Impact

- **Backend (`backend/apps/academic/`)**: `views.py`, `serializers.py`, `urls.py`, `tests.py`.
- **Frontend (`frontend/src/`)**: `pages/FlashcardsPage.tsx`, `pages/CalendarPage.tsx`, `pages/StudySessionPage.tsx`, `components/StudyNotesWorkspace.tsx`, `components/StudyDocumentsHub.tsx`, `api/client.ts`, `api/types.ts`.
