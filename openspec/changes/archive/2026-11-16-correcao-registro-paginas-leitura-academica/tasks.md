## 1. Backend: Correção e Tolerância no Endpoint de Log de Páginas

- [x] 1.1 Atualizar `AcademicReadingLogPagesView` em `backend/apps/academic/views.py` para aceitar `pages` ou `pages_read` e `date` ou `read_date`.
- [x] 1.2 Implementar acumulação aditiva de páginas lidas no mesmo dia no modelo `ReadingLog`.
- [x] 1.3 Adicionar testes de API em `backend/tests/test_academic_reading_api.py` validando payload `{pages: 10}` e múltiplos registros no mesmo dia.

## 2. Frontend: Ajuste no Cliente HTTP e Utilitários de Estatísticas

- [x] 2.1 Ajustar `logReadingPages` em `frontend/src/api/client.ts` para enviar payload com compatibilidade bilateral.
- [x] 2.2 Atualizar `frontend/src/api/types.ts` e `frontend/src/utils/readingStats.ts` para leitura flexível de `date` ou `read_date`.
- [x] 2.3 Melhorar tratamento de erro e feedback visual em `StudySessionPage.tsx`.

## 3. Validação e Qualidade

- [x] 3.1 Executar testes do backend (`$env:DB_ENGINE="sqlite"; uv run pytest -q`).
- [x] 3.2 Executar testes do frontend (`pnpm test --run`).
- [x] 3.3 Validar registro de páginas e atualização de streak no navegador.
