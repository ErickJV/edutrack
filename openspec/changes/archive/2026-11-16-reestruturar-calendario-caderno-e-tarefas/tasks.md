# Tasks

## 1. Endpoints Backend (Vínculo de Disciplinas e Tarefas sem Erros)

- [x] 1.1 Atualizar `StudentSubjectListCreateView` em `backend/apps/academic/views.py` e `AcademicTaskWriteSerializer` / `AcademicReadingSerializer` em `backend/apps/academic/serializers.py` para garantir matrícula automática inicial no curso ativo, aceitar vínculo de tarefas por `StudentSubject.id` ou `Subject.id`, normalizar `due_date` (`YYYY-MM-DD`) e normalizar `status` de leitura.

## 2. Menu Superior, Calendário Responsivo em Largura Total e Tarefas

- [x] 2.1 Mover `"Calendário"` para logo após `"Início"` em `frontend/src/components/AppNavigation.tsx` e reestruturar `frontend/src/pages/CalendarPage.tsx` em largura total (`max-w-7xl`) sem espremer a grade à esquerda, exibindo todos os dias e eventos completos em cada célula.
- [x] 2.2 Atualizar `frontend/src/components/TaskFormModal.tsx` e `frontend/src/pages/TasksPage.tsx` para listar todas as disciplinas ativas e da matriz do curso no seletor de nova tarefa e tratar erros detalhados da API.

## 3. Reestruturação do Bloco de Anotações na Sessão de Estudo

- [x] 3.1 Reestruturar `frontend/src/components/StudyNotesWorkspace.tsx` como um Bloco de Anotações visual (WYSIWYG com opção de folha pautada/limpa, checklists interativas e formatação visual direta sem expor tags HTML ou Markdown cru).

## 4. Verificação Ponta a Ponta

- [x] 4.1 Validar compilação (`tsc -b` e `vite build`), testar criação de tarefa vinculada à disciplina via API, validar artefatos OpenSpec e publicar no GitHub (`origin/main`).
