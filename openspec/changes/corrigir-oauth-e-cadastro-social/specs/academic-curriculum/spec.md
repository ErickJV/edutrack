## ADDED Requirements

### Requirement: Edição de Carga Horária Declarada e Professor na Disciplina Ativa
O sistema DEVE permitir que o estudante personalize a carga horária em horas (de 1 a 2000) e o nome do professor responsável em suas disciplinas ativas (`StudentSubject`), refletindo as alterações imediatamente na interface e nas métricas de progresso.

#### Scenario: Aluno atualiza professor e carga horária de uma matéria
- **WHEN** o estudante autenticado envia `PATCH /api/v1/student-subjects/{id}` com `professor_name` e `workload_hours`
- **THEN** o sistema valida que a matrícula pertence ao estudante logado
- **AND** atualiza os dados locais da matrícula sem alterar a matriz curricular base do curso
- **AND** retorna HTTP 200 com a matrícula atualizada.

#### Scenario: Validação de carga horária inválida
- **WHEN** o estudante envia carga horária menor que 1 ou maior que 2000 horas
- **THEN** a API rejeita a atualização com HTTP 400 Bad Request e mensagem clara de validação.
