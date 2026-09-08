## Purpose

Organizar um cadastro privado e reutilizável de professores para que cada estudante associe suas disciplinas às pessoas que ministram as aulas.

## ADDED Requirements

### Requirement: Cadastro pessoal de professores
O sistema MUST oferecer `GET|POST /api/v1/professors` e `GET|PATCH|DELETE /api/v1/professors/{id}` com sessão autenticada e CSRF nas mutações. Entrada: `name` obrigatório (1–120 caracteres após trim); saída: `id`, `name`, `active`. POST retorna 201, consultas/edição 200 e DELETE 204, arquivando o professor e preservando vínculos existentes. Nomes iguais são permitidos; identidade é o id. Dados inválidos retornam 400; anônimo 401; acesso a id inexistente ou alheio 404.

#### Scenario: Criar e reutilizar professor
- **WHEN** o aluno cadastra um professor e o seleciona em duas disciplinas próprias
- **THEN** ambas referenciam o mesmo cadastro pessoal e uma edição de nome aparece em ambas
- **AND** nenhum outro aluno recebe esse cadastro em sua listagem.

#### Scenario: Arquivar professor vinculado
- **WHEN** o aluno arquiva um professor usado em disciplinas
- **THEN** o professor continua identificável nos vínculos existentes e não é oferecido para novos vínculos
- **AND** não são apagadas disciplinas, aulas, eventos ou tarefas.

#### Scenario: Acesso indevido ou entrada inválida
- **WHEN** alguém consulta/edita id de professor alheio ou envia nome vazio
- **THEN** a API responde respectivamente 404 ou 400 e não altera registros.

### Requirement: Interface de professores e migração
A interface MUST oferecer `/professores`, criação direta no editor de disciplina, seleção, edição e arquivamento com estados carregando/vazio/erro e tentativa novamente, temas e acessibilidade desde 360 px. Nomes legados preenchidos MUST ser migrados para cadastros do mesmo aluno sem exposição entre usuários; nomes vazios permanecem sem vínculo. A reversão MUST preservar o texto legado até a migração ser validada.

#### Scenario: Cadastro durante edição de matéria
- **WHEN** o aluno não encontra seu professor e o cria no editor
- **THEN** o novo professor fica selecionado, os demais campos digitados são preservados e o vínculo só é salvo com a confirmação da disciplina.

#### Scenario: Falha na listagem
- **WHEN** carregar professores falha
- **THEN** a tela anuncia o erro e oferece nova tentativa sem exibir a falha como lista vazia.
