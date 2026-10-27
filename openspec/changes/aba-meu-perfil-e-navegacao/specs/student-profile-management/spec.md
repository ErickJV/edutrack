# Spec Delta

## Purpose

Permitir que o estudante visualize suas informações cadastrais e acadêmicas em uma aba dedicada "Meu Perfil" no menu superior, padronizar o rótulo "Início" na navegação principal e possibilitar a alteração do curso matriculado a qualquer momento.

## ADDED Requirements

### Requirement: Padronização do menu superior com Início e Meu Perfil
A navegação principal superior (`AppNavigation`) MUST exibir o rótulo `"Início"` para a rota `/home` (substituindo `"Home"`) e incluir uma aba `"Meu Perfil"` apontando para a rota protegida `/perfil`.

#### Scenario: Navegação principal exibe Início e Meu Perfil
- **WHEN** um estudante autenticado com perfil concluído visualiza o cabeçalho em qualquer página interna
- **THEN** o menu superior exibe o item `"Início"` direcionando para `/home` e o item `"Meu Perfil"` direcionando para `/perfil`

### Requirement: Remoção do bloco de perfil da página Início
A página inicial (`/home`) MUST NOT exibir a seção `"Seu perfil / Informações acadêmicas"` (Graduação, Modalidade e Vínculo), mantendo apenas os blocos de entregas urgentes, métricas do painel acadêmico e gráfico de progresso por disciplina.

#### Scenario: Acesso à página Início sem o cartão de perfil
- **WHEN** o estudante acessa `/home`
- **THEN** a página renderiza as próximas entregas, o painel acadêmico e o desempenho por disciplina, sem exibir o bloco `"Seu perfil / Informações acadêmicas"`

### Requirement: Exibição de dados cadastrais e acadêmicos na aba Meu Perfil
A página `"Meu Perfil"` (`/perfil`) SHALL exibir o nome do aluno (`full_name`), o e-mail cadastrado (`email`), o nome do curso (`course_name`), a modalidade (`modality_label`) e o status de vínculo (`Verificado`).

#### Scenario: Visualização dos dados em Meu Perfil
- **WHEN** o estudante clica na aba `"Meu Perfil"` (`/perfil`)
- **THEN** o sistema exibe o nome completo do aluno, o e-mail institucional cadastrado, o nome do curso atual, a modalidade e o status de vínculo verificado

### Requirement: Alteração de curso pelo estudante na aba Meu Perfil
O sistema SHALL permitir que o estudante autenticado altere o seu curso matriculado (`course_offering_id`) diretamente na aba `"Meu Perfil"` (`/perfil`) por meio da rota `PATCH /api/v1/profile`, retornando HTTP `200 OK` com o objeto de perfil atualizado.

#### Scenario: Alteração de curso com sucesso
- **WHEN** o estudante seleciona uma nova oferta de curso ativa na aba `"Meu Perfil"` e confirma a alteração (`PATCH /api/v1/profile` com `{"course_offering_id": "<uuid>"}`)
- **THEN** o backend atualiza o `course_offering` do usuário, retorna HTTP `200 OK` com os novos dados de `course_offering`, e a interface atualiza imediatamente o curso exibido com mensagem de confirmação

#### Scenario: Tentativa de alterar para curso inexistente ou inativo
- **WHEN** uma requisição `PATCH /api/v1/profile` informa um `course_offering_id` inválido ou inativo
- **THEN** o backend rejeita a alteração com HTTP `400 Bad Request` informando `"Selecione uma graduação ativa."`
