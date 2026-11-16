# icone-marca-impatrack Spec Delta

## REMOVED Requirements

### Requirement: Logo de marca grande (só ícone) e favicon da aba
**Reason**: A marca deixou de ser apenas o ícone; o cabeçalho agora exibe também o wordmark `Impatrack`.
**Migration**: O componente `Brand` mantém o ícone e o favicon atuais e adiciona o wordmark à direita; nenhum chamador precisa mudar.

## ADDED Requirements

### Requirement: Wordmark Impatrack ao lado do ícone
O componente `Brand` SHALL exibir o texto `Impatrack` imediatamente à direita do ícone da marca, em Montserrat extrabold, com a cor `#0d3950` no tema claro e branco no escuro.

#### Scenario: Cabeçalho autenticado
- **WHEN** qualquer página renderiza o cabeçalho com `Brand`
- **THEN** o ícone e o wordmark aparecem lado a lado e o wordmark mantém contraste nos dois temas
