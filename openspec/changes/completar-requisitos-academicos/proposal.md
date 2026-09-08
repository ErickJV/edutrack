## Why

A especificação do professor agora fornecida acrescenta requisitos ainda sem cobertura completa: distribuição do tempo de estudo, previsão de conclusão, busca por data, insights de planejamento e relatório semanal PDF. O usuário escolheu priorizar esses requisitos e registrar as ideias do grupo num roadmap separado.

## What Changes

- Completar busca textual e filtros de data/status em tarefas e disciplinas pessoais.
- Permitir descrição pessoal da disciplina, mantendo nome e descrição do catálogo identificáveis; expor início/fim a partir da configuração acadêmica já planejada.
- Exibir separadamente progresso por tarefas (requisito do professor) e por aulas (pedido do usuário), sem alterar a fórmula temporal aprovada.
- Adicionar registros datados de estudo para gráficos e relatórios semanais confiáveis; **BREAKING:** `actual_minutes` passa a ser total derivado, editável por registros datados em vez de substituição direta na tarefa.
- Implementar análise Python de estimado versus real e previsão de conclusão de tarefas pela velocidade recente, com fórmulas e insuficiência de dados explícitas. Recomendações desta entrega são determinísticas; não apresentar cálculo como resposta de modelo generativo.
- Criar relatório semanal PDF sob demanda, com métricas equivalentes ao JSON e alternativa HTML acessível.
- Corrigir a Home para listar pendentes/em andamento e alertas internos de atraso e de prazo futuro menor que 48h, excluindo concluídas.
- Documentar e testar APIs sob carga representativa de 1.000 contas, além dos requisitos de isolamento, temas e mobile-first.

## Capabilities

### New Capabilities

- `study-time-records`: registros datados de estudo, correções e total acumulado auditável.
- `study-analytics`: distribuição de tempo, progresso de tarefas, insights explicáveis e previsão.
- `weekly-study-reports`: relatório semanal em JSON/HTML/PDF sob demanda.

### Modified Capabilities

- `study-tasks`: tempo por registros, busca e filtros combinados.
- `academic-curriculum`: busca pessoal, descrição própria e datas de referência da disciplina.
- `student-dashboard`: tarefas em andamento/pendentes e alertas de prazo corretos.

Dependências: implementar e sincronizar `personalizar-rotina-academica` antes desta mudança, após sincronizar a base `gestao-academica-e-estudos`. Os deltas usam os mesmos caminhos e nomes dessas capacidades; ainda não há base sincronizada em `openspec/specs`. Não duplicar os trabalhos de tema, calendário, carga, professores ou frequência.

## Impact

- Backend/banco: registros de estudo datados e migrações conservadoras, consultas agregadas em Python/Django, exportação PDF; sem troca de Django/MSSQL.
- Frontend: filtros e descrição pessoal, apontamento de tempo com data, gráficos/tabulação, insights e relatório semanal; preservar React e temas da dependência.
- APIs: novos recursos privados de registros, analytics e relatórios; atualizar clientes/OpenAPI conjuntamente com a mudança de escrita de tempo.
- Segurança: sessão e CSRF existentes; nenhuma integração externa ou mudança na autenticação. Registros, métricas e PDFs são privados, com 404 para ids alheios e sem URLs públicas persistentes; não enviar dados para um provedor de IA nesta fase.
- Operação: geração PDF em Python requer selecionar dependência compatível durante implementação, com versão fixada justificada e teste de renderização; sem fila, envio automático, SMTP adicional ou hospedagem pública. Dados de carga sintéticos em ambiente isolado.

## Non-goals

- Ideias do grupo ficam no roadmap: caderno por aula com escrita manual, uploads, agente generativo, flashcards/questões/projetos, integração Git, métodos de estudo, concursos e chat.
- Notas/AP1/AP2: nem o anexo define pesos ou fórmula; registrar interesse sem assumir regra institucional.
- Push externo é evolução futura no documento original; nesta entrega, alertas aparecem dentro da aplicação.
- Não declarar conformidade integral só por concluir tasks: exigir evidências de cada requisito e registrar adaptações pedagógicas e limites do teste de carga.

## Rastreabilidade e adaptações

Ver `docs/planejamento/requisitos-professor-e-ideias-grupo.md` para P01–P15, G01–G13 e origem. P01/P03/P04/P12/P15 têm base existente; P02/P05/P14 combinam esta mudança com personalização; P06–P11/P13 concentram as lacunas desta proposta.

Tecnologias livres e catálogo no lugar de cadastro manual foram autorizados pelo professor segundo relato do usuário. As sessões Django não serão trocadas por JWT/Xano. Preservar os dois progressos atende o uso solicitado e mantém a medida por tarefas descrita no documento. O exemplo de insight do professor pode ser calculado sem LLM; a integração generativa proposta pelo grupo permanece no roadmap escolhido.
