# Proposal

## Why
O usuário pediu, numa alteração anterior, para reduzir o "DPI" da página Início porque os elementos estavam grandes. O ajuste foi feito no commit `c2cccc1` e depois ampliado pelos commits `e78c498`/`66b149c` (novo dashboard tokenizado). Apenas a Home e o shell receberam a escala compacta; Calendário, Tarefas, Anotações, Flashcards, Disciplinas e Perfil continuam na escala antiga (`text-2xl/3xl`, KPIs `text-3xl`, cartões `rounded-3xl`/`rounded-[2rem]` com `p-5/6/8`, botões `min-h-11/12`).

Estado final: as sete abas autenticadas usam os mesmos tamanhos de título, texto, cartão, raio, espaçamento e botão da Home atual. Cores, bordas, sombras, estrutura e contratos de API não mudam.

## What Changes
- Normalizar a escala tipográfica e de espaçamento de `CalendarPage`, `TasksPage`, `SubjectsPage`, `FlashcardsPage`, `ProfilePage`, `StudySessionPage` e dos componentes de anotações/perfil, usando como referência a Home atual.
- Compactar os overlays abertos dentro dessas abas (`TaskFormModal`, `SemesterSelectionModal`, `SubjectEditModal`, modais de evento/importação do calendário, modal de flashcard, `ScheduleConfig`, `ReadingModal`, `LogPagesModal`).
- Manter inalterados: frente/verso dos flashcards, corpo do caderno (`text-base` com linhas de 32px), capas 3D (`PerspectiveBook`), mostrador do Pomodoro (`.tms-time`), emojis decorativos, grade mensal do calendário e `FormControls`/`Feedback` compartilhados com autenticação.
- Nenhuma alteração de backend, API, rotas, estado ou tokens de cor.

## Capabilities

### New Capabilities
- `densidade-compacta-abas`: Implements capabilities and behavior for Densidade compacta em todas as abas autenticadas

### Modified Capabilities

## Impact
- `frontend/src/pages/HomePage.tsx` — referência visual viva (container, gaps, tokens); não editar.
- `frontend/src/components/dashboard/MetricCard.tsx` — referência de KPI (25 px, `p-[14px]`) e rótulo (10 px).
- `frontend/src/components/dashboard/WeeklyActivity.tsx` / `SubjectBooks.tsx` — referência de cartão 17 px e título de item 13 px.
- `frontend/src/components/layout/AppLayout.tsx` / `Topbar.tsx` — moldura e título global; não editar.
- `frontend/src/pages/FlashcardsPage.tsx:603-677` — faces e pergunta/resposta; zona de exceção.
