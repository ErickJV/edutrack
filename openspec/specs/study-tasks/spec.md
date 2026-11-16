# study-tasks Specification

## Purpose
Esta capacidade gerencia as tarefas, entregas e sessões de estudo vinculadas às disciplinas ativas do estudante, incluindo datas limites, status de conclusão e acompanhamento de tempo estimado versus tempo real de execução.

## Requirements

### Requirement: Criação e Edição de Tarefas com Isolamento de Usuário
O sistema MUST permitir a criação, consulta, atualização e remoção de tarefas acadêmicas vinculadas a disciplinas ativas do estudante logado, impedindo que outros usuários visualizem ou alterem suas tarefas.

#### Scenario: Criação de nova tarefa com sucesso
- **WHEN** o estudante autenticado envia `POST /api/v1/tasks` com título, disciplina ativa vinculada (`student_subject_id`), data/hora limite (`due_date`) e tempo estimado em minutos (`estimated_minutes`)
- **THEN** o sistema valida que a disciplina pertence ao estudante autenticado
- **AND** persiste a tarefa com status inicial `pendente` e retorna HTTP 201 Created com o payload da tarefa.

#### Scenario: Tentativa de vincular tarefa à disciplina de outro aluno
- **WHEN** um usuário tenta enviar `student_subject_id` pertencente a outro estudante
- **THEN** o sistema responde com HTTP 404 Not Found ou HTTP 403 Forbidden, sem vazar a existência da disciplina de terceiros.

#### Scenario: Edição e remoção de tarefa existente
- **WHEN** o estudante envia `PATCH /api/v1/tasks/{id}` ou `DELETE /api/v1/tasks/{id}` de uma tarefa criada por ele
- **THEN** o sistema aplica a modificação ou remove o registro com HTTP 200/204
- **AND** quando executado por outro usuário, a resposta DEVE ser HTTP 404 Not Found.

### Requirement: Alternância Rápida de Conclusão de Tarefas
A API e a interface MUST possibilitar marcar uma tarefa como concluída ou reabri-la como pendente de forma imediata, recalculando os índices de progresso da disciplina associada.

#### Scenario: Marcar tarefa como concluída
- **WHEN** o estudante aciona o endpoint `POST /api/v1/tasks/{id}/toggle-complete` ou atualiza status para `concluida`
- **THEN** o sistema registra a data/hora de conclusão (`completed_at`)
- **AND** atualiza o percentual de conclusão da disciplina vinculada proporcionalmente ao total de tarefas
- **AND** responde com HTTP 200 contendo o novo status e as métricas atualizadas.

### Requirement: Registro de Tempo Real de Estudo
O sistema MUST permitir registrar o tempo real gasto na execução de uma tarefa, seja por apontamento manual de minutos dedicados ou por redirecionamento da tarefa para a tela dedicada de Sessão de Estudo Pomodoro, acumulando os minutos dedicados no término dos ciclos de foco.

#### Scenario: Apontamento de tempo real gasto
- **WHEN** o estudante atualiza o campo `actual_minutes` de uma tarefa
- **THEN** o sistema persiste o valor em minutos acumulados
- **AND** calcula o desvio entre tempo estimado e tempo real executado.

#### Scenario: Redirecionamento da tarefa para sessão de estudo Pomodoro
- **WHEN** o estudante clica na ação de iniciar estudo a partir de um card de tarefa na página `/tarefas`
- **THEN** a interface redireciona o usuário para a rota `/estudo` passando o identificador da tarefa como parâmetro
- **AND** a tela de estudo inicializa com a tarefa e a disciplina selecionadas como contexto do Pomodoro
- **AND** ao concluir ciclos de foco na sessão, os minutos transcorridos são persistidos e somados ao `actual_minutes` da respectiva tarefa.

### Requirement: Visualização, Filtros e Acessibilidade na Página de Tarefas
A interface na rota `/tarefas` MUST apresentar a lista de tarefas organizadas por urgência e permitir filtragem por disciplina, por status e por busca textual.

#### Scenario: Filtrar tarefas por disciplina e status
- **WHEN** o usuário seleciona um filtro de matéria específica e status `pendente`
- **THEN** a lista atualiza instantaneamente sem recarregar a página
- **AND** tarefas com prazo vencido recebem destaque visual de alerta com contraste WCAG AA
- **AND** todas as ações interativas possuem navegação fluida por teclado e alvos de toque maiores que 44 px.

### Requirement: Personalização Tipográfica Avançada no Caderno de Anotações
O editor de anotações MUST disponibilizar um seletor de tipografia com suporte a diversas famílias de fontes amplamente utilizadas (Montserrat, Comfortaa, Segoe UI, Arial, Inter, Merriweather e Monospace/Código), aplicando a fonte selecionada tanto na área de digitação quanto no modo de visualização formatada.

#### Scenario: Seleção de fonte pelo usuário
- **WHEN** o estudante abre o menu de fontes e seleciona "Montserrat" ou "Comfortaa"
- **THEN** a fonte do editor e do preview atualiza imediatamente para a família tipográfica escolhida
- **AND** a preferência visual é mantida durante a navegação entre notas da sessão de estudo.

### Requirement: Seletor Livre de Cores com Hexadecimal, Paleta e Conta-gotas
A barra de formatação do editor MUST fornecer um seletor completo de cores com suporte a código hexadecimal (`#RRGGBB`), seletor de cores nativo (círculo/paleta) e conta-gotas (*EyeDropper API* quando disponível), permitindo colorir trechos de texto e aplicar fundos de marca-texto personalizados.

