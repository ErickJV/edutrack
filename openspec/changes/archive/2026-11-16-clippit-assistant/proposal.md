# Proposal

## Why
Os estudantes do EduTrack possuem diversas informações acadêmicas dispersas entre disciplinas, tarefas pendentes, controle de faltas, calendário de avaliações e metas de leitura. A plataforma necessita de um assistente inteligente proativo e carismático, inspirado no clássico Clippit (Clippy) dos anos 90 com a roupagem nostálgica do projeto de Felix Rieseberg (janela Windows 98 via 98.css, animações originais e balões de diálogo). A IA utilizará o modelo **Gemini 3.8 Flash** via **Google Antigravity OAuth** (com suporte híbrido via `.env` e override no próprio Clippy), injetando no prompt exclusivamente o contexto do estudante autenticado (disciplinas ativas, faltas, prazos, notas e leituras) com isolamento rigoroso entre usuários.

## What Changes
- **Novo Módulo Backend (`backend/apps/assistant/`)**:
  - `context.py`: Função `get_student_academic_context(user: User)` que sintetiza o perfil cadastral, disciplinas em andamento, faltas, tarefas pendentes/atrasadas, provas agendadas e leituras ativas exclusivamente do usuário autenticado (`request.user`).
  - `antigravity.py`: Cliente de integração com o gateway unificado do Google Antigravity (`https://cloudcode-pa.googleapis.com/v1internal:generateContent` / `streamGenerateContent`), operando com o modelo `gemini-3.8-flash`, cabeçalhos oficiais de cliente Antigravity e autenticação OAuth2 (com renovação automática via `refresh_token` ou token direto provido via header/configuração).
  - `views.py` e `serializers.py`: Endpoints REST protegidos:
    - `POST /api/v1/assistant/chat`: Envio de mensagens com histórico, injeção de contexto acadêmico isolado e retorno da resposta com estado de animação (`thinking`, `writing`, `congratulate`, `alert`).
    - `GET /api/v1/assistant/context`: Visualização do contexto sintetizado do aluno para auditoria e depuração.
    - `GET /api/v1/assistant/status`: Verificação do status de configuração das credenciais do Antigravity.
  - Registro da aplicação em `backend/edutrack/settings.py` e rotas em `backend/edutrack/urls.py`.
  - Configurações em `.env.example` para `ANTIGRAVITY_ACCESS_TOKEN`, `ANTIGRAVITY_REFRESH_TOKEN`, `ANTIGRAVITY_CLIENT_ID`, `ANTIGRAVITY_CLIENT_SECRET` e `ANTIGRAVITY_PROJECT_ID`.
- **Assets de Animação do Clippit (`frontend/public/clippy/`)**:
  - Disponibilização dos arquivos de animação do Clippit extraídos dos sprites originais da Microsoft (WebP/PNG transparentes): `restpose`, `idle`, `thinking`, `writing`, `searching`, `explain`, `alert`, `congratulate`, `wave`, `getattention`, `hearing`.
  - Mapeamento tipado de animações e durações com fallback em SVG/CSS integrado.
- **Componentes do Clippit no Frontend (`frontend/src/components/clippit/`)**:
  - `ClippitFloatingWidget.tsx`: Ícone flutuante interativo ancorado no canto inferior direito (`bottom-6 right-6`), com balão de fala proativo, alternância de animações ao clicar/passar o mouse e gatilho para abrir a janela principal.
  - `ClippitWindow.tsx`: Janela retro estilo Windows 98 (Felix Rieseberg) com barra de título azul clássica (`Clippit - Assistente EduTrack`), botões de minimizar e fechar, avatar animado do Clippy sincronizado com o ciclo de resposta da IA, histórico de mensagens com markdown, botões de atalho acadêmico rápido ("O que estudar hoje?", "Próximas provas", "Minhas faltas", "Tarefas atrasadas") e modal de configurações para override de token Antigravity.
  - `ClippitAnimation.tsx`: Renderizador de sprites e animações com controle de ciclo de vida (`play`, loop de `idle`, fallback).
- **Integração Global no Frontend (`frontend/src/App.tsx`)**:
  - Inclusão do `ClippitFloatingWidget` dentro da rota autenticada (`ProtectedRoute`), tornando o assistente acessível em todas as páginas do sistema (`/home`, `/disciplinas`, `/tarefas`, `/estudo`, `/perfil`).
- **Cliente de API Frontend (`frontend/src/api/client.ts` & `frontend/src/api/types.ts`)**:
  - Adição dos métodos `sendAssistantChat`, `getAssistantContext` e `getAssistantStatus`.

## Capabilities

### New Capabilities
- `clippit-assistant`: Implements capabilities and behavior for Clippit Assistant (Felix Rieseberg Style) com Gemini 3.8 Flash via Antigravity OAuth

### Modified Capabilities

## Impact
1. `backend/apps/assistant/context.py`: Responsável por construir o payload de contexto acadêmico estritamente isolado para `request.user`.
2. `backend/apps/assistant/antigravity.py`: Cliente de comunicação com `cloudcode-pa.googleapis.com` (Gemini 3.8 Flash via Antigravity OAuth2).
3. `backend/apps/assistant/views.py`: Endpoints REST (`AssistantChatView`, `AssistantContextView`, `AssistantStatusView`).
4. `frontend/src/components/clippit/ClippitWindow.tsx`: Interface gráfica retro estilo Windows 98 / Felix Rieseberg com chat, botões de ação e avatar animado.
5. `frontend/src/components/clippit/ClippitFloatingWidget.tsx`: Widget flutuante no canto inferior direito que orquestra estados e visibilidade.

---
