## 1. Modelagem Backend e Matriz Curricular (`apps.academic`)

- [x] 1.1 Criar novo app Django `apps.academic` e adicioná-lo em `LOCAL_APPS` no `settings.py`. Verificar com `python manage.py check`.
- [x] 1.2 Definir os modelos `Subject` (disciplina da matriz do curso), `StudentSubject` (matrícula ativa do estudante) e `AcademicTask` (tarefas e estudos) com campos de carga horária, status, tempo estimado e tempo real. Verificar integridade com migração `python manage.py makemigrations academic`.
- [x] 1.3 Criar migração de dados idempotente populando a matriz curricular das graduações da Impacta vinculadas ao `catalog.Course`. Verificar executando `python manage.py migrate` e conferindo a contagem no shell.
- [x] 1.4 Implementar testes automatizados de modelo em `backend/tests/test_academic_models.py` validando relacionamentos, restrições únicas e cascata de exclusão. Verificar com `pytest backend/tests/test_academic_models.py`.

## 2. APIs REST e Regras de Negócio no Backend

- [x] 2.1 Criar serializers e viewsets para consulta de matriz curricular (`GET /api/v1/curriculum`) filtrada pelo curso do aluno logado. Verificar com teste de rota em `pytest backend/tests/test_academic_api.py`.
- [x] 2.2 Criar endpoint de seleção e atualização de matérias ativas (`GET|POST /api/v1/student-subjects`) garantindo isolamento estrito por usuário. Verificar teste rejeitando acesso ou manipulação de disciplinas alheias.
- [x] 2.3 Implementar CRUD de tarefas acadêmicas (`/api/v1/tasks`) com suporte a filtros por matéria e status, e ação `/toggle-complete`. Verificar com testes unitários cobrindo transições de status.
- [x] 2.4 Implementar endpoint consolidado de dashboard (`GET /api/v1/dashboard/summary`) calculando taxa de progresso ponderada por carga horária e feed de prazos iminentes. Verificar com teste de agregação.
- [x] 2.5 Registrar esquemas no OpenAPI do drf-spectacular e validar documentação gerada em `/api/schema/`.

## 3. Frontend: Catálogo Curricular e Minhas Disciplinas

- [x] 3.1 Atualizar `frontend/src/api/types.ts` e `frontend/src/api/client.ts` com as interfaces e funções clientes para grade, matérias ativas e tarefas. Verificar compilação TypeScript com `pnpm build`.
- [x] 3.2 Criar componente de seleção de semestre e confirmação de disciplinas ativas (`SemesterSelectionModal.tsx` ou fluxo dedicado). Verificar visualmente em tela e com testes de componente.
- [x] 3.3 Criar página `/disciplinas` (`SubjectsPage.tsx`) exibindo a grade de matérias ativas, cargas horárias e progresso individual por disciplina. Verificar navegação e renderização de estados de carregamento e vazio.
- [x] 3.4 Adicionar navegação global responsiva (Navbar/Header) conectando Home, Disciplinas e Tarefas, com alvos de toque mínimos de 44 px e indicador de rota ativa. Verificar acessibilidade com navegação por teclado.

## 4. Frontend: Gestão de Tarefas e Acompanhamento de Estudos

- [x] 4.1 Criar página `/tarefas` (`TasksPage.tsx`) com visão em lista de tarefas agrupadas ou filtradas por disciplina e status (Pendente, Concluída). Verificar comportamento de filtros na UI.
- [x] 4.2 Criar modal de criação e edição de tarefas (`TaskFormModal.tsx`) com seleção de matéria, data limite e minutos estimados. Verificar validações de campos obrigatórios.
- [x] 4.3 Implementar alternância rápida de conclusão de tarefa (checkbox) com atualização otimista da UI e feedback de erro. Verificar comportamento ao marcar/desmarcar.
- [x] 4.4 Implementar controle e apontamento de tempo real de estudo dedicado na tarefa. Verificar persistência dos minutos acumulados.

## 5. Frontend: Dashboard Executivo na Home

- [x] 5.1 Refatorar `HomePage.tsx` substituindo os blocos de placeholder pelo painel de métricas ativas (total de matérias, tarefas pendentes, horas de estudo e percentual de progresso). Verificar renderização correta com dados mock/reais.
- [x] 5.2 Adicionar gráfico visual de progresso por disciplina (barras acessíveis com percentual e contraste adequado). Verificar ausência de overflow horizontal em 360 px.
- [x] 5.3 Implementar feed de próximas entregas no Dashboard, ordenado por prazo, com destaque visual de urgência para itens com menos de 48 horas. Verificar exibição de tags de prazo relativo.

## 6. Validação Integrada, Acessibilidade e Critérios de Aceite

- [x] 6.1 Executar a suíte completa de testes de backend com `pytest`. Verificar 100% de aprovação nas regras de segurança e isolamento de usuário.
- [x] 6.2 Executar suíte de testes de frontend e verificações de tipagem/lint com `pnpm test` e `pnpm lint`.
- [x] 6.3 Criar e rodar teste E2E com Playwright cobrindo o fluxo completo: login -> seleção de matérias -> criação de tarefa -> conclusão -> verificação do impacto no Dashboard.
- [x] 6.4 Auditar conformidade de acessibilidade (foco visível, contraste WCAG AA, leitor de tela e alvos de toque) em 360 px e desktop.
