## MODIFIED Requirements

### Requirement: Interface Responsiva e Acessível do Dashboard na Home
A tela `/home` MUST consolidar as seções funcionais de métricas ativas, gráfico de progresso por disciplina, feed de entregas e informações do perfil acadêmico do estudante, sem blocos estáticos ou placeholders de recursos futuros. O layout MUST se adaptar desde 360 px até telas desktop com foco acessível e sem overflow horizontal.

#### Scenario: Visualização limpa do rodapé do Dashboard
- **WHEN** o estudante autenticado acessa a Home
- **THEN** a seção inferior renderiza as informações do perfil acadêmico de forma integrada
- **AND** nenhum card provisório de "Próximos passos" é exibido na interface.

#### Scenario: Acesso ao Dashboard em viewport mobile (360 px)
- **WHEN** o estudante acessa a Home em dispositivo móvel
- **THEN** os cards de métricas se reorganizam em grid vertical sem overflow horizontal
- **AND** os elementos de controle mantêm área de toque mínima de 44x44 px e foco visível ao navegar por teclado.
