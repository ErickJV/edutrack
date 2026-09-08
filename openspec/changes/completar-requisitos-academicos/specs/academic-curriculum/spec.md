## ADDED Requirements

### Requirement: Informações pessoais e filtros de disciplinas
`PATCH /api/v1/student-subjects/{id}` MUST aceitar `personal_description` de até 5.000 caracteres, vazio permitido, sem substituir a descrição do catálogo. Consultas de matrícula MUST expor descrição pessoal, descrição/nome do catálogo e `start_date`/`end_date` derivados da menor/maior vigência das aulas ou, sem horários, do semestre; sem ambos, nulos. A UI MUST mostrar a origem das datas e direcionar à edição de semestre/horários já existente. Sessão e CSRF obrigatórios; 200 no sucesso, 400 em texto inválido, 401 anônimo, 403 CSRF e 404 para id alheio/inexistente.

`GET /api/v1/student-subjects` MUST aceitar `q` em nome e descrição pessoal, `status`, `from`/`to` para interseção das datas da disciplina, preservando seleção/histórico da dependência. Datas nulas não satisfazem filtro por data; parâmetros inválidos retornam 400. Filtros se combinam por AND e ficam refletidos na URL. Interface MUST distinguir carregamento, vazio e erro, ter ambos os temas, teclado e responsividade desde 360 px.

#### Scenario: Editar descrição privada
- **WHEN** o aluno descreve conteúdos que precisa revisar em sua disciplina
- **THEN** só sua matrícula muda; o catálogo e a matrícula de outra pessoa não recebem a alteração.

#### Scenario: Buscar disciplina em período
- **WHEN** o aluno combina texto, status e intervalo
- **THEN** a lista retorna somente suas matrículas compatíveis com todos os filtros e recupera-os após recarga.

#### Scenario: Migração compatível
- **WHEN** a nova descrição é adicionada a matrículas existentes
- **THEN** inicia vazia, preservando ids, aulas, tarefas e professores; rollback da aplicação mantém a coluna para não perder textos novos.
