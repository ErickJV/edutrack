"""Conteúdo estruturado do documento de entrega (16 tarefas).

Cada tarefa declara objetivo, entregas, figuras, blocos de terminal e a tabela
de critérios. O build_report.py transforma esta estrutura em report.html.
"""

STATUS_ATENDIDO = "Atendido"
STATUS_EQUIVALENTE = "Atendido por equivalente"
STATUS_PARCIAL = "Parcial"
STATUS_NAO_APLICAVEL = "Não aplicável"

FATOS = {
    "repositorio": "https://github.com/ErickJV/edutrack",
    "primeiro_commit": "2e55d66 — 2026-09-01 — feat: implementa MVP de autenticação e home",
    "ultimo_commit": "aa94981 — 2026-11-17 — feat(academic,docs): filtros de busca, relatório em PDF e documentação",
    "pr_final": "#56 — mergeado em 2026-11-17 (ErickJV/main a partir de KarinyAlves/main), 10 arquivos, +1.014 / -8",
    "arquivadas": 23,
    "em_andamento": [
        "acompanhar-boletim-configuravel",
        "completar-requisitos-academicos",
        "deepseek-llm-module",
        "impatrack-clippit-refresh",
        "personalizar-rotina-academica",
        "student-profile-tab",
    ],
}

STACK = [
    ("Backend", "Python 3.14.10 (venv do projeto) + Django 5.2.17"),
    ("API", "Django REST Framework 3.18.0 + drf-spectacular (OpenAPI 3.0)"),
    ("Banco", "PostgreSQL 16 em produção; SQLite via DB_ENGINE=sqlite na execução local"),
    ("Frontend", "React 19.2.8 + TypeScript 7.0.2 + Vite 8.3.8"),
    ("Estilo", "Tailwind CSS 4.3.3 + Lucide React 1.37.0"),
    ("Especificações", "OpenSpec 1.14.3 (spec-driven)"),
    ("Ferramentas", "Git 2.56.0, Node 26.13.1, npm 11.20.0, VS Code 1.146.0"),
]

