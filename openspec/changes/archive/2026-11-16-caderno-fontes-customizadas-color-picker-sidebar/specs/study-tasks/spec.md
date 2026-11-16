## ADDED Requirements

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
