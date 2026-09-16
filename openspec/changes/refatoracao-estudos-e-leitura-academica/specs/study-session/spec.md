## Purpose
Esta capacidade oferece um ambiente imersivo de estudo estruturado composto por timer Pomodoro compacto e minimalista, orientação de metodologias ativas em gaveta colapsável e caderno de anotações ampliado como workspace principal dominante com barra de formatação rica.

## ADDED Requirements

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
