# EduTrack

Plataforma mobile-first para organização acadêmica de estudantes universitários (com matriz curricular da Faculdade Impacta).

O EduTrack centraliza a rotina de estudos do aluno: acompanhamento de disciplinas matriculadas, registro de frequência e faltas, gestão de tarefas com prazos e prioridades, calendário integrado de entregas e provas, além de um espaço de estudos completo com cronômetro Pomodoro, metas diárias de leitura e bloco de notas em Markdown.

---

## Stack Tecnológica

| Camada | Tecnologia | Detalhes |
| :--- | :--- | :--- |
| **Backend** | Python 3.14+, Django 5.2 LTS, DRF 3.18 | Gerenciado com `uv`, autenticação com `django-allauth` e Argon2id |
| **Banco de Dados** | PostgreSQL 16+ (Driver nativo `psycopg 3`) | Suporte opcional a SQLite (`DB_ENGINE=sqlite`) para dev zero-daemon |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 4 | Gerenciado com `pnpm`, ícones com Lucide React |
| **Produção** | Azure VM (B2ats_v2, 1 GB RAM + 2 GB Swap) | Processos gerenciados por **PM2**, proxy reverso com **Caddy** (HTTPS automático) |

---

## O que está Implementado

* **Autenticação & Perfil**:
  * Cadastro institucional (`@aluno.impacta.edu.br`) e login por e-mail/senha.
  * Login social com Google OAuth2 (com PKCE e validação de domínio).
  * Em desenvolvimento local (`DEBUG=True`), contas são ativadas instantaneamente sem necessidade de servidor de e-mail.
* **Matriz & Disciplinas**:
  * Catálogo de cursos de graduação (ADS, Banco de Dados, Ciência da Computação, etc.).
  * Seleção de matérias por semestre letivo e ajuste de carga horária declarada.
  * Cadastro e vinculação de professores por disciplina.
* **Horários & Frequência**:
  * Configuração de grade semanal de aulas (dia da semana, horário e sala).
  * Geração automática de ocorrências de aula ao longo do semestre letivo.
  * Registro de presença ou falta por aula com cálculo de percentual de frequência.
* **Tarefas & Calendário**:
  * Gestão de tarefas acadêmicas por disciplina, com status (pendente, em andamento, concluída), tempo estimado e tempo realizado.
  * Visualização unificada de eventos, prazos e provas no Dashboard e Calendário.
* **Espaço de Estudos (Study Session)**:
  * Cronômetro Pomodoro integrado (Foco 25 min, Pausa Curta 5 min, Pausa Longa 15 min) com alertas sonoros e notificações.
  * Rastreamento de leituras acadêmicas (livros/artigos, páginas totais, páginas lidas, meta diária e gráfico de sequência dos últimos 14 dias).
  * Workspace de anotações em Markdown organizado por pastas e vinculado a disciplinas/tarefas.

---

## Desenvolvimento Local (Rápido e Nativo)

Não é necessário Docker ou containers para rodar o projeto. O ambiente é leve, consumindo menos de 150 MB de RAM no total.

