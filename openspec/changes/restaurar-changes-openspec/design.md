# Design

## Context
No commit `c56cfd9b2396934daa623b4ecbe86f79091ff5e9`, a pasta `openspec/` foi excluída e adicionada ao `.gitignore` na tentativa de manter diretórios locais por usuário, resultando na perda de 13 changes de sprints anteriores e das especificações base do sistema. Atualmente, o repositório contém 4 changes recentes (`aba-meu-perfil-e-navegacao`, `remover-modulo-professores`, `clippit-assistant` e `student-profile-tab`) e um `config.yaml` atualizado para o stack nativo e workflow enxuto. O objetivo é recuperar os 13 changes antigos e as 3 especificações base do commit imediatamente anterior (`31ed279`), remover o bloqueio de rastreamento do `.gitignore` e consolidar todas as 17 changes e especificações no branch ativo sem sobrescrever as alterações recentes.

## Goals / Non-Goals
**Goals:**
- Implement Restaurar Changes e Specs do OpenSpec Mantendo Versão Atual cleanly and reliably

**Non-Goals:**
- Scope outside the core requirements of Restaurar Changes e Specs do OpenSpec Mantendo Versão Atual

## Decisions
Follow standard modular design conventions for Restaurar Changes e Specs do OpenSpec Mantendo Versão Atual.
- Ensure clean cutover without redundant backward-compatibility shims.
- Reuse existing project utilities and patterns.

## Risks / Trade-offs
[Unforeseen edge cases or regression] → Mitigation: Comprehensive end-to-end and unit verification tests.
