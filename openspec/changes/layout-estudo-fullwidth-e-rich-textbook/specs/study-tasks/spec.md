## ADDED Requirements

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
