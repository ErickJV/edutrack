## MODIFIED Requirements

### Requirement: Consulta da Grade Curricular por Curso
O sistema MUST disponibilizar a matriz curricular do curso do aluno autenticado, ordenada por semestre recomendado e nome, com id, nome, código e carga conhecida ou nula. O sistema MUST NOT apresentar horas presumidas como oficiais nem assumir 80h quando a fonte não informa o valor.

#### Scenario: Aluno autenticado consulta a matriz do seu curso
- **WHEN** o aluno requisita `GET /api/v1/curriculum`
- **THEN** recebe 200 com disciplinas do curso vinculado ao seu perfil e `workload_hours` conhecido ou nulo
- **AND** a resposta não expõe dados de outros cursos ou dados privados de outros alunos.

#### Scenario: Usuário anônimo tenta acessar a matriz curricular
- **WHEN** uma requisição não autenticada é feita para `GET /api/v1/curriculum`
- **THEN** o sistema rejeita com HTTP 401 e mensagem de autenticação necessária.

#### Scenario: Aluno sem perfil acadêmico completo tenta acessar o currículo
- **WHEN** um usuário autenticado sem oferta vinculada requisita o currículo
- **THEN** o sistema responde 403 e orienta completar o perfil.

### Requirement: Seleção e Confirmação de Matérias Ativas do Aluno
O sistema MUST permitir selecionar matérias e semestre de referência via `POST /api/v1/student-subjects` com `subject_ids`, `semester_period` legado opcional e `term_id` opcional. MUST validar curso e propriedade do semestre; seleção repetida MUST preservar ids, tarefas, professores, carga, horários e frequência. Desmarcar MUST arquivar o vínculo, reativável, sem apagar histórico; lista vazia é permitida. Matrícula com histórico não pode ser movida para outro semestre nesta entrega (409); repetição da mesma disciplina em múltiplos semestres fica fora desta mudança.

#### Scenario: Estudante seleciona matérias ativas do semestre
- **WHEN** o estudante envia a seleção válida
- **THEN** o sistema retorna 200/201 com vínculos mantidos ou criados, novos em estado ativo
- **AND** novos vínculos sem calendário têm progresso nulo, exigindo configuração para calculá-lo.

#### Scenario: Tentativa de vincular disciplina de curso diferente
- **WHEN** o estudante envia uma disciplina de outra graduação
- **THEN** o sistema rejeita com 400 informando que ela não pertence à matriz do aluno.

#### Scenario: Ajustar seleção existente
- **WHEN** o aluno desmarca e depois reativa uma matéria com tarefas e frequência
- **THEN** recupera o mesmo vínculo e dados anteriores, sem duplicação ou exclusão em cascata.

### Requirement: Listagem e Visualização de Minhas Disciplinas na UI
A interface MUST exibir `/disciplinas` com matérias ativas, carga declarada, professor e progresso de aulas, com acesso ao detalhe editável. MUST substituir a barra baseada em tarefas por `round(100 × aulas_ocorridas / aulas_totais_validas)`; ocorrência conta após seu término no fuso configurado, canceladas não contam e reposições contam. Sem aulas, progresso é nulo e a UI mostra “Configure as aulas”. Progresso de tarefas MUST permanecer identificado separadamente.

#### Scenario: Visualização da página com disciplinas ativas
- **WHEN** o estudante acessa `/disciplinas` autenticado
- **THEN** recebe carregamento acessível seguido de cartões com carga declarada ou “Não informada”, professor ou “Não definido”, aulas ocorridas/restantes e botão de detalhes
- **AND** todos os controles têm foco visível e alvo de pelo menos 44 px.

#### Scenario: Visualização com nenhuma disciplina selecionada (estado vazio)
- **WHEN** o estudante ainda não confirmou nenhuma matéria ativa
- **THEN** a interface exibe estado vazio amigável com chamada para configurar matérias do semestre.

#### Scenario: Progresso independente de presença e tarefas
- **WHEN** seis de vinte aulas válidas terminaram, existe uma falta registrada e nenhuma tarefa concluída
- **THEN** a disciplina mostra 30%, seis ocorridas e quatorze restantes; concluir uma tarefa não altera esses valores.

#### Scenario: Limites e atualização automática
- **WHEN** o instante atual passa pelo término de uma aula, antes do início do semestre ou após todas as aulas
- **THEN** a consulta retorna respectivamente nova contagem, 0% ou 100%, sem edição manual
- **AND** a tela aberta atualiza em até um minuto e ao recuperar foco, usando o cálculo do servidor.

## ADDED Requirements

### Requirement: Personalização privada de disciplina
`GET|PATCH /api/v1/student-subjects/{id}` MUST permitir ler/editar `workload_hours` declarado (inteiro 1–2000 ou nulo para limpar), `professor_id` e `term_id`, preservando dados omitidos. Resposta 200 inclui carga pessoal, professor, `progress_percent`, `task_progress_percent`, `classes_total`, `classes_elapsed`, `classes_remaining` e frequência. Sessão e CSRF exigidos; anônimos 401, dados inválidos 400, CSRF inválido 403 e id/referência alheia 404. Arquivados não aceitam novas tarefas/aulas até reativação, mas preservam histórico.

#### Scenario: Editar carga e professor
- **WHEN** um aluno define 60h e um professor próprio
- **THEN** apenas sua matrícula muda, outros alunos e catálogo permanecem intactos
- **AND** cargas pessoais não são sobrescritas por seed/importação.

#### Scenario: Informação desconhecida e migração
- **WHEN** dados anteriores têm horas importadas sem procedência confirmada
- **THEN** permanecem rastreáveis para reversão, mas não são copiados automaticamente para a carga pessoal nem usados como horas oficiais
- **AND** telas e somatórios sinalizam informação pendente em vez de mostrar zero ou 80h presumidas.

#### Scenario: Falha de edição
- **WHEN** salvar disciplina falha ou o usuário informa carga inválida
- **THEN** o formulário preserva valores digitados, anuncia o erro e permite corrigir/tentar novamente, em ambos os temas e desde 360 px.
