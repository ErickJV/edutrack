## Context

Ver `proposal.md` para motivação, escopo e investigação de pedidos antigos. A base usa Django/DRF, sessão allauth e React/Tailwind. Matrículas já possuem texto de professor e semestre, mas o catálogo guarda horas com valores presumidos; a seleção apaga matrículas e tarefas em cascata. O progresso é calculado por tarefas e consumido na Home e Disciplinas. Não há mecanismo de calendário ou frequência.

Esta mudança altera modelos, contratos e experiência transversal; por isso requer design e migrações explícitos. Os deltas da base acadêmica ainda aguardam sincronização para `openspec/specs`; a primeira tarefa verifica e sincroniza essa base sem declará-la validada apenas pelas caixas marcadas.

## Goals / Non-Goals

**Goals:** uma fonte de ocorrências para calendário, progresso e frequência; preservar ids e dados pessoais em ajustes; contabilizar tempo no servidor; manter contratos testáveis com SQL Server real.

**Non-Goals:** motor genérico de recorrência, importação de feriados, fórmulas oficiais de notas/frequência ou múltiplas matrículas da mesma matéria em semestres diferentes. A configuração aceita várias regras semanais por matéria; cada bloco é uma aula contável, independente da carga horária declarada.

## Decisions

### 1. Tema como preferência do navegador

Criar tokens semânticos de fundo, superfície, texto, borda, foco e estado em CSS, substituindo cores fixas nas páginas e modais. Persistir `light|dark|system` em armazenamento local; `matchMedia` resolve Sistema. Aplicar o tema por módulo local executado antes da montagem da interface, compatível com CSP sem liberar scripts inline. Em falha de persistência, estado em memória e preferência do dispositivo mantêm a navegação.

Alternativas: gravar tema no perfil exigiria migração e chamadas sem necessidade de sincronização solicitada; duplicar classes de cor por página aumenta inconsistência. Não adicionar biblioteca para esse recurso.

### 2. Dados declarados pertencem à matrícula

Adicionar `StudentSubject.workload_hours` anulável (inteiro 1–2000), `professor` e `term` opcionais. Esse valor pessoal é a fonte dos cartões e ponderação; carga desconhecida não recebe fallback do catálogo. A carga não determina o número de aulas, pois a duração e a unidade hora-aula podem variar.

Tornar `Subject.workload_hours` anulável e adicionar procedência `unknown|verified` com valor legado preservado para auditoria/reversão. Nenhuma carga importada sem comprovação se torna verificada por ter valor diferente de 80. Dados atuais sem procedência ficam desconhecidos; importação manual só marca verificado com evidência explícita de extração, mantém ausentes nulos e não toca matrículas. Remover execução de scraping no seed/startup; usar migrações e dados versionados.

Alternativa descartada: editar o catálogo global alteraria a carga de outros alunos. Não reescrever migrações já aplicadas nem tentar recuperar por suposição informação que a importação perdeu.

### 3. Professores pessoais e preservação de vínculos

`Professor`: UUID, user, name, active e datas. Somente nome nesta entrega, sem contatos ou cadastro público. Migrar `professor_name` preenchido por aluno, deduplicando apenas texto normalizado dentro desse aluno, mantendo texto legado durante a transição. Nomes homônimos criados depois são permitidos. Arquivar preserva o vínculo e impede novas associações.

Reescrever seleção de matérias como reconciliação transacional: manter ids selecionados, criar ausentes, arquivar desmarcados e reativar anteriores. Usar `is_selected` separado de `status` acadêmico para não confundir desmarcar com trancar ou concluir. Consulta padrão mostra selecionadas; `include_archived=true` oferece histórico pessoal. Tarefas existentes continuam acessíveis ao proprietário; novas tarefas/eventos/aulas exigem vínculo selecionado. Nenhuma cascata é disparada por ajuste de seleção.

