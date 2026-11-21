# Proposal

## Why
The app header currently shows only the Impatrack tile icon, with no wordmark. Clippit still authenticates through local OAuth credentials discovered from `oh-my-pi`, exposes provider/model text in the UI, and uses an amber/cream visual palette. This change adds the wordmark, switches Clippit's backend to a server-side DeepSeek API key, removes the three unwanted Clippit UI elements, and replaces the amber palette with white/slate surfaces and the existing teal accents. No provider or model name is shown to end users.

## What Changes
- Add the `Impatrack` wordmark to the shared `Brand` component, immediately right of the existing SVG icon.
- Replace the previous transport module with `backend/apps/assistant/deepseek.py`: server-side `DEEPSEEK_API_KEY`, OpenAI-compatible `POST https://api.deepseek.com/chat/completions`, no local credential discovery, no custom token header.
- Remove the `Copiloto Impatrack` badge, the `Online` pill, and the chat footer from `ClippitWindow`.
- Replace amber/cream styling in the Clippit window, floating balloon, and chat bubbles with white/slate surfaces and teal accents.
- Remove provider/model wording from assistant errors, status payloads, and frontend API helpers.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `clippit-assistant`: autenticação por chave de API do servidor e janela limpa.
- `icone-marca-impatrack`: wordmark `Impatrack` visível ao lado do ícone da marca.

## Impact
- `frontend/src/components/Brand.tsx` — `Brand` component: add the wordmark span and gap; all headers inherit it.
- `frontend/src/components/clippit/ClippitWindow.tsx` — title bar ~235, hero ~270–296, quick actions ~313, assistant bubbles ~336–358, footer ~380–390.
- `frontend/src/components/clippit/clippy.css` — `.office97-speech-balloon` and `.clippy-bubble-assistant` light/dark rules.
- `backend/apps/assistant/deepseek.py` — new transport/client; replaces the previous transport module.
- `frontend/src/pages/CalendarPage.tsx` — nenhuma mudança: a ordem `Programação Semanal` → grade mensal foi mantida.
