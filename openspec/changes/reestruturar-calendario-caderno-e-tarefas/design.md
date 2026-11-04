## Context
1. **Menu e Layout do Calendário**: Em `AppNavigation.tsx`, `"Calendário"` estava antes de `"Perfil"` no fim da lista. Em `CalendarPage.tsx`, o uso de `lg:grid-cols-12` com `lg:col-span-8` dentro de `max-w-6xl` espremia as 7 colunas do mês no lado esquerdo da tela.
2. **Bloco de Anotações em Estudo (`StudyNotesWorkspace.tsx`)**: O componente usava um `<textarea>` que injetava strings HTML (`<span style="...">`, `<mark style="...">`, `<u>`) diretamente no texto editável, dando aparência de código HTML puro em vez de um bloco de anotações propriamente dito.
3. **Criação de Tarefas e Vínculo com Disciplinas**: Quando o usuário trocava de curso no Perfil ou ainda não tinha configurado manualmente o semestre em Disciplinas, `GET /api/v1/student-subjects` retornava vazio (`[]`) ou apenas disciplinas de outro curso, impedindo criar tarefas em `TaskFormModal.tsx`. Além disso, `AcademicTaskWriteSerializer` exigia estritamente um UUID já existente em `StudentSubject` com `status='active'`.

## Goals / Non-Goals

**Goals:**
- Posicionar `"Calendário"` logo após `"Início"` no menu superior.
- Reestruturar `CalendarPage.tsx` para largura total (`max-w-7xl`), com grade mensal ampla de 7 colunas no desktop e visão responsiva detalhada no mobile, mostrando todos os dias do mês e todos os eventos dentro de cada dia, com painel de detalhes/ações abaixo ou integrado sem espremer a grade.
- Reestruturar `StudyNotesWorkspace.tsx` como um verdadeiro **Bloco de Anotações** visual (`contentEditable` rico + suporte legado a notas antigas), com estilos de folha (Pautada, Pontilhada, Limpa), barra de ferramentas visual (sem tags HTML aparentes) e inserção de blocos de destaque/checklists.
- Garantir que `StudentSubjectListCreateView`, `AcademicTaskWriteSerializer` e `TaskFormModal.tsx` permitam vincular tarefas a qualquer disciplina do curso do aluno sem falhas.

**Non-Goals:**
- Alterar o modelo de autenticação ou rotas públicas.

## Decisions

### 1. Calendário em Largura Total (`CalendarPage.tsx`)
- A grade de 7 colunas passa a ocupar 100% da largura do container (`max-w-7xl`), dando a cada dia espaço suficiente para exibir número do dia, indicador de quantidade e cartões legíveis de cada evento (horário, título e disciplina).
- Ao clicar em um dia (ou visualizar o dia selecionado), a seção **"Agenda e Ações do Dia Selecionado"** exibe todos os detalhes, links de origem e botões rápidos (concluir tarefa, registrar presença/falta, criar/excluir evento) em layout amplo de 2 a 3 colunas sem comprimir o calendário.
- No mobile (`< 640px`), oferece alternância fluida ou grade responsiva com lista diária completa para que nenhum dia ou evento fique espremido.

### 2. Bloco de Anotações Visual (`StudyNotesWorkspace.tsx`)
- Renomear `"Caderno de Anotações (Textbook)"` para **"Bloco de Anotações"**.
- Substituir o `<textarea>` que expunha HTML bruto por um editor visual rico (`contentEditable`) com conversão automática de notas existentes (removendo/renderizando tags `<span>`, `<mark>`, `<u>` e Markdown como elementos visuais reais) e opções de fundo de papel (`Folha Pautada`, `Pontilhada` ou `Folha Limpa`).

### 3. Vínculo Resiliente de Disciplinas nas Tarefas (`serializers.py`, `views.py`, `TaskFormModal.tsx`)
- Em `StudentSubjectListCreateView`: filtrar disciplinas do curso atual do estudante (`user.course_offering.course`) e, caso o estudante ainda não possua nenhuma disciplina ativa no curso atual, matricular automaticamente as disciplinas do 1º semestre do seu curso para que nunca fique sem disciplinas disponíveis.
- Em `AcademicTaskWriteSerializer`: aceitar em `student_subject` tanto o `id` de um `StudentSubject` (reativando-o se estiver `dropped`) quanto o `id` de um `Subject` da matriz do curso (criando automaticamente o `StudentSubject` ativo), além de aceitar `due_date` no formato `YYYY-MM-DD` (convertendo para `12:00 UTC` do dia).
- Em `TaskFormModal.tsx` e `TasksPage.tsx`: carregar também a matriz curricular (`listCurriculum`) como fallback e exibir a mensagem real da `ApiError` caso ocorra erro.
