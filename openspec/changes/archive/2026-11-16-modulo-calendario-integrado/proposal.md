# Proposal

## Why

Atualmente o estudante cadastra horários de aulas na aba `"Disciplinas"`, cria tarefas com prazos na aba `"Tarefas"` e define metas/datas de prova de leituras na aba `"Estudo"`, mas não possui uma aba de **Calendário** na interface para visualizar todos esses compromissos consolidados por dia/mês. Embora o backend já possua o endpoint `/api/v1/calendar`, ele ainda não está exposto em um módulo visual no frontend e ainda não agrega as datas de leituras acadêmicas (`AcademicReading`).

## What Changes

- **Novo Módulo `"Calendário"` (`/calendario`) na Navegação Principal**:
  - Adicionar a aba `"Calendário"` (`/calendario`) no menu superior (`AppNavigation.tsx`).
  - Criar a página `CalendarPage.tsx` com grade mensal interativa e painel detalhado do dia selecionado, refletindo automaticamente qualquer adição ou alteração feita nas demais telas:
    - **Disciplinas (`/disciplinas`)**: Aulas geradas a partir da grade semanal (`ClassOccurrence`), salas, horários e status de frequência.
    - **Tarefas (`/tarefas`)**: Entregas e atividades com prazo (`AcademicTask.due_date`), incluindo status (pendente, em andamento, concluída) e ação rápida de concluir direto pelo calendário.
    - **Estudo (`/estudo`)**: Metas de término (`target_date`) e datas de prova (`exam_date`) das leituras acadêmicas (`AcademicReading`).
    - **Eventos Acadêmicos (`/api/v1/academic-events`)**: Provas, trabalhos e compromissos cadastrados diretamente no calendário.
- **Aprimoramento da Agregação em `GET /api/v1/calendar` no Backend**:
  - Incluir no `CalendarView` (`backend/apps/academic/views.py`) os prazos de leituras acadêmicas (`target_date` e `exam_date` de `AcademicReading`) e preencher `subject_name` nos `AcademicEvent`s vinculados a disciplinas.

## Capabilities

### New Capabilities
- `academic-calendar`: Módulo visual de calendário acadêmico (`/calendario`) sincronizado automaticamente com aulas de Disciplinas, prazos de Tarefas, metas/provas de Leituras da aba Estudo e eventos acadêmicos.

### Modified Capabilities

## Impact

- **Backend (`backend/apps/academic/views.py`)**:
  - `CalendarView`: Inclusão de itens de `AcademicReading` (`exam_date` e `target_date`) e preenchimento de `subject_name` em `AcademicEvent`.
- **Frontend (`frontend/src/`)**:
  - `components/AppNavigation.tsx`: Inclusão do item `{ to: '/calendario', label: 'Calendário' }`.
  - `api/types.ts` & `api/client.ts`: Tipagens `CalendarItem`, `AcademicEvent`, `AcademicEventPayload` e funções `listCalendarItems`, `createAcademicEvent`, `deleteAcademicEvent`.
  - `pages/CalendarPage.tsx`: Nova página do módulo de Calendário com grade mensal, filtros por disciplina/tipo, visualização diária e criação rápida de eventos/provas.
  - `App.tsx`: Registro da rota protegida `/calendario`.
