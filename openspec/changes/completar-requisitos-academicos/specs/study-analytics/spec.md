## Purpose

Transformar tarefas e registros de tempo em indicadores explicáveis de esforço, andamento e previsão, sem confundir estimativa de estudo com calendário de aulas ou aprovação acadêmica.

## ADDED Requirements

### Requirement: Métricas e distribuição de tempo
`GET /api/v1/study-analytics?from=YYYY-MM-DD&to=YYYY-MM-DD` MUST retornar JSON privado com intervalo [from,to), fuso America/Sao_Paulo, `generated_at`, `subjects` e `totals`. Intervalo máximo 366 dias; padrão últimos sete dias locais incluindo hoje. Cada disciplina inclui minutos datados no intervalo, minutos legados sem data separados, contagem atual de tarefas, `task_progress_percent` e `class_progress_percent`. Progresso por tarefas = concluídas / total ×100 (0 se vazio); por aulas preserva a fórmula da dependência. Distribuição de tempo MUST usar somente registros datados do intervalo e incluir disciplinas arquivadas com registros nele, identificadas como arquivadas.

#### Scenario: Distribuição verificável
- **WHEN** há 60 minutos datados de uma matéria e 30 de outra no intervalo, além de 120 legados
- **THEN** o gráfico/tabela mostra 90 minutos distribuídos em 60 e 30, com 120 sem data destacados separadamente
- **AND** cada matéria exibe progresso de tarefas e de aulas com rótulos distintos.

#### Scenario: Intervalo vazio ou inválido
- **WHEN** o intervalo não tem registros ou início não precede fim
- **THEN** o primeiro caso retorna 200 com estado sem estudo registrado, e o segundo 400 sem divisão por zero.

### Requirement: Recomendações explicáveis por estimado e real
A resposta de analytics MUST incluir insights calculados para cada disciplina usando tarefas atualmente concluídas, com `completed_at` dentro do intervalo e estimativa positiva. Comparar soma do tempo real acumulado dessas tarefas (incluindo legado explicitamente identificado) com soma das estimativas; desvio = (real − estimado) / estimado ×100. Só emitir recomendação de esforço com pelo menos três tarefas elegíveis e tempo real positivo; desvios >=20% sugerem revisar estimativas, <=−20% sugerem revisar planejamento para baixo, demais são estáveis. Sempre retornar contagem de amostra, totais, fórmula/versão e motivo quando insuficiente. Os textos MUST identificar análise calculada, não afirmar uso de LLM ou causalidade de dificuldade.

#### Scenario: Estouro de estimativa
- **WHEN** três tarefas elegíveis totalizam 100 minutos estimados e 130 reais
- **THEN** aparece desvio de +30% e sugestão de revisar o planejamento, com os totais e amostra que justificam a mensagem.

#### Scenario: Dados insuficientes
- **WHEN** não há três tarefas elegíveis ou todas têm estimativa zero
- **THEN** o sistema retorna motivo de insuficiência e não gera recomendação percentual fictícia.

### Requirement: Previsão de conclusão das tarefas
A resposta MUST prever conclusão do conjunto atual de tarefas pendentes/em andamento por disciplina, usando quantidade de tarefas atualmente concluídas nos últimos 28 dias, a partir de `completed_at`. Com C>=3, velocidade=C/28 por dia e dias estimados=ceil(pendentes/velocidade). Se pendentes=0, mostrar “Sem tarefas pendentes”; se C<3, previsão nula por amostra insuficiente. Previsões superiores a 365 dias MUST ser identificadas como horizonte insuficiente e não produzir data exata. A data é a data local atual mais os dias calculados, com rótulo de estimativa condicionada à manutenção do ritmo e do conjunto de tarefas; não prevê fim das aulas.

#### Scenario: Previsão calculada
- **WHEN** o aluno tem sete conclusões nos últimos 28 dias e três tarefas pendentes
- **THEN** a previsão é de 12 dias, com janela e amostra visíveis; reabrir tarefa retira sua conclusão da amostra.

### Requirement: Acesso, interface e desempenho
Analytics MUST exigir sessão, retornar 401 para anônimo e nunca aceitar seleção de outro usuário. Home MUST apresentar gráfico de barras de minutos, alternativa tabular, indicadores e motivos de insuficiência, com estados carregando/vazio/erro recuperável, ambos os temas e acessibilidade em 360/768/1280 px. APIs JSON MUST ter p95 <2s e taxa de erros inesperados <1% no perfil documentado de 1.000 contas e 50 usuários simultâneos; isso não declara capacidade de 1.000 simultâneos.

#### Scenario: Privacidade e acessibilidade
- **WHEN** dois alunos consultam métricas e um navega apenas por teclado/leitor de tela
- **THEN** cada um recebe só seus dados e consegue ler valores e explicações sem depender de cor ou gráfico.
