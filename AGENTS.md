# AGENTS.md — EduTrack

Este arquivo fornece contexto durável e diretrizes para o desenvolvimento neste repositório. Leia também o `README.md` e, para mudanças planejadas, os artefatos em `openspec/`.

## 1. Visão Geral e Arquitetura

O **EduTrack** é uma plataforma mobile-first de organização acadêmica voltada para estudantes universitários (com matriz curricular da Faculdade Impacta). O sistema centraliza disciplinas matriculadas por semestre, frequência, tarefas acadêmicas, calendário integrado com extração automática de datas de planos de ensino (PDF/DOCX), espaço de anotações e flashcards com repetição espaçada.

### Stack Tecnológica
- **Monorepo**: `backend/` (Django) e `frontend/` (React + TypeScript).
- **Backend**: Python 3.14+, Django 5.2 LTS, Django REST Framework 3.18, `django-allauth`, `pypdf` e `uv`.
- **Banco de Dados**: PostgreSQL 16+ (`psycopg 3`) em produção e desenvolvimento padrão, com suporte nativo a SQLite (`DB_ENGINE=sqlite`) para execução local e testes rápidos.
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS 4, Lucide React e `pnpm`.
- **Especificações**: OpenSpec (`openspec/specs/` e `openspec/changes/`).

## 2. Regras de Domínio e Segurança

1. **Isolamento estrito por usuário (`user_id` / `request.user`)**:
   - Todo endpoint de disciplinas do aluno (`StudentSubject`), tarefas (`AcademicTask`), eventos (`AcademicEvent`), anotações (`StudyNote`), pastas (`StudyFolder`), documentos (`StudyDocument`), flashcards (`Flashcard`) e relatórios deve obrigatoriamente filtrar os registros pelo usuário autenticado (`filter(user=request.user)`).
   - Nunca retorne, altere ou exclua dados pertencentes a outros estudantes.
2. **Prevenção contra SQL Injection e Validação de Entrada**:
   - Utilize exclusivamente o ORM do Django ou consultas parametrizadas (`cursor.execute(sql, [params])`). Jamais construa queries SQL concatenando strings enviadas pelo usuário.
   - Uploads de arquivos no calendário e nos documentos de estudo devem validar extensão, MIME type e assinatura binária real (magic bytes `%PDF-` para PDF e estrutura ZIP/OOXML `word/document.xml` para DOCX).
3. **Autenticação e Sessão**:
   - Aceite somente e-mails institucionais terminados em `@aluno.impacta.edu.br`.
   - Sessões utilizam cookies `HttpOnly`, `SameSite=Lax`, proteção CSRF ativa e hash de senhas Argon2id.

## 3. Contratos Principais de API e Rotas

### Endpoints Backend (`/api/v1/`)
- `GET /api/v1/course-offerings` e `GET|PUT /api/v1/profile`
- `GET|POST /api/v1/curriculum`
- `GET|POST /api/v1/student-subjects` (suporta filtros `status`, `search` e `has_overdue_tasks`)
- `GET|PUT|PATCH|DELETE /api/v1/student-subjects/{id}`
- `GET|POST /api/v1/tasks` e `GET|PUT|PATCH|DELETE /api/v1/tasks/{id}`
- `POST /api/v1/tasks/{id}/toggle-complete`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/calendar`, `POST /api/v1/calendar/extract-pdf` e `POST /api/v1/calendar/confirm-extracted`
- `GET|POST /api/v1/study-notes` e `GET|PUT|PATCH|DELETE /api/v1/study-notes/{id}`
- `GET|POST /api/v1/flashcards`, `GET|PATCH|DELETE /api/v1/flashcards/{id}` e `POST /api/v1/flashcards/generate-ai`
- `GET /api/v1/reports/generate` (geração de relatório de desempenho acadêmico em PDF)

### Navegação Principal do Frontend
- Ordem padronizada do menu: **Início | Calendário | Tarefas | Anotações | Flashcards | Disciplinas** e **Perfil** alinhado à direita.
- Responsividade mobile-first a partir de 360px, suporte a tema claro/escuro e contraste acessível WCAG AA.

## 4. Fluxo de Trabalho com OpenSpec

Toda nova funcionalidade, alteração de modelo de dados ou contrato de API deve seguir o fluxo orientado a especificações:

1. **Explorar**: inspecionar modelos (`backend/apps/academic/models.py`), views (`views.py`), rotas e componentes existentes antes de propor mudanças.
2. **Propor (`openspec/changes/<nome-da-mudanca>/`)**: documentar `proposal.md`, `design.md`, deltas em `specs/` e `tasks.md`.
3. **Implementar**: aplicar as alterações mantendo compatibilidade com a arquitetura existente e validando com testes automatizados.
4. **Arquivar (`openspec/changes/archive/`)**: após a conclusão e verificação de todas as tarefas (`- [x]`), sincronizar as especificações principais em `openspec/specs/` e mover a mudança concluída para `openspec/changes/archive/`.

## 5. Convenções de Código, Git e Validação

- **Commits**: utilize o padrão *Conventional Commits* em português (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`), com mensagens claras e objetivas.
- **Branches e Pull Requests**: desenvolva funcionalidades e correções mantendo o histórico limpo e verificável antes do merge na branch `main`.
- **Comandos de verificação**:
  - Backend: `cd backend && uv run --no-sync python manage.py test apps.academic`
  - Frontend: `cd frontend && pnpm typecheck && pnpm build`
  - Scripts utilitários: `python scripts/calculate_progress.py` e `python scripts/generate_report.py`
