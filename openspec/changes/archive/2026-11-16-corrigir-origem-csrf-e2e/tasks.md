## 1. Alinhar configuração local

- [x] 1.1 Incluir `http://127.0.0.1:5173` no valor local padrão de `CSRF_TRUSTED_ORIGINS` em `backend/edutrack/settings.py` e verificar a lista carregada com um teste Django.
- [x] 1.2 Alinhar os padrões de `DJANGO_CSRF_TRUSTED_ORIGINS` em `compose.yaml` e `.env.example`, confirmando que ambos contêm exatamente as origens locais suportadas e nenhum curinga.

## 2. Cobertura de regressão

- [x] 2.1 Adicionar teste backend que comprove a presença de `localhost:5173` e `127.0.0.1:5173` nas origens CSRF locais e verificar que o teste falha sem a correção e passa com ela.
- [x] 2.2 Adicionar o nome acessível “Sair” ao botão de logout da Home e verificar no E2E mobile que ele é localizado por role e nome sem alterar o layout.
- [x] 2.3 Sincronizar o fluxo E2E com a URL e o heading da recuperação antes do submit e verificar que a mensagem genérica e o e-mail aparecem sem espera fixa.
- [x] 2.4 Executar Ruff, mypy e a suíte backend com SQLite, confirmando que configuração e testes existentes permanecem válidos.

## 3. Validação integrada e entrega

- [x] 3.1 Subir o Docker Compose e executar o Playwright, confirmando que cadastro, verificação, recuperação, novo login e acessibilidade passam usando `http://127.0.0.1:5173`.
- [x] 3.2 Executar `git diff --check`, revisar que nenhuma configuração de produção foi relaxada e conferir todos os critérios da proposta.
- [x] 3.3 Criar commit, publicar a branch e confirmar que os três jobs do GitHub Actions terminam com sucesso.
