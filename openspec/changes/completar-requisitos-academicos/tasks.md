## 1. Dependências e rastreabilidade

- [ ] 1.1 Verificar implementação/validação de `personalizar-rotina-academica` e sincronização das bases `academic-curriculum`, `student-dashboard` e `study-tasks`; conferir nomes dos requisitos e compatibilidade dos deltas antes de editar código desta mudança.
- [ ] 1.2 Consolidar a matriz P01–P15 em evidências existentes, trabalho desta mudança e adaptações informadas pelo usuário; verificar que G01–G13 continuam no roadmap e que nenhuma funcionalidade pendente foi declarada implementada.

## 2. Registros de tempo confiáveis

- [ ] 2.1 Criar migrações de registros datados e saldo legado com unicidade/índices; testar migração de totais existentes, preservação de ids, saldo sem data e repetição de seed em SQL Server.
- [ ] 2.2 Implementar API privada de registros e correção do saldo legado, com total transacional; testar criar/editar/excluir, concorrência, idempotência após falha e chave conflitante/excluída.
- [ ] 2.3 Tornar `actual_minutes` derivado e rejeitar escrita antiga; atualizar OpenAPI e contratos de formulário, verificando total consistente e resposta 400 orientativa ao cliente antigo.
- [ ] 2.4 Criar listagem/edição de registros com data e saldo sem data no frontend; testar correção, exclusão, erro recuperável e isolamento de estados entre usuários.
- [ ] 2.5 Adaptar cronômetro para recarga e confirmação idempotente, revisão de duração/data e sessão já aberta em outra aba; testar cruzamento de dia, retry, logout e ausência de lançamento automático indevido.

## 3. Busca e informações de disciplina

- [ ] 3.1 Adicionar descrição pessoal na matrícula e datas derivadas da dependência; testar migração, preservação do catálogo, entrada inválida e acesso alheio.
- [ ] 3.2 Implementar filtros combinados de tarefas e disciplinas com datas/fuso, status, texto e categorias de urgência; testar UUID inválido, fronteiras, sem prazo, ordenação e isolamento.
- [ ] 3.3 Integrar filtros à URL e edição de descrição pessoal às telas existentes; testar recarga, limpar filtros, vazio versus erro e navegação por teclado.

## 4. Analytics e recomendações

- [ ] 4.1 Implementar agregação de registros por período/disciplina e JSON de analytics; testar 60+30 minutos no período, saldo legado separado e dados de matérias arquivadas.
- [ ] 4.2 Implementar desvio por tarefas concluídas e insights versionados; testar 100 estimados/130 reais, estimativa zero, amostra mínima, legado e estados estáveis/insuficientes.
- [ ] 4.3 Implementar previsão por ritmo de 28 dias e limites; testar sete conclusões/três pendências=12 dias, reabertura, janela, nenhum pendente e horizonte excessivo.
- [ ] 4.4 Exibir gráfico de tempo/tabela, explicações e os dois progressos na Home; verificar fórmulas independentes, gráfico vazio, dados insuficientes e erro de API em testes de componente.

## 5. Home e alertas

- [ ] 5.1 Corrigir categorias ativas/atrasadas/urgentes no resumo e seus contadores; testar relógio fixo, prazo exato em 48h, concluídas excluídas e máximo de cinco itens com total completo.
- [ ] 5.2 Implementar listas, ações rápidas e links com filtros equivalentes; testar conclusão/reabertura, rollback visual em erro e acesso à lista completa sem perder a precisão de 48h.

## 6. Relatório semanal

- [ ] 6.1 Implementar objeto de relatório e endpoint JSON com semana/fuso e situação atual identificada; testar segunda/domingo, semana atual parcial, semana vazia e correções de registros.
- [ ] 6.2 Selecionar/verificar biblioteca PDF em Python 3.14 e container backend, fixando somente dependência necessária; entregar prova de renderização com fontes locais, acentos e múltiplas páginas.
- [ ] 6.3 Implementar PDF privado a partir dos mesmos dados e controles de geração; testar autenticação, no-store, limites de linhas, 429, cancelamento real por timeout e conteúdo sem fetch remoto.
- [ ] 6.4 Criar consulta de semana, HTML equivalente e download na interface; testar estados gerando/erro, nome do arquivo, semana inválida e recuperação sem perda da visualização.
- [ ] 6.5 Renderizar PDFs de amostras vazia/normal/longa e comparar valores com JSON/HTML; conferir visualmente páginas, texto pesquisável, tabelas sem corte e cabeçalhos legíveis.

## 7. Documentação e validação integrada

- [ ] 7.1 Atualizar README, AGENTS, contexto OpenSpec e OpenAPI com fórmulas, intervalos, tempo sem data, limites de PDF e migração; verificar coerência com as seis specs e com a matriz do professor.
- [ ] 7.2 Executar testes backend em SQL Server, migrações/check, Ruff e mypy; comprovar privacidade e CSRF em registros/saldo/filtros/exportação, além de idempotência e concorrência dos totais.
- [ ] 7.3 Executar testes frontend, lint, tipos e build; registrar resultados e compatibilidade com personalização/progresso de aulas.
- [ ] 7.4 Executar E2E de login, filtros, apontamento datado, conclusão, insight, alerta e download semanal; comparar dados do relatório e verificar recarga do cronômetro sem duplicação.
- [ ] 7.5 Auditar gráficos, listas e relatórios HTML em ambos os temas e 360/768/1280 px com teclado, leitor de tela, contraste e alvos de 44 px; registrar separadamente evidências automatizadas e manuais.
- [ ] 7.6 Executar teste de carga isolado com 1.000 contas e 50 clientes segundo o design, incluindo exportação normal; registrar ambiente, massa, p95, erros e tempos PDF, sem afirmar suporte a 1.000 simultâneos.
- [ ] 7.7 Conferir cada requisito P01–P15 com evidência/adaptação e cada cenário das specs com testes; validar OpenSpec estritamente e registrar limitações antes de futura sincronização/arquivamento.
