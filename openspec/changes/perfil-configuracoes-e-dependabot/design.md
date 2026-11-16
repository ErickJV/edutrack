# Design

## Context
O Perfil atual só edita nome, curso e modalidade e ainda troca o e-mail por um `PATCH /api/v1/profile` que grava o novo endereço como verificado, sem confirmação. Ao mesmo tempo, existem 8 PRs abertos pelo Dependabot (5 Python e 3 Node) que precisam ser analisados e integrados sem quebrar `uv lock`, `pnpm install`, `mypy`, `ruff` ou o build do Vite. A entrega precisa deixar a conta do estudante utilizável no dia a dia: e-mail verificado, senha, sessões ativas, status do Google, exportação de dados e exclusão de conta.

## Goals / Non-Goals
**Goals:**
- Implement Plano: Configurações de conta no Perfil + atualização das dependências (Dependabot) cleanly and reliably

**Non-Goals:**
- Scope outside the core requirements of Plano: Configurações de conta no Perfil + atualização das dependências (Dependabot)

## Decisions
1. **Usar o allauth para e-mail e senha**, em vez de criar endpoints próprios. Motivo: validadores, Argon2id, rotação de sessão, código/link e notificações já são tratados pela biblioteca. Evitar o padrão atual de `ProfileUpdateSerializer.validate_email` + `EmailAddress(... verified=True)`.
2. **`ACCOUNT_CHANGE_EMAIL = True`**: o novo e-mail substitui o antigo após a confirmação (`verify_email` remove os demais e marca o novo como primário). Isso evita um segundo `PATCH` para promover o e-mail.
3. **Remover `email` de `ProfileUpdateSerializer` e do formulário acadêmico**. `PATCH /api/v1/profile` fica restrito a `full_name` e `course_offering_id`; a UI de e-mail vive em “Conta e segurança”.
4. **Sessões via `allauth.usersessions`**, sem `USERSESSIONS_TRACK_ACTIVITY` (sem escrita por request). Um middleware leve `EnsureUserSessionMiddleware` cria a linha da sessão atual apenas quando ela ainda não existe, para que usuários com sessão antiga vejam “Este dispositivo”.
5. **Exclusão de conta** exige `confirmation == "EXCLUIR"` e, quando `has_usable_password`, a senha atual. A view coleta os caminhos dos `StudyDocument.file`, apaga o usuário dentro de `transaction.atomic()` e depois remove os arquivos do storage em melhor esforço.
6. **Exportação JSON** usa `django.core.serializers.serialize` para os querysets do usuário, o que inclui todos os campos de dados sem montar dezenas de serializers. Não exporta hash de senha, tokens sociais nem binários.
7. **UI condicionada pela configuração real**: `GET /_allauth/browser/v1/config` informa `email_verification_by_code_enabled`; a seção mostra campo de código quando `true` e instruções de link + “Já confirmei” quando `false`.
8. **Ordem de merge**: primeiro os frontend (#55, #54, #53), depois backend (#49, #48, #51, #50, #52), e em seguida o commit corretivo de `django-stubs`/`uv.lock`. Motivo: os PRs de frontend compartilham `pnpm-lock.yaml`; os de backend só editam linhas distintas do `pyproject.toml`, mas o `uv.lock` fica desatualizado.

## Risks / Trade-offs
[Unforeseen edge cases or regression] → Mitigation: Comprehensive end-to-end and unit verification tests.