Alternativa descartada: apagar/recriar ou deduplicar professores globalmente perde histórico ou mistura dados pessoais. Manter unicidade atual usuário/disciplina evita migrar implicitamente para um sistema multiturma.

### 4. Semestre e ocorrências materializadas

`AcademicTerm`: UUID, user, name, start_date, end_date, timezone. `ClassSchedule`: matrícula, weekday, start_time, end_time, room e vigência. `ClassOccurrence`: matrícula, regra opcional, chave estável de origem, starts_at/ends_at em UTC, room, cancelled, flag de edição individual e replaces opcional. Reposição avulsa usa id próprio. A unicidade da regra e data de origem impede duplicação; não proibir sobreposição entre matérias diferentes, pois alunos podem ter conflitos reais na agenda.

Gerar a recorrência semanal no backend usando datas e zoneinfo já disponíveis. Semestre limitado a 366 dias para limitar expansão, consulta de calendário a 93 dias. Validar horários locais ambíguos/inexistentes por fuso e retornar 400 em vez de escolher silenciosamente um instante. Toda gravação de regra e ocorrências ocorre numa transação, com bloqueio das linhas afetadas e restrições de unicidade para requisições concorrentes.

Edições recalculam ocorrências futuras intocadas; preservam passadas, editadas individualmente e com frequência. Se alteração de semestre excluir ocorrência protegida, responder 409. DELETE de regra marca-a inativa e cancela futuras intocadas. Cancelamento mantém a ocorrência para auditoria; reposição fora das datas do semestre exige primeiro ajustar as datas. Essa política permite início retroativo sem reescrever história ao editar horários.

Alternativa: expandir ocorrências somente em leitura dificultaria ids estáveis, faltas, exceções e edição individual. Não usar Celery, scheduler ou biblioteca de calendário externa para atualizar percentuais.

### 5. Progresso e frequência são medidas distintas

No relógio do servidor, uma ocorrência não cancelada com `ends_at <= now` é ocorrida. Seja T o total válido da matrícula no semestre e E o total ocorrido: `progress_percent = round(100 * E / T)` (nulo se T=0), `classes_remaining = T-E`. Arredondamento decimal de meio para cima, limitado a 0–100. Contagens inteiras preservam precisão; não há inferência de domínio/aprendizagem pelo indicador.

Exemplo de teste, não calendário oficial: semestre 03/08/2026–14/12/2026, segundas 19h–21h, sem exclusões, soma 20 aulas. Em 07/09/2026 às 21h no fuso São Paulo ocorreram 6: 30%, restam 14. Se uma das seis foi cancelada sem reposição, E=5 e T=19; se foi reposta em data futura, E=5 e T=20. Feriados não são presumidos; usuário cancela no calendário.

`Attendance`: ocorrência única, status `present|absent|unrecorded`, updated_at; pode ser campo da ocorrência se isso simplificar integridade sem alterar contrato. Default desconhecido. Percentual de presença considera apenas registros explícitos de aulas ocorridas válidas; pendências aparecem ao lado. Cancelamento exclui do resumo sem apagar registro. Não calcular aprovação nem limite legal de faltas.

Manter `task_progress_percent` com fórmula antiga, independente. Agregar contadores no banco sem uma consulta por disciplina, e ponderar progresso de aulas somente por cargas pessoais com calendário; mostrar cobertura parcial. Frontend atualiza ao voltar para a janela e a cada 60 segundos enquanto visível; relógio do cliente não decide o valor. Testes usam relógio controlado.

### 6. Calendário integrado sem duplicar tarefas

`AcademicEvent`: UUID, user, matrícula opcional, kind, title, description, sala, datas/instantes e all_day. Para dia inteiro, datas locais com fim exclusivo; ausência de fim significa um dia. Para evento pontual, fim ausente coincide com início. Serialização discriminada por all_day evita deslocamento de datas ao converter UTC. Prazo de tarefa segue o instante existente e não é convertido para evento salvo.

