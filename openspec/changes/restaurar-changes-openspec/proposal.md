# Proposal

## Why
No commit `c56cfd9b2396934daa623b4ecbe86f79091ff5e9`, a pasta `openspec/` foi excluída e adicionada ao `.gitignore` na tentativa de manter diretórios locais por usuário, resultando na perda de 13 changes de sprints anteriores e das especificações base do sistema. Atualmente, o repositório contém 4 changes recentes (`aba-meu-perfil-e-navegacao`, `remover-modulo-professores`, `clippit-assistant` e `student-profile-tab`) e um `config.yaml` atualizado para o stack nativo e workflow enxuto. O objetivo é recuperar os 13 changes antigos e as 3 especificações base do commit imediatamente anterior (`31ed279`), remover o bloqueio de rastreamento do `.gitignore` e consolidar todas as 17 changes e especificações no branch ativo sem sobrescrever as alterações recentes.

## What Changes
- **Remover ignoramento de `openspec/` no `.gitignore`**
- **Restaurar os 13 changes legados a partir do commit `31ed279`**
- **Restaurar especificações base (`openspec/specs/`) a partir do commit `31ed279`**
- **Preservar artefatos recentes e atualizar índice do Git**

## Capabilities

### New Capabilities
- `restaurar-changes-openspec`: Implements capabilities and behavior for Restaurar Changes e Specs do OpenSpec Mantendo Versão Atual

### Modified Capabilities

## Impact
- `.gitignore`: linha 11 (`openspec/`), remover para destravar o rastreamento das changes pelo Git.
- `openspec/config.yaml`: raiz do OpenSpec; MUST permanecer idêntico ao `HEAD` atual (configuração para sprints ágeis, pt-BR e PostgreSQL).
- `openspec/changes/`: diretório central de propostas e tarefas; conterá os 17 changes após a restauração.
- `openspec/specs/`: especificações de capacidades; conterá `academic-curriculum`, `student-dashboard` e `study-tasks`.
