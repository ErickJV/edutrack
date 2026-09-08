## 1. Base de especificações e preservação

- [x] 1.1 Conferir os requisitos modificados contra a mudança acadêmica anterior e sincronizar sua base em `openspec/specs` com o workflow de sync, sem arquivar; verificar nomes dos requisitos e validação estrita das capacidades.
- [x] 1.2 Adicionar seleção/arquivamento independente do status acadêmico e reconciliar matrículas transacionalmente; testar ids e tarefas preservados em seleção repetida, vazia e reativação.
- [x] 1.3 Expor histórico pessoal de matrículas e manter tarefas anteriores acessíveis, rejeitando criação em vínculo arquivado; testar isolamento, 404 para ids alheios e ausência de exclusão em cascata.

## 2. Carga horária e professores

- [x] 2.1 Criar campos de carga pessoal e procedência/valor legado do catálogo; testar migração com horas ausentes/presumidas, restrição 1–2000 e reversão em banco de testes.
- [x] 2.2 Remover sincronização online do seed/startup e fallback de 80h da importação manual; testar seed sem rede, idempotência, horas desconhecidas nulas e preservação de cargas pessoais.
- [x] 2.3 Criar professor privado e vínculo opcional na matrícula, migrando textos existentes por aluno; testar homônimos, nomes vazios e preservação do texto legado.
- [x] 2.4 Implementar APIs de professores com arquivamento e OpenAPI; testar criação/edição/leitura, campos inválidos, CSRF, propriedade e preservação de vínculos.
- [x] 2.5 Implementar edição parcial da matrícula para carga/professor e atualizar contratos; testar limpeza de valores, campos omitidos e rejeição de referência alheia sem modificar catálogo.
- [x] 2.6 Criar página de professores e editor de disciplina com cadastro inline; verificar formulário, nome acessível, dados preservados após erro e atualização dos cartões em testes de frontend.

## 3. Semestre e aulas

- [x] 3.1 Criar modelos/migrações de semestre, horário e ocorrência com índices, chaves estáveis e vínculo opcional da matrícula; verificar migrações em SQL Server, sem gerar semestre para dados legados.
- [x] 3.2 Implementar APIs de semestre e associação em matrícula; testar datas inclusivas, fuso, duração, propriedade e conflito de troca com histórico.
- [ ] 3.3 Implementar geração semanal transacional e APIs de horário com contratos; testar limites do semestre, vários blocos, repetição idempotente, concorrência e horários locais inválidos.
- [ ] 3.4 Implementar consulta/edição individual, cancelamento e aula avulsa/reposição; testar sala, vínculo de reposição, exclusão do total válido, reativação e HTTP 404 para referências alheias.
- [ ] 3.5 Implementar reconciliação de séries e datas do semestre protegendo histórico; testar ids preservados, cancelamento só de futuras intocadas e resposta 409 para conflitos.
- [ ] 3.6 Criar configuração de semestre e horários na disciplina, com lista de aulas editável; verificar estados vazio/carregando/erro, vigência e edição pelo teclado em testes de interface.

## 4. Frequência e progresso temporal

- [ ] 4.1 Criar registro único de frequência e API PUT idempotente com resumo; testar correção, não informado, futura/cancelada, CSRF e isolamento entre alunos.
- [ ] 4.2 Calcular progresso e contagens por aulas no servidor com agregação; testar relógio fixo, 6/20=30%, início/fim, cancelamentos/reposições e nulo sem aulas.
- [ ] 4.3 Separar progresso de tarefas e atualizar resumo ponderado por carga pessoal com cobertura parcial; testar 60h×50% + 40h×25%=40%, nenhuma elegível e exclusão de matérias arquivadas.
- [ ] 4.4 Atualizar tipos, clientes e OpenAPI para novos campos e nulabilidade, e adaptar Home/Disciplinas; verificar contrato gerado, estados pendentes e ausência de NaN/horas presumidas.
- [ ] 4.5 Criar controles de frequência no detalhe da disciplina/aula e resumo com pendências; testar correção de falta para presença sem alterar progresso temporal.
- [ ] 4.6 Atualizar progresso ao recuperar foco e a cada minuto enquanto a página está visível; verificar com relógio simulado a atualização e limpeza de timers sem depender de hora do cliente.

## 5. Calendário e eventos

- [x] 5.1 Criar eventos manuais e APIs com OpenAPI; testar provas/entregas/outros, dia inteiro, instante pontual, datas inválidas, propriedade e CSRF.
- [ ] 5.2 Implementar agregação de aulas/eventos/prazos com filtros e intervalo máximo; testar interseção [from,to), ids de origem, fuso e ausência de duplicação após alteração/remoção de prazo.
- [ ] 5.3 Criar `/calendario`, navegação e agenda acessível com filtros/Hoje; verificar estado vazio, carregamento, erro, tipos/sala/horários e acesso à tarefa original.
- [ ] 5.4 Criar visões semana/mês com alternativa por lista e navegação entre períodos; verificar dados equivalentes, fronteiras de mês e ausência de overflow desde 360 px.
- [ ] 5.5 Integrar criação/edição de eventos, reposições, cancelamentos e frequência ao detalhe de calendário; testar cenário de prova AP1 sem nota/cópia de tarefa e atualização do progresso após cancelamento.

## 6. Aparência

- [x] 6.1 Implementar tokens e preferência Claro/Escuro/Sistema persistente com inicialização compatível com CSP; testar recarga, sistema, armazenamento bloqueado e preferência inválida.
- [x] 6.2 Aplicar tokens a páginas públicas/autenticadas, modais, formulários e estados; verificar visualmente os dois temas e contraste dos componentes e textos, registrando evidências.
- [x] 6.3 Integrar seletor acessível à navegação pública/autenticada; testar teclado, rótulo/estado anunciado e manutenção da preferência após logout.

## 7. Documentação e validação integrada

- [ ] 7.1 Atualizar README, AGENTS, contexto OpenSpec e documentação de migração/rollback com o produto real, endpoints, configuração e limites; conferir coerência com specs e registrar ausência de requisitos de notas/AP1/AP2.
- [ ] 7.2 Executar Ruff, mypy, testes completos backend, migrations/check e schema no SQL Server real, além dos ciclos SQLite; registrar resultados e comprovar migração/seed sem perda de dados e sem rede.
- [ ] 7.3 Executar lint, TypeScript, testes e build frontend; registrar resultados cobrindo contratos novos e nulos.
- [ ] 7.4 Criar/executar E2E autossuficiente com Mailpit: login, carga/professor, semestre/horário, progresso, falta/presença, cancelamento/reposição, prova/prazo no calendário e recarga com tema persistido; registrar evidências dos fluxos.
- [ ] 7.5 Auditar 360/768/1280 px nos temas claro/escuro, contraste AA, foco, teclado, leitor de tela e alvos de 44 px nas páginas e modais; documentar avaliação manual e automatizada sem marcar como completo o que não foi verificado.
- [ ] 7.6 Medir resumo com a massa do design (12 matérias, 1.200 aulas, 500 tarefas), verificar tempo <1s e ausência de consultas por disciplina; registrar ambiente e resultados.
- [ ] 7.7 Conferir cada cenário das seis specs contra evidências, validar OpenSpec em modo estrito e registrar pendências reais antes de sincronização/arquivamento futuro; não usar somente checkboxes como prova de conclusão.
