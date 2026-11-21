# Design

## Context
Backend Django 5.2 com DRF. `backend/apps/assistant/deepseek.py` concentrava um transporte DeepSeek funcional compatível com OpenAI; `backend/apps/academic/views.py` continha duas chamadas HTTP inline ao provedor anterior e dois motores determinísticos. As settings já expõem `DEEPSEEK_API_KEY` e `DEEPSEEK_MODEL`. Os testes rodam em SQLite via `DB_ENGINE=sqlite`; `requests` já está instalado e era usado pelo cliente existente, então não há dependência nova nem mudança de lock-file.

## Goals / Non-Goals
**Goals:**
- Um único módulo dono de todo tráfego de LLM no backend.
- JSON estruturado validado localmente, com descarte de itens inválidos.
- Degradação graciosa: sem chave ou em falha HTTP, o comportamento é o atual caminho determinístico.
- Nenhum nome de provedor ou modelo exposto em payload, erro ou interface.

**Non-Goals:**
- Alterar contratos de API ou componentes de frontend.
- Adicionar seleção de modelo ou formulário de chave para o aluno.
- Reescrever o histórico em `openspec/changes/archive/**`.

## Decisions
1. `backend/apps/llm/` é um app Django registrado (`apps.llm.apps.LLMConfig`) com `client.py` (`LLMClient`, `LLMError`, `LLMNotConfiguredError`), `prompts.py` e `services.py`. Nenhum outro módulo pode chamar `requests` para LLM, ler `DEEPSEEK_API_KEY` diretamente ou montar URL de provedor.
2. Provider permanece server-side e sem nome na UI; `AssistantStatusView` continua retornando apenas `{"configured": bool}`.
3. Modelo padrão `deepseek-flash`, sobrescrevível por `DEEPSEEK_MODEL`.
4. Todas as chamadas enviam `"thinking": {"type": "disabled"}` para manter latência, custo e `temperature` previsíveis; `reasoning_content` nunca é lido nem persistido.
5. Features estruturadas usam JSON mode (`response_format: {"type": "json_object"}`) mais validação local; `chat_json` remove cercas markdown, parseia, recorta do primeiro `{`/`[` ao último fechamento e levanta `LLMError` se continuar inválido.
6. Motores determinísticos permanecem como rede de segurança: gerador local de flashcards, análise cognitiva determinística, `_build_10_questions` e parser regex do calendário.
7. Regex vence na extração de calendário: `parse_calendar_text` mantém toda data detectada pelo regex e usa candidatos do LLM apenas para tipos que o regex perdeu; datas do LLM precisam ser ISO entre 2000 e 2100.
8. Upload permanece rápido: `StudyDocumentListCreateView.perform_create` chama `_generate_cognitive_analysis(..., use_llm=False)`; apenas `POST /ai-analyze` consulta o LLM.
9. Referências vivas apenas: código, configuração, docs, specs principais e o change não arquivado; `openspec/changes/archive/**` intocado.

## Risks / Trade-offs
- [Conta rejeita `deepseek-flash`] → definir `DEEPSEEK_MODEL=deepseek-v4-flash` no `.env`; nenhuma mudança de código.
- [JSON mode devolve conteúdo em branco] → tratado como `LLMError` e resolvido pelo fallback determinístico; sem retry automático para não dobrar custo/latência.
- [Latência do LLM em `/calendar/extract-pdf`] → timeout de 60s; ao estourar, a resposta sai com os resultados apenas do regex.
- [Chave real no `.env` do desenvolvedor] → `@override_settings(DEEPSEEK_API_KEY="")` na suíte acadêmica impede chamadas de rede acidentais.
- [Mudança acidental de contrato] → nenhuma alteração de frontend; qualquer falha de frontend indica mudança indevida no backend.
