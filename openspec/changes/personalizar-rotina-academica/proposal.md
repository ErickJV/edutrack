## Why

O estudante precisa adaptar o EduTrack à sua turma: as cargas horárias importadas podem ser valores presumidos, professores não possuem cadastro reutilizável e falta uma agenda de aulas e avaliações. O progresso atual mede tarefas concluídas, mas o usuário quer acompanhar aulas ocorridas em relação ao total do semestre, com presença e ausência registradas separadamente.

## What Changes

- Adicionar temas claro, escuro e automático, com preferência persistida no navegador e cobertura de todas as telas.
- Permitir carga horária declarada pelo aluno em cada disciplina; representar ausência de informação sem assumir 80h ou apresentar estimativas como oficiais.
- Criar cadastro pessoal de professores, reutilizável entre disciplinas, e permitir vincular/alterar o professor da matéria.
- Criar semestre com datas definidas pelo usuário e horários semanais de aulas, incluindo sala, cancelamentos e reposições.
- Criar `/calendario` com agenda, semana e mês, reunindo aulas, prazos de tarefas e eventos manuais de prova, trabalho e outros compromissos acadêmicos.
- **BREAKING:** alterar a semântica de `progress_percent` para aulas ocorridas / aulas totais válidas do semestre. Expor progresso de tarefas em campo separado e adaptar o dashboard e a ponderação às cargas horárias declaradas.
- Registrar presença, falta ou estado não informado por aula ocorrida; frequência não altera progresso temporal nem indica aprovação oficial.
- Preservar matrículas, tarefas e novos dados ao ajustar a seleção de disciplinas.

## Capabilities

### New Capabilities

- `appearance-preferences`: escolha e persistência de tema acessível.
- `professor-management`: cadastro pessoal e associação de professores.
- `academic-calendar`: semestre, horários, ocorrências, eventos e agregação de prazos.
- `class-attendance`: registro e resumo de presença e ausência por aula.

### Modified Capabilities

- `academic-curriculum`: carga declarada, personalização e preservação de matrículas; progresso temporal das disciplinas.
- `student-dashboard`: métricas de aulas separadas das métricas de tarefas, ponderadas por cargas declaradas.

As duas capacidades modificadas existem em `openspec/changes/gestao-academica-e-estudos/specs/`, mas ainda não em `openspec/specs/`. Esta proposta depende dessa base implementada no commit `442d4de`: sincronizar sua especificação antes de aplicar/sincronizar os deltas desta mudança, preservando os mesmos nomes e sem arquivar automaticamente a mudança anterior.

## Impact

- Backend/banco: expandir `apps.academic` com semestre, professores, horários, ocorrências, eventos e frequência; migrações aditivas e correção da atualização destrutiva de seleção de matérias.
- APIs: novos recursos autenticados em `/api/v1/`; expandir matrículas e resumo; atualizar OpenAPI e consumidores junto à mudança semântica de progresso.
- Frontend: temas globais, edição de disciplina, professores, configuração do semestre, calendário e controles de frequência; adaptar Home e Disciplinas.
- Segurança/privacidade: professores e registros acadêmicos pertencem exclusivamente ao aluno; validar propriedade de todas as referências, usar CSRF nas mutações e HTTP 404 para objetos alheios. Autenticação e respostas resistentes à enumeração de contas permanecem com os contratos existentes.
- Operação: sem hospedagem, serviços ou dependências novas planejadas. Dados versionados; remover a sincronização online automática da inicialização para que ela não sobrescreva dados nem introduza horas presumidas. Importação manual deve tratar horas ausentes como desconhecidas.

## Non-goals

- Cálculo de notas, médias, pesos de AP1/AP2, recuperação ou aprovação: não foram encontrados requisitos desses assuntos nos Markdown atuais nem no histórico Git pesquisado. Provas chamadas AP1/AP2 podem ser eventos nomeados pelo usuário, sem fórmula acadêmica presumida.
- Planejamento automático de estudos, integrações com calendários externos, notificações, compartilhamento de professores, portal acadêmico e frequência oficial.
- Inferir datas oficiais da faculdade. 03/08/2026 é apenas o exemplo mencionado pelo usuário; início e fim do semestre são editáveis, sem pré-cadastro dessa data como fato.

## Evidências da exploração

- `backend/apps/academic/management/commands/sync_impacta_curriculum.py` usa 80h quando não encontra horas; `StudentSubject.progress_percent` calcula tarefas concluídas / total.
- `StudentSubject.professor_name` é texto; a seleção atual apaga matrículas e recria registros, apagando tarefas em cascata. A preservação é necessária para a personalização pedida.
- `openspec/changes/gestao-academica-e-estudos/specs/study-tasks/spec.md` documenta prazos, filtros, tempo estimado/real e conclusão de tarefas; nenhum Markdown encontrado especifica AP1/AP2 ou médias.
- README, AGENTS e contexto OpenSpec ainda descrevem só autenticação: atualizar na implementação para refletir o produto realmente entregue.
