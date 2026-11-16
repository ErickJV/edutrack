# academic-calendar Spec Delta

## ADDED Requirements

### Requirement: Programação Semanal após o calendário mensal
A página `/calendario` SHALL renderizar a seção `Programação Semanal` depois do bloco `Calendário Acadêmico` e da grade mensal completa, mantendo os controles e a seleção de semana existentes.

#### Scenario: Ordem da página
- **WHEN** o aluno abre `/calendario`
- **THEN** a grade mensal aparece antes da seção semanal e nenhum controle semanal é perdido
