## ADDED Requirements

### Requirement: Gerenciamento Individual de Flashcards e Nomenclatura "Cards"
A aba de Flashcards MUST permitir criar, visualizar, editar/atualizar (incluindo frente e verso) e excluir flashcards individuais com confirmação prévia, persistindo todas as operações no banco de dados e atualizando a interface sem recarregamento manual. A interface MUST utilizar as expressões `"Cards"` (em substituição a `"Baralhos (Decks)"`) e `"Todos os Cards"` (em substituição a `"Todos os Baralhos"`).

#### Scenario: Criar, editar e excluir um flashcard individualmente
- **WHEN** o usuário cria um card, edita sua frente/verso ou solicita sua exclusão confirmando a operação
- **THEN** o backend persiste a alteração via `/api/v1/flashcards` ou `/api/v1/flashcards/<id>` e a interface reflete a mudança imediatamente sem recarregar a página

#### Scenario: Exibição consistente da nomenclatura Cards
- **WHEN** o usuário acessa a aba Flashcards
- **THEN** o painel lateral e filtros exibem `"Cards"` e `"Todos os Cards"` de forma consistente

### Requirement: Filtragem de Disciplinas do Semestre Vigente na Aba Anotações
A aba de Anotações MUST exibir somente as disciplinas efetivamente vinculadas ao semestre vigente do estudante, removendo qualquer vínculo ativo ou associação incorreta da disciplina `"Application Data Persistence"` ao semestre atual (2º semestre), preservando as anotações existentes.

#### Scenario: Listagem de disciplinas disponíveis na aba Anotações
- **WHEN** o estudante do 2º semestre consulta os seletores de disciplinas na aba Anotações
- **THEN** apenas as disciplinas ativas do semestre vigente são listadas e `"Application Data Persistence"` não aparece como opção nem permanece associada às anotações do semestre atual

### Requirement: Upload e Leitura Automática de Calendários Acadêmicos em PDF
A aba de Calendário MUST oferecer uma opção discreta para upload de arquivo PDF de calendário acadêmico / plano de aulas vinculado a uma disciplina selecionada, identificando automaticamente as datas das avaliações `AP1`, `AP2`, `PAI 1`, `PAI 2` e `PAI 3` (incluindo variações em algarismos romanos `I`, `II`, `III` e por extenso `Programa de Aprendizagem Interdisciplinar`), apresentando tela de conferência prévia com edição/exclusão e prevenindo duplicidades.

#### Scenario: Upload do PDF de plano de aulas de Programming & Algorithms
- **WHEN** o usuário envia o PDF de calendário acadêmico vinculado à disciplina `Programming & Algorithms`
- **THEN** o sistema identifica `AP1` (`21/09`), `AP2` (`22/10`) e `PAI 2` (`29/10`), ignora menções de `Resolução da AP1` (`24/09`) e textos sem data em `Critérios de Avaliação`, informa que `PAI 1` e `PAI 3` não constam no documento sem inventar datas, e permite conferir, editar ou excluir cada item antes de confirmar o cadastro no Calendário
