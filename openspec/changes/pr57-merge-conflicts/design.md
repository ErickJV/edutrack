# Design

## Context
O PR #57 (`ErickJV:fix-remove-ai-flashcards`, 5 commits de `KarinyAlves`, head `1739b4b`) nasceu em `9b7cddf` mas a `main` avançou 3 commits (`9b6e5ef`, `864fb83`, `737b959`), criando conflitos em 6 arquivos do frontend. Estado final desejado: merge resolvido preservando **as duas frentes** — o sistema de movimento/transições da main (classes `page-enter`, `stagger-item`, `bar-grow`, `modal-backdrop`, `modal-dialog`, `press`, `MotionPresence`, `MetricValue`, token `--ease-out-expo`) e as features do PR (livros 3D PerspectiveBook em Disciplinas, régua interativa do Pomodoro, remoção da geração de flashcards por IA em Anotações/Flashcards, renomear disciplina no modal) — com branch do PR atualizada, PR mergeável e integrado na `main`.

OpenSpec: o PR não toca `openspec/`; a main só adicionou `openspec/changes/{motion-system,auth-theme-transitions,login-brand-offset,brand-text-only}`, que o merge carrega sem conflito. Nenhum artefato OpenSpec será criado, arquivado ou editado nesta tarefa.

Conflitos (confirmados com `git merge-tree`): `SubjectEditModal.tsx` (2 hunks), `FlashcardsPage.tsx` (1), `SubjectsPage.tsx` (5), `styles.css` (1). `PomodoroTimer.tsx`, `StudyNotesWorkspace.tsx`, `tsconfig.app.json`, `vite.config.ts` fazem merge textual limpo (hunks da main caem em contexto idêntico ao base — verificado) e só precisam de revisão. `perspective-book.tsx` e `lib/utils.ts` são arquivos novos, sem conflito.

## Goals / Non-Goals
**Goals:**
- Implement PR #57 — resolver conflitos com a main e integrar cleanly and reliably

**Non-Goals:**
- Scope outside the core requirements of PR #57 — resolver conflitos com a main e integrar

## Decisions
Follow standard modular design conventions for PR #57 — resolver conflitos com a main e integrar.
- Ensure clean cutover without redundant backward-compatibility shims.
- Reuse existing project utilities and patterns.

## Risks / Trade-offs
[Unforeseen edge cases or regression] → Mitigation: Comprehensive end-to-end and unit verification tests.
