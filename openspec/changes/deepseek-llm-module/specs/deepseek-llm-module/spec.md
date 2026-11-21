# Spec Delta

## ADDED Requirements

### Requirement: Módulo único de LLM no backend
O backend MUST concentrar toda chamada a modelos de linguagem em `backend/apps/llm`, lendo a chave `DEEPSEEK_API_KEY` configurada no servidor. Nenhum outro módulo SHALL ler a chave, montar URL de provedor ou importar cliente HTTP de LLM diretamente.

#### Scenario: Chamada de qualquer feature de IA
- **WHEN** Clippit, flashcards, análise de documento, simulado ou extração de calendário é acionado e `DEEPSEEK_API_KEY` está configurada
- **THEN** a requisição sai por `apps.llm.client.LLMClient.chat`/`chat_json` com `Authorization: Bearer`, modelo `deepseek-flash` (salvo `DEEPSEEK_MODEL`) e `thinking` desabilitado

### Requirement: Saída estruturada validada
Os serviços de `apps.llm.services` MUST solicitar JSON quando a feature exige dados estruturados e MUST validar o formato localmente antes de devolvê-lo às views. Itens inválidos MUST ser descartados; resultados estruturados incompletos MUST ser rejeitados.

#### Scenario: Resposta JSON inválida ou incompleta
- **WHEN** a API devolve conteúdo vazio, JSON malformado, item de flashcard sem `front`/`back`, análise sem uma das sete chaves exigidas, simulado com menos de 10 questões válidas ou data de calendário fora de 2000–2100
- **THEN** o serviço registra um warning sem prompt nem chave e retorna lista vazia/`None`, deixando a view usar o motor determinístico existente

### Requirement: Degradação graciosa e segredo não exposto
Sem chave configurada ou em falha HTTP, as features MUST continuar funcionando pelo caminho determinístico atual, sem erro 500. A chave, o modelo e o provedor MUST NOT ser retornados em payloads, mensagens de erro ou renderizados na interface.

#### Scenario: Chave ausente ou provedor indisponível
- **WHEN** `DEEPSEEK_API_KEY` está vazia ou a chamada HTTP falha
- **THEN** flashcards, análise, simulado e calendário usam seus motores locais e o Clippit responde com a mensagem de fallback atual; nenhum nome de provedor/modelo ou chave aparece na resposta
