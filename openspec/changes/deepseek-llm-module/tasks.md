# Tasks

## 1. Módulo LLM compartilhado

- [x] 1.1 Criar `backend/apps/llm/__init__.py`, `apps.py` (`LLMConfig`) e `client.py` com `LLMClient`, `LLMError`, `LLMNotConfiguredError`, endpoint, modelo padrão `deepseek-flash`, timeout, `chat`, `chat_json` e parsing de JSON com remoção de cercas. Verificado: `LLMClient(api_key="x").model == "deepseek-flash"`.
- [x] 1.2 Criar `backend/apps/llm/prompts.py` com `CLIPPIT_SYSTEM_PROMPT`, `build_flashcards_prompt`, `build_document_analysis_prompt`, `build_quiz_prompt` e `build_calendar_extraction_prompt`, reutilizando os textos existentes e incluindo a palavra `JSON` nos prompts estruturados.
- [x] 1.3 Criar `backend/apps/llm/services.py` com as quatro funções e validações exatas, capturando `LLMError`/`ValueError`/`TypeError`/`KeyError` e retornando vazio/`None`.
- [x] 1.4 Registrar `"apps.llm.apps.LLMConfig"` em `INSTALLED_APPS` e alterar `DEEPSEEK_MODEL` para `deepseek-flash`. Verificado com `manage.py check`.
- [x] 1.5 Criar `backend/apps/llm/tests.py` com os quatro testes de transporte e JSON. Verificado: `manage.py test apps.llm -v 2` — 4 testes OK.

## 2. Clippit

- [x] 2.1 Criar `backend/apps/assistant/chat.py` com `generate_chat_response` e `_determine_animation`, usando `LLMClient` e preservando as mensagens de fallback atuais.
- [x] 2.2 Atualizar `backend/apps/assistant/views.py` para importar `LLMClient` e `generate_chat_response`, removendo `DeepSeekClient`.
- [x] 2.3 Excluir `backend/apps/assistant/deepseek.py`; atualizar `backend/apps/assistant/tests.py` para importar `LLMClient` de `apps.llm.client`, patchear `apps.llm.client.requests.post` e esperar `deepseek-flash`. Verificado: `manage.py test apps.assistant -v 2` — 6 testes OK.

## 3. Flashcards

- [x] 3.1 Em `FlashcardAIGenerateView.post`, remover os imports locais `json`/`os`/`urllib.request` e o bloco do provedor anterior; chamar `generate_flashcards(...)` com `count`, `subject_title`, `core_theme`, `source_text=clean_source` e `fallback_context=full_context_label`.
- [x] 3.2 Manter o preenchimento local quando `len(generated_specs) < count` e a criação dos cards com `hint[:255]` e `tags[:200]`. Verificado por `test_flashcard_generation_uses_shared_llm`.

## 4. Análise de documentos

- [x] 4.1 Adicionar `use_llm: bool = True` a `StudyDocumentAIAnalyzeView._generate_cognitive_analysis`; quando verdadeiro, chamar `generate_document_analysis` e retornar o resultado validado; quando falso, ir direto ao motor determinístico.
- [x] 4.2 Atualizar `StudyDocumentListCreateView.perform_create` para chamar `_generate_cognitive_analysis(..., use_llm=False)`; `StudyDocumentAIAnalyzeView.post` mantém o default `True`.
- [x] 4.3 Remover o bloco do provedor anterior e os imports `json`/`urllib.request` do método. Verificado por `test_document_analysis_uses_shared_llm` e pelo teste de pipeline existente.

## 5. Simulado

- [x] 5.1 Adicionar `StudyDocumentQuizView._collect_page_snippets(pages)` e reutilizá-lo em `_build_10_questions`.
- [x] 5.2 Em `StudyDocumentQuizView.post`, chamar `generate_quiz_questions(doc_title, snippets) or self._build_10_questions(doc, pages)` e atribuir `id` sequencial antes de criar `StudyQuiz`.
- [x] 5.3 Validar que a resposta mantém `total_questions`, `questions`, citações e o fluxo `action="submit"`. Verificado por `test_quiz_generation_uses_shared_llm` e pelo teste de submissão existente.

## 6. Calendário

- [x] 6.1 Extrair `_resolve_reference_year` e `_make_calendar_item` de `CalendarPdfExtractView`, usando `_make_calendar_item` também no ramo regex.
- [x] 6.2 Adicionar `llm_items=None` a `parse_calendar_text` e implementar a mesclagem regex-primeiro; recalcular `existing_types`, `missing_types`, avisos e deduplicação sobre a lista final.
- [x] 6.3 Em `CalendarPdfExtractView.post`, chamar `extract_calendar_items` após validar o texto e passar `llm_items` ao parser. Verificado por `test_calendar_extraction_merges_llm_items` e pelos testes de calendário existentes.

## 7. Remoção de referências do provedor anterior

- [x] 7.1 Remover a variável de chave do provedor anterior de `.env.example` e adicionar `DEEPSEEK_MODEL=deepseek-flash`; `settings.py` não lê mais nenhuma variável do provedor anterior.
- [x] 7.2 Remover a menção ao provedor anterior em `docs/planejamento/requisitos-professor-e-ideias-grupo.md`.
- [x] 7.3 Reescrever `openspec/specs/clippit-assistant/spec.md` para o desenho atual (módulo LLM compartilhado, contexto isolado do aluno).
- [x] 7.4 Substituir menções ao provedor anterior em `openspec/changes/impatrack-clippit-refresh/{proposal.md,design.md,specs/clippit-assistant/spec.md,tasks.md}` por equivalentes neutros, preservando o sentido técnico.
- [x] 7.5 Excluir o diretório `openspec/changes/clippit-ui-and-omp-auth/`; `openspec/changes/archive/**` inalterado.

## 8. Verificação

- [x] 8.1 Adicionar `@override_settings(DEEPSEEK_API_KEY="")` à classe `FlashcardsAndNotesQualityTests` e os quatro testes de feature LLM.
- [x] 8.2 `DB_ENGINE=sqlite .venv/Scripts/python.exe manage.py test apps.llm apps.assistant apps.academic -v 2` — 26 testes OK.
- [x] 8.3 `git grep -niE "gemini|antigravity|generativelanguage|GEMINI_API_KEY|GOOGLE_API_KEY" -- . ':(exclude)openspec/changes/archive/**'` — sem saída.
- [x] 8.4 `DB_ENGINE=sqlite .venv/Scripts/python.exe manage.py check` — sem erros.
