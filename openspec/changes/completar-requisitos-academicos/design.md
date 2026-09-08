## Context

Ver `proposal.md` e `docs/planejamento/requisitos-professor-e-ideias-grupo.md`. A mudança depende da personalização de semestre/aulas/professores/tema, ainda não implementada. O código atual possui acumulados de tempo, mas não seus dias de realização; usa conclusão atual e `completed_at` para tarefas; a Home inclui tarefas concluídas no feed por falta de filtro. Não é possível reconstruir semanas anteriores de estudo a partir do acumulado.

## Goals / Non-Goals

**Goals:** métricas reproduzíveis no servidor, leitura privada e eficiente, relatórios coerentes com dados atuais e evidência rastreável de cobertura do documento acadêmico.

**Non-Goals:** motor generativo, relatórios agendados, snapshots históricos imutáveis, alterações na stack ou nas fórmulas de aulas/frequência da dependência. Recomendação calculada não prova uso de LLM; essa distinção deve aparecer na apresentação acadêmica.

## Decisions

### 1. Cadeia de dependências e contratos

Executar depois de `personalizar-rotina-academica` e sincronizar sua base antes destes deltas. Somar requisitos novos sem substituir descrição/horários/tema planejados. `study-tasks` precisa ajustar explicitamente a conclusão de tarefa para atualizar progresso de tarefas, pois a especificação antiga confundia esse valor com o progresso geral da disciplina.

Implantar frontend/backend juntos ao tornar `actual_minutes` somente leitura. Atualizar formulários de criação/edição para não enviar esse campo; apontamento usa registros datados. Preservar o campo de resposta evita quebra desnecessária em gráficos existentes; rejeitar escrita antiga claramente evita falsa confirmação de tempo salvo.

### 2. Livro de registros de estudo

Adicionar `StudyRecord`: UUID, user, task, studied_on, minutes, source, client_id, created_at, updated_at e deleted_at. Chave única `(user, client_id)` e transações impedem duplicação em retries. Exclusão lógica preserva a chave idempotente; repetição de criação com chave já excluída retorna 409 em vez de ressuscitar minutos. Consultas agregadas ignoram excluídos. Edições não alteram o dono nem tarefa original; transferir tempo requer excluir e criar conscientemente.

Adicionar `legacy_actual_minutes` à tarefa, migrado do acumulado atual. Atualizar `actual_minutes` como cache transacional do saldo + SUM(registros ativos), bloqueando a tarefa em mutações concorrentes e testando invariância. Alternativa de agregar cada leitura é possível, mas o cache mantém compatibilidade de serializers e consultas; nenhuma escrita avulsa é permitida. Correção do saldo legado usa endpoint próprio e não inventa datas.

Registro manual usa data escolhida em São Paulo. Cronômetro mantém início/pausas e chave de confirmação em armazenamento do navegador isolado por usuário, oferece revisão de duração/data ao salvar e limpa informações no logout. Uma sessão que cruza meia-noite oferece dividir em registros por dia antes de confirmar; não lançar tempo por todo intervalo em que navegador ficou fechado sem revisão. Nova aba deve avisar sobre sessão já existente em vez de criar cronômetro duplicado para a mesma tarefa.

Alternativa descartada: atribuir o tempo antigo à data de migração ou usar `updated_at` como dia de estudo produz relatórios falsos. Se uma tarefa for excluída pelo fluxo existente, dados associados deixam de entrar em relatórios regenerados; explicar que relatórios representam dados atuais, não arquivo imutável.

### 3. Analytics determinístico e testável

Serviço Python único produz objetos de dados para JSON/HTML/PDF, com `calculation_version`, `generated_at` e fuso. Agregar por usuário e matrícula com SQL/ORM e usar Decimal para percentuais; arredondamento final para uma casa decimal, sem dividir por zero.

- Distribuição de esforço: soma de registros ativos pela data no intervalo, inclusive matérias arquivadas identificadas; saldo legado fora da distribuição.
- Progresso de tarefas: total concluído atual / total atual; medida de aulas fornecida pelo serviço da dependência. Não recalcular calendário em paralelo.
- Desvio de estimativa: tarefas concluídas na janela, estimativa positiva, amostra >=3; soma real acumulada/soma estimada, com contribuição legada indicada. Não comparar duração acumulada de tarefas ainda abertas com a estimativa total como se estivessem finalizadas.
- Previsão: tarefas concluídas atualmente com `completed_at` nos últimos 28 dias; C/28, mínimo 3. Com pendentes P, ceil(P×28/C), limitada a horizonte de 365 dias. Não promete aprovação ou fim de semestre e explicita a hipótese de ritmo estável. Reabertura remove a tarefa da amostra e nova conclusão usa a nova data.

Alternativa de LLM traria custo, provedor e envio de dados sem necessidade para o exemplo dado pelo professor. Esta fase gera insights por regras matemáticas explícitas; agente sobre materiais está no roadmap escolhido. Não ocultar essa adaptação sob rótulo de IA generativa.

### 4. Filtros e apresentação

Validar query params antes de construir filtros, inclusive UUID e enum, para evitar 500 por strings malformadas. Tarefas com data usam limites convertidos de meia-noite em São Paulo para instantes UTC. Busca textual ignora caixa e combina campos por OR internamente e filtros por AND. Manter listas atuais para compatibilidade; paginação é obrigatória no novo recurso de registros. Para matrículas, datas derivadas das vigências ou semestre são filtradas por interseção; limites from/to são [início,fim), datas finais inclusivas da disciplina devem ser convertidas para fim exclusivo na comparação.

