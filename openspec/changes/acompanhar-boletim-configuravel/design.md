## Context

Ver `proposal.md` para origem do quadro e autorização de regras configuráveis. Notas não possuem modelo no projeto atual. A proposta de personalização define matrículas, calendário e frequência por encontro, ainda pendentes de implementação. A tabela recebida associa TF à carga horária, portanto um contador de encontros ausentes não é suficiente para simular sua situação.

## Goals / Non-Goals

**Goals:** configuração limitada e auditável, cálculos reproduzíveis, conservação das notas originais, clareza de cobertura e independência entre progresso de aulas, frequência e resultado de notas.

**Non-Goals:** execução de fórmulas livres, modelagem de qualquer regulamento acadêmico possível, snapshots oficiais do portal ou mudança global das regras da faculdade. Regras novas fora das opções declaradas exigirão evolução posterior quando informadas, sem perda dos lançamentos atuais.

## Decisions

### 1. Políticas declarativas versionadas

Criar política por matrícula com revisão monotônica, configuração estruturada validada e confirmação. Manter revisões antigas imutáveis, autor/datas de alteração e referência de modelo. Os modelos iniciais são sugestões versionadas de dados do aplicativo, não catálogo de regulamentos. Atualizar modelo no futuro só afeta novas escolhas.

Configuração tem até 20 componentes finais; cada grupo MAP tem até 30 APs e profundidade máxima um grupo mais folhas. Componentes têm ids estáveis e labels independentes; notas relacionam-se às folhas, com MAP manual como folha quando escolhido. Desativar componente conserva suas notas. Pesos finais em percentuais decimais totalizam exatamente 100; pesos internos relativos são normalizados na média ponderada. Validar ausência de ciclos, ids duplicados e referências fora da matrícula; não usar eval, expressões Python/SQL ou template do usuário.

Alternativa descartada: colunas fixas AP1/AP2 presumem quantidade e fórmula; JSON irrestrito ou expressão livre dificulta segurança e validação. Usar estrutura persistida em JSONField com validação e tabela de identidades de avaliação; verificar suporte no MSSQL fixado com testes. Relacionamentos de dono e avaliações permanecem tabelados, não escondidos apenas no JSON.

### 2. Motor decimal com pendências explícitas

Criar funções puras no backend que resolvem notas efetivas (SUB), grupo MAP, pesos finais, bônus/teto e arredondamento nessa ordem. Decimal nos valores, pesos e limites; frontend só formata resposta, não mantém fórmula concorrente. Pontuação de entrada com no máximo duas casas decimais; valores fora da escala são rejeitados, não ajustados silenciosamente. Escala é única na política; alterar para escala menor que notas existentes retorna 409 até corrigir/desativar avaliações afetadas, sem converter notas automaticamente.

Estados unset de MAP/SUB/bônus bloqueiam média final; para regras que não se aplicam, aluno escolhe disabled. SUB é opcional quando a regra está configurada e sua ausência não torna PR válida pendente; o alvo precisa ter nota efetiva após resolver a substituição. Bônus habilitado exige nota explícita, incluindo zero. Não arredondar MAP antes de ponderar; a escolha de arredondamento afeta apenas a média final. Esse comportamento é uma convenção do app claramente mostrada, não regra atribuída à instituição.

Com notas incompletas, retornar contribuição conhecida e peso correspondente; num grupo MAP incompleto, suas APs conhecidas contribuem pelos pesos efetivos para a soma parcial, mas MAP/final continuam pendentes. Não chamar contribuição conhecida de média final. Para faixa possível, avaliar desconhecidas nos limites zero/escala com a mesma política monotônica. Para uma pendência, resolver a menor nota em passos de 0,01 que atinge o mínimo sob arredondamento; busca binária na grade decimal usa o mesmo avaliador. Retornar já atingido ou inalcançável quando pertinente; não resolver fórmula com SUB ou regras desconhecidas pendentes.

Alternativa descartada: dividir só pelos pesos lançados e apresentar como final pode fazer o aluno interpretar nota suficiente antes de completar avaliações. Não inferir lançamento ausente como zero.

### 3. Notas, revisão e transações

Uma nota por avaliação/matrícula, anulável, com revision própria para concorrência otimista; política tem revisão independente. GET do boletim retorna ambas. PUT de nota compara sua expected_revision, valida escala sob política atual e incrementa revisão. Política e notas são bloqueadas transacionalmente durante validações cruzadas; conflito retorna 409. Primeiro lançamento usa revisão zero. Guardar alterações de nota em histórico mínimo privado (valor anterior/novo, data), sem logs de conteúdo gerais.

Política substituída preserva ids de avaliações conhecidas; remoções tornam-nas inativas. Configuração restaurada pode reutilizar os ids para retomar notas, mas não copia lançamentos entre alunos ou disciplinas. Históricos não são compartilhados. Reset de nota usa score=null, não exclusão de avaliação.

### 4. Unidades e TF com origem única

Adicionar `attendance_units` anulável às ocorrências e padrão opcional em regras futuras; adicionar `missed_units` anulável ao registro. Nenhuma migração converte encontros em horas automaticamente. Status legado permanece consultável; se o aluno confirma unidades de um encontro já ausente, UI pede confirmar quantas foram perdidas. Alterar unidades abaixo de missed_units ou de encontro com registro incompatível exige correção explícita, não truncamento.

