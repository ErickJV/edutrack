# Tasks

## 1. Endpoints Backend (Agregação Completa no Calendário)

- [x] 1.1 Atualizar `CalendarView` em `backend/apps/academic/views.py` para incluir o nome da disciplina (`subject_name`) nos eventos acadêmicos (`AcademicEvent`) e agregar automaticamente as metas de leitura (`target_date`, `kind: "reading"`) e datas de prova de leitura (`exam_date`, `kind: "exam"`) cadastradas no módulo `"Estudo"` (`AcademicReading`), verificando com `ruff check apps/academic/views.py`.

## 2. Telas & Componentes Frontend (Módulo Calendário e Navegação)

- [x] 2.1 Adicionar tipagens (`CalendarItem`, `AcademicEvent`) e funções de consumo da API (`listCalendarItems`, `createAcademicEvent`, `deleteAcademicEvent`) em `frontend/src/api/types.ts` e `frontend/src/api/client.ts`.
- [x] 2.2 Criar `frontend/src/pages/CalendarPage.tsx` com grade mensal interativa, filtros por disciplina/categoria, painel lateral de detalhes do dia, ações rápidas (concluir tarefa, registrar presença/falta em aula) e criação/remoção de eventos acadêmicos; registrar a rota `/calendario` em `frontend/src/App.tsx` e adicionar a aba `"Calendário"` em `frontend/src/components/AppNavigation.tsx`.

## 3. Verificação Ponta a Ponta

- [x] 3.1 Validar compilação e tipagem (`tsc -b` e `vite build`), testar o endpoint `GET /api/v1/calendar` confirmando que alterações feitas em Disciplinas, Tarefas e Estudo aparecem no Calendário, e publicar as alterações no GitHub (`origin/main`).
