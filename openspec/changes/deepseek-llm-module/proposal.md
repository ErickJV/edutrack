# Proposal

## Why

O backend já fala com o DeepSeek para o Clippit, mas as outras features de IA não compartilham esse caminho: `FlashcardAIGenerateView` e `StudyDocumentAIAnalyzeView` chamavam um provedor diferente com a chave própria dele, enquanto o simulado e a extração de calendário eram motores determinísticos que nunca chegavam a um LLM. Strings de provedor, um nome de modelo aposentado e menções a OAuth local estavam espalhadas por código, `.env.example`, docs e specs. O resultado eram duas stacks de IA, duas políticas de falha e uma superfície de configuração que não corresponde mais ao produto. Este change cria um único módulo LLM no backend, move todas as features de IA para ele e remove toda referência viva ao provedor anterior.

## What Changes

- Adicionar o app Django `backend/apps/llm/` com o único transporte de LLM (`LLMClient`), todos os prompts de IA e serviços de feature validados.
- Migrar o chat do Clippit de `apps.assistant.deepseek.DeepSeekClient` para o módulo compartilhado e excluir o arquivo antigo.
- Substituir o bloco do provedor anterior na geração de flashcards pelo módulo compartilhado, mantendo o fallback analítico determinístico.
- Substituir o bloco do provedor anterior na análise de documentos pelo módulo compartilhado; o upload mantém a análise determinística rápida, e `POST /ai-analyze` usa o LLM.
- Adicionar geração por LLM ao simulado de 10 questões, com validação estrita e fallback determinístico.
- Adicionar extração de avaliações assistida por LLM no upload de calendário PDF/DOCX; o parser regex permanece autoritativo e o LLM só preenche tipos ausentes.
- Alterar o modelo padrão para `deepseek-flash` (nome público atual; `deepseek-v4-flash` é alias legado).
- Remover a variável de chave do provedor anterior e toda menção a ele de código, configuração, docs, specs principais e do change não arquivado `impatrack-clippit-refresh`. Manter `openspec/changes/archive/**` intacto como registro histórico.
- Excluir o change obsoleto e não implementado `openspec/changes/clippit-ui-and-omp-auth/`, superado pela migração já implementada.

Sem mudanças no frontend: endpoints, formato de requisição e formato de resposta permanecem iguais. Sem migração de banco.

## Capabilities

### New Capabilities
- `deepseek-llm-module`: transporte único de LLM no servidor, tratamento da chave DeepSeek, validação de JSON estruturado e degradação graciosa.

### Modified Capabilities
- `clippit-assistant`: o chat usa o módulo LLM compartilhado, sem descoberta de provedor ou OAuth.
- `flashcards-and-notes-quality`: a geração de flashcards usa o módulo LLM compartilhado.
- `study-documents-rag`: análise de documento e geração de simulado usam o módulo LLM compartilhado.
- `academic-calendar`: a extração de avaliações de PDF/DOCX usa o módulo LLM compartilhado para preencher tipos ausentes.

## Impact
- `backend/apps/llm/`: novo app (client, prompts, services, tests).
- `backend/apps/assistant/`: `views.py` passa a usar `LLMClient`/`generate_chat_response`; `deepseek.py` é removido; novo `chat.py`.
- `backend/apps/academic/views.py`: flashcards, análise de documento, simulado e extração de calendário.
- `backend/edutrack/settings.py`: registro de `apps.llm.apps.LLMConfig` e default `deepseek-flash`.
- `.env.example`, `docs/planejamento/`, `openspec/specs/clippit-assistant/spec.md` e `openspec/changes/impatrack-clippit-refresh/`.
- Nenhuma dependência nova e nenhuma migração de banco.
