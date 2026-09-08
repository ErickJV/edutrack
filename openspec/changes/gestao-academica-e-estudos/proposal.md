## Why

O EduTrack já possui autenticação institucional, perfil de aluno e graduação vinculada, mas o estudante ainda não consegue gerenciar sua rotina de estudos. Permitir a extração/pré-carregamento da grade curricular da Impacta diretamente por curso elimina a fricção de digitação manual de matérias, viabilizando o controle estruturado de disciplinas, tarefas e progresso acadêmico.

## What Changes

- Modelar a grade curricular oficial por curso (`Subject`), contendo nome, código, carga horária e semestre sugerido, seedada a partir das matrizes curriculares da Impacta.
- Implementar a associação de disciplinas ativas do estudante (`StudentSubject` / `Enrollment`), permitindo selecionar o semestre atual e ajustar as disciplinas que está cursando no ciclo.
- Implementar a gestão de tarefas acadêmicas (`AcademicTask`), permitindo criar, listar, atualizar e concluir entregas vinculadas às disciplinas ativas, com data limite, status e tempos (estimado e real).
- Implementar APIs REST para consulta da grade do curso, inscrição/seleção de matérias do aluno, CRUD de tarefas acadêmicas e consolidação de métricas.
- Atualizar a interface do frontend:
  - Tela/fluxo de seleção de semestre e confirmação de matérias ativas.
  - Página de Gestão de Disciplinas com visualização de carga horária e progresso.
  - Página de Gestão de Tarefas com filtros por matéria/status e apontamento de tempo.
  - Transformação da Home em Dashboard funcional com cards de métricas, gráfico de progresso e próximas entregas.

## Capabilities

### New Capabilities
- `academic-curriculum`: Modelagem do catálogo curricular de disciplinas por curso, matriz curricular seedada da faculdade e gerenciamento de disciplinas ativas vinculadas ao estudante autenticado.
- `study-tasks`: Gestão de tarefas e compromissos acadêmicos vinculados a disciplinas, com controle de prazos, estados de conclusão e apontamento de tempo estimado versus tempo real.
- `student-dashboard`: Visão executiva consolidada na página principal com métricas de desempenho acadêmico, taxa de conclusão por matéria e feed ordenado de tarefas iminentes.

### Modified Capabilities
Nenhuma. O projeto não possuía capacidades de gestão curricular ou tarefas previamente especificadas; estas são as primeiras capabilities do núcleo acadêmico.

## Impact

- **Backend:** Criação do app `apps.academic` (ou expansão de `apps.catalog` com novo app de acompanhamento do aluno), com models para `Subject`, `StudentSubject` e `AcademicTask`, serializers, viewsets REST autenticadas e rotas em `/api/v1/`.
- **Frontend:** Criação das páginas e rotas `/disciplinas`, `/tarefas`, componentes de seleção de semestre/matérias, modal de tarefas, gráficos de progresso e refatoração da `HomePage.tsx` para exibir o Dashboard.
- **Banco:** Novas tabelas para disciplinas, matrículas ativas do aluno e tarefas acadêmicas com chaves estrangeiras apropriadas e integridade referencial.
- **Segurança:** Isolamento estrito por usuário: cada estudante só tem permissão para visualizar, editar e excluir suas próprias matérias ativas e tarefas. Autenticação por sessão existente mantida.
- **Operação:** Novas migrações no banco com sementes idempotentes para as matrizes curriculares. Nenhuma alteração nas portas ou no Docker Compose.

## Non-goals

- Integração em tempo real com login/senha do portal acadêmico oficial da faculdade (scraping autenticado sob demanda). A matriz é pré-carregada de forma determinística por curso.
- Lançamento de notas oficiais ou integração com o sistema acadêmico de notas e faltas da instituição.
- Recursos de inteligência preditiva complexa / geração de PDFs, que serão adicionados no módulo subsequente de analytics.
- Compartilhamento de tarefas ou colaboração multiusuário (cada espaço é privado e pessoal do estudante).
