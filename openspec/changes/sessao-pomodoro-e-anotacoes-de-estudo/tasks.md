## 1. Backend: Modelos de Dados, Migrações e APIs

- [x] 1.1 Criar os modelos `StudyFolder` e `StudyNote` em `backend/apps/academic/models.py` com chaves estrangeiras para `User`, `StudentSubject` e `AcademicTask`.
- [x] 1.2 Gerar migração Django (`makemigrations`) e aplicar no banco de dados.
- [x] 1.3 Implementar `StudyFolderSerializer` e `StudyNoteSerializer` em `backend/apps/academic/serializers.py` garantindo validações de propriedade do usuário.
- [x] 1.4 Criar as views para listagem, criação, atualização e remoção de pastas e notas em `backend/apps/academic/views.py` e mapear endpoints em `backend/apps/academic/urls.py`.
- [x] 1.5 Criar e executar suíte de testes de API em `backend/tests/test_study_session_api.py` cobrindo criação, edição, filtros e isolamento de pastas e notas entre usuários.

## 2. Frontend: Tipagem e Cliente de API

- [x] 2.1 Definir tipos `StudyFolder`, `StudyNote` e opções de Pomodoro em `frontend/src/api/types.ts`.
- [x] 2.2 Implementar métodos no cliente HTTP (`frontend/src/api/client.ts`) para gerenciar pastas e notas de estudo.

## 3. Frontend: Componentes do Pomodoro, Metodologias e Caderno

- [x] 3.1 Desenvolver o componente `PomodoroTimer` com alternância entre Foco (25 min), Pausa Curta (5 min) e Pausa Longa (15 min), controles de execução, modal de personalização de durações e sincronização de minutos com a tarefa vinculada.
- [x] 3.2 Desenvolver o componente `MethodologySelector` com guias práticos, etapas e inserção rápida de roteiros para Método Feynman, Revisão Espaçada, Mapas Mentais e Interrogação Elaborativa.
- [x] 3.3 Desenvolver o workspace do caderno de anotações (Textbook) com gerenciador de pastas personalizáveis, lista de notas e editor de texto com formatação estilo Notion e autosave.
- [x] 3.4 Desenvolver a página `StudySessionPage.tsx` integrando o timer, a seleção de tarefa, o guia de metodologia e o caderno de anotações em layout adaptável.
- [x] 3.5 Registrar as rotas `/estudo` e `/estudo/:taskId` em `frontend/src/App.tsx` e incluir item de menu "Estudo" em `frontend/src/components/AppNavigation.tsx`.
- [x] 3.6 Atualizar os cards de tarefas em `frontend/src/pages/TasksPage.tsx` substituindo o cronômetro inline por botão/link de redirecionamento para `/estudo?taskId={id}`.

## 4. Validação Integrada, Testes e Acessibilidade

- [x] 4.1 Criar testes de interface para a página de estudo e timer em `frontend/src/pages/StudySessionPage.test.tsx` e atualizar `TasksPage.test.tsx`.
- [x] 4.2 Executar testes automatizados e checagem de tipos do frontend (`pnpm test --run` e `pnpm typecheck`).
- [x] 4.3 Executar testes do backend e linting (`uv run pytest` e `uv run ruff check .`).
- [x] 4.4 Validar responsividade em 360 px, verificar ausência de overflow e garantir conformidade de acessibilidade (WCAG AA).
