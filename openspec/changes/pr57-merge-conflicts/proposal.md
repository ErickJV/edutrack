# Proposal

## Why
O PR #57 (`ErickJV:fix-remove-ai-flashcards`, 5 commits de `KarinyAlves`, head `1739b4b`) nasceu em `9b7cddf` mas a `main` avançou 3 commits (`9b6e5ef`, `864fb83`, `737b959`), criando conflitos em 6 arquivos do frontend. Estado final desejado: merge resolvido preservando **as duas frentes** — o sistema de movimento/transições da main (classes `page-enter`, `stagger-item`, `bar-grow`, `modal-backdrop`, `modal-dialog`, `press`, `MotionPresence`, `MetricValue`, token `--ease-out-expo`) e as features do PR (livros 3D PerspectiveBook em Disciplinas, régua interativa do Pomodoro, remoção da geração de flashcards por IA em Anotações/Flashcards, renomear disciplina no modal) — com branch do PR atualizada, PR mergeável e integrado na `main`.

OpenSpec: o PR não toca `openspec/`; a main só adicionou `openspec/changes/{motion-system,auth-theme-transitions,login-brand-offset,brand-text-only}`, que o merge carrega sem conflito. Nenhum artefato OpenSpec será criado, arquivado ou editado nesta tarefa.

Conflitos (confirmados com `git merge-tree`): `SubjectEditModal.tsx` (2 hunks), `FlashcardsPage.tsx` (1), `SubjectsPage.tsx` (5), `styles.css` (1). `PomodoroTimer.tsx`, `StudyNotesWorkspace.tsx`, `tsconfig.app.json`, `vite.config.ts` fazem merge textual limpo (hunks da main caem em contexto idêntico ao base — verificado) e só precisam de revisão. `perspective-book.tsx` e `lib/utils.ts` são arquivos novos, sem conflito.

## What Changes
- `git fetch origin` (garante `origin/main` em `737b959` e `origin/fix-remove-ai-flashcards` em `1739b4b`).
- Criar branch local a partir do PR: `git switch -c fix-remove-ai-flashcards origin/fix-remove-ai-flashcards`.
- `git merge origin/main` — deve parar com conflito nos 4 arquivos abaixo. Se aparecer conflito em outro arquivo, ele é tratado com a regra geral "manter as duas frentes" (nunca escolher só um lado) e registrado no commit.
- Imports: manter o lado `.our` (`MotionPresence` + `MetricValue`), sem a linha em branco conflitante. O import `PerspectiveBook` (`@/components/perspective-book`) e os helpers `getProfessorDisplay`/`BOOK_COVER_STYLES` do PR vêm do merge automático.
- Loading/return: remover o `if (loading) return <PageLoader />` do PR; manter o loading por `MotionPresence` da main e adicionar `overflow-x-hidden` do PR ao `<main>`:
- ção de métricas: manter os 3 `<article>` da main (`stagger-item card-lift`, `animationDelay` 0/45/90ms, `MetricValue`), mas com o className condicional do PR:
- Lista: manter a assinatura e classes da main — `activeSubjects.map((item, index) =>`, `className="stagger-item card-lift rounded-3xl ..."`, `style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}`.
- Barra de progresso: manter a versão da main com `bar-grow`:
- conteúdo de `origin/main:frontend/src/styles.css` (inclui `--ease-out-expo` em `:root` e o bloco "SISTEMA DE MOVIMENTO — TRANSICIONES DE ROTA, OVERLAYS, LISTAS E MÉTRICAS", terminando no `}` do `@media (prefers-reduced-motion: reduce)`);
- uma linha em branco;
- conteúdo de `origin/fix-remove-ai-flashcards:frontend/src/styles.css` a partir da linha 258 (`/* ====...` do cabeçalho "POMODORO TIME SCRUBBER — RÉGUA INTERATIVA COM MOLA E DÍGITOS ROLANTES") até o EOF, com o `@media (prefers-reduced-motion: reduce)` do `.tms-strip` fechado.
- `/disciplinas`: `document.querySelectorAll('[aria-label="Livros das disciplinas ativas"] h2').length === 3`; screenshot mostra 3 livros 3D; não existe o texto "Minhas disciplinas"; os 3 cards de métrica têm `stagger-item`; nenhum erro no console.
- `/disciplinas`: clicar "Editar" no primeiro card → o dialog tem `modal-dialog`, o backdrop `modal-backdrop`, e existe `input[name="subject_name"]` com `value` = nome da disciplina; fechar.
- `/estudo`: `.tms` e `.tms-ruler` existem; o display de tempo muda após alguns segundos; abrir engrenagem → dialog "Configurar Pomodoro" tem `modal-dialog`.
- `/flashcards`: nenhum botão cujo texto case `/Gerar.*IA/i`; a página renderiza sem erro.
- `/estudo` (aba Anotações): nenhum texto "Gerar Flashcards com IA".
- `git add` apenas os arquivos resolvidos (`SubjectEditModal.tsx`, `FlashcardsPage.tsx`, `SubjectsPage.tsx`, `styles.css`) e `git commit --no-edit` (usa a mensagem do merge).
- `grep -rn '<<<<<<<' frontend/src` deve sair vazio antes do push.
- `git push origin fix-remove-ai-flashcards` (o PR #57 volta a `mergeable: true`).
- `git switch main && git merge --no-ff fix-remove-ai-flashcards -m "Merge pull request #57 from ErickJV/fix-remove-ai-flashcards"`.
- `git push origin main`.
- Confirmar via API `https://api.github.com/repos/ErickJV/edutrack/pulls/57`: `state` `closed` com `merged_at` preenchido. Se continuar `open`, o merge foi feito mas o GitHub não vinculou: reportar e não inventar merge pela API sem token.

## Capabilities

### New Capabilities
- `pr57-merge-conflicts`: Implements capabilities and behavior for PR #57 — resolver conflitos com a main e integrar

### Modified Capabilities

## Impact
- `frontend/src/pages/SubjectsPage.tsx` — imports (11-13), `return`/loading (53-57), seção de métricas (95-117), mapa da lista (153-158), barra de progresso (178-180); base do merge (`theirs`) tem o banner de livros e helpers nas linhas 1-75.
- `frontend/src/components/SubjectEditModal.tsx` — `updateStudentSubject` (185), bloco "Disciplina da matriz" (239-250); `current` definido em ~79.
- `frontend/src/pages/FlashcardsPage.tsx` — bloco do modal de IA (~998-1148 na main), imediatamente antes de `{/* Modal de Criar / Editar Flashcard Manual */}`.
- `frontend/src/styles.css` — fim de arquivo: bloco novo da main começa em "SISTEMA DE MOVIMENTO" (~257); bloco do PR começa na linha 258 da versão do PR.
- `frontend/src/components/PomodoroTimer.tsx` / `StudyNotesWorkspace.tsx` — merge limpo; usar apenas para conferência das classes de movimento (não editar).
