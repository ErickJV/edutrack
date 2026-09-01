# EduTrack

Plataforma mobile-first para organização acadêmica de alunos da Faculdade Impacta. Este primeiro MVP entrega autenticação, perfil acadêmico e uma Home protegida; os recursos de estudos serão desenvolvidos nas próximas versões.

> Projeto acadêmico. Não é um sistema oficial da Faculdade Impacta e ainda não está pronto para publicação pública.

## O que está implementado

- Cadastro exclusivo para endereços terminados exatamente em `@aluno.impacta.edu.br`.
- Verificação por código numérico de seis dígitos, válido por 10 minutos e limitado a três tentativas.
- Login local, sessão segura, opção de lembrar por 14 dias e logout.
- Recuperação por link de uso único com validade de uma hora e resposta resistente à enumeração.
- Login Google/OIDC opcional, com PKCE, e-mail verificado, domínio validado no backend e sem persistir tokens.
- Conclusão de perfil para novos usuários OAuth.
- Graduações/modalidades versionadas, administráveis pelo Django Admin.
- Aceite versionado de Termos e Privacidade, sem IP nem user-agent.
- Home protegida com saudação, graduação, modalidade e estado dos próximos recursos.
- Layout acessível, responsivo desde 360 px e identidade visual EduTrack em índigo/ciano.

Não fazem parte deste MVP: disciplinas, grade curricular, tarefas, calendário, notas, integração com o portal acadêmico, MFA, edição completa de perfil e hospedagem pública.

## Stack fixada

| Camada | Tecnologia |
| --- | --- |
| Backend | Python 3.14, Django 5.2 LTS, DRF 3.18, django-allauth 65.19 |
| Banco | SQL Server 2022, mssql-django 1.8, ODBC Driver 18 |
| Frontend | React 19.2, TypeScript 7, Vite 8, Tailwind CSS 4 |
| Ferramentas | uv 0.12.5, pnpm 11.3, Ruff, mypy, Vitest, Playwright |
| Ambiente local | Docker Compose e Mailpit |

