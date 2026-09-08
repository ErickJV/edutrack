## Purpose

Oferecer um boletim pessoal que reúna avaliações, média e situação estimada com transparência sobre regras configuradas, notas pendentes e frequência.

## ADDED Requirements

### Requirement: Lançamento de notas e leitura privada
`GET /api/v1/student-subjects/{id}/gradebook` MUST retornar política/revisão, avaliações, notas, cálculo, pendências, resumo de faltas e situação. `PUT /api/v1/student-subjects/{id}/grades/{assessment_id}` MUST receber `score` decimal de zero a scale_max ou nulo para limpar, `expected_revision` e retornar 200 com nota/revisão. Avaliações são criadas/editadas na configuração declarativa, com ids estáveis; seu rótulo não é a identidade. Notas não lançadas MUST permanecer nulas e visíveis como pendentes, distintas de zero. Troca de política MUST preservar notas em avaliações desativadas, consultáveis em histórico e excluídas do cálculo atual.

Todas as rotas MUST usar sessão, CSRF nas mutações e propriedade da matrícula/avaliação: 401 anônimo, 403 CSRF, 404 alheio/inexistente, 400 nota inválida, 409 revisão conflitante. Matrícula arquivada permite leitura, exigindo reativação para editar. Não expor RA ou notas em logs, links públicos ou respostas de terceiros.

#### Scenario: Nota zero e nota pendente
- **WHEN** AP1 recebe zero e AP2 não foi lançada
- **THEN** AP1 conta como nota registrada e AP2 como pendência, sem afirmar média final completa.

#### Scenario: Editar avaliação alheia
- **WHEN** um aluno envia nota para assessment_id de outro aluno, mesmo sob sua própria matrícula
- **THEN** recebe 404 e nenhuma nota é alterada.

### Requirement: Cálculo transparente e simulação
O boletim MUST calcular a soma de componentes finais normalizados por peso/100, resolvendo MAP e SUB conforme política e somando bônus somente no modo configurado. MUST retornar contribuição conhecida, peso conhecido, pendências e média final nula enquanto houver regra unset, política não confirmada ou nota efetiva obrigatória ausente. Bônus habilitado não informado é pendente; disabled é excluído. Com dados completos, limitar a média à escala e aplicar política de arredondamento/comparação. Não usar renormalização dos pesos conhecidos como média final.

Para uma única avaliação folha pendente com peso efetivo positivo, sem substituição pendente nem regra desconhecida, MUST mostrar nota mínima necessária respeitando escala, teto e arredondamento. Para várias pendências, mostrar faixa mínima/máxima possível sob a política configurada e avisar que falta definir distribuição de notas; não inventar uma solução única. Simulações MUST ser distintas dos valores salvos.

#### Scenario: Cálculo completo com PAI
- **WHEN** a política confirmada usa MAP=7, PR=6, PAI=8 com pesos 30/50/20, SUB e bônus desativados
- **THEN** a média é 6,7 e a fórmula mostra 2,1 + 3,0 + 1,6.

#### Scenario: Prova ainda pendente
- **WHEN** Sem PAI tem MAP=8 e PR pendente, média mínima 6 e regras confirmadas sem bônus/SUB
- **THEN** a contribuição conhecida é 4,0, o peso conhecido 50% e a média final é nula
- **AND** a nota mínima necessária na PR é 4,0.

#### Scenario: Arredondamento não aprova silenciosamente
- **WHEN** média bruta 5,995 é exibida como 6,00 com comparação raw e mínimo 6
- **THEN** o requisito de nota ainda não está atingido, com explicação da comparação; mudar para rounded só altera resultado por revisão explícita.

### Requirement: Situação e interface
O boletim MUST apresentar separadamente `grade_status`, `attendance_status` e situação combinada estimada, usando rótulos: Configuração pendente, Dados incompletos, Em andamento, Critérios atingidos, Abaixo da média, Limite de faltas excedido ou Abaixo da média e frequência. Só usar os quatro últimos como conclusão combinada quando semestre tiver terminado, política confirmada, notas completas e frequência suficientemente informada; antes disso, mostrar Em andamento com alertas das dimensões conhecidas. Ausência de fim de semestre impede conclusão final. Nenhum estado é histórico oficial ou aprovação garantida.

Na seção Boletim de Disciplinas, controles MUST permitir editar regras, notas e origem de faltas, ler a fórmula e acessar aulas. MUST oferecer estados carregando/vazio/erro/salvando, temas claro/escuro, teclado, foco e alvos de 44 px desde 360 px. Resumo no cartão da disciplina não substitui nem altera progresso temporal ou por tarefas.

#### Scenario: Média suficiente e excesso de faltas
- **WHEN** semestre encerrado tem média 7, carga/unidades 80, frequência mínima 75% e TF confirmado 21
- **THEN** o resumo indica nota atingida, limite de faltas excedido e situação estimada correspondente, sem afirmar aprovação pela nota isolada.

#### Scenario: Semestre em curso e dados parciais
- **WHEN** aulas ainda estão em andamento ou há notas/frequência não informadas
- **THEN** o boletim mostra fase/pendências e alertas conhecidos, sem concluir reprovação ou preencher valores ausentes com zero.
