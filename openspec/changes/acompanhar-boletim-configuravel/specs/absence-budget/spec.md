## Purpose

Mostrar limite e saldo de faltas em unidades explicitamente declaradas pelo estudante, distinguindo registro parcial de um total informado e evitando contagem duplicada.

## ADDED Requirements

### Requirement: Configuração de unidades e origem de TF
`GET|PUT /api/v1/student-subjects/{id}/absence-policy` MUST ler/salvar `total_units` inteiro 1–2000, `minimum_attendance_percent` decimal 0–100, `source=manual|calendar`, revisão e confirmação do aluno. A carga horária pessoal pode preencher uma sugestão de total_units, mas somente confirmação a torna base do cálculo; alterações posteriores da carga MUST indicar divergência, nunca sobrescrever unidades confirmadas. Padrão sugerido de frequência mínima é 75%, editável.

No modo manual, `manual_absences` inteiro 0–total_units, `as_of` data não futura e `complete` booleano são obrigatórios; complete confirma que o total cobre até as_of, não que o semestre terminou. No modo calendar, TF deriva somente de ocorrências válidas com unidades/faltas conhecidas; não somar total manual. Trocar fonte MUST preservar ambos os conjuntos para futura revisão, substituir a origem usada no cálculo e indicar a mudança.

Rotas MUST exigir sessão, CSRF e propriedade, retornando 200 no sucesso, 400 para dados inválidos, 401/403 para sessão/CSRF, 404 alheio/inexistente e 409 para revisão desatualizada.

#### Scenario: Informar faltas vistas no portal
- **WHEN** o aluno define 80 unidades, 75%, fonte manual e TF=2 na data atual
- **THEN** vê limite 20 e saldo 18 na data informada, sem adicionar novamente as faltas do calendário.

#### Scenario: Origem trocada
- **WHEN** o aluno muda para calendário com três unidades de falta registradas
- **THEN** TF usado passa a três, não cinco, e o total manual anterior continua guardado como informação inativa.

### Requirement: Limite e cobertura
O sistema MUST calcular `allowed_absences=floor(total_units × (1−minimum_attendance_percent/100))`, `remaining=max(0,allowed−TF)` e `excess=max(0,TF−allowed)`. A igualdade TF=limite ainda atende ao limiar. MUST exibir `projected_attendance=100×(total_units−TF)/total_units` como projeção se não houver novas faltas, nunca como frequência registrada atual. Sem configuração, mostrar cálculo indisponível. Usar precisão decimal; exibição arredondada não decide o limiar.

No modo calendar, faltas conhecidas dão saldo provisório; ocorrências passadas sem estado/unidades geram pendência e não viram zero. Para concluir frequência do semestre, todas as ocorrências válidas precisam de unidades conhecidas, soma igual ao total declarado e, após encerramento, estados conhecidos. Soma incompatível MUST sinalizar divergência e impedir conclusão, sem redistribuir faltas automaticamente. No modo manual, conclusão exige complete=true e as_of no fim do semestre ou depois, além de fim já ocorrido. TF acima do limite é alerta mesmo com dados incompletos.

#### Scenario: Limites do quadro de referência
- **WHEN** mínimo configurado é 75% e totais declarados são 36, 40, 72, 80, 120 e 160
- **THEN** os limites são respectivamente 9, 10, 18, 20, 30 e 40.

#### Scenario: Falta no limite ou acima
- **WHEN** total é 40 e TF muda de 10 para 11
- **THEN** o primeiro atende ao mínimo com saldo zero; o segundo excede em uma unidade.

#### Scenario: Cobertura incompleta
- **WHEN** uma aula passada está sem frequência ou sem unidades
- **THEN** TF conhecido e saldo aparecem como provisórios, há pendência explícita e não é emitida conclusão de frequência suficiente.
