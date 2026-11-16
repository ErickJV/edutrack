# flashcards-and-notes-quality Specification

## Purpose
TBD - created by archiving change flashcards-ia-raciocinio-profundo-e-correcao-anotacao. Update Purpose after archive.

## Requirements

### Requirement: Normalização ortográfica estrita de "Nova anotação"
O sistema MUST utilizar a grafia correta `"Nova anotação"` como título padrão de qualquer anotação criada sem título personalizado ou cujo título contenha a variante incorreta `"Nova anotaço"`, garantindo consistência no banco de dados, na API e na interface.

#### Scenario: Criação ou salvamento de anotação com título padrão ou grafia incorreta
- **WHEN** uma anotação (`StudyNote`) é criada ou atualizada com título vazio, `"Nova anotaço"` ou `"nova anotaco"`
- **THEN** o sistema normaliza e persiste o título exatamente como `"Nova anotação"`

#### Scenario: Higienização de registros existentes no banco de dados
- **WHEN** existem anotações ou flashcards previamente salvos contendo `"Nova anotaço"` no título ou no enunciado
- **THEN** os registros de `StudyNote` passam a exibir `"Nova anotação"` e os flashcards superficiais gerados com `"Em Nova anotaço..."` são regenerados com perguntas profundas livres do erro ortográfico

### Requirement: Exclusão de títulos genéricos do enunciado das perguntas
O gerador de flashcards por IA (`POST /api/v1/flashcards/generate-ai`) MUST NOT utilizar títulos genéricos de notas (`"Nova anotação"`, `"Nova anotaço"`, `"Sem título"`, `"Anotação de Estudo"`) como nome do tema acadêmico dentro da pergunta gerada.

#### Scenario: Geração de flashcards a partir de uma nota ainda intitulada "Nova anotação"
- **WHEN** o estudante aciona a geração de flashcards por IA em uma anotação cujo título é `"Nova anotação"`
- **THEN** o motor deduz o contexto temático a partir da disciplina vinculada (`StudentSubject.name`) ou dos conceitos centrais do próprio conteúdo, sem jamais produzir enunciados como `"Em Nova anotação, ..."`

### Requirement: Filtragem de expressões conversacionais e metalinguísticas
O analisador de texto de `POST /api/v1/flashcards/generate-ai` MUST distinguir conceitos técnicos reais de expressões introdutórias, conversacionais ou metalinguísticas que precedem dois-pontos (como `"Objetivo"`, `"Temos que considerar diversos fatores"`, `"Nossos modelos"`, `"Observação"`, `"Exemplo"`, `"Importante"`, `"Resumo"`), impedindo que tais fragmentos sejam isolados como se fossem nomenclaturas.

#### Scenario: Anotação contendo frases introdutórias seguidas de dois-pontos
- **WHEN** o texto da anotação contém linhas como `"Objetivo: capturar aspectos da realidade que sejam do interesse da situação"` ou `"Temos que considerar diversos fatores: requisitos, protótipos, tamanho do projeto, tecnologias"`
- **THEN** o motor NÃO gera perguntas superficiais do tipo `'O que significa "Objetivo"?'` ou `'O que significa "Temos que considerar diversos fatores"?'`, mas interpreta a proposição completa para formular questões de raciocínio lógico sobre os fatores, objetivos e implicações técnicas descritos

### Requirement: Elaboração de perguntas profundas orientadas ao raciocínio lógico
O endpoint `POST /api/v1/flashcards/generate-ai` MUST elaborar perguntas que estimulem o raciocínio lógico, a análise crítica de cenários, a relação de causa e efeito, a avaliação de *trade-offs* e a resolução de problemas (níveis de Aplicação, Análise, Avaliação e Síntese da Taxonomia de Bloom), evitando perguntas meramente superficiais de definição de nomenclatura (`"O que significa X?"`).

#### Scenario: Geração de flashcards analíticos sobre critérios, fatores e tomada de decisão
- **WHEN** o conteúdo da anotação aborda fatores de decisão, níveis de abstração ou critérios de validação (como modelagem de software, arquitetura, algoritmos ou teorias acadêmicas)
- **THEN** cada flashcard gerado apresenta na frente (`front`) um problema de raciocínio lógico, análise de *trade-off*, impacto causal ou julgamento de cenário prático, e no verso (`back`) uma resposta estruturada com a justificativa lógica, a relação entre as variáveis e a aplicação prática extraída da anotação