Descrição pessoal vai em campo da matrícula, com texto plano e escape no frontend/PDF. Nome do catálogo permanece o nome da disciplina conforme adaptação autorizada; início/fim editam a configuração já existente, evitando dois calendários concorrentes.

Home consulta listas ativas, atrasadas e urgentes com relógio do servidor; inclui totais e links para filtros completos. Atraso não pode aparecer como “vence hoje”. Barras de tempo usam CSS/SVG local com tabela equivalente, reaproveitando o design system; nenhuma biblioteca de gráficos é obrigatória. Estados de insuficiência de dados são conteúdo normal, diferentes de falha de API.

### 5. Relatório semanal por solicitação

Adotar segunda-feira 00h até segunda seguinte em São Paulo. Consulta retorna dados atuais agrupados pela semana escolhida: minutos pela data de estudo e conclusões pelo `completed_at` atual. Alertas e progressos são seção “Situação na geração”, não fotografia inventada da semana passada. Correções/exclusões podem mudar um relatório regenerado; identificar geração e versão de cálculo.

Gerar PDF em memória a partir do mesmo objeto do JSON. Escolher biblioteca Python com suporte validado a Python 3.14, fontes locais com acentos, tabelas multipágina e sem fetch remoto; avaliar compatibilidade e fixar versão no lockfile antes de integrar. Esta escolha interna não altera contrato nem pede provedor externo. Fonte embutida e escaping do conteúdo são obrigatórios; template fixo sem HTML arbitrário executável.

Gerar sob demanda, com limite explícito de 1.000 linhas detalhadas; totais nunca truncados. Resposta PDF autenticada e não cacheável, sem armazenamento público. Aplicar limite de 10 gerações/minuto por usuário, retornar 429 com Retry-After e permitir HTML mesmo se PDF falhar. Controlar execução com orçamento de 15s via mecanismo com cancelamento real no processo de geração e teste de timeout; não afirmar que timeout de rede interrompe processamento. Relatório normal até 100 tarefas/200 registros deve atingir 2s no ambiente de referência.

Alternativas: fila e envio automático ampliariam operação não requerida; snapshots persistentes exigiriam política de retenção; navegador imprimindo HTML não atende sozinho “PDF via Python”. HTML é alternativa acessível completa, PDF é download adicional.

### 6. Perfil de desempenho e segurança

Traduzir “1.000+ usuários” em teste inicial documentado: 1.000 contas sintéticas, cada uma com 10 matrículas, 100 tarefas e 200 registros; 50 clientes simultâneos autenticados durante cinco minutos após um minuto de aquecimento. Medir p95<2s e erros inesperados<1% nas consultas de tarefas filtradas, matrículas, resumo e analytics. Incluir ensaio separado de exportações normais, mantendo meta de 2s por relatório. Registrar CPU/RAM, versões, ambiente Docker/MSSQL, mistura de requests e resultados; não afirmar 1.000 clientes simultâneos. Manter alvo mais rigoroso <1s do dashboard na massa específica da dependência.

Cada queryset e relação é restrito ao usuário antes da consulta, inclusive exportação, saldo legado e filtros. Reutilizar sessão e CSRF. IDs aleatórios não substituem autorização. Medição de carga roda isolada, sem inserir dados sintéticos no banco pessoal existente. Não atualizar dependências incidentalmente; somente biblioteca PDF e ferramenta de teste de carga se necessário, com justificativa e lockfile próprio.

## Risks / Trade-offs

- Totais sem data impedem retrospectiva exata → preservar saldo e marcar sua ausência nos gráficos semanais.
- Datas de conclusão são estado atual, não log histórico → transparência no relatório e fórmula; log completo fica fora desta entrega.
- Contagem de tarefas como velocidade ignora dificuldade → apresentar amostra, janela e hipótese, sem previsão quando insuficiente.
- Biblioteca PDF/fonte pode falhar em ambiente alvo → prova curta de compatibilidade e renderização antes do restante da integração.
- Cache de total pode divergir → transação única, bloqueios e testes concorrentes e de reconciliação.
- Dependência anterior ainda não implementada → tarefa inicial verifica execução/sincronização; não declarar esta mudança pronta para execução fora de ordem.

## Migration Plan

1. Aplicar/validar dependências e sincronizar specs. Registrar rastreabilidade P01–P15 e distinguir existente, planejado e verificado.
2. Criar migrações aditivas de registros, saldo legado e descrição pessoal. Testar com SQL Server real e fixture de migração, mantendo ids/totais.
3. Implantar nova escrita de tempo e consumidores juntos. Popular saldo legado uma única vez; sementes repetidas não remigram nem duplicam registros.
4. Adicionar analytics e PDF somente após verificação da origem dos tempos. Atualizar OpenAPI, README, AGENTS, contexto OpenSpec e guia de apresentação com fórmulas/limites.
5. Rollback operacional mantém schema novo e restaura versão da aplicação compatível com acumulado; antes de voltar a escrever total pelo código antigo, suspender gravação ou reconciliar saldos/registros explicitamente. Não remover tabelas ou descartar registros novos sem backup e autorização para reversão destrutiva.
6. Registrar evidências de testes funcionais, isolamento/CSRF, desempenho e renderização de PDF. Validação do OpenSpec não substitui aceite de funcionamento.
