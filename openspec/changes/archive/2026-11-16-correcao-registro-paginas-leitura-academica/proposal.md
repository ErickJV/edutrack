## Why

Ao clicar no botão de avanço rápido "+10 págs" ou tentar registrar páginas lidas através do modal de leitura na aba "Leitura Acadêmica", a aplicação exibia a mensagem de erro *"Erro ao registrar páginas na leitura"*.

Isso ocorria devido a uma incompatibilidade de contrato entre o payload enviado pelo frontend (`{ pages, read_date }`) e os parâmetros estritos exigidos pelo endpoint backend `POST /api/v1/academic-readings/<id>/log/` (`pages_read` e `date`), além de sobreposição incorreta de páginas lidas no mesmo dia e divergência de nomenclatura de campo no utilitário de cálculo de sequência diária (*streak*).

## What Changes

- **Harmonização do Endpoint de Registro de Páginas**:
  - Aceitar tanto `pages_read` quanto `pages` no payload de entrada da view `AcademicReadingLogPagesView`.
  - Aceitar tanto `read_date` quanto `date` no payload de entrada da view.
  - Ajustar a persistência em `ReadingLog` para acumular páginas lidas quando o aluno registrar múltiplos blocos de leitura no mesmo dia (soma incremental em vez de sobrescrever).
- **Adequação no Cliente HTTP e Tipagens do Frontend**:
  - Ajustar `logReadingPages` em `frontend/src/api/client.ts` para enviar payload com compatibilidade total (`pages_read`, `pages`, `date`, `read_date`).
  - Suportar tanto `date` quanto `read_date` na tipagem `ReadingLog` e no utilitário `calculateReadingSummary`.
  - Exibir a mensagem detalhada de erro retornada pela API caso ocorra falha de validação no frontend.

## Capabilities

### Modified Capabilities
- `study-tasks`: Especifica o comportamento do endpoint de registro de páginas de leitura acadêmica, garantindo suporte aos campos de páginas e datas e acumulação diária progressiva de páginas lidas.

## Impact

- **Backend**:
  - `backend/apps/academic/views.py`: `AcademicReadingLogPagesView` atualizada para suportar os formatos e soma diária.
  - `backend/tests/test_academic_reading_api.py`: Testes adicionais cobrindo envio de `pages` / `pages_read`, datas e múltiplos registros no mesmo dia.
- **Frontend**:
  - `frontend/src/api/client.ts`: `logReadingPages` normalizado.
  - `frontend/src/api/types.ts`: `ReadingLog` com `date` e `read_date`.
  - `frontend/src/utils/readingStats.ts`: leitura de `log.date || log.read_date`.
  - `frontend/src/pages/StudySessionPage.tsx`: exibição de erros amigáveis ao usuário.
