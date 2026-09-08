## Why

O usuário quer acompanhar notas, faltas e situação por disciplina no EduTrack, usando o boletim apresentado como referência. Como não conhece as regras de composição de MAP/APs, substitutiva e bônus, autorizou expressamente deixá-las configuráveis até informar regras fixas.

## What Changes

- Criar boletim pessoal dentro de Disciplinas com avaliações, notas pendentes, média parcial/final calculada e situação estimada.
- Oferecer modelos editáveis Com PAI (MAP 30%, PR 50%, PAI 20%) e Sem PAI (MAP 50%, PR 50%), baseados no quadro fornecido, sem tratá-los como regra universal verificada.
- Permitir configurar como AP1/AP2/outras APs compõem MAP, a aplicação de SUB, bônus, escala, média mínima, arredondamento e frequência mínima. Sem regra escolhida, mostrar pendência e preservar notas sem inventar cálculo.
- Separar ausência de nota de nota zero; explicar cálculo e notas necessárias quando houver dados suficientes.
- Acompanhar TF por total manual declarado ou por faltas registradas no calendário, com escolha explícita da origem e sem somar duas vezes.
- Adicionar unidades de frequência por encontro de aula; não assumir que um encontro corresponde a uma falta ou converter minutos automaticamente.
- Mostrar limite de faltas conforme total de unidades e frequência mínima, saldo/excesso e cobertura dos registros. Progresso das aulas permanece aulas ocorridas / aulas totais; frequência e notas são medidas distintas.
- Guardar a configuração por disciplina, com revisão para alterações futuras, sem sobrescrever notas ou políticas existentes ao atualizar um modelo.

## Capabilities

### New Capabilities

- `grading-policies`: modelos e regras declarativas de avaliação por disciplina.
- `student-gradebook`: lançamento de notas, cálculo transparente e situação estimada.
- `absence-budget`: limite, saldo e situação de faltas em unidades declaradas.

### Modified Capabilities

- `class-attendance`: unidades de frequência por ocorrência e integração com o boletim, preservando os registros e contadores existentes.

Dependência técnica: implementar e sincronizar `personalizar-rotina-academica` antes desta mudança. A base `class-attendance` está nessa proposta, ainda não em `openspec/specs`; os deltas novos não autorizam sobrescrevê-la nem arquivá-la automaticamente. `completar-requisitos-academicos` continua prioridade pedagógica anterior, mas o boletim não depende de seus relatórios/analytics. Ordem recomendada: personalização → requisitos do professor → boletim.

## Impact

- Backend/banco: regras versionadas, avaliações e notas por matrícula, unidades de frequência, origem de TF e resumo calculado. Migrações aditivas e testes de precisão decimal em MSSQL.
- Frontend: seção Boletim no detalhe da disciplina, configuração guiada, edição de notas/faltas e visão resumida nas disciplinas; reutilizar temas e calendário.
- APIs: recursos privados em `/api/v1/student-subjects/{id}/...` e extensão compatível do registro de frequência; OpenAPI e tipos sincronizados.
- Segurança/privacidade: notas e faltas somente do próprio aluno, sessão/CSRF existentes, 404 para ids alheios/inexistentes. Não importar RA, nome, turma ou valores pessoais do exemplo para fixtures/seeds. Sem mudança na autenticação ou enumeração de contas.
- Operação: nenhuma dependência, serviço, integração externa, credencial ou consulta online nova. Cálculo local ao backend, sem executar expressões fornecidas pelo usuário.

## Non-goals

- Histórico oficial, scraping autenticado do portal, sincronização de notas, aprovação institucional ou validação de regulamento.
- Inferir regras desconhecidas de MAP, SUB ou bônus; fórmulas arbitrárias executáveis; notas compartilhadas entre colegas.
- Alterar progresso temporal ou por tarefas para usar notas; mudar escopo das demais propostas; implementar IA, chat ou caderno nesta mudança.

## Evidência e escolhas autorizadas

O quadro enviado informa média mínima 6,0, frequência mínima 75%, dois conjuntos de pesos e limites de faltas 36→9, 40→10, 72→18, 80→20, 120→30 e 160→40. Esses números são referência fornecida pelo usuário, não verificação independente; carga e unidade devem ser confirmadas por disciplina. O usuário respondeu que não conhece as regras restantes e quer configuração até esclarecer. A proposta usa modelos sugeridos, com regras desconhecidas desativadas/pendentes e confirmação explícita do aluno antes do cálculo de situação.
