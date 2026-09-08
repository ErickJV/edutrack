## 1. Dependência e dados

- [ ] 1.1 Verificar implementação e sincronização de `personalizar-rotina-academica`, incluindo `class-attendance`; conferir compatibilidade do delta e registrar evidências antes de aplicar mudanças no boletim.
- [ ] 1.2 Criar modelos/migrações de políticas, revisões, avaliações e notas com unicidade por matrícula; testar migração em MSSQL e preservação de dados acadêmicos existentes.
- [ ] 1.3 Criar campos/política de faltas e unidades opcionais em horários/ocorrências, mantendo nulos legados; testar migração sem converter encontros em faltas presumidas.

## 2. Regras e notas

- [ ] 2.1 Implementar política declarativa e modelos Com PAI/Sem PAI; testar pesos, escala, profundidade, referência alheia, ciclos e rejeição de expressão executável.
- [ ] 2.2 Implementar revisões e API de política/avaliações; testar conflitos 409, mudança de escala, ids estáveis e preservação de notas em componentes desativados.
- [ ] 2.3 Implementar API de notas e histórico mínimo privado; testar zero versus nulo, limites decimais, edição concorrente, CSRF e ids alheios.
- [ ] 2.4 Implementar MAP manual/aritmética/ponderada, SUB e bônus com estados unset/disabled; testar AP ausente, troca pelo menor versus melhor nota e teto de bônus.
- [ ] 2.5 Implementar média/contribuição conhecida e arredondamento/comparação; testar 6,7 no exemplo Com PAI e 5,995 bruto versus 6,00 exibido, sem tratar pendência como zero.
- [ ] 2.6 Implementar nota mínima necessária e faixa de simulação; testar PR mínima 4,00 no exemplo Sem PAI, múltiplas pendências, já atingido, impossível e regra desconhecida.

## 3. Faltas e situação

- [ ] 3.1 Estender registro de frequência para unidades e faltas parciais; testar ausência total/parcial, presente, unidade desconhecida, redução incompatível e preservação de contadores/progresso antigos.
- [ ] 3.2 Implementar política manual/calendário e revisão de fonte; testar total manual, data/cobertura, propriedade e troca sem dupla contagem ou perda dos dados inativos.
- [ ] 3.3 Calcular limites, saldo/excesso, projeção e cobertura; testar os seis limites do quadro, igualdade no limite, divergência de unidades e dados passados não informados.
- [ ] 3.4 Implementar resumo combinado de nota/frequência com fase do semestre; testar alta nota com excesso de faltas, campos pendentes, fim ausente, data manual insuficiente e cálculo final somente com cobertura.

## 4. Interface e contratos

- [ ] 4.1 Atualizar OpenAPI, tipos e cliente para política, notas, TF e unidades; verificar schema gerado, nulabilidade e compatibilidade dos endpoints de frequência existentes.
- [ ] 4.2 Criar configuração guiada no detalhe da disciplina, com modelos editáveis e rascunho pendente; testar configuração incompleta, atualização de política e rótulos de sugestão.
- [ ] 4.3 Criar lançamento de notas, histórico, fórmula e simulação no Boletim; testar pendência/zero, revisão conflitante, preservação de formulário em erro e dados não salvos de simulação.
- [ ] 4.4 Criar controles de TF manual/calendário e unidades no detalhe de aula; testar data do total, origem visível, cobertura parcial e ausência parcial.
- [ ] 4.5 Integrar resumo de situação nos cartões de disciplinas sem alterar barras de aulas/tarefas; testar dimensões independentes e alertas conhecidos com dados pendentes.

## 5. Validação e documentação

- [ ] 5.1 Atualizar README, AGENTS, contexto OpenSpec e roadmap com regras pessoais configuráveis e limites da estimativa; verificar coerência com quatro specs e ausência de RA/dados pessoais do exemplo em fixtures.
- [ ] 5.2 Executar backend com SQL Server real, migrações/check, Ruff e mypy; verificar testes de precisão, nulidade, concorrência, isolamento e CSRF em todos os novos recursos.
- [ ] 5.3 Executar testes/lint/tipos/build frontend e E2E de configurar política, lançar notas, mudar regra, informar TF e consultar situação; verificar recarga e persistência sem duplicação.
- [ ] 5.4 Auditar tema claro/escuro e 360/768/1280 px com teclado, leitor de tela, contraste, foco e alvos de 44 px; registrar evidência manual e automatizada sem confundi-las.
- [ ] 5.5 Conferir todos os cenários, regressão de calendário/progresso/tarefas e estratégia de rollback conservando dados; validar OpenSpec estritamente e registrar limitações antes de sincronização/arquivamento futuro.
