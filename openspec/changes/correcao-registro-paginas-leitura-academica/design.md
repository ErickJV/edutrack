## Context

Ver `proposal.md - Why`. A discrepância entre nomes de atributos no frontend e no backend causava rejeição HTTP 400 no endpoint de log de páginas.

## Goals / Non-Goals

**Goals:**
- Garantir interoperabilidade tolerante a variações de payload (`pages_read` e `pages`; `date` e `read_date`).
- Implementar acumulação aditiva em `ReadingLog` para registros sucessivos no mesmo dia.
- Unificar o utilitário de estatísticas de leitura para suportar tanto `date` quanto `read_date`.

**Non-Goals:**
- Não alterar os modelos do banco de dados (os campos existentes `ReadingLog.date` e `ReadingLog.pages_read` já atendem plenamente).

## Decisions

### 1. Tolerância de Parâmetros na View
- **Decisão**: Na `AcademicReadingLogPagesView`, extrair `pages = request.data.get("pages_read") if request.data.get("pages_read") is not None else request.data.get("pages")` e `date_str = request.data.get("read_date") or request.data.get("date")`.
- **Acumulação Diária**: Buscar `ReadingLog` existente da data. Se já existir, somar `pages_read += pages`. Caso contrário, criar novo log com `pages_read = pages`.

## Risks / Trade-offs

- **[Risco] Compatibilidade retroativa com clientes antigos** → *Mitigação*: Manter suporte simultâneo a ambos os nomes de parâmetros.
