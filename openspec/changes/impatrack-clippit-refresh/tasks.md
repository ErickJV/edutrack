# Tasks

## 1. Marca e layout do calendário

- [x] 1.1 Adicionar o wordmark `Impatrack` em `frontend/src/components/Brand.tsx` (Montserrat extrabold, cores de tema, gap flex) e verificar o cabeçalho de `/home`.
- [x] 1.2 Mover o JSX da seção semanal em `frontend/src/pages/CalendarPage.tsx` para depois da grade mensal e renumerar os comentários de seção.

## 2. Limpeza da UI do Clippit

- [x] 2.1 Remover o selo `Copiloto Impatrack`, a pílula `Online` e o rodapé do chat em `ClippitWindow.tsx`; remover menções a modelo nos estados de carregamento e erro.
- [x] 2.2 Trocar as classes/CSS âmbar do Clippit por branco/cinza/teal em `ClippitWindow.tsx`, `clippy.css` e `ClippitFloatingWidget.tsx`.

## 3. Backend DeepSeek

- [x] 3.1 Adicionar `DEEPSEEK_API_KEY`/`DEEPSEEK_MODEL` em `backend/edutrack/settings.py` e substituir o bloco Antigravity de `.env.example` por `DEEPSEEK_API_KEY=`, mantendo `GEMINI_API_KEY` para os flashcards.
- [x] 3.2 Remover `backend/apps/assistant/antigravity.py` e criar `backend/apps/assistant/deepseek.py` preservando `CLIPPIT_SYSTEM_PROMPT` e `_determine_animation`.
- [x] 3.3 Atualizar `views.py` e `serializers.py` para usar `DeepSeekClient`, remover o header de token customizado e reduzir o status a `{configured}`.
- [x] 3.4 Reescrever os testes do assistente (payload DeepSeek, remoção de mensagem duplicada, fallback sem chave).

## 4. Limpeza da API no frontend

- [x] 4.1 Remover o armazenamento do token Antigravity, o header customizado, `getAssistantStatus` e o tipo `AssistantStatus` de `client.ts`/`types.ts`.
- [x] 4.2 Atualizar o texto de erro do Clippit para não citar provedor/credenciais.

## 5. Verificação

- [x] 5.1 `cd backend && DB_ENGINE=sqlite uv run python manage.py test apps.assistant -v 2` — 6 testes OK (executado com `./.venv/Scripts/python.exe`, pois `uv` não está no PATH desta máquina).
- [x] 5.2 `pnpm lint && pnpm typecheck && pnpm build` — `tsc -b` sem erros e `vite build` OK; `eslint` sem problemas nos arquivos alterados (os 5 erros restantes são pré-existentes em `ProfilePage.tsx` e no `useEffect` de `CalendarPage.tsx`, idênticos em `HEAD`).
- [x] 5.3 Verificação em navegador headless (WebKit) com servidores locais:
  - `/home`: `Brand` renderiza `<svg>` + `<span>Impatrack</span>` com `gap-2.5 sm:gap-3`.
  - `/calendario`: ordem das seções = Calendário Acadêmico → grade mensal → Programação Semanal; navegação de semana altera o label (16–22 nov. → 09–15 nov.) e mantém 7 cards de dia.
  - Clippit: sem `Copiloto Impatrack`, sem `Online`, sem rodapé de atalhos/modelo; balão do assistente com `background-color: rgb(248, 250, 252)` e borda `rgb(226, 232, 240)`; envio de mensagem retorna a resposta de fallback (sem `DEEPSEEK_API_KEY` no ambiente de verificação).
- [x] 5.4 Greps do plano sem resultados: nenhum `Antigravity|antigravity|Gemini|gemini|oh-my-pi|.omp` em `backend/apps/assistant`/`frontend/src/components/clippit`; nenhum `DeepSeek|deepseek|DEEPSEEK|v4` em `frontend/src`; nenhum `amber|orange|yellow` em `frontend/src/components/clippit`.
