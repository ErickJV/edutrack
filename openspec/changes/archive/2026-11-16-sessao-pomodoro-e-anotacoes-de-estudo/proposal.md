# Proposta: Sessão de Estudo Pomodoro, Metodologias Ativas e Caderno de Anotações

## Why

Atualmente, na aba "Tarefas", o registro de estudo é feito por um cronômetro inline simples ("Iniciar estudo"), que apenas contabiliza minutos de forma contínua e sem suporte pedagógico. Para alunos da Faculdade Impacta, manter o foco exige uma técnica de gerenciamento de tempo estruturada, como o método Pomodoro (com intervalos programados), suporte a metodologias ativas de estudo e um espaço dedicado para registrar notas, resumos e sínteses organizados de forma hierárquica.

Esta mudança substitui o cronômetro inline de tarefas por um redirecionamento para uma nova tela dedicada de Sessão de Estudo, equipada com um timer Pomodoro configurável (padrão 25/5/15 min), seleção de metodologias ativas (Método Feynman, Revisão Espaçada, Mapas Mentais, Interrogação Elaborativa) e um caderno de anotações ("textbook") organizável por pastas no estilo Notion com personalização visual e textual.

## What Changes

- **Redirecionamento a partir de Tarefas**: O botão "Iniciar estudo" nos cards da página `/tarefas` passa a redirecionar o usuário para a rota `/estudo` carregando a tarefa selecionada como contexto inicial (pré-selecionando disciplina e meta de tempo).
- **Timer Pomodoro Configurável**:
  - Ciclos de Foco (padrão 25 min), Pausa Curta (padrão 5 min) e Pausa Longa (padrão 15 min).
  - Modal ou painel de configurações para o usuário personalizar os tempos a seu critério.
  - Controles acessíveis de iniciar, pausar, resetar e alternar modo.
  - Contabilização dos minutos de foco concluídos como tempo realizado (`actual_minutes`) na tarefa associada.
- **Seletor de Metodologias de Estudo**:
  - Seleção entre 4 abordagens fundamentais: *Método Feynman*, *Revisão Espaçada*, *Mapas Mentais* e *Interrogação Elaborativa*.
  - Exibição de guias de apoio rápido e roteiros mentais durante a sessão de foco para direcionar a técnica escolhida.
- **Caderno de Anotações / Textbook com Estrutura de Pastas**:
  - Criação, renomeação e exclusão de pastas de estudo para organização temática (disciplinas, módulos, tópicos).
  - Criação e edição de anotações personalizadas com título, blocos de texto, formatação e autonomia visual.
  - Vínculo opcional entre anotação, pasta e tarefa/disciplina.
  - Persistência das pastas e anotações no backend por usuário.
- **Novos Endpoints de Backend**:
  - `GET|POST /api/v1/study-folders` e `GET|PATCH|DELETE /api/v1/study-folders/{id}`
  - `GET|POST /api/v1/study-notes` e `GET|PATCH|DELETE /api/v1/study-notes/{id}`

### Não Objetivos

- Não inclui gravação de áudio, transcrição por IA ou upload de arquivos binários externos (PDFs, imagens pesadas) nesta fase.
- Não substitui o editor Notion completo com blocos de banco de dados relacionais complexos; foca em anotações ricas com estrutura de pastas e páginas.
- Não altera regras de autenticação, sessão ou catálogo de cursos do sistema.

## Capabilities

### New Capabilities
- `study-session`: Abrange o timer Pomodoro configurável com ciclos de foco e pausas, a seleção contextual de metodologias de estudo e o caderno de anotações organizado por pastas com persistência por aluno.

### Modified Capabilities
- `study-tasks`: Atualiza o comportamento da ação de estudo nas tarefas para redirecionar o estudante para a nova tela de sessão de estudo Pomodoro, mantendo a atualização dos minutos realizados da tarefa.

## Impact

- **Backend**:
  - Criação dos modelos `StudyFolder` e `StudyNote` em `apps/academic/models.py`.
  - Nova migração Django para as tabelas correspondentes com isolamento por usuário (`user = ForeignKey(User)`).
  - Serializers e ViewSets em `apps/academic/serializers.py` e `apps/academic/views.py`.
  - Novas rotas em `apps/academic/urls.py`.
  - Testes de API para CRUD de pastas e anotações e isolamento entre estudantes em `backend/tests/`.
- **Frontend**:
  - Nova página `frontend/src/pages/StudySessionPage.tsx`.
  - Rota `/estudo` e `/estudo/:taskId` em `frontend/src/App.tsx`.
  - Componentes `PomodoroTimer.tsx`, `MethodologySelector.tsx`, `StudyNotesWorkspace.tsx`.
  - Atualização do botão de ação em `frontend/src/pages/TasksPage.tsx`.
  - Adição de link de navegação para a sessão de estudo em `AppNavigation.tsx`.
  - Tipos e métodos de API em `frontend/src/api/types.ts` e `frontend/src/api/client.ts`.
- **Banco de Dados**: Criação de tabelas `academic_studyfolder` e `academic_studynote` com chaves estrangeiras e índices.
- **Segurança**: Isolamento estrito de dados por usuário autenticado (`user=request.user`), validação CSRF e proteção contra injeção de HTML/XSS no conteúdo das anotações.
