## Purpose
A capacidade de Leitura Acadêmica permite aos estudantes gerenciar metas diárias de páginas lidas, registrar hábitos de leitura com streaks e acompanhar o progresso de livros e materiais vinculados diretamente a exames e provas universitárias.

## ADDED Requirements

### Requirement: Gerenciamento de Leituras Acadêmicas Vinculadas a Exames
O sistema MUST permitir ao estudante cadastrar, listar, atualizar e arquivar leituras acadêmicas (livros, apostilas, capítulos e artigos), vinculando-as opcionalmente a uma disciplina ativa e a um exame universitário específico (ex.: P1, P2, P3 com especificação do volume de questões e data da prova).

#### Scenario: Cadastro de leitura com vínculo a exame
- **WHEN** o estudante autenticado envia `POST /api/v1/academic-readings` com título do livro, total de páginas, páginas já lidas, disciplina vinculada e detalhes do exame (nome da prova, data e quantidade de questões previstas)
- **THEN** o sistema persiste o registro vinculado exclusivamente ao usuário
- **AND** retorna HTTP 201 com o percentual de leitura calculado, páginas restantes e ritmo sugerido (páginas/dia necessárias até a prova).

#### Scenario: Isolamento de leituras por estudante
- **WHEN** um estudante tenta ler, editar ou excluir leitura pertencente a outro usuário
- **THEN** o sistema retorna HTTP 404 Not Found sem vazar informações.

### Requirement: Registro Diário de Leitura e Tracker de Metas (Streak)
O sistema MUST permitir o registro de páginas lidas em datas específicas, contabilizando o cumprimento da meta diária individual de páginas e mantendo uma sequência ininterrupta de dias de leitura (*streak*).

#### Scenario: Registro rápido de páginas lidas
- **WHEN** o estudante aciona a ação de incremento rápido (+10 páginas) ou informa valor numérico manual em uma leitura
- **THEN** o sistema atualiza o total de páginas lidas da leitura via `POST /api/v1/reading-logs`
- **AND** se o acumulado do dia atingir ou superar a meta diária estabelecida, incrementa ou preserva a sequência (*streak*) ativa
- **AND** o histórico dos últimos 14 dias atualiza imediatamente o gráfico de barras.

#### Scenario: Visualização do gráfico de histórico dos últimos 14 dias
- **WHEN** o estudante acessa o dashboard de leitura
- **THEN** a interface exibe as barras diárias dos últimos 14 dias indicando a quantidade de páginas lidas por dia e a linha de corte da meta estipulada.

### Requirement: Integração entre Leitura e Caderno de Anotações (Textbook)
O sistema MUST disponibilizar no card de cada leitura um atalho direto para criar ou abrir uma nota dedicada no Caderno de Anotações (Textbook).

#### Scenario: Criação de anotação a partir de um livro
- **WHEN** o estudante clica em "Criar anotação da leitura" no card do livro
- **THEN** o sistema redireciona para o Textbook com uma nova nota inicializada com o título da leitura e a disciplina correspondente pré-selecionada.
