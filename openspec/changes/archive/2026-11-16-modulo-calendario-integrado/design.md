## Context
O EduTrack já possui no backend (`backend/apps/academic/views.py`) os endpoints `CalendarView` (`/api/v1/calendar`) e `AcademicEventListCreateView` / `AcademicEventDetailView` (`/api/v1/academic-events`), porém:
1. O frontend ainda não possui a página `/calendario` nem o item `"Calendário"` na barra de navegação (`AppNavigation.tsx`).
2. O `CalendarView` agrega `ClassOccurrence` (geradas na tela `"Disciplinas" / SubjectEditModal`), `AcademicTask` (criadas/editadas na tela `"Tarefas"`) e `AcademicEvent`, mas ainda não inclui os marcos de `AcademicReading` (`target_date` e `exam_date`, criados/editados na tela `"Estudo"`) e deixava `subject_name: None` nos `AcademicEvent`.

## Goals / Non-Goals

**Goals:**
- Garantir que qualquer criação, edição ou remoção feita nas telas `"Disciplinas"` (grade horária e vigência de aulas), `"Tarefas"` (prazos e status de conclusão) e `"Estudo"` (metas de leitura `target_date` e datas de prova `exam_date`) apareça automaticamente no módulo `"Calendário"`.
- Permitir também criar e remover eventos acadêmicos diretamente no calendário (`AcademicEvent`: prova, entrega ou lembrete) e realizar ações rápidas nos itens do dia (concluir tarefa, registrar presença/falta de aula).
- Seguir fielmente o padrão visual dark mode do EduTrack (`slate-950`, `emerald`, `cyan`, `amber`, `rose`).

**Non-Goals:**
- Sincronização com agendas externas (Google Calendar / Outlook iCal) neste ciclo.

## Decisions

### 1. Enriquecimento do `CalendarView` (`GET /api/v1/calendar`)
- **Arquivo**: `backend/apps/academic/views.py`
- **Decisão**:
  - Em `AcademicEvent`, adicionar `.select_related("student_subject__subject")` e preencher `"subject_name": ev.student_subject.subject.name if ev.student_subject else None`.
  - Consultar `AcademicReading` do estudante (quando `source_filter` permitir `"reading"`) filtrando leituras com `target_date` ou `exam_date` dentro do intervalo `[from_dt.date(), to_dt.date()]` (e respeitando `student_subject_id` quando filtrado).
  - Para `target_date` no intervalo, emitir item com `source_type: "reading"`, `kind: "reading"`, `title: f"Meta de leitura: {r.title}"` e `status: r.status`.
  - Para `exam_date` no intervalo, emitir item com `source_type: "reading"`, `kind: "exam"`, `title: f"Prova ({r.subject_name}): {r.title}"` e `status: r.status`.

### 2. Arquitetura do Módulo Frontend (`CalendarPage.tsx`)
- **Arquivos**:
  - `frontend/src/api/types.ts` e `frontend/src/api/client.ts`: Adicionar tipos `CalendarItem`, `AcademicEvent` e funções `listCalendarItems`, `createAcademicEvent`, `deleteAcademicEvent`.
  - `frontend/src/pages/CalendarPage.tsx`:
    - Cabeçalho com seletor de mês/ano (anterior, próximo, botão `"Hoje"`), contadores resumo do mês (Aulas, Tarefas, Provas/Eventos, Leituras) e filtros por disciplina e por categoria.
    - Grade mensal de 7 colunas (Seg a Dom) exibindo pílulas coloridas por tipo de item em cada dia (`emerald` para aulas, `amber` para tarefas, `rose` para provas, `cyan` para leituras/estudo, `violet` para outros eventos).
    - Painel lateral detalhado do dia selecionado permitindo:
      - Visualizar horários, salas e status de cada item do dia;
      - Marcar/desmarcar tarefa como concluída (`updateTask`) ou registrar presença/falta em aula (`markAttendance`) diretamente do calendário;
      - Cadastrar novo evento acadêmico (`createAcademicEvent`) ou excluir evento avulso (`deleteAcademicEvent`).
  - `frontend/src/components/AppNavigation.tsx` e `frontend/src/App.tsx`: Adicionar aba `"Calendário"` (`/calendario`) na navegação principal.
