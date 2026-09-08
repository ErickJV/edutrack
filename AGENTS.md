# AGENTS.md — EduTrack

Este arquivo fornece contexto durável para agentes que trabalham neste repositório. Leia também o `README.md` e, para mudanças planejadas, os artefatos em `openspec/`.

## Produto e estágio atual

O EduTrack é uma plataforma acadêmica mobile-first para alunos da Faculdade Impacta. O MVP atual entrega autenticação, perfil acadêmico e uma Home protegida. Não é um sistema oficial da faculdade e ainda não está pronto para publicação pública.

Já estão implementados cadastro institucional, verificação de e-mail por código, login local, recuperação de senha, Google OIDC opcional, conclusão de perfil OAuth, consentimentos legais versionados, catálogo de cursos/ofertas e proteção de rotas.

Estão fora do MVP atual: disciplinas, grade curricular, tarefas, calendário, notas, integração com o portal acadêmico, MFA, edição completa de perfil e hospedagem pública. Trate qualquer inclusão desses itens como uma nova mudança OpenSpec, não como extensão implícita da autenticação.

## Arquitetura e versões

- Monorepo: `backend/` (Django) e `frontend/` (React), orquestrados pelo Docker Compose da raiz.
- Backend: Python 3.14, Django 5.2 LTS, DRF 3.18, django-allauth 65.19, mssql-django 1.8 e uv.
- Frontend: React 19.2, TypeScript 7, Vite 8, Tailwind CSS 4 e pnpm.
- Infra local: SQL Server 2022, ODBC Driver 18 e Mailpit.
- O usuário customizado `accounts.User` usa UUID e e-mail como identificador.
- `Course` e `CourseOffering` são entidades separadas; ofertas podem ser ativadas pelo Django Admin.
- A API headless do allauth está em `/_allauth/browser/v1`; APIs próprias usam `/api/v1/`.

Não atualize versões fixadas ou lockfiles incidentalmente. Mudanças de dependências precisam de justificativa, compatibilidade verificada e testes correspondentes.

## Regras de domínio e segurança

- Aceite somente e-mails que terminem exatamente em `@aluno.impacta.edu.br`; valide sempre no backend.
- A verificação local usa código numérico de seis dígitos, validade de 10 minutos e no máximo três tentativas.
- Recuperação de senha deve responder genericamente para evitar enumeração de contas; o link é de uso único e válido por uma hora.
- Google OIDC exige e-mail verificado e institucional. Não persista tokens Google.
- Use sessão Django em cookie `HttpOnly`, `SameSite=Lax` e proteção CSRF. “Lembrar de mim” dura 14 dias; sem a opção, a sessão expira com o navegador.
- Senhas usam Argon2id e mínimo de 12 caracteres. Nunca registre senhas, códigos, tokens ou segredos.
- Consentimentos devem referenciar versões de documentos legais; não armazene IP ou user-agent.
- Preserve mensagens resistentes à enumeração, rotação/invalidação de sessões e rate limiting.
- Fora do ambiente local, preserve HTTPS, cookies `Secure`, HSTS, CSP, conexão MSSQL criptografada e segredos por ambiente.

Mudanças em autenticação, sessão, consentimento ou autorização exigem testes negativos e revisão explícita dos efeitos de segurança.

## Contratos e interface

APIs próprias atuais:

- `GET /api/v1/course-offerings`
- `GET|PUT /api/v1/profile`
- `PUT /api/v1/session`
- `GET /api/v1/health`

Rotas atuais do frontend:

- `/entrar`, `/cadastro`, `/verificar-email`
- `/esqueci-senha`, `/redefinir-senha/:key`
- `/completar-perfil`, `/home`
- `/termos`, `/privacidade`

Mantenha a interface mobile-first desde 360 px, sem overflow, navegável por teclado, com foco visível, sem violações críticas de acessibilidade e alvos de toque de pelo menos 44 px. Preserve a identidade visual índigo/ciano.

## Forma de trabalhar com OpenSpec

Use OpenSpec para toda mudança de comportamento, contrato, modelo de dados, fluxo de usuário, segurança ou escopo do produto:

1. Explore requisitos e código existente sem editar.
2. Crie uma proposta com objetivos, não objetivos, cenários verificáveis, impacto de dados/API/UI e riscos.
3. Revise `proposal.md`, especificações, `design.md` e `tasks.md` antes de implementar.
4. Aplique as tarefas em ordem, mantendo os artefatos coerentes quando surgirem decisões novas.
5. Execute verificações proporcionais ao risco e registre o resultado.
6. Sincronize as especificações e arquive a mudança somente após conclusão e validação.

Correções pequenas que apenas restauram um comportamento já especificado podem dispensar uma proposta completa, mas ainda devem preservar testes e contratos existentes. Não use artefatos OpenSpec como substitutos para testes ou documentação operacional.

## Comandos e validação

Comandos principais na raiz:

- `make dev`, `make down`, `make logs`
- `make migrate`, `make seed`, `make superuser`
- `make test`, `make lint`, `make build`, `make e2e`

Para ciclos rápidos do backend, use SQLite apenas em desenvolvimento/testes locais:

```bash
cd backend
DB_ENGINE=sqlite uv run pytest -q
uv run ruff check .
uv run mypy .
```

Para o frontend:

```bash
cd frontend
pnpm lint
pnpm typecheck
pnpm test --run
pnpm build
```

Antes de concluir uma mudança, execute no mínimo os testes da área afetada. Alterações transversais ou de autenticação devem passar por lint, tipos, testes backend/frontend e pelo fluxo E2E relevante. Mudanças em modelos Django devem incluir migração e `makemigrations --check`.

## Convenções de alteração

- Preserve alterações preexistentes e evite reformatações ou atualizações de lockfile sem relação com a tarefa.
- Mantenha documentação, `.env.example`, esquema OpenAPI e testes sincronizados com mudanças de contrato ou configuração.
- Dados iniciais devem continuar versionados e idempotentes; não consulte o catálogo Impacta em tempo de execução.
- Os textos `draft-2026-09-01` são provisórios e não devem ser apresentados como revisão jurídica final.
- Nunca execute operações destrutivas de banco ou volumes sem autorização explícita.
- Use commits pequenos, descritivos e em português ou no padrão já adotado pelo histórico.

## Critério de conclusão

Uma tarefa só está concluída quando o comportamento solicitado está implementado, os cenários de aceite relevantes estão cobertos, as verificações passam e a documentação/artefatos OpenSpec refletem o resultado. Informe limitações ou verificações não executadas de forma objetiva.
