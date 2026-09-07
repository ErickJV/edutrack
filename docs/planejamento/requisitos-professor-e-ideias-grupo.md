# Requisitos do professor e ideias do grupo

## Origem e finalidade

Documento de rastreabilidade de planejamento, registrado em 07/09/2026 a partir de “Especificação de Negócio: EduTrack AI”, versão 1.0, janeiro de 2026, fornecida pelo usuário nesta conversa. O anexo original foi disponibilizado como `pasted-text.txt`. Este documento resume seus requisitos; não é transcrição literal nem declaração de aceite pelo professor.

As sugestões do grupo abaixo são um backlog de ideias, não funcionalidades implementadas nem compromissos de entrega já aprovados. O usuário escolheu “Requisitos do professor primeiro; ideias do grupo em roadmap”. A proposta `completar-requisitos-academicos` cobre as lacunas do professor após `personalizar-rotina-academica`, que continua com seu escopo próprio e 36 tarefas pendentes.

## Adaptações e decisões conhecidas

- O usuário informou que o professor liberou as tecnologias: manter Django, React/TypeScript e MSSQL. FlutterFlow, Xano, XanoScript, JWT/Xano e Gemini Code Assist constam da especificação original, mas não devem provocar migração da stack ou da sessão Django existente.
- O usuário informou que o professor aceitou a seleção de curso com disciplinas obtidas do catálogo Impacta em lugar de cadastro manual obrigatório. O catálogo é compartilhado; dados pessoais da disciplina pertencem ao aluno.
- O público implementado continua restrito a alunos Impacta. O público mais amplo do documento não autoriza remover a restrição institucional.
- O usuário quer progresso de aulas ocorridas / aulas totais, com frequência separada. O professor descreveu progresso por tarefas concluídas. Preservar ambos com nomes distintos permite atender às duas finalidades; não afirmar que o professor já aprovou eliminar o indicador por tarefas.
- A data inicial 03/08/2026 mencionada pelo aluno não é calendário institucional confirmado; o semestre será configurável.

## Matriz de requisitos da especificação do professor

Estado baseado em inspeção dos artefatos e trechos de código atuais; “existente” não substitui revisão integral ou testes de aceite.

| ID | Requisito original resumido | Situação e encaminhamento |
| --- | --- | --- |
| P01 | Cadastro/login e recuperação de senha | Implementados na base de autenticação; Google é extensão já existente. |
| P02 | Criar/editar/excluir disciplinas privadas: nome, professor, carga, descrição, início/fim | Seleção via catálogo foi aceita pelo professor, segundo usuário. Professor/carga/semestre estão planejados em `personalizar-rotina-academica`. Edição de descrição pessoal e datas específicas por disciplina precisam de conferência de cobertura; catálogo não deve ser editado globalmente por aluno. |
| P03 | Tarefas por disciplina: título, descrição, data prevista e status | CRUD existente; conferir cenários de isolamento e mutação contra contratos. |
| P04 | Tempo estimado/real como evolução futura | Campos e apontamento manual/cronômetro já existem, antecipando a evolução. Confiabilidade de persistência e recarga deve ser verificada antes de insights. |
| P05 | Dashboard com progresso por tarefas concluídas | Existente; manter como “Progresso das tarefas” mesmo com a nova medida de aulas. |
| P06 | Gráficos simples de tempo gasto por disciplina | Há total de minutos, mas o gráfico atual de disciplinas mostra progresso. Falta planejar o gráfico de distribuição de tempo real. |
| P07 | Progresso ponderado e previsão de conclusão pela velocidade atual | Ponderação existe e será adaptada na proposta anterior. Previsão não está especificada; precisa de janela, amostra mínima e tratamento de insuficiência de dados. |
| P08 | Busca/filtros de tarefas e disciplinas por data/status | Filtros de matéria/status existentes. Busca textual/data precisam de cobertura explícita; não concluir atendimento só pelo título da capacidade. |
| P09 | Recomendações por comparação estimado × real | Não encontrada implementação. Definir métricas explicáveis, base mínima, caso estimado zero e indicação de dados insuficientes. O exemplo do professor pode ser calculado em Python, sem depender obrigatoriamente de LLM. |
| P10 | Relatório semanal em PDF via Python | Não encontrado planejamento anterior. Definir semana/fuso, conteúdo e geração sob demanda ou agendada antes de implementação. |
| P11 | Alertas de prazos; push como integração futura | Home tem seção urgente, mas precisa separar tarefas concluídas, atrasadas e prazos futuros. Push não é automaticamente obrigação desta entrega. |
| P12 | Dados privados por usuário e autenticação segura | Sessão Django/CSRF na stack adaptada; todas as expansões precisam manter isolamento por usuário. |
| P13 | APIs abaixo de 2s; escalabilidade para 1.000+ usuários | É requisito não funcional, não evidência de capacidade atual. Definir carga concorrente, massa, ambiente e percentil para teste; 1.000 usuários cadastrados não equivale a 1.000 simultâneos. |
| P14 | Mobile-first, temas claro/escuro e legibilidade | Mobile-first existente; temas já planejados na proposta anterior. |
| P15 | Git/GitHub e documentação viva OpenSpec | Existentes; manter rastreabilidade por mudança e critérios verificáveis. |