#### Scenario: Aplicação de cor via código hexadecimal ou color picker
- **WHEN** o estudante digita um código hexadecimal ou seleciona uma cor no color picker e confirma para texto ou realce
- **THEN** o editor insere a tag de estilização com a cor especificada
- **AND** o painel de visualização renderiza o texto com a cor exata configurada pelo estudante.

### Requirement: Menu Lateral Retrátil de Pastas e Anotações
A estrutura do Caderno de Anotações MUST oferecer uma barra lateral retrátil (*collapsible sidebar*) que permite ocultar e exibir a listagem de pastas e anotações com botão de controle de fácil acesso e transição suave, maximizando a área de leitura e escrita.

#### Scenario: Retração e expansão do menu lateral de pastas
- **WHEN** o estudante aciona o botão de retração da barra lateral
- **THEN** o painel de pastas e anotações se recolhe, expandindo o editor para ocupar 100% da largura do caderno
- **AND** um botão de reabertura permanece acessível na borda superior/lateral para restaurar a listagem a qualquer momento.

### Requirement: Registro Robusto de Páginas Lidas com Acumulação Diária
O endpoint `POST /api/v1/academic-readings/{id}/log` MUST aceitar o apontamento de páginas lidas suportando as chaves `pages_read` ou `pages`, e a data de leitura através de `date` ou `read_date`. Quando houver mais de um registro na mesma data para uma leitura, a quantidade de páginas DEVE ser acumulada no histórico daquele dia, e o marcador `current_page` da leitura deve ser incrementado até no máximo o total de páginas da obra (`total_pages`).

#### Scenario: Registro rápido de páginas (+10 págs)
- **WHEN** o estudante autenticado aciona o endpoint com `{"pages": 10}`
- **THEN** o sistema atualiza `current_page` somando 10 páginas (respeitando o limite `total_pages`)
- **AND** persiste ou incrementa o `ReadingLog` para a data de hoje com 10 páginas
- **AND** retorna HTTP 200 com os dados atualizados da leitura e o novo percentual de progresso.

#### Scenario: Múltiplos registros de leitura no mesmo dia
- **WHEN** o estudante registra 15 páginas pela manhã e posteriormente 20 páginas à tarde na mesma data
- **THEN** o log daquele dia totaliza 35 páginas lidas
- **AND** a meta diária e o cálculo de sequência (*streak*) refletem a soma acumulada de 35 páginas.

### Requirement: Layout Full-Width e Barra de Foco e Métodos Lado a Lado
A interface da Sessão de Estudo (`/estudo`) MUST utilizar a largura total útil da tela (*full-width* fluido sem limitação restrita de `max-w-7xl`), posicionando no topo os controles de foco (Pomodoro Timer) e o Guia da Metodologia Ativa de Estudo lado a lado em colunas horizontais complementares, destinando todo o espaço inferior ao Caderno de Anotações (*Textbook*).

#### Scenario: Visualização em tela desktop e aproveitamento de tela
- **WHEN** o estudante acessa `/estudo` em uma tela com resolução desktop (>= 1024px)
- **THEN** a interface expande fluidamente por toda a largura horizontal da janela com preenchimento lateral harmônico
- **AND** o Pomodoro Timer é exibido no topo alinhado lado a lado com o seletor/resumo da metodologia de estudo ativa
- **AND** o Caderno de Anotações ocupa 100% da largura útil restante abaixo dos blocos de topo.

#### Scenario: Responsividade em telas menores e mobile
- **WHEN** o usuário acessa `/estudo` em dispositivos móveis (360px a 768px)
- **THEN** os blocos de topo se empilham ordenadamente na vertical mantendo alvos de toque >= 44px
- **AND** a barra lateral de pastas do Caderno é colapsável para priorizar o editor/leitor de texto sem rolagem horizontal indesejada.

### Requirement: Caderno de Anotações com Formatação Rica, Cores, Fontes e Estilos
O editor de anotações (*Textbook*) MUST fornecer uma barra de ferramentas expressiva e diversificada, suportando seleção de cores de texto e marca-texto, escolha de famílias tipográficas (Sans-serif, Serif acadêmica e Monospace), estilos de blocos de destaque (Callouts `[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!IMPORTANT]`), blocos de código, checklists de estudo, tabelas e métricas da nota (palavras, caracteres e tempo de leitura estimado).

#### Scenario: Aplicação de cores e destaque no texto
- **WHEN** o estudante seleciona um trecho no editor e escolhe uma cor de texto ou cor de marca-texto (amarelo, verde, ciano, rosa, roxo ou laranja)
- **THEN** o editor insere a sintaxe correspondente
- **AND** o painel de visualização (*Preview*) renderiza o trecho com a coloração selecionada tanto no tema claro quanto no tema escuro com contraste acessível.

#### Scenario: Alternância de tipografia do editor
- **WHEN** o estudante alterna o estilo de fonte entre "Sans-serif Moderna", "Serif Acadêmica" e "Monospace Código"
- **THEN** a tipografia da área de escrita e do preview atualiza imediatamente conforme a escolha
- **AND** a preferência visual é mantida durante a sessão de estudo.

#### Scenario: Inserção de blocos ricos, callouts e contadores
- **WHEN** o estudante clica nos botões de inserção de Callout temático, tabela ou checklist
- **THEN** o editor injeta o esqueleto formatado na posição do cursor
- **AND** o rodapé do editor exibe em tempo real o total de palavras, caracteres e o tempo estimado de leitura (baseado na média de 200 palavras/min).