### 1. Pré-requisitos
* [uv](https://astral.sh/uv) (gerenciador de pacotes Python)
* [pnpm](https://pnpm.io/) e [Node.js 22+](https://nodejs.org/)
* PostgreSQL local (ou use SQLite sem instalar nada extra)

### 2. Configuração Inicial

```bash
# 1. Clonar o projeto
git clone https://github.com/ErickJV/edutrack.git
cd edutrack

# 2. Copiar as variáveis de ambiente
cp .env.example .env

# 3. Instalar dependências (backend via uv, frontend via pnpm)
make install

# 4. Aplicar as migrações no banco
make migrate

# 5. Popular os cursos e matriz curricular inicial
make seed

# 6. Criar um administrador para o painel Django (/admin)
make superuser
```

> **Dica para SQLite (zero configuração de banco):**
> Se preferir não rodar um serviço de PostgreSQL local na sua máquina de desenvolvimento, basta definir `DB_ENGINE=sqlite` no `.env`. O Django usará um arquivo `db.sqlite3` local automaticamente.

### 3. Rodando o Projeto

Abra dois terminais (ou use abas):

* **Terminal 1 — Backend API (porta 8000)**:
  ```bash
  make dev-api
  ```
* **Terminal 2 — Frontend Web (porta 5173)**:
  ```bash
  make dev-web
  ```

Acesse no navegador: **http://localhost:5173**

O frontend Vite faz proxy automático de chamadas `/api`, `/_allauth`, `/accounts` e `/admin` para o backend na porta 8000.

---

## Comandos do Makefile

| Comando | Descrição |
| :--- | :--- |
| `make install` | Instala dependências do backend (`uv sync`) e frontend (`pnpm install`) |
| `make migrate` | Executa as migrações do Django no banco configurado |
| `make seed` | Popula o banco com os cursos e matriz curricular oficial |
| `make superuser` | Cria um superusuário para acessar o Django Admin (`/admin`) |
| `make dev-api` | Inicia o servidor de desenvolvimento do Django (`0.0.0.0:8000`) |
| `make dev-web` | Inicia o servidor Vite do frontend com hot-reload (`0.0.0.0:5173`) |
| `make build` | Compila o frontend React para produção em `frontend/dist/` |
| `make lint` | Executa análise estática de código (`ruff` no backend e `eslint`/`tsc` no frontend) |

---

## Produção no Servidor (Azure VM)

A aplicação de produção está hospedada na Azure em uma instância de baixo custo (1 GB de RAM com 2 GB de Swap) atendendo pelo domínio **https://impatrack.dev**.

### Arquitetura de Produção:
* **PostgreSQL**: Serviço nativo `systemd` ouvindo localmente em `127.0.0.1:5432`.
* **PM2**: Gerenciador de processos que mantém os serviços ativos e reinicia em caso de reboot:
  * `edutrack-api`: Backend Django (`uv run python manage.py runserver 0.0.0.0:8000`)
  * `edutrack-web`: Frontend Vite (`pnpm dev --host 0.0.0.0 --port 5173`)
* **Caddy**: Servidor web e proxy reverso ouvindo nas portas 80 e 443, emitindo certificados SSL/TLS automáticos e encaminhando tráfego para `localhost:5173`.

### Comandos de Operação no Servidor (via SSH):

```bash
# Conectar no servidor
ssh edutrack

# Ver status dos processos e uso de memória
pm2 status

# Acompanhar logs em tempo real
pm2 logs
pm2 logs edutrack-api   # apenas backend
pm2 logs edutrack-web   # apenas frontend

# Reiniciar os serviços após atualizações de código
pm2 restart all

# Atualizar o servidor após git push na máquina local
cd ~/edutrack
git pull origin main
make install
make migrate
pm2 restart all
```

---

## Desenvolvimento com OpenSpec (Workflow de Sprints)

O projeto está configurado para desenvolvimento rápido orientado a **Sprints** com o OpenSpec CLI:

1. **Propor uma Sprint / Backlog de Mudança**:
   ```bash
   # No terminal ou via comando omp /opsx-propose
   openspec new change "<nome-da-sprint>"
   ```
   * O `proposal.md` define os objetivos e o escopo da sprint.
   * O `tasks.md` gera um **Sprint Backlog** estruturado em 2 a 4 fatias de entrega completas (Banco, API Backend, Telas Frontend, Verificação).
   * Sem micro-tarefas redundantes de testes unitários ou mocks artificiais.

2. **Implementar a Sprint**:
   ```bash
   # Executar a implementação do backlog
   openspec instructions apply --change "<nome-da-sprint>"
   ```
   * As tarefas do backlog são implementadas em fluxo contínuo ou delegadas a subagentes paralelos (`task`).
   * Validação realizada na prática executando a aplicação (`make dev-api`, `pnpm typecheck`, `curl` ou no navegador).

3. **Arquivar a Sprint**:
   ```bash
   # Após todas as fatias estarem concluídas e verificadas
   openspec archive "<nome-da-sprint>"
   ```
