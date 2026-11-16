## Context

Veja `proposal.md` para a motivação. Atualmente, o Playwright usa `http://127.0.0.1:5173` como `baseURL`, enquanto os padrões de `DJANGO_CSRF_TRUSTED_ORIGINS` em `backend/edutrack/settings.py`, `compose.yaml` e `.env.example` incluem somente as origens locais baseadas em `localhost`. Como o proxy Vite preserva a origem do navegador, o middleware CSRF do Django rejeita as mutações encaminhadas ao backend.

A correção atravessa configuração Django, ambiente composto e cobertura automatizada. Durante a validação, o fluxo passou a alcançar a Home e revelou que o texto “Sair” fica oculto no mobile enquanto o ícone também está oculto da árvore de acessibilidade, deixando o botão sem nome acessível.

## Goals / Non-Goals

**Goals:**

- Tornar explícita e consistente a lista de origens confiáveis do ambiente local.
- Permitir que o E2E use `127.0.0.1` sem desabilitar ou contornar o middleware CSRF.
- Detectar divergências futuras entre a origem Playwright e a configuração local confiável.
- Preservar um nome acessível estável para o logout em todos os viewports.
- Manter configuração de produção dependente de variáveis de ambiente explícitas.

**Non-Goals:**

- Inferir origens confiáveis automaticamente a partir de cabeçalhos recebidos.
- Aceitar curingas, esquemas inseguros fora do desenvolvimento ou portas arbitrárias.
- Mudar a origem canônica dos links enviados por e-mail, que continua definida por `FRONTEND_URL`.
- Alterar o cliente HTTP, o proxy Vite ou o fluxo de autenticação.

## Decisions

### 1. Autorizar as duas grafias de loopback apenas nos padrões locais

Os valores locais padrão incluirão `http://localhost:5173`, `http://127.0.0.1:5173` e `http://localhost:8000`. A mesma lista será refletida em `settings.py`, `compose.yaml` e `.env.example`.

Isso mantém o comportamento previsvisível tanto para navegação manual em `localhost` quanto para Playwright em `127.0.0.1`. Em produção, `DJANGO_CSRF_TRUSTED_ORIGINS` continuará substituindo integralmente esses padrões.

Alternativas consideradas:

- Trocar o Playwright para `localhost`: reduziria o sintoma atual, mas manteria uma divergência frágil entre ferramentas locais e não documentaria que ambos os endereços de loopback são suportados.
- Desabilitar CSRF no CI: rejeitado porque removeria justamente uma proteção que o E2E deve exercitar.
- Aceitar curingas: rejeitado por ampliar desnecessariamente a superfície de confiança.

### 2. Preservar `FRONTEND_URL` canônica em `localhost`

`FRONTEND_URL` continuará sendo `http://localhost:5173`. Essa variável controla redirecionamentos e links, enquanto `CSRF_TRUSTED_ORIGINS` responde por quais origens podem realizar mutações. Separar essas responsabilidades evita gerar links diferentes apenas para acomodar o executor E2E.

### 3. Cobrir os padrões locais com teste de configuração

Um teste backend verificará que, sem sobrescrita por ambiente, as origens de loopback exigidas pelo desenvolvimento estão presentes. O E2E continuará sendo a prova integrada de que cadastro e demais mutações atravessam proxy e CSRF corretamente.

Alternativa considerada: confiar apenas no E2E. Rejeitada porque a falha surgiria tarde, após subir SQL Server e todos os serviços, enquanto um teste de configuração fornece diagnóstico rápido e localizado.

### 4. Nomear explicitamente o botão de logout

O botão receberá `aria-label="Sair"`. O texto visual continuará responsivo e oculto abaixo do breakpoint `sm`, mas o nome acessível permanecerá estável para tecnologia assistiva e para o seletor semântico do Playwright.

Alternativas consideradas:

- Tornar o texto sempre visível: rejeitado porque altera desnecessariamente o layout mobile.
- Selecionar o botão por classe, posição ou `data-testid`: rejeitado porque faria o teste ignorar a falha real de acessibilidade.

### 5. Sincronizar o E2E com a rota de recuperação

Após clicar em “Esqueci minha senha”, o teste aguardará a URL e o heading da página de recuperação antes de preencher e enviar o formulário. A página e sua API funcionam isoladamente; a falha acontece quando o Playwright interage durante a transição SPA, antes de o novo estado estabilizar.

Alternativas consideradas:

- Aumentar o timeout da mensagem: rejeitado porque não corrige a corrida anterior ao envio e atrasaria o diagnóstico.
- Usar espera fixa: rejeitado por tornar o teste dependente do desempenho da máquina.
- Alterar o formulário ou a API: rejeitado porque o teste manual confirmou o comportamento correto fora da transição.

## Risks / Trade-offs

- [A lista padrão divergir novamente entre arquivos] -> Manter teste de configuração e revisar `.env.example` junto a mudanças operacionais.
- [Uma origem local ser aplicada acidentalmente em produção] -> Produção deve fornecer `DJANGO_CSRF_TRUSTED_ORIGINS`; os pré-requisitos de publicação já exigem configuração explícita de domínio e HTTPS.
- [Confundir origem confiável com host permitido] -> Não alterar `ALLOWED_HOSTS`; cada configuração mantém sua responsabilidade própria.
- [Teste unitário validar apenas `settings.py`, mas não Compose] -> O E2E composto complementa o teste unitário e valida o valor efetivamente injetado no container.
- [O texto visual e o nome acessível divergirem no futuro] -> Usar a mesma expressão curta “Sair” e manter o E2E baseado em role/nome.
- [Transições SPA variarem entre ambientes] -> Aguardar sinais semânticos da rota de destino, nunca tempos fixos.

## Migration Plan

1. Atualizar os padrões locais e o exemplo de ambiente.
2. Adicionar o teste de regressão da configuração.
3. Corrigir o nome acessível do logout mobile sem alterar sua apresentação.
4. Executar testes backend e o E2E composto.
5. Publicar a alteração e confirmar o novo GitHub Actions.

Não há migração de banco ou dados. O rollback consiste em reverter os valores e o teste adicionados; nenhuma sessão ou conta é afetada.
