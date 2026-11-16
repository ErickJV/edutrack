# Spec: Módulo de Estudo com IA Multimodal, RAG Acadêmico e Simulados

## ADDED Requirements

### Requirement: Upload e Extração de Documentos com Rastreamento por Página
O sistema MUST permitir o envio de arquivos de estudo em PDF (e apresentações exportadas em PDF), extraindo o conteúdo textual estruturado página a página com metadados para busca e citação.

#### Scenario: Envio de apresentação ou apostila em PDF
- **WHEN** o estudante faz upload de um arquivo PDF vinculado ou não a uma disciplina
- **THEN** o backend processa o arquivo via `pypdf`, armazena os metadados do documento (`StudyDocument`), salva os trechos individuais com o número exato da página (`page_number`) e retorna o documento pronto para análise

### Requirement: Citação Obrigatória de Documento e Página nas Respostas da IA
Toda e qualquer análise, resumo, resposta ou explicação gerada pela IA a partir de um documento do estudante MUST indicar explicitamente o nome do documento e a página ou seção de onde o conceito foi extraído.

#### Scenario: Geração de resumo e explicação de conceitos
- **WHEN** o estudante solicita a análise de um documento (ex: Normalização de Banco de Dados)
- **THEN** o copiloto IA formula o resumo e as explicações incluindo referências de citação no formato `[Nome do Documento - Pág. X]` ou `[Slide X]`, permitindo ao estudante auditar a fonte primária

### Requirement: Esteira Pedagógica Completa por IA (6 Pilares)
Ao acionar a análise de um documento acadêmico, o sistema MUST disponibilizar os seguintes produtos cognitivos:
1. Resumo estruturado dos conceitos;
2. Explicação dos tópicos mais complexos com exemplos práticos de aplicação;
3. Glossário de conceitos-chave essenciais;
4. Mapa mental estruturado (em formato hierárquico / mermaid / visual);
5. Roteiro de estudos guiado por objetivos;
6. Sugestões de assuntos e temas que necessitam de reforço / aprofundamento.

#### Scenario: Processamento de apresentação sobre Normalização de Dados
- **WHEN** o estudante aciona o copiloto sobre a apresentação de normalização
- **THEN** o sistema exibe os conceitos de 1FN, 2FN, 3FN e BCNF com exemplos de tabelas, o mapa mental das dependências funcionais, o roteiro de revisão e indica quais tópicos exigem maior atenção

### Requirement: Simulados Interativos de Verificação com 10 Questões
O sistema MUST ser capaz de gerar um simulado de 10 questões de múltipla escolha ou discursivas baseadas no documento enviado, permitindo ao estudante responder, receber correção imediata e diagnóstico dos pontos fracos.

#### Scenario: Resolução de simulado de 10 questões
- **WHEN** o estudante clica em "Gerar Simulado de 10 Questões"
- **THEN** o sistema gera as 10 questões com alternativas, exibe a interface de teste interativo, calcula a nota ao finalizar e apresenta a justificativa comentada com citação da página correspondente de cada questão

### Requirement: Geração Direta de Flashcards e Integração com Bloco de Anotações
O estudante MUST poder converter os pontos centrais do documento em flashcards no sistema Anki existente com um clique, e também salvar qualquer síntese gerada para o seu caderno de anotações pessoal.

#### Scenario: Adição de flashcards ao baralho da disciplina
- **WHEN** o estudante clica em "Adicionar Flashcards ao Anki" no painel do documento
- **THEN** novos flashcards objetivos e diretos são criados no baralho da disciplina correspondente, prontos para a repetição espaçada
