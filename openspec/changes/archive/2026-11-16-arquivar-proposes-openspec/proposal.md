# Proposal

## Why
`openspec/changes/` tem 26 changes pendentes; `openspec list` marca 20 como `✓ Complete` e 6 como incompletos. O pedido: arquivar os concluídos — mover cada um para `openspec/changes/archive/AAAA-MM-DD-<slug>/`, sincronizar `openspec/specs/` com os deltas e commitar o resultado. O pedido inclui `icone-marca-impatrack` mesmo estando `0/7 tasks`: a implementação (Brand só-ícone, `frontend/public/favicon.svg`, favicon na aba) já foi executada e verificada. Total a arquivar: **21 changes**; 5 ficam pendentes.

Estado de descoberta (verificado nesta sessão):

- `openspec` 1.14.3 em `C:\Users\nyeer\AppData\Roaming\npm\openspec` (já no PATH).
- `openspec validate --changes` → `Totals: 26 passed, 0 failed`; `openspec validate --specs` → `Totals: 4 passed, 0 failed`.
- Specs principais hoje: `academic-curriculum` (3 reqs), `perfil-configuracoes-e-dependabot` (1), `student-dashboard` (3), `study-tasks` (4).
- Dois findings `Archive would refuse`: `acompanhar-boletim-configuravel` (fica pendente, fora de escopo) e `gestao-academica-e-estudos` — este com as 10 requirements já presentes em `openspec/specs/` (academic-curriculum 3/3, student-dashboard 3/3, study-tasks 4/4, headers idênticos). Só esse precisa de `--skip-specs`.
- `corrigir-origem-csrf-e2e` declara `skip_specs: true` no `.openspec.yaml`; o CLI já ignora deltas dele.

## What Changes
- Implement Arquivar os proposes concluídos do OpenSpec
- Add verification tests and documentation updates

## Capabilities

### New Capabilities
- `arquivar-proposes-openspec`: Implements capabilities and behavior for Arquivar os proposes concluídos do OpenSpec

### Modified Capabilities

## Impact
- `openspec/changes/icone-marca-impatrack/tasks.md` — 7 checkboxes a marcar (passo 1).
- `openspec/changes/icone-marca-impatrack/specs/icone-marca-impatrack/spec.md` — header e scenario com acentuação corrompida (passo 2).
- `openspec/specs/` — destino do merge de deltas; hoje 4 capabilities, deve terminar com 17.
- `openspec/changes/archive/2026-11-16-perfil-configuracoes-e-dependabot/` — exemplo do formato de destino (`.openspec.yaml`, `proposal.md`, `design.md`, `tasks.md`, `specs/<cap>/spec.md`); já arquivado, não tocar.
