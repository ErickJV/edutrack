## Why
Após a primeira versão do calendário e revisão do fluxo de estudo e tarefas, foram identificados quatro pontos críticos de usabilidade e funcionamento:
1. A aba `"Calendário"` deve ficar logo em seguida da aba `"Início"` no menu superior, e não no final.
2. O layout do calendário ficava espremido no lado esquerdo (dividido em `lg:col-span-8` dentro de `max-w-6xl`), cortando os títulos dos eventos nas células dos dias; é necessário um calendário de largura total (`max-w-7xl`), responsivo e amplo, que exiba claramente todos os dias do mês e os eventos completos em cada dia.
3. Na sessão de `"Estudo"`, o espaço de `"Textbook / Caderno"` exibia um `<textarea>` cru que injetava tags HTML/Markdown brutas (`<span style="...">`, `<mark>`, `<u>`), parecendo um editor de HTML puro em vez de um bloco real voltado para anotações.
4. Na criação de novas tarefas (`Tarefas`), ocorriam erros ao vincular disciplinas quando o estudante ainda não havia configurado manualmente o semestre ou trocado de curso, além de incompatibilidade de status maiúsculo/minúsculo em leituras acadêmicas.

## What Changes
- **Menu Superior (`AppNavigation.tsx`)**: Posicionar `"Calendário"` imediatamente após `"Início"` (`Início`, `Calendário`, `Disciplinas`, `Tarefas`, `Estudo`, e `Perfil` à direita).
- **Calendário Responsivo em Largura Total (`CalendarPage.tsx`)**:
  - Remover o espremimento lateral (`lg:col-span-8`) e expandir a grade mensal para ocupar toda a largura do container (`max-w-7xl`), com células amplas (`min-h-36` a `min-h-44`) que mostram todos os dias e listam claramente os eventos de cada dia com horário, título, disciplina e status.
  - Em telas menores (mobile/tablet), oferecer visualização responsiva adaptável com todos os dias do mês e seus eventos legíveis sem corte horizontal.
  - Posicionar o painel detalhado de ações rápidas e agenda do dia de forma integrada e espaçosa.
- **Reestruturação Completa do Bloco de Anotações (`StudyNotesWorkspace.tsx`)**:
  - Substituir o editor de código/HTML cru por um **Bloco de Anotações Visual (WYSIWYG)** onde formatações (negrito, itálico, sublinhado, cores, marca-texto, títulos, listas, citações e blocos de destaque) são aplicadas visualmente no texto sem expor tags HTML (`<span>`, `<mark>`, `<u>`) ao estudante.
  - Adicionar suporte a estilo de folha de caderno (pautada, pontilhada ou limpa), checklists clicáveis e cartões rápidos de anotação.
- **Correção de Criação de Tarefas e Vínculo com Disciplinas (`backend/apps/academic/` e `TaskFormModal.tsx`)**:
  - Garantir que o estudante sempre tenha disciplinas disponíveis do seu curso atual (auto-populando o 1º semestre quando não houver matrículas ativas do curso e listando também a matriz curricular no modal de tarefas).
  - Permitir que `AcademicTaskWriteSerializer` aceite tanto o ID de `StudentSubject` quanto o ID de `Subject` da matriz do curso (criando/ativando automaticamente o vínculo `StudentSubject`) e normalize datas `YYYY-MM-DD`.
  - Corrigir a serialização de status em `AcademicReading` para aceitar valores em maiúsculas ou minúsculas.

## Capabilities

### New Capabilities
- `study-notebook`: Bloco de anotações visual (WYSIWYG) na sessão de Estudo, sem exposição de HTML puro, com folhas pautadas/limpas e organização por pastas e disciplinas.

### Modified Capabilities
- `academic-calendar`: Posicionamento da aba `"Calendário"` logo após `"Início"` e layout responsivo de largura total exibindo todos os dias e eventos em cada dia.
- `study-tasks`: Vínculo resiliente de novas tarefas às disciplinas do curso ativo do estudante.

## Impact
- **Frontend**: `frontend/src/components/AppNavigation.tsx`, `frontend/src/pages/CalendarPage.tsx`, `frontend/src/components/StudyNotesWorkspace.tsx`, `frontend/src/components/TaskFormModal.tsx`, `frontend/src/pages/TasksPage.tsx`.
- **Backend**: `backend/apps/academic/views.py`, `backend/apps/academic/serializers.py`.