## Páginas desejadas pelo grupo

| Página | Comportamento desejado | Relação com o planejamento |
| --- | --- | --- |
| Login | Registro, login, recuperação e Google | Base existente. |
| Home | Tarefas pendentes/em andamento e urgentes com menos de dois dias | Consolidar listas e regra exata: futuras em menos de 48h, atrasadas em categoria própria, concluídas fora dos alertas. |
| Disciplinas | Seleção, progresso, notas e informações | Personalização/progresso na proposta anterior; notas são novo pedido sem fórmula definida. |
| Tarefas | Criar, acompanhar e consultar materiais de estudo | CRUD/tempo existentes; anexos e materiais ainda são expansão. |

## Backlog das ideias do grupo

| ID | Ideia preservada | Dependências e decisões antes de implementação |
| --- | --- | --- |
| G01 | Caderno (“textbook”) por matéria, com anotações vinculadas a um dia de aula | Usar ocorrência do calendário como vínculo opcional. Definir texto, pesquisa, autosave, exclusão e comportamento após cancelar aula. |
| G02 | Escrita manual/desenho com tablet no caderno | Definir suporte a caneta, borracha, desfazer e armazenamento editável de traços; acessibilidade textual e limites de arquivo. Não equivale a OCR. |
| G03 | Upload de PDFs e materiais/anotações nas disciplinas e tarefas | Armazenamento privado, limites, validação de arquivo, acesso autorizado e relação entre documento original e suas referências. |
| G04 | Agente em aba própria com acesso a materiais | Definir provedor/modelo, custo, consentimento para envio e limites. Conteúdo de PDF é dado, não instrução com autoridade sobre ferramentas. |
| G05 | Gerar questões, flashcards e projetos práticos a partir de materiais | Necessita contexto recuperável com referências; usuário revisa e confirma a criação de itens persistentes. |
| G06 | Agente criar tarefas/flashcards e organizar estudos | Escopo de ferramentas limitado ao aluno; confirmação do conteúdo proposto e prevenção de duplicação. |
| G07 | Integrar projetos gerados ao Git/GitHub | Definir exportação de arquivos versus escrita em repositório; vinculação e autorização específica para alterações externas. |
| G08 | Pomodoro, Feynman, revisão espaçada, mapas mentais e interrogação elaborativa | São fluxos distintos. Definir primeiro método, comportamento e relação com registros de tempo antes de reunir tudo num único mecanismo. |
| G09 | Personalizar por foco, como concurso; bancos Vunesp/FGV/Cebraspe | Amplia o produto além do público universitário atual. Definir licenças/acesso a questões e mudança de público em proposta própria. |
| G10 | IA opcional para organizar tópicos das anotações | Nota original preservada, consentimento por ação e revisão das sugestões antes de substituir texto. |
| G11 | Chat entre colegas de turma | Exige conceito de turma/membros, convite, privacidade, bloqueio e moderação; não inferir turma pelo curso e não tornar registros pessoais públicos. |
| G12 | Modo escuro | Já coberto por `personalizar-rotina-academica`; evitar proposta duplicada. |
| G13 | Notas, AP1/AP2 e outras avaliações | O anexo não especifica fórmulas, pesos ou aprovação. Registrar interesse; não inventar regras institucionais. Provas nomeadas AP1/AP2 podem existir no calendário sem módulo de notas. |

## Ordem de execução e roadmap

1. Aplicar a personalização já proposta: horas, professores, semestre, aulas, frequência, calendário e tema.
2. Completar cobertura do professor: busca/data, distribuição de tempo, indicadores separados, insights explicáveis e relatório PDF.
3. Caderno por disciplina e materiais privados, incluindo vínculo com aula; decidir quando incluir escrita manual.
4. Assistente opcional sobre materiais, geração revisada de questões/flashcards e método de estudo inicial.
5. Colaboração/chat, Git externo e novos públicos em mudanças próprias.

## Lacunas a resolver

- Escopo imediato escolhido: requisitos do professor. Caderno, uploads, IA generativa, métodos, chat e notas permanecem no roadmap, sem tarefas de implementação nesta proposta.
- Se houver notas nesta entrega: obter regra de cálculo real ou autorizar expressamente um registro flexível sem cálculo institucional.
- Se houver IA generativa: definir provedor/custos e quais ações o assistente pode propor/executar; nenhuma credencial ou envio de PDF é necessário para esta fase de planejamento.
- A proposta adota 1.000 contas com dados e 50 usuários simultâneos como perfil inicial de teste documentado; não afirma equivalência a 1.000 simultâneos nem aceite formal do professor.

## Pesquisa anterior

Antes deste anexo, a busca em Markdown e no histórico Git encontrou somente a gestão de tarefas (prazos, filtros, conclusão e tempo) e menções a notas como fora do escopo. O anexo agora recebido acrescenta previsão, insights e relatório PDF; continua sem AP1/AP2, pesos de notas, flashcards ou chat. Estes últimos vêm das ideias do grupo e da conversa, não do documento do professor.