O endpoint agregado consulta intervalo [from,to), combina ocorrências, eventos e tarefas do próprio aluno e retorna ids com prefixo de origem, por exemplo `task:<uuid>`, evitando colisões. Canceladas e concluídas conservam estado visual; tarefa sem prazo fica fora. Filtro `kind` aceita `class|task|exam|assignment|other`. Datas de eventos com disciplina usam fuso do semestre; sem disciplina usam America/Sao_Paulo. Calendário oferece detalhe e encaminhamento ao recurso original para edição; nenhuma rota de evento edita cópia de tarefa.

Implementar agenda acessível como base, semana e mês sobre o mesmo conjunto de dados. Usar HTML/CSS e formatação nativa; lista equivalente sempre disponível, evitando dependência de arraste. Não incluir notificações, exportação ou sincronização externa.

### 7. Autorização, contratos e compatibilidade

Reutilizar sessão/CSRF e padrões DRF; querysets e referências de serializers filtrados pelo usuário antes de validar ids. Não buscar professor, matrícula, semestre ou ocorrência em queryset global para depois distinguir propriedade. Retornar 404 para referências alheias e inexistentes, 400 para campos inválidos, 409 para conflitos de histórico.

Implantar backend/frontend juntos: `progress_percent` e `weighted_progress_percent` tornam-se anuláveis e mudam significado; atualizar tipos, fixtures, OpenAPI, textos e todos os consumidores no mesmo commit funcional. `professor_name` pode permanecer derivado para compatibilidade de leitura, mas novas escritas usam professor_id. Novos campos de configuração são opcionais para preservar cadastros existentes. APIs exatas e códigos ficam nas specs.

## Risks / Trade-offs

- Datas/horas declaradas incorretamente → permitir edição com proteção de histórico e identificar dados como pessoais, sem afirmar vínculo oficial.
- Histórico já apagado pelo comportamento anterior → preservar o que ainda existe; não prometer recuperação de registros excluídos sem backup.
- Migração de cargas sem procedência → conservar valores legados, mostrar pendência e exigir declaração do aluno para ponderação.
- Tema incompleto ou contraste insuficiente → auditoria WCAG AA nos dois temas, todos os controles e estados, não apenas filtro de violações críticas.
- Geração concorrente e consultas grandes → transações, unicidade, índices por usuário/matrícula/data, intervalo limitado e agregação de contadores.
- Escopo temporal sem repetição de disciplina em outro semestre → explicar conflito 409 no editor; nova modelagem multisemestre fica como evolução explícita.

## Migration Plan

1. Conferir/sincronizar a base OpenSpec acadêmica existente antes dos deltas novos; não confundir checklist com verificação de comportamento.
2. Criar migrações aditivas para dados novos, índices e campos legados de recuperação; provar execução em SQL Server real e SQLite de testes.
3. Migrar somente professores com nomes conhecidos; horas pessoais e semestres ficam nulos para preenchimento. Preservar ids de matrículas/tarefas e contagens, com teste de migração ida/volta e seed idempotente sem rede.
4. Implantar APIs e frontend juntos, com tutorial de configuração em estados vazios. Atualizar README, AGENTS, contexto OpenSpec e OpenAPI para funcionalidades e limites reais.
5. Reversão operacional: voltar aplicação mantendo tabelas/colunas aditivas e cópia das informações antigas. Antes de reverter esquema removendo dados novos, exportar/validar backup e obter autorização explícita; não executar rollback destrutivo automaticamente.
6. Validar APIs e E2E em SQL Server/Mailpit, privacidade e CSRF, progresso com relógio fixo, temas/teclado/contraste e leitores de tela. Massa de desempenho: aluno com 12 matérias, 1.200 ocorrências e 500 tarefas; medir resumo <1s após aquecimento no ambiente documentado. Registrar limitações de avaliação manual separadamente de evidências automatizadas.
