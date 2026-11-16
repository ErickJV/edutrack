# Tasks

## 1. Implementation

- [x] 1.1 1. **Remover ignoramento de `openspec/` no `.gitignore`** and verify changes

## 2. Verification

- [x] 2.1 **Validação do CLI do OpenSpec**:
- [x] 2.2 Executar `openspec status --all`.
- [x] 2.3 Esperado: listagem de todos os 17 changes válidos sob o schema `spec-driven` sem falhas de sintaxe ou referências corrompidas.
- [x] 2.4 **Integridade do `config.yaml`**:
- [x] 2.5 Executar `git diff HEAD -- openspec/config.yaml`.
- [x] 2.6 Esperado: saída vazia (nenhuma alteração no arquivo de configuração atual).
- [x] 2.7 **Conferência de presença dos 4 changes recentes**:
- [x] 2.8 Verificar existência de `openspec/changes/aba-meu-perfil-e-navegacao/proposal.md`, `remover-modulo-professores/proposal.md`, `clippit-assistant/proposal.md` e `student-profile-tab/proposal.md`.
- [x] 2.9 **Inspeção do status do Git**:
- [x] 2.10 Executar `git status --short openspec/ .gitignore`.
- [x] 2.11 Esperado: `.gitignore` modificado e todas as pastas de `openspec/changes` e `openspec/specs` preparadas/visíveis para versionamento.
