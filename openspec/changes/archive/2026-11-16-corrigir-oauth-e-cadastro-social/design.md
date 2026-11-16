## Context

O EduTrack utiliza `django-allauth` headless no backend e Vite com proxy reverso no frontend. No ambiente de produção com Caddy e domínio público `impatrack.dev`, o redirecionamento OAuth precisa preservar a origem pública e https, sem forçar endereços locais (`127.0.0.1` ou `localhost:8000`). Novos estudantes vindos do Google precisam concluir o perfil definindo sua senha e curso. Alunos ativos precisam conseguir ajustar o professor e a carga horária declarada das matérias que cursam.

## Goals / Non-Goals

**Goals:**
- Redirecionamento OAuth dinâmico e confiável tanto em desenvolvimento (`localhost`) quanto em produção (`impatrack.dev`).
- Conclusão assistida de perfil para contas Google: nome e e-mail institucional pré-preenchidos e travados, solicitando definição de senha e escolha da graduação/modalidade.
- Edição de professor e carga horária na matrícula ativa (`StudentSubject`) pelo aluno logado, com validação e atualização visual imediata.

**Non-Goals:**
- Permitir login social com e-mails fora do domínio institucional `@aluno.impacta.edu.br`.
- Modificar o catálogo mestre de disciplinas da faculdade (`catalog.Course` e `academic.Subject`).

## Decisions

### 1. Suporte a Proxy Reverso no Django e Vite
- **Decisão:** Habilitar `USE_X_FORWARDED_HOST = True` no Django e configurar o Vite para repassar `X-Forwarded-Host` e `X-Forwarded-Proto` sem fixar `Host: localhost:8000`. No Caddy e no Vite, a origem pública (`https://impatrack.dev` ou `http://localhost:5173`) é preservada, garantindo que o Django gere a `redirect_uri` e `callback_url` correspondentes ao domínio que o usuário está navegando.

### 2. Fluxo de Conclusão de Cadastro com Senha
- **Decisão:** Quando o aluno faz login pela primeira vez com Google, o allauth vincula a conta social. O usuário é redirecionado para `/completar-perfil`. O formulário é atualizado para exigir `password` e `confirmation` (mínimo 12 caracteres, com hasher Argon2id) e `course_offering_id`. Isso garante que o aluno passe a ter tanto acesso via Google quanto login local tradicional com senha.

### 3. Edição de Professor e Carga Horária Declarada
- **Decisão:** Adicionar o campo `custom_workload_hours` em `StudentSubject` (ou permitir atualizar a carga da matrícula), expondo a propriedade `workload_hours` efetiva (carga declarada se informada, ou carga da matriz como padrão). Implementar `PATCH /api/v1/student-subjects/{id}` com serializer validado e adicionar modal de edição simples em `/disciplinas`.

## Risks / Trade-offs

- **Redirecionamento Google Cloud Console:** No painel do Google Cloud, a URI de callback oficial de produção (`https://impatrack.dev/accounts/google/login/callback/`) deve estar cadastrada junto às origens autorizadas.
- **Validação de Senha:** A senha definida no cadastro OAuth deve seguir o mesmo rigor de segurança da aplicação (mínimo 12 caracteres e Argon2id).
