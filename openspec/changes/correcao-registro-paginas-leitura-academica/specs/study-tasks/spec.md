## ADDED Requirements

### Requirement: Registro Robusto de Páginas Lidas com Acumulação Diária
O endpoint `POST /api/v1/academic-readings/{id}/log` MUST aceitar o apontamento de páginas lidas suportando as chaves `pages_read` ou `pages`, e a data de leitura através de `date` ou `read_date`. Quando houver mais de um registro na mesma data para uma leitura, a quantidade de páginas DEVE ser acumulada no histórico daquele dia, e o marcador `current_page` da leitura deve ser incrementado até no máximo o total de páginas da obra (`total_pages`).

#### Scenario: Registro rápido de páginas (+10 págs)
- **WHEN** o estudante autenticado aciona o endpoint com `{"pages": 10}`
- **THEN** o sistema atualiza `current_page` somando 10 páginas (respeitando o limite `total_pages`)
- **AND** persiste ou incrementa o `ReadingLog` para a data de hoje com 10 páginas
- **AND** retorna HTTP 200 com os dados atualizados da leitura e o novo percentual de progresso.

#### Scenario: Múltiplos registros de leitura no mesmo dia
- **WHEN** o estudante registra 15 páginas pela manhã e posteriormente 20 páginas à tarde na mesma data
- **THEN** o log daquele dia totaliza 35 páginas lidas
- **AND** a meta diária e o cálculo de sequência (*streak*) refletem a soma acumulada de 35 páginas.
