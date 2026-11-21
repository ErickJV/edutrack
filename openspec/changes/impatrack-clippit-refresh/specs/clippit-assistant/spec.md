# clippit-assistant Spec Delta

## REMOVED Requirements

### Requirement: Clippit Assistant Felix Rieseberg Style com autenticação local
**Reason**: A autenticação via OAuth local do provedor anterior e o modelo usado por ele foram substituídos por uma chave de API do servidor, e nenhum nome de provedor ou modelo é exposto ao usuário final.
**Migration**: O assistente agora usa `DEEPSEEK_API_KEY` no backend (endpoint compatível com OpenAI) e a interface não exibe provedor nem modelo; clientes que enviavam o header customizado de token do provedor anterior devem parar de enviá-lo.

## ADDED Requirements

### Requirement: Clippit usa chave de API do servidor sem expor o provedor
O assistente Clippit SHALL obter a credencial exclusivamente de `DEEPSEEK_API_KEY` no backend e MUST NOT expor nome de provedor ou modelo em respostas, status ou interface. As chamadas SHALL usar o endpoint compatível com OpenAI `/chat/completions`, enviando prompt de sistema, histórico e o contexto acadêmico do usuário autenticado.

#### Scenario: Chave configurada
- **WHEN** um aluno autenticado envia uma mensagem com `DEEPSEEK_API_KEY` definida
- **THEN** o backend chama o endpoint de chat e retorna a resposta do assistente com animação, sem metadados de modelo

#### Scenario: Chave ausente
- **WHEN** `DEEPSEEK_API_KEY` está vazia
- **THEN** o backend responde 200 com mensagem amigável do Clippit e nenhuma chamada externa é feita

### Requirement: Janela do Clippit sem ruídos e em paleta clara
A janela do Clippit SHALL omitir o selo `Copiloto Impatrack`, o indicador `Online` e o rodapé com atalhos/modelo. Balões e o quadro do avatar SHALL usar superfícies brancas ou cinza-claras com acentos teal do tema, sem amarelo/laranja.

#### Scenario: Abrir a janela
- **WHEN** o aluno abre o widget do Clippit
- **THEN** os três elementos removidos não aparecem e os balões exibem fundo branco/claro
