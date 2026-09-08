## Why

O fluxo E2E de autenticação falha no CI porque o Playwright abre o frontend em `http://127.0.0.1:5173`, enquanto o backend confia apenas nas origens locais baseadas em `localhost`. O Django rejeita o cadastro com HTTP 403 antes que o comportamento funcional possa ser validado.

## What Changes

- Incluir a origem local usada pelo Playwright na configuração CSRF do ambiente composto e no exemplo de variáveis de ambiente.
- Adicionar uma verificação de regressão para manter alinhadas a origem do Playwright e as origens confiáveis do Django.
- Garantir que o botão de logout da Home mantenha o nome acessível “Sair” quando o texto visual estiver oculto no viewport mobile.
- Reexecutar o fluxo E2E completo de cadastro, verificação, recuperação e novo login no CI.
- Manter inalteradas as regras de CSRF e cookies em produção.
- Não alterar fluxos, contratos de API, modelos de dados ou apresentação visual do produto.

## Capabilities

### New Capabilities

Nenhuma. A mudança corrige configuração de desenvolvimento e CI, sem introduzir comportamento de produto.

### Modified Capabilities

Nenhuma. Não há especificações existentes e nenhum requisito funcional é alterado; a mudança usa `skip_specs: true`.

## Impact

- **Backend:** configuração das origens CSRF confiáveis no ambiente local; nenhuma alteração nas views ou APIs.
- **Frontend:** nome acessível explícito no botão de logout mobile, sem alteração visual; a configuração Playwright continua usando `127.0.0.1`.
- **Banco:** não afetado; nenhuma migração ou mudança de dados.
- **Segurança:** confiança adicionada somente para a origem explícita de desenvolvimento `http://127.0.0.1:5173`. Não serão usados curingas nem relaxadas as proteções de produção. Privacidade, autorização e resistência à enumeração permanecem inalteradas.
- **Operação:** Docker Compose, `.env.example`, CI e teste de regressão serão alinhados. Nenhuma dependência nova será adicionada.

## Non-goals

- Alterar o domínio ou a configuração de publicação do EduTrack.
- Desabilitar CSRF ou aceitar origens por curinga.
- Modificar o fluxo de cadastro ou reduzir sua cobertura E2E.