TASKS = [
    {
        "numero": 1,
        "titulo": "Primeiro contato com Git e GitHub",
        "modulo": "Ferramentas e versionamento",
        "objetivo": (
            "Configurar o Git na máquina, criar a conta no GitHub e publicar o primeiro "
            "repositório do projeto da disciplina."
        ),
        "entregue": [
            "Git 2.56.0.windows.2 instalado e configurado com identidade institucional "
            "(<code>Erick Jonathan</code> / <code>erick.jonathan@aluno.impacta.edu.br</code>).",
            "Repositório público <code>ErickJV/edutrack</code> com README, Makefile, .env.example e "
            "as pastas <code>backend/</code>, <code>frontend/</code>, <code>openspec/</code>, "
            "<code>docs/</code> e <code>scripts/</code>.",
            "Histórico real de 110 commits entre o primeiro (<code>2e55d66</code>, 2026-09-01) e o "
            "último (<code>aa94981</code>, 2026-11-17).",
            "Branch principal única (<code>main</code>) sincronizada com <code>origin/main</code>.",
        ],
        "figuras": [
            ("ide/t01-git.png", "Git configurado no terminal integrado do VS Code, com versão, identidade, log e branch", "Ambiente local"),
            ("github/t01-repo.png", "Repositório público ErickJV/edutrack: 110 commits, branch main e contribuidores", "GitHub"),
        ],
        "codigos": [
            ("Saída literal do terminal — configuração e histórico local", "txt/t01-git.txt"),
        ],
        "criterios": [
            ("Git instalado e com identidade configurada", "git --version 2.56.0.windows.2 e git config --global com e-mail institucional", STATUS_ATENDIDO),
            ("Conta no GitHub com repositório do projeto", "Repositório público ErickJV/edutrack", STATUS_ATENDIDO),
            ("Primeiro commit publicado com push", "2e55d66 em 2026-09-01, visível no histórico da branch main", STATUS_ATENDIDO),
            ("README descrevendo o projeto", "README.md com stack, funcionalidades e comandos de execução", STATUS_ATENDIDO),
        ],
        "adaptacao": (
            "A tarefa original pedia um repositório novo e vazio para o primeiro contato. Aqui o "
            "repositório já evoluiu para o EduTrack completo; o primeiro commit continua no histórico "
            "e pode ser inspecionado com git log --reverse."
        ),
    },
    {
        "numero": 2,
        "titulo": "VS Code, Node.js e assistência de IA",
        "modulo": "Ambiente de desenvolvimento",
        "objetivo": (
            "Instalar o VS Code, o Node.js e as extensões de apoio, habilitando assistência de IA "
            "no editor para acelerar o desenvolvimento."
        ),
        "entregue": [
            "VS Code 1.146.0 com o monorepo aberto e o terminal integrado ativo.",
            "Node.js v26.13.1 e npm 11.20.0 disponíveis na linha de comando.",
            "Extensões instaladas: Python, Pylance, Python Envs, C/C++, CMake Tools, Java (pacote completo), "
            "Gradle e Maven.",
            "Assistência de código usada por agente de linha de comando sobre o repositório, com as regras "
            "de <code>AGENTS.md</code> e o contrato de <code>openspec/config.yaml</code>.",
        ],
        "figuras": [
            ("ide/t02-node.png", "Versões de Node, npm, VS Code e a lista real de extensões instaladas", "Ambiente local"),
            ("ide/t02-vscode-explorer.png", "Explorer do projeto com frontend/package.json (React 19.2.8, Vite 8.3.8, Tailwind 4.3.3)", "Ambiente local"),
        ],
        "codigos": [
            ("Saída literal do terminal — Node, npm, VS Code e extensões", "txt/t02-node.txt"),
        ],
        "criterios": [
            ("VS Code instalado e em uso", "code --version 1.146.0 e captura do editor com o projeto aberto", STATUS_ATENDIDO),
            ("Node.js instalado", "node --version v26.13.1 e npm 11.20.0", STATUS_ATENDIDO),
            ("Extensões de linguagem instaladas", "code --list-extensions lista Python, Pylance, C/C++ e Java", STATUS_ATENDIDO),
            ("Assistência de IA no fluxo de trabalho", "Uso de agente/CLI sobre o repositório com AGENTS.md e OpenSpec", STATUS_EQUIVALENTE),
            ("Extensões Gemini Code Assist e XanoScript", "Não constam na lista de extensões instaladas; não foram usadas", STATUS_NAO_APLICAVEL),
        ],
        "adaptacao": (
            "A tarefa original cita Gemini Code Assist e XanoScript. Nenhuma das duas extensões está "
            "instalada neste ambiente — a lista completa de extensões está na saída do terminal — e o "
            "projeto não usa Xano. A assistência de IA foi feita por agente de linha de comando com "
            "contexto do repositório."
        ),
    },
    {
        "numero": 3,
        "titulo": "OpenSpec e especificação antes do código",
        "modulo": "Processo orientado a especificação",
        "objetivo": (
            "Instalar e configurar o OpenSpec no repositório, criando a estrutura de especificações "
            "que orienta cada mudança antes da implementação."
        ),
        "entregue": [
            "OpenSpec 1.14.3 instalado; estrutura <code>openspec/config.yaml</code>, "
            "<code>openspec/specs/</code> e <code>openspec/changes/</code> versionada no repositório.",
            "23 mudanças concluídas em <code>openspec/changes/archive/</code> e 6 em andamento em "
            "<code>openspec/changes/</code>.",
            "<code>AGENTS.md</code> na raiz descrevendo o fluxo Explorar → Propor → Implementar → Arquivar.",
            "<code>openspec validate --all</code> executado sobre o repositório inteiro: 23 itens "
            "aprovados, 0 falhas.",
        ],
        "figuras": [
            ("ide/t03-openspec.png", "Versão do OpenSpec, changes em andamento e contagem real de propostas arquivadas", "Ambiente local"),
            ("ide/t03-vscode-openspec.png", "Estrutura openspec/: archive com propostas, changes em andamento e config.yaml", "Ambiente local"),
        ],
        "codigos": [
            ("Saída literal do terminal — versão, changes e contagem", "txt/t03-openspec.txt"),
        ],
        "criterios": [
            ("OpenSpec instalado", "openspec --version 1.14.3", STATUS_ATENDIDO),
            ("Estrutura de especificações criada", "openspec/{changes,specs,config.yaml} versionados", STATUS_ATENDIDO),
            ("Especificações validadas", "openspec validate --all: 23 aprovados, 0 falhas", STATUS_ATENDIDO),
            ("Documento de contexto para agentes", "AGENTS.md na raiz com o fluxo OpenSpec", STATUS_EQUIVALENTE),
        ],
        "adaptacao": (
            "A tarefa original espera <code>openspec/AGENTS.md</code> e <code>openspec/project.md</code>, "
            "arquivos das versões iniciais do OpenSpec. A versão 1.14.3 organiza o contexto em "
            "<code>openspec/config.yaml</code> e mantém o documento de diretrizes em <code>AGENTS.md</code> "
            "na raiz. O equivalente está presente e validado."
        ),
    },
    {
        "numero": 4,
        "titulo": "Backend como código, não como plataforma",
        "modulo": "Modelagem e versionamento do backend",
        "objetivo": (
            "Modelar as tabelas do sistema em uma ferramenta de backend e manter essa definição "
            "versionada, em vez de configurá-la apenas por interface."
        ),
        "entregue": [
            "Modelos declarados em <code>backend/apps/academic/models.py</code> (Subject, StudentSubject, "
            "AcademicTask, AcademicEvent, StudyNote, Flashcard) e versionados com o projeto.",
            "14 migrações aplicadas no app <code>academic</code>, de <code>0001_initial</code> a "
            "<code>0014_rename_summary_ai_studydocument_analysis_cache_and_more</code>.",
            "Contrato de API exposto em <code>/api/v1/</code> e documentado via OpenAPI em "
            "<code>/api/schema/</code> e <code>/api/docs/</code>.",
        ],
        "figuras": [
            ("ide/t11-vscode-model.png", "models.py: classe AcademicTask com status, categoria e chaves estrangeiras", "Ambiente local"),
        ],
        "codigos": [
            ("Saída literal do terminal — migrações do app academic", "txt/t04-migrations.txt"),
        ],
        "criterios": [
            ("Tabelas definidas de forma declarativa", "models.py com as classes de domínio acadêmico", STATUS_EQUIVALENTE),
            ("Definição versionada no Git", "models.py e apps/academic/migrations/ no repositório", STATUS_ATENDIDO),
            ("Histórico de evolução do schema", "showmigrations academic com 0001 a 0014 aplicadas", STATUS_ATENDIDO),
            ("Ferramenta Xano", "Projeto não usa Xano; o backend é Django + DRF", STATUS_NAO_APLICAVEL),
        ],
        "adaptacao": (
            "A tarefa original pede as tabelas no Xano, que é uma plataforma no-code. O projeto usa "
            "Django, onde a definição das tabelas é código Python versionado e o schema evolui por "
            "migrações. O efeito de «backend como código» é mais forte: toda a modelagem está no Git."
        ),
    },
    {
        "numero": 5,
        "titulo": "Branches e pull request",
        "modulo": "Fluxo de colaboração",
        "objetivo": (
            "Trabalhar em branch separada e integrar a <code>main</code> por pull request revisado, "
            "mantendo histórico verificável."
        ),
        "entregue": [
            "PR #56 mergeado em 2026-11-17: filtros de busca em disciplinas, relatório de desempenho em "
            "PDF e documentação do projeto.",
            "PR com 10 arquivos alterados (+1.014 / -8) e 2 commits: <code>c962e9c</code> "
            "(busca, script de progresso e relatório) e <code>d30cecb</code> (AGENTS.md e referências).",
            "Histórico da <code>main</code> com PRs de dependências e merges rastreáveis; localmente "
            "apenas a branch <code>main</code> é mantida.",
        ],
        "figuras": [
            ("github/t05-pr56.png", "PR #56 com o selo Merged, autor, branch de origem e resumo das alterações", "GitHub"),
            ("github/t05-pr56-files.png", "Aba Files changed do PR #56: 10 arquivos, incluindo models, views, reports.py e AGENTS.md", "GitHub"),
            ("github/t16-pulls.png", "Lista de pull requests: 23 fechados/mergeados, PR #56 no topo", "GitHub"),
        ],
        "codigos": [
            ("Saída literal do terminal — branches e merges recentes", "txt/t16-git.txt"),
        ],
        "criterios": [
            ("Mudança feita fora da main e integrada por PR", "PR #56 com branch de origem KarinyAlves/main", STATUS_ATENDIDO),
            ("PR revisado e mergeado", "Selo Merged em 2026-11-17 atribuído a ErickJV", STATUS_ATENDIDO),
            ("Histórico limpo e verificável", "git log --merges mostra os merges de PRs na main", STATUS_ATENDIDO),
            ("Branch release/final-delivery", "Não existe no repositório; a entrega é feita fora do Git", STATUS_PARCIAL),
        ],
        "adaptacao": None,
    },
    {
        "numero": 6,
        "titulo": "Pesquisa de referências visuais",
        "modulo": "Pesquisa e repertório",
        "objetivo": (
            "Pesquisar referências de interface para o app e registrar o que cada uma ensina, "
            "antes de desenhar telas."
        ),
        "entregue": [
            "<code>docs/pesquisa/referencias.md</code> com três referências analisadas: Notion "
            "(dashboard acadêmico), TickTick/Todoist (gestão de tarefas) e AnkiWeb/RemNote (repetição espaçada).",
            "Para cada referência: categoria, link público, pontos positivos, pontos negativos e o que "
            "foi aplicado no EduTrack.",
            "Decisões derivadas: hierarquia tipográfica, indicadores de urgência em 48 horas e Pomodoro.",
        ],
        "figuras": [
            ("github/t06-referencias.png", "referencias.md no GitHub, com as seções da primeira referência analisada", "GitHub"),
        ],
        "codigos": [
            ("Referências registradas no documento", "literal:referencias"),
        ],
        "criterios": [
            ("Pesquisa registrada em documento", "docs/pesquisa/referencias.md com 3 referências", STATUS_ATENDIDO),
            ("Análise crítica (positivos e negativos)", "Cada referência tem as duas listas preenchidas", STATUS_ATENDIDO),
            ("Aplicação prática no produto", "Seção «Aplicação no EduTrack» em cada referência", STATUS_ATENDIDO),
            ("Dois templates Figma", "Não foram usados; a pesquisa foi feita em produtos públicos", STATUS_NAO_APLICAVEL),
        ],
        "adaptacao": (
            "A tarefa original pede dois templates prontos de Figma. O repositório não contém arquivos "
            "Figma: a pesquisa foi feita nos produtos de referência e ficou registrada em Markdown."
        ),
    },
    {
        "numero": 7,
        "titulo": "Configuração do frontend e identidade visual",
        "modulo": "Frontend",
        "objetivo": (
            "Configurar o projeto de frontend, tema e navegação, com as telas principais conectadas "
            "ao backend."
        ),
        "entregue": [
            "Frontend React 19.2.8 + TypeScript + Vite 8.3.8 com Tailwind CSS 4.3.3 e Lucide React.",
            "Tema teal/slate com alternância claro/escuro/sistema, tipografia própria e componentes "
            "reutilizados (Brand, AppNavigation, ThemeToggle).",
            "Tela de login institucional, cadastro, conclusão de perfil e as sete páginas internas.",
            "Aplicação publicada em <code>https://impatrack.dev</code>, consumindo a API em "
            "<code>/api/v1/</code>.",
        ],
        "figuras": [
            ("app/t07-login.png", "Tela de entrada com identidade Impatrack e formulário institucional", "Execução do projeto"),
            ("app/t07-home.png", "Página inicial com navegação principal e itens urgentes das próximas 48 horas", "Execução do projeto"),
            ("app/t07-home-metricas.png", "Painel acadêmico da home: disciplinas, tarefas, progresso ponderado e tempo de estudo", "Execução do projeto"),
        ],
        "codigos": [
            ("Dependências reais do frontend", "literal:frontend"),
        ],
        "criterios": [
            ("Projeto de frontend configurado", "package.json com React 19.2.8, Vite 8.3.8 e Tailwind 4.3.3", STATUS_ATENDIDO),
            ("Tema e identidade aplicados", "Capturas de login e home com a marca e as cores do produto", STATUS_ATENDIDO),
            ("Navegação entre as telas", "Barra com Início, Calendário, Tarefas, Anotações, Flashcards, Disciplinas e Perfil", STATUS_ATENDIDO),
            ("Integração com o backend", "Consumo de /api/v1/ com sessão autenticada", STATUS_ATENDIDO),
            ("Ferramenta FlutterFlow", "Frontend implementado em React; FlutterFlow não foi usado", STATUS_NAO_APLICAVEL),
        ],
        "adaptacao": (
            "A tarefa original usa FlutterFlow. Neste projeto o frontend é código React com Vite, o que "
            "permite versionar componentes e reaproveitar a mesma API já usada no restante do sistema. "
            "Os objetivos de configuração de projeto, tema e navegação estão cumpridos."
        ),
    },
    {
        "numero": 8,
        "titulo": "Primeira proposta no OpenSpec",
        "modulo": "Especificação",
        "objetivo": (
            "Escrever a primeira proposta de mudança no OpenSpec, descrevendo problema, escopo e "
            "impacto antes de implementar."
        ),
        "entregue": [
            "Proposta <code>2026-11-16-gestao-academica-e-estudos</code> com <code>proposal.md</code>, "
            "<code>design.md</code>, <code>tasks.md</code>, <code>specs/</code> e <code>.openspec.yaml</code>.",
            "Estrutura da proposta em Why / What Changes / Capabilities / Impact, com capacidades "
            "novas e modificadas explicitadas.",
            "Proposta arquivada após conclusão, junto das outras 22 concluídas.",
        ],
        "figuras": [
            ("github/t08-proposal.png", "Pasta da proposta arquivada no GitHub: proposal.md, design.md, tasks.md e specs", "GitHub"),
            ("ide/t08-vscode-proposal.png", "proposal.md aberto no editor com as seções Why, What Changes, Capabilities e Impact", "Ambiente local"),
        ],
        "codigos": [],
        "criterios": [
            ("Proposta criada no local correto", "openspec/changes/archive/2026-11-16-gestao-academica-e-estudos", STATUS_ATENDIDO),
            ("Problema e escopo descritos", "Seções Why e What Changes preenchidas", STATUS_ATENDIDO),
            ("Capacidades e impacto declarados", "Seções Capabilities e Impact com módulos e riscos", STATUS_ATENDIDO),
            ("Proposta validada pela ferramenta", "openspec validate --all aprovando os 23 itens", STATUS_ATENDIDO),
            ("Comando /openspec:proposal", "Proposta escrita pelo CLI/agente, não por slash command do editor", STATUS_EQUIVALENTE),
        ],
        "adaptacao": (
            "A tarefa original descreve o comando de barra <code>/openspec:proposal</code> em um editor "
            "com essa extensão. Aqui a proposta foi escrita por CLI/agente seguindo o mesmo formato de "
            "artefatos, e validada com <code>openspec validate</code>."
        ),
    },
    {
        "numero": 9,
        "titulo": "Páginas e assets do aplicativo",
        "modulo": "Interface",
        "objetivo": (
            "Construir as páginas principais do aplicativo, com assets organizados e navegação "
            "consistente entre elas."
        ),
        "entregue": [
            "Sete páginas implementadas: Início, Calendário, Tarefas, Anotações, Flashcards, Disciplinas e Perfil.",
            "Barra de navegação fixa com a ordem padronizada e Perfil alinhado à direita.",
            "Assets em <code>frontend/public/</code>: favicon, ícone da marca, imagem do Clippit e a "
            "galeria de 11 prints de CRUD.",
            "Layout responsivo mobile-first a partir de 360px, com tema claro e escuro.",
        ],
        "figuras": [
            ("app/t09-disciplinas.png", "Disciplinas: cinco matérias ativas, média de progresso e carga horária", "Execução do projeto"),
            ("app/t09-tarefas.png", "Tarefas: formulário rápido, contadores e filtros por disciplina e status", "Execução do projeto"),
            ("app/t09-calendario.png", "Calendário acadêmico com programação semanal e ações rápidas", "Execução do projeto"),
            ("app/t09-estudo.png", "Anotações: cadernos, editor com pauta e ferramentas de formatação", "Execução do projeto"),
            ("app/t09-flashcards.png", "Flashcards: repetição espaçada, seis cards e virar cartão em 3D", "Execução do projeto"),
            ("app/t09-perfil.png", "Perfil: dados pessoais e acadêmicos editáveis", "Execução do projeto"),
            ("github/t13-prints.png", "frontend/public/prints com as 11 capturas de CRUD versionadas", "GitHub"),
        ],
        "criterios": [
            ("Páginas principais criadas", "Sete rotas implementadas e capturadas em execução", STATUS_ATENDIDO),
            ("Navegação entre páginas", "AppNavigation presente em todas as telas internas", STATUS_ATENDIDO),
            ("Assets organizados", "frontend/public/ com favicon, marca, clippit e prints", STATUS_ATENDIDO),
            ("Pasta assets/ na raiz do projeto", "Não existe; os assets ficam em frontend/public/", STATUS_EQUIVALENTE),
        ],
        "adaptacao": (
            "A tarefa original pede uma pasta <code>assets/</code> na raiz do app. Neste projeto os "
            "assets estáticos do frontend ficam em <code>frontend/public/</code>, que é o diretório "
            "servido pelo Vite — mesmo papel, local diferente."
        ),
    },
    {
        "numero": 10,
        "titulo": "AGENTS.md: regras duráveis do projeto",
        "modulo": "Governança técnica",
        "objetivo": (
            "Documentar em AGENTS.md as regras que qualquer agente ou pessoa deve seguir no "
            "repositório: arquitetura, segurança, contratos e fluxo de trabalho."
        ),
        "entregue": [
            "<code>AGENTS.md</code> na raiz com cinco seções: visão geral e arquitetura, regras de "
            "domínio e segurança, contratos de API e rotas, fluxo OpenSpec e convenções de Git/validação.",
            "Regra de isolamento por usuário (<code>filter(user=request.user)</code>) e proibição de SQL "
            "concatenado, com validação de upload por assinatura binária.",
            "Convenção de commits em Conventional Commits em português e comandos de verificação do "
            "backend, frontend e scripts.",
            "Conteúdo integral reproduzido no Apêndice A deste documento.",
        ],
        "figuras": [
            ("ide/t10-vscode-agents.png", "AGENTS.md no editor: seções de segurança, contratos de API e fluxo OpenSpec", "Ambiente local"),
            ("github/t10-agents.png", "AGENTS.md renderizado no GitHub em 63 linhas", "GitHub"),
        ],
        "criterios": [
            ("Arquivo AGENTS.md na raiz", "AGENTS.md versionado e referenciado no README", STATUS_ATENDIDO),
            ("Regras de segurança explícitas", "Seção 2 com isolamento por usuário, SQLi e autenticação", STATUS_ATENDIDO),
            ("Contratos de API documentados", "Seção 3 com os endpoints de /api/v1/", STATUS_ATENDIDO),
            ("Fluxo de trabalho e validação", "Seção 4 (OpenSpec) e seção 5 (Git e comandos)", STATUS_ATENDIDO),
            ("Teste do arquivo com chat Gemini", "Não executado; não há extensão Gemini neste ambiente", STATUS_PARCIAL),
        ],
        "adaptacao": (
            "A tarefa original propõe validar o arquivo conversando com um assistente no editor. A "
            "validação aqui foi prática: as regras foram aplicadas no código do repositório — por exemplo, "
            "o filtro por usuário nas views — e verificadas por testes automatizados."
        ),
    },
    {
        "numero": 11,
        "titulo": "Tabela de tarefas acadêmicas",
        "modulo": "Modelagem de dados",
        "objetivo": (
            "Criar a tabela de tarefas acadêmicas com os campos necessários para prazo, status e "
            "tempo gasto, e expor o CRUD correspondente."
        ),
        "entregue": [
            "Modelo <code>AcademicTask</code> com <code>user</code>, <code>student_subject</code>, "
            "<code>title</code>, <code>description</code>, <code>due_date</code>, <code>status</code>, "
            "<code>estimated_minutes</code>, <code>actual_minutes</code>, <code>completed_at</code>, "
            "<code>category</code> e <code>all_day</code>.",
            "Migração <code>0012_academictask_all_day_academictask_category_and_more</code> aplicada.",
            "CRUD em <code>/api/v1/tasks</code> e <code>/api/v1/tasks/{id}</code>, com ação "
            "<code>toggle-complete</code>.",
            "Tarefa registrada no Django Admin, com evidência pela API e pela galeria de prints.",
        ],
        "figuras": [
            ("ide/t11-vscode-model.png", "AcademicTask: status (pendente, em andamento, concluída), categoria e relações", "Ambiente local"),
            ("prints/crud_tasks_post.png", "POST /api/v1/tasks criando uma tarefa (201 Created)", "Execução do projeto"),
            ("prints/crud_tasks_get.png", "GET /api/v1/tasks listando as tarefas do estudante (200 OK)", "Execução do projeto"),
            ("prints/crud_tasks_patch.png", "PATCH /api/v1/tasks/{id} atualizando uma tarefa", "Execução do projeto"),
            ("prints/crud_tasks_delete.png", "DELETE /api/v1/tasks/{id} removendo uma tarefa", "Execução do projeto"),
        ],
        "codigos": [
            ("Saída literal do terminal — migrações do app", "txt/t04-migrations.txt"),
        ],
        "criterios": [
            ("Tabela de tarefas criada", "Modelo AcademicTask com migração 0012 aplicada", STATUS_ATENDIDO),
            ("Campos de prazo, status e tempo", "due_date, status, estimated_minutes, actual_minutes, completed_at", STATUS_ATENDIDO),
            ("CRUD disponível", "GET/POST/PUT/PATCH/DELETE em /api/v1/tasks", STATUS_ATENDIDO),
            ("Registro visível no admin", "AcademicTask registrada no admin; a folha de estilo do admin é bloqueada pelo CSP do projeto (middleware default-src 'none')", STATUS_ATENDIDO),
            ("Ferramenta Xano", "Tabela modelada em Django ORM", STATUS_NAO_APLICAVEL),
        ],
        "adaptacao": (
            "A tarefa original cria a tabela no Xano. Aqui a mesma estrutura é um modelo Django com "
            "migração versionada. A interface do Django Admin responde 200, mas nesta execução o "
            "cabeçalho <code>Content-Security-Policy: default-src 'none'</code> de "
            "<code>edutrack/middleware.py</code> bloqueia os assets do admin; por isso a evidência do "
            "CRUD vem da API e da galeria de prints."
        ),
    },
    {
        "numero": 12,
        "titulo": "Script Python de cálculo de progresso",
        "modulo": "Automação e lógica",
        "objetivo": (
            "Escrever um script Python que calcule o progresso acadêmico por disciplina, tratando "
            "casos limite como ausência de tarefas."
        ),
        "entregue": [
            "<code>scripts/calculate_progress.py</code> com <code>calculate_task_progress</code>, que "
            "devolve total, concluídas, pendentes e percentual.",
            "Guarda de divisão por zero: quando <code>total == 0</code>, o progresso é 0.0.",
            "<code>calculate_weighted_progress</code>, que pondera o progresso pela carga horária de cada disciplina.",
            "Saída em tabela formatada por disciplina, com total geral e progresso ponderado.",
        ],
        "figuras": [
            ("ide/t12-vscode-script.png", "calculate_progress.py: normalização de entradas, guarda de divisão por zero e retorno estruturado", "Ambiente local"),
        ],
        "codigos": [
            ("Saída literal do terminal — execução do script", "txt/t12-progress.txt"),
            ("Saída literal do terminal — casos limite (0,0), (10,7) e (5,9)", "txt/t12-zero.txt"),
        ],
        "criterios": [
            ("Script Python funcional", "python ../scripts/calculate_progress.py imprime a tabela por disciplina", STATUS_ATENDIDO),
            ("Percentual por disciplina", "calculate_task_progress devolve progress_percent e formatted", STATUS_ATENDIDO),
            ("Tratamento de zero tarefas", "f(0,0) retorna progress_percent 0.0, sem exceção", STATUS_ATENDIDO),
            ("Ponderação por carga horária", "calculate_weighted_progress usa workload_hours de cada disciplina", STATUS_ATENDIDO),
        ],
        "adaptacao": None,
    },
    {
        "numero": 13,
        "titulo": "CRUD de disciplinas com baixa lógica",
        "modulo": "API e regras de domínio",
        "objetivo": (
            "Implementar o CRUD de disciplinas do aluno, incluindo remoção com baixa lógica e "
            "documentação dos endpoints."
        ),
        "entregue": [
            "<code>GET|POST /api/v1/student-subjects</code> e "
            "<code>GET|PUT|PATCH|DELETE /api/v1/student-subjects/{id}</code>.",
            "<code>DELETE</code> faz baixa lógica: o registro muda para <code>status=\"dropped\"</code> e "
            "a resposta é <code>204 No Content</code>.",
            "Isolamento por usuário: toda consulta passa por <code>filter(user=user)</code>, onde "
            "<code>user</code> vem de <code>self.request.user</code>.",
            "Endpoints documentados no Swagger em <code>/api/docs/</code> e cada verbo evidenciado na galeria /prints.",
        ],
        "figuras": [
            ("app/t13-swagger.png", "Swagger UI com os endpoints /api/v1/ e os verbos disponíveis", "Execução do projeto"),
            ("app/t13-prints-page.png", "Galeria /prints: 11 operações reais com payload e resposta", "Execução do projeto"),
            ("prints/crud_subjects_post.png", "POST /api/v1/student-subjects criando a disciplina", "Execução do projeto"),
            ("prints/crud_subjects_get.png", "GET /api/v1/student-subjects listando as disciplinas", "Execução do projeto"),
            ("prints/crud_subjects_patch.png", "PATCH /api/v1/student-subjects/{id} atualizando a disciplina", "Execução do projeto"),
        ],
        "codigos": [],
        "criterios": [
            ("Listagem e criação de disciplinas", "GET e POST em /api/v1/student-subjects", STATUS_ATENDIDO),
            ("Detalhe, atualização e remoção", "GET/PUT/PATCH/DELETE em /api/v1/student-subjects/{id}", STATUS_ATENDIDO),
            ("Baixa lógica na remoção", "DELETE muda status para dropped e responde 204 (verificado no teste)", STATUS_ATENDIDO),
            ("Isolamento por usuário", "filter(user=user) em todas as consultas da view", STATUS_ATENDIDO),
            ("Ferramenta Xano", "Endpoints implementados em DRF", STATUS_NAO_APLICAVEL),
        ],
        "adaptacao": (
            "A tarefa original cria os endpoints no Xano. Aqui o CRUD é implementado em Django REST "
            "Framework, com as mesmas operações e uma regra adicional de baixa lógica, verificada por "
            "teste automatizado."
        ),
    },
    {
        "numero": 14,
        "titulo": "Busca e filtros combinados",
        "modulo": "Consulta e filtros",
        "objetivo": (
            "Permitir busca textual e filtros combinados nas disciplinas e tarefas, com resultado "
            "correto e previsível."
        ),
        "entregue": [
            "Parâmetros <code>search</code> e <code>q</code> filtram nome, código e professor da disciplina "
            "via <code>icontains</code> no ORM.",
            "Parâmetros <code>has_overdue_tasks</code> e <code>overdue</code> retornam apenas disciplinas "
            "com tarefa não concluída e prazo vencido.",
            "Busca de tarefas por título, descrição e disciplina em <code>/api/v1/tasks</code>.",
            "Teste automatizado cobre os dois filtros: cada um retorna exatamente uma disciplina.",
        ],
        "figuras": [
            ("ide/t13-vscode-view.png", "get_queryset com filtro por usuário, semestre, search/q e has_overdue_tasks", "Ambiente local"),
        ],
        "codigos": [
            ("Saída literal — respostas reais da API com filtros", "txt/t14-search.txt"),
            ("Saída literal do terminal — teste de busca", "txt/t13-tests.txt"),
        ],
        "criterios": [
            ("Busca textual por disciplina", "?search=Governance retorna 1 disciplina (Data Governance)", STATUS_ATENDIDO),
            ("Filtro por tarefas atrasadas", "?has_overdue_tasks=true retorna 1 disciplina (Mobile Applications)", STATUS_ATENDIDO),
            ("Busca em tarefas", "?search= no endpoint de tarefas filtra título e descrição", STATUS_ATENDIDO),
            ("Cobertura por teste automatizado", "test_advanced_search_and_pdf_report_generation: OK", STATUS_ATENDIDO),
            ("Campo de busca na interface de disciplinas", "A interface não expõe campo de texto; o filtro está na API e no Swagger", STATUS_EQUIVALENTE),
        ],
        "adaptacao": (
            "A tarefa original pede busca híbrida (plataforma + script). Aqui a busca roda no ORM do "
            "Django, que é o caminho natural deste backend, e o Python atua no progresso e no relatório. "
            "A tela de disciplinas não tem campo de texto: o filtro é consumido pela API e documentado no "
            "Swagger, por isso a evidência é a resposta JSON real."
        ),
    },
    {
        "numero": 15,
        "titulo": "Relatório de desempenho em PDF",
        "modulo": "Geração de documentos",
        "objetivo": (
            "Gerar um relatório de desempenho acadêmico em PDF a partir dos dados do estudante, "
            "com um endpoint dedicado."
        ),
        "entregue": [
            "<code>GET /api/v1/reports/generate</code> devolve <code>application/pdf</code> iniciando com "
            "<code>%PDF-</code>.",
            "Geração em <code>apps/academic/reports.py</code> com apoio de <code>pypdf</code>, sem "
            "biblioteca de layout externa.",
            "Relatório com indicadores consolidados, desempenho por disciplina e relação de tarefas com prazo e status.",
            "Artefato versionado em <code>docs/relatorio-desempenho-edutrack.pdf</code>.",
        ],
        "figuras": [
            ("app/t15-relatorio.png", "PDF gerado para o usuário de demonstração: indicadores, desempenho por disciplina e tarefas", "Execução do projeto"),
            ("ide/t15-vscode-docs.png", "Pasta docs/ com o relatório versionado e os documentos de pesquisa e planejamento", "Ambiente local"),
            ("github/t15-report.png", "docs/ no GitHub com relatorio-desempenho-edutrack.pdf versionado", "GitHub"),
        ],
        "codigos": [
            ("Saída literal do terminal — metadados do PDF versionado", "txt/t15-report.txt"),
        ],
        "criterios": [
            ("Endpoint gera PDF", "GET /api/v1/reports/generate responde application/pdf", STATUS_ATENDIDO),
            ("Arquivo PDF válido", "Conteúdo inicia com %PDF-1.4 e é lido pelo pypdf", STATUS_ATENDIDO),
            ("Relatório com dados do estudante", "Indicadores, tabela por disciplina e lista de tarefas", STATUS_ATENDIDO),
            ("Artefato versionado no repositório", "docs/relatorio-desempenho-edutrack.pdf", STATUS_ATENDIDO),
            ("Biblioteca reportlab", "Não usada; a geração é própria, apoiada em pypdf", STATUS_NAO_APLICAVEL),
        ],
        "adaptacao": (
            "A tarefa original sugere uma biblioteca de relatórios pronta. O projeto gera o PDF com "
            "implementação própria sobre pypdf, o que evita dependência de layout externo. O PDF exibido "
            "neste documento foi gerado na hora para o usuário de demonstração, sem sobrescrever o "
            "artefato versionado, que pertence a outro estudante."
        ),
    },
    {
        "numero": 16,
        "titulo": "Auditoria final e entrega",
        "modulo": "Fechamento",
        "objetivo": (
            "Revisar o estado do repositório, validar as especificações e entregar o projeto com "
            "histórico e documentação coerentes."
        ),
        "entregue": [
            "23 propostas arquivadas e 6 em andamento, todas validadas por <code>openspec validate --all</code> "
            "(23 aprovados, 0 falhas).",
            "README com stack, funcionalidades implementadas, comandos de execução e fluxo OpenSpec.",
            "PR #56 como último merge da <code>main</code>, em 2026-11-17.",
            "Pendência assumida: não existe branch nem PR <code>release/final-delivery</code>; a entrega é "
            "feita por este documento e pelo repositório.",
        ],
        "figuras": [
            ("ide/t16-vscode-readme.png", "README com a tabela de stack e o que está implementado", "Ambiente local"),
        ],
        "codigos": [
            ("Saída literal do terminal — openspec validate --all", "txt/t16-validate.txt"),
            ("Saída literal do terminal — merges e últimos commits", "txt/t16-git.txt"),
        ],
        "criterios": [
            ("Especificações validadas no estado final", "openspec validate --all: 23 itens, 0 falhas", STATUS_ATENDIDO),
            ("Documentação do projeto atualizada", "README e AGENTS.md coerentes com o código", STATUS_ATENDIDO),
            ("Histórico de integração rastreável", "PR #56 mergeado em 2026-11-17", STATUS_ATENDIDO),
            ("Propostas pendentes declaradas", "6 changes em andamento listadas no Apêndice B", STATUS_PARCIAL),
            ("Branch e PR de entrega final", "Não existem; pendência declarada", STATUS_PARCIAL),
        ],
        "adaptacao": (
            "A tarefa original pede um PR de release fechando a disciplina. O repositório não tem esse PR: "
            "as seis propostas em andamento continuam abertas e a entrega acontece por este documento. "
            "O estado real é mostrado sem máscara."
        ),
    },
]

LITERAIS = {
    "referencias": [
        "docs/pesquisa/referencias.md",
        "1. Notion — Student & Academic Dashboard Template",
        "   https://www.notion.so/templates/category/school",
        "2. TickTick / Todoist — Academic & Task Planner",
        "   https://todoist.com/templates/category/education",
        "3. AnkiWeb / RemNote — Spaced Repetition & Flashcards",
    ],
    "frontend": [
        '"name": "edutrack-frontend"',
        '"dependencies": {',
        '  "@tailwindcss/vite": "4.3.3",',
        '  "lucide-react": "1.37.0",',
        '  "react": "19.2.8",',
        '  "react-dom": "19.2.8",',
        '  "react-router-dom": "7.18.3",',
        '  "tailwindcss": "4.3.3"',
        "},",
        '"devDependencies": {',
        '  "typescript": "7.0.2",',
        '  "vite": "8.3.8"',
        "}",
    ],
}
