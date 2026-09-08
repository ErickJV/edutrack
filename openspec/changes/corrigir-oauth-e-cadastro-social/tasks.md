## 1. Redirecionamento OAuth e Proxy Reverso

- [x] 1.1 Configurar `USE_X_FORWARDED_HOST = True` e `SECURE_PROXY_SSL_HEADER` em `backend/edutrack/settings.py` para suportar proxy reverso com preservação de host e protocolo.
- [x] 1.2 Atualizar `frontend/vite.config.ts` para repassar cabeçalhos de proxy do host (`X-Forwarded-Host`, `X-Forwarded-Proto`) sem forçar host estático de loopback em produção.
- [x] 1.3 Validar que o `GoogleButton.tsx` submete a `callback_url` relativa à origem ativa do navegador.

## 2. Cadastro Assistido para Novo Usuário OAuth

- [x] 2.1 Atualizar `ProfileCompletionSerializer` em `backend/apps/accounts/serializers.py` para aceitar `password`, validar força mínima de 12 caracteres e persistir via `set_password` para contas sociais.
- [x] 2.2 Atualizar `ProfileCompletionPage.tsx` no frontend para exibir nome e e-mail preenchidos e travados, solicitando definição de senha e graduação/modalidade.
- [x] 2.3 Implementar testes de backend validando conclusão de perfil de usuário social com definição de senha e vínculo de curso.

## 3. Edição de Carga Horária e Professor nas Disciplinas

- [x] 3.1 Adicionar campo `custom_workload_hours` no modelo `StudentSubject` em `backend/apps/academic/models.py` com migração correspondente.
- [x] 3.2 Atualizar serializers e viewsets em `apps/academic` com endpoint `PATCH /api/v1/student-subjects/{id}` para alteração de `professor_name` e `custom_workload_hours` (1 a 2000 horas) com isolamento estrito de usuário.
- [x] 3.3 Adicionar modal e botão de edição de professor e carga horária nos cards de disciplina na página `/disciplinas`.
- [x] 3.4 Atualizar os cálculos de carga horária e progresso para priorizar a carga horária declarada pelo aluno.

## 4. Validação e Qualidade

- [x] 4.1 Executar suíte de testes de backend com `pytest` cobrindo os novos fluxos de OAuth, conclusão de perfil e edição de matérias.
- [x] 4.2 Executar testes de frontend, lint e build com `pnpm test`, `pnpm lint` e `pnpm run build`.