`AbsencePolicy` por matrícula guarda revisão, total declarado de unidades, frequência mínima, fonte e confirmação. Manter total manual/data/cobertura mesmo quando fonte é calendário. Somar somente ocorrências não canceladas com unidades conhecidas e frequência lançada, e computar pendências separadamente. Para presentes, missed_units=0; ausência parcial é status absent com missed_units menor que attendance_units; contadores antigos representam encontros com qualquer ausência e isso aparece no rótulo.

Total de unidades independe da quantidade de encontros e não é recalculado por cancelar aula; sem reposição, soma das unidades do calendário pode divergir do total declarado, situação que precisa aparecer em vez de recalcular a carga presumida. Fonte manual permite registrar TF sem configurar toda a frequência do passado. Mudar fonte troca a projeção, não soma nem destrói dados da outra origem.

Cálculo com Decimal: limite=floor(U×(1−p/100)); saldo/excesso inteiros; projeção=(U−TF)/U×100. Exemplo 80/75%/TF2: limite20, saldo18 e projeção97,5% se não houver novas faltas. Não confundir projeção do semestre com percentual observado entre encontros conhecidos. Relação carga→unidades é sugestão a confirmar, sem assumir unidade de 50 ou 60 minutos.

### 5. Estado da disciplina e UI

Gradebook retorna estado de configuração, completude de notas, dimensão de nota e dimensão de frequência com motivos, além de estado combinado. Prioridade do rótulo principal: política não confirmada/necessária unset → Configuração pendente; dados necessários ausentes → Dados incompletos; semestre ainda não encerrou → Em andamento; depois combinação de nota suficiente e TF dentro do limite. Alertas conhecidos, como excesso de faltas, permanecem visíveis mesmo quando outro campo está pendente. Não atualizar o status manual da matrícula (active/completed/dropped) automaticamente.

Semestre encerra ao terminar end_date no seu fuso. Fonte manual tem cobertura final somente com complete=true e as_of>=end_date e semestre encerrado. Calendar tem cobertura final somente com todas as unidades/estados válidos e soma igual à política. Exibir “situação estimada com suas regras” e resumo das configurações; nunca “histórico oficial”.

Adicionar Boletim no detalhe de disciplina já existente, não criar réplica de portal acadêmico. Assistente guiado pergunta modelo, APs/MAP, substituição, bônus, arredondamento e limites, permitindo salvar pendente. Notas e TF podem ser lançados enquanto cálculo final é indisponível. Tela usa tabelas acessíveis no desktop e cartões rotulados no mobile, com texto para pendências e limites em ambos os temas.

### 6. Compatibilidade e segurança

Estender APIs de frequência mantendo status e contadores de encontros; novos campos opcionais não invalidam clientes antigos. Ausência sem unidades permanece pendência para boletim, nunca uma falta automática. Novos endpoints reaproveitam sessão/CSRF e querysets filtrados por dono. Não incluir RA ou a identificação pessoal fornecida no exemplo em fontes versionadas, seeds, testes ou screenshots. Testes usam pessoas e notas fictícias.

Não há biblioteca nova necessária para cálculo, política ou UI. Dados são privados por matrícula; cada id de avaliação ou ocorrência deve pertencer ao mesmo usuário e matrícula do endpoint. Regras têm limite de tamanho, enums e pesos; injeção de expressão recebe 400. Consultas de lista agregam/prefetch dados para evitar consulta por célula do boletim.

## Risks / Trade-offs

- Regras configuradas erradas → fórmula/revisão visíveis, modelos rotulados como sugestão e estado estimado.
- Diferença entre faltas do portal e registros → fonte explícita, data do total manual e cobertura do calendário.
- Mudança de política altera situação → revisão nova preserva notas e explica alteração, sem atualizar outras matrículas.
- Pesos/escala incompatíveis com notas existentes → rejeitar conflito e conservar dados, sem corrigir por suposição.
- Mistura de encontros e unidades → rótulos separados e testes de aulas com quatro unidades e faltas parciais.

## Migration Plan

1. Confirmar implementação/validação de personalização e sincronizar sua especificação antes deste delta. Não usar a checklist como única evidência.
2. Criar tabelas/campos aditivos e restrições; políticas de matrículas existentes começam ausentes, unidades nulas e notas não são importadas do quadro pessoal enviado.
3. Testar migração em SQL Server real e SQLite de teste, preservando status de frequência, ids de aulas, tarefas e descrições existentes.
4. Implantar APIs/UI juntos; atualizar OpenAPI, tipos, README e matriz de roadmap para mostrar que boletim virou proposta aprovada, ainda distinta de implementação.
5. Reversão operacional retorna versão de app compatível mantendo campos/tabelas aditivas. Exportar dados novos e obter autorização antes de reversão destrutiva de esquema; não remover notas/revisões automaticamente.
6. Validar exemplos de pesos, arredondamento, pendências, faltas/cobertura, concorrência, isolamento, regressão dos progressos e acessibilidade. Regras fixas futuras serão incorporadas por nova revisão de configuração ou atualização de especificação se excederem as opções existentes.