O catálogo inicial foi capturado do [catálogo de graduação da Impacta](https://www.impacta.edu.br/graduacao) em 01/09/2026. Não existe consulta ao site da faculdade em tempo de execução.

## Arquitetura

```text
Navegador
   │ cookie HttpOnly + CSRF
   ▼
React/Vite :5173 ──proxy──▶ Django/DRF/allauth :8000
                              │              │
                              ▼              ▼
                       SQL Server :1433   Mailpit :1025
                                           UI :8025
```

O monorepo separa `backend/` e `frontend/`. O modelo `accounts.User` usa UUID e existe desde a primeira migração. `Course` e `CourseOffering` são entidades independentes para permitir grades futuras e ativação/desativação de ofertas no Admin.

A autenticação principal usa a API headless oficial do django-allauth em `/_allauth/browser/v1`. As APIs próprias são:

- `GET /api/v1/course-offerings` — ofertas ativas para o cadastro.
- `GET|PUT /api/v1/profile` — consulta/conclusão de perfil OAuth.
- `PUT /api/v1/session` — define sessão de navegador ou 14 dias.
- `GET /api/v1/health` — saúde da aplicação e do banco.
- `/api/schema/` e `/api/docs/` — OpenAPI e Swagger.

## Executar localmente

Pré-requisitos: Docker com Compose v2 e Git. As portas `1433`, `5173`, `8000`, `8025` e `1025` precisam estar livres.

```bash
cp .env.example .env
make dev
```

Na primeira execução as imagens serão construídas, o banco `edutrack` será criado, as migrações serão aplicadas e a carga inicial será confirmada. Depois, acesse:

- Aplicação: http://localhost:5173
- Mailpit: http://localhost:8025
- API: http://localhost:8000/api/v1/health
- Admin: http://localhost:8000/admin
- Documentação da API: http://localhost:8000/api/docs/

Comandos úteis:

```bash
make logs        # acompanha os serviços
make migrate     # aplica migrações
make seed        # reaplica a carga versionada e idempotente
make superuser   # cria acesso ao Django Admin
make test        # testes backend e frontend
make lint        # Ruff, mypy, ESLint e TypeScript
make build       # build de produção do frontend
make down        # encerra os containers sem apagar dados
```

Para apagar também o volume local do SQL Server, use `docker compose down --volumes`. Essa ação remove o banco de desenvolvimento e não pode ser desfeita.

## Desenvolvimento sem Docker

O backend pode usar SQLite apenas para desenvolvimento rápido e testes unitários:

```bash
cd backend
uv sync --all-groups
DB_ENGINE=sqlite uv run python manage.py migrate
DB_ENGINE=sqlite uv run python manage.py runserver
```

Em outro terminal:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

O proxy Vite aponta para `http://localhost:8000` fora do Docker. SQLite não é usado na aplicação composta nem na CI de backend.

## Google OAuth local

1. Crie um cliente OAuth do tipo “Aplicativo da Web” no Google Cloud.
2. Cadastre `http://localhost:8000/accounts/google/login/callback/` como URI de redirecionamento autorizada.
3. Preencha `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env`.
4. Defina `VITE_GOOGLE_ENABLED=true` e reinicie `api` e `web`.

São solicitados somente os escopos `openid email profile`. O parâmetro de domínio ajuda a experiência no Google, mas a autorização real ocorre no backend: somente e-mails institucionais verificados são aceitos. Um endereço verificado já existente é vinculado à conta, sem duplicação.

## E-mails e fluxos

O Mailpit recebe os códigos de verificação e links de recuperação no ambiente local. Não é preciso usar uma caixa de entrada real. O E2E automatizado cria uma conta institucional de teste, lê o código pela API do Mailpit, confirma o cadastro, redefine a senha e entra novamente.

```bash
docker compose up --detach --build
cd frontend
pnpm exec playwright install chromium
PLAYWRIGHT_EXTERNAL_SERVER=true pnpm e2e
```

Os projetos Playwright executam em larguras de 360, 768 e 1280 px e verificam overflow, teclado e violações críticas de acessibilidade. O OAuth externo é coberto no backend com respostas simuladas e deve ser validado manualmente com credenciais Google de desenvolvimento.

## Segurança

- Senhas armazenadas com Argon2id e mínimo de 12 caracteres.
- Cookies de sessão `HttpOnly`, `SameSite=Lax`, rotação no login e CSRF em mutações.
- Sessões anteriores invalidadas após redefinição de senha.
- Rate limiting padrão do allauth para login, reenvio e recuperação.
- Respostas genéricas na recuperação para evitar descoberta de contas.
- CSP, HSTS, HTTPS obrigatório e cookies `Secure` quando `DJANGO_DEBUG=false`.
- SQL Server com conexão criptografada; confiança no certificado é permitida somente no padrão local.
- Segredos lidos por variáveis de ambiente e excluídos do Git.
- Tokens Google não são armazenados.

Antes de uma publicação são obrigatórios: textos jurídicos finais, domínio e HTTPS, SMTP transacional, SQL Server gerenciado com backups, cache compartilhado para rate limiting, configuração do proxy confiável, rotação dos segredos e `DB_TRUST_SERVER_CERTIFICATE=false` com certificado válido.

## Qualidade e CI

A workflow em `.github/workflows/ci.yml` roda em push e pull request:

- Backend contra SQL Server real: Ruff, mypy, migrações, pytest e checks de deploy.
- Frontend: ESLint, TypeScript, Vitest e build.
- E2E: Compose completo, Playwright, Mailpit e acessibilidade.

Dependabot acompanha uv/pip, pnpm, Docker e GitHub Actions semanalmente. O projeto permanece privado e sem licença pública nesta fase.

## Documentos jurídicos

Os Termos de Uso e a Política de Privacidade incluídos na versão `draft-2026-09-01` são textos acadêmicos provisórios, claramente marcados como pendentes de revisão jurídica. Cada aceite referencia a versão exata do documento ativo.
