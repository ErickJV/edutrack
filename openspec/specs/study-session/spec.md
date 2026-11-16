# study-session Specification

## Purpose
Esta capacidade oferece um ambiente imersivo de estudo estruturado composto por timer Pomodoro compacto e minimalista, orientação de metodologias ativas em gaveta colapsável e caderno de anotações ampliado como workspace principal dominante com barra de formatação rica.

## Requirements

### Requirement: Timer Pomodoro Minimalista para Sessões de Estudo
O sistema MUST disponibilizar um timer Pomodoro compacto e minimalista na rota `/estudo` posicionado na coluna lateral de suporte (~25% de largura), exibindo de forma discreta o display do tempo, ações rápidas de controle (Iniciar/Pausar, Pular ciclo), atalho de configurações e contador discreto de pomodoros concluídos.

#### Scenario: Execução em layout minimalista compacto
- **WHEN** o estudante visualiza o timer Pomodoro na coluna lateral
- **THEN** o timer ocupa menos da metade do espaço vertical tradicional, priorizando o Textbook
- **AND** exibe display claro do tempo (ex: `25:00`), alternância rápida entre foco e pausas, e botão de configuração secundário.

### Requirement: Seleção e Orientação de Metodologias Ativas em Gaveta Colapsável
A tela de estudo MUST disponibilizar o guia de metodologias ativas (Método Feynman, Revisão Espaçada, Mapas Mentais, Interrogação Elaborativa) em uma gaveta colapsável (accordion) na coluna lateral, preservando a área central de escrita do usuário.

#### Scenario: Expansão e recolhimento da gaveta de metodologias
- **WHEN** o estudante clica no cabeçalho do accordion de Metodologias Ativas
- **THEN** a gaveta expande para exibir os 4 métodos, seus passos práticos e o botão de inserção de roteiro na anotação ativa
- **AND** quando colapsada, reduz o espaço vertical ocupado na coluna lateral.

### Requirement: Caderno de Anotações Dominante com Rich Text Toolbar (Textbook)
O sistema MUST fornecer o Caderno de Anotações ("textbook") como espaço principal dominante da tela (aproximadamente 75% da largura útil em desktop), expandindo a área de escrita e fornecendo uma barra de formatação rica (Rich Text Toolbar) com suporte a H1, H2, H3, Negrito, Itálico, Highlight/Marca-texto, Checklist (`- [ ]`), Blocos de Citação/Callout, Código e Tabelas simples.

#### Scenario: Utilização da Rich Text Toolbar enriquecida
- **WHEN** o estudante utiliza a barra de ferramentas do editor
- **THEN** pode acionar botões para inserir H3 (`### `), itálico (`*texto*`), highlight/marca-texto (`==texto==`), tabelas (`| Col 1 | Col 2 |`), callouts (`> [!NOTE]`) e checklist
- **AND** o editor aplica a formatação na posição do cursor preservando a escrita contínua.

#### Scenario: Área útil maximizada sem cabeçalho decorativo
- **WHEN** a tela `/estudo` é carregada
- **THEN** nenhum subtítulo decorativo "Ambiente de alta performance" é exibido
- **AND** a área de escrita vertical e horizontal é maximizada para digitação sem distrações.

### Requirement: Timer Pomodoro Configurável para Sessões de Estudo
O sistema MUST disponibilizar um timer Pomodoro na rota `/estudo` que suporte blocos de foco, pausas curtas e pausas longas, permitindo que o estudante configure a duração de cada intervalo conforme suas preferências.

#### Scenario: Execução de ciclo Pomodoro com valores padrão
- **WHEN** o estudante inicia uma sessão de estudo sem customização prévia
- **THEN** o timer inicia no modo de Foco com duração padrão de 25 minutos
- **AND** disponibiliza controles de iniciar, pausar, resetar e alternar para Pausa Curta (padrão 5 minutos) ou Pausa Longa (padrão 15 minutos)
- **AND** emite sinalização visual e sonora/notificação acessível ao término do intervalo.

#### Scenario: Customização dos tempos do Pomodoro pelo usuário
- **WHEN** o estudante acessa o painel de configurações do timer e define novos valores (ex.: 50 min de foco, 10 min de pausa curta e 20 min de pausa longa)
- **THEN** o sistema aplica os novos valores imediatamente aos próximos ciclos
- **AND** persiste as preferências do usuário no armazenamento local ou perfil para sessões futuras.

#### Scenario: Sincronização do tempo de foco com a tarefa vinculada
- **WHEN** o estudante executa o Pomodoro com uma tarefa ativa vinculada e conclui ou pausa o bloco de foco
- **THEN** os minutos completados de foco são enviados para atualização do campo `actual_minutes` da tarefa
- **AND** o progresso do tempo acumulado é refletido sem necessidade de recarregar a página.

### Requirement: Seleção e Orientação de Metodologias Ativas de Estudo
A tela de estudo MUST disponibilizar um seletor para que o aluno escolha a metodologia de estudo ativa a ser empregada durante a sessão, fornecendo diretrizes práticas e passos estruturados da técnica selecionada.

#### Scenario: Seleção de metodologia e exibição do guia prático
- **WHEN** o estudante seleciona uma das quatro metodologias: "Método Feynman", "Revisão Espaçada", "Mapas Mentais" ou "Interrogação Elaborativa"
- **THEN** a interface exibe um card de apoio com a descrição da técnica, os passos a seguir e dicas de aplicação imediata durante o ciclo de foco
- **AND** o estado da metodologia selecionada permanece visível durante todo o bloco de estudo.

### Requirement: Caderno de Anotações Estruturado em Pastas (Textbook)
O sistema MUST fornecer um espaço de caderno de anotações ("textbook") com suporte à criação hierárquica de pastas, criação e edição de notas personalizáveis e persistência segura por estudante autenticado.

#### Scenario: Gerenciamento de pastas de estudo
- **WHEN** o estudante autenticado cria uma nova pasta informando nome e cor/ícone opcional
- **THEN** o sistema persiste a pasta via `POST /api/v1/study-folders` associada exclusivamente à conta do aluno
- **AND** permite renomear, listar e excluir pastas através de `PATCH` e `DELETE /api/v1/study-folders/{id}`.

#### Scenario: Criação e personalização de anotações dentro de pastas
- **WHEN** o estudante cria ou edita uma anotação dentro de uma pasta selecionada
- **THEN** o sistema permite registrar título e conteúdo formatado (estilo Notion com suporte a texto estruturado, tópicos e destaques)
- **AND** salva as alterações via `POST|PATCH /api/v1/study-notes` garantindo isolamento estrito contra acesso de outros usuários.

#### Scenario: Isolamento de pastas e notas entre estudantes
- **WHEN** um usuário tenta acessar, modificar ou excluir pastas ou notas pertencentes a outro estudante
- **THEN** o sistema responde com HTTP 404 Not Found
- **AND** nenhuma informação de terceiros é exposta.
