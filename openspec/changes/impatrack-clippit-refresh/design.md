# Design

## Context
O cabeçalho exibia apenas o ícone da marca. A página `/calendario` renderizava o card `Programação Semanal` entre o cabeçalho do calendário e a grade mensal. O Clippit autenticava via credenciais locais do `oh-my-pi` / Google Antigravity, expunha provedor e modelo na UI e usava paleta âmbar/creme. O gerador de flashcards em `backend/apps/academic/views.py` também lê `GEMINI_API_KEY`, mas é uma feature separada e não faz parte do caminho de autenticação do assistente.

## Goals / Non-Goals
**Goals:**
- Manter a persona do Clippit e a injeção de contexto acadêmico inalteradas.
- Autenticação do assistente como uma única chave de servidor.
- UI do Clippit agnóstica de provedor e consistente com o tema do app.

**Non-Goals:**
- Migrar a integração Gemini do gerador de flashcards.
- Adicionar formulário de chave de API para o usuário.
- Expor seleção de modelo na interface.

## Decisions
1. Endpoint compatível com OpenAI do DeepSeek com `Authorization: Bearer $DEEPSEEK_API_KEY`, removendo refresh de token, acesso ao SQLite do OMP, project IDs e parsing de resposta do Gemini. O modelo é um default interno (`deepseek-v4-flash`), sobrescrevível por `DEEPSEEK_MODEL`, e nunca é retornado pela API nem renderizado na UI.
   - Alternativa descartada: manter o caminho Antigravity com fallback Gemini — preservaria a dependência de credenciais locais que este change elimina.
2. `CLIPPIT_SYSTEM_PROMPT` e `_determine_animation` permanecem verbatim; apenas o transporte muda.
3. `/api/v1/assistant/status` continua para health check, com payload reduzido a `{ "configured": boolean }`.
4. A seção semanal vai depois do bloco mensal completo, porque a referência de `Calendário Acadêmico` é o bloco inteiro (cabeçalho + grade), não só o título.
5. Superfícies brancas/cinza-claras (`#ffffff` / `#f8fafc`, bordas `#e2e8f0`) e acentos teal existentes (`#0d3950`, `#005063`, `#006768`); no tema escuro, superfícies `#0c1824` com bordas `#005063`.

## Risks / Trade-offs
- [Provedor rejeita `deepseek-v4-flash` para a chave fornecida] → definir `DEEPSEEK_MODEL` no `.env` com o identificador da conta; nenhuma mudança de código.
- [Provedor devolve envelope diferente do padrão OpenAI] → o cliente registra a falha e retorna a mensagem genérica de nova tentativa, sem expor detalhes do provedor.
- [Regressão visual fora do Clippit ao mover a seção semanal] → a mudança é puramente de posição do JSX; estado, handlers e markup do bloco foram movidos verbatim.
