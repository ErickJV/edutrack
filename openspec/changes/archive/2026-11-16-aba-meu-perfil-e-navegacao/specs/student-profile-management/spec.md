# Spec Delta

## Purpose

Permitir que o estudante visualize e edite todas as suas informações cadastrais e acadêmicas (nome do aluno, e-mail cadastrado, nome do curso e modalidade) em uma aba dedicada "Perfil" no menu superior, sem exibir campo de "Vínculo", e padronizar o rótulo "Início" na navegação principal.

## ADDED Requirements

### Requirement: Padronização do menu superior com Início e Perfil
A navegação principal superior (`AppNavigation`) MUST exibir o rótulo `"Início"` para a rota `/home` (substituindo `"Home"`) e incluir uma aba `"Perfil"` apontando para a rota protegida `/perfil`.

#### Scenario: Navegação principal exibe Início e Perfil
- **WHEN** um estudante autenticado com perfil concluído visualiza o cabeçalho em qualquer página interna
- **THEN** o menu superior exibe o item `"Início"` direcionando para `/home` e o item `"Perfil"` direcionando para `/perfil`

### Requirement: Remoção do bloco de perfil da página Início
A página inicial (`/home`) MUST NOT exibir a seção `"Seu perfil / Informações acadêmicas"` (Graduação, Modalidade e Vínculo), mantendo apenas os blocos de entregas urgentes, métricas do painel acadêmico e gráfico de progresso por disciplina.

#### Scenario: Acesso à página Início sem o cartão de perfil
- **WHEN** o estudante acessa `/home`
- **THEN** a página renderiza as próximas entregas, o painel acadêmico e o desempenho por disciplina, sem exibir o bloco `"Seu perfil / Informações acadêmicas"`

### Requirement: Exibição de dados cadastrais e acadêmicos na aba Perfil sem campo Vínculo
A página `"Perfil"` (`/perfil`) SHALL exibir o nome do aluno (`full_name`), o e-mail cadastrado (`email`), o nome do curso (`course_name`) e a modalidade (`modality_label`), e MUST NOT exibir o campo `"Vínculo"`.

#### Scenario: Visualização dos dados em Perfil sem Vínculo
- **WHEN** o estudante clica na aba `"Perfil"` (`/perfil`)
- **THEN** o sistema exibe nome do aluno, e-mail cadastrado, nome do curso e modalidade, sem apresentar o item `"Vínculo"`

### Requirement: Edição de todos os campos na aba Perfil
O sistema SHALL permitir que o estudante autenticado altere o nome do aluno (`full_name`), o e-mail cadastrado (`email`), o nome do curso e a modalidade (`course_offering_id`) diretamente na aba `"Perfil"` (`/perfil`) por meio da rota `PATCH /api/v1/profile`, retornando HTTP `200 OK` com o objeto de perfil atualizado.

#### Scenario: Alteração dos campos do perfil com sucesso
- **WHEN** o estudante edita nome, e-mail, curso e/ou modalidade na aba `"Perfil"` e confirma a alteração (`PATCH /api/v1/profile`)
- **THEN** o backend atualiza os dados do usuário, retorna HTTP `200 OK` com o perfil atualizado e a interface reflete os novos valores imediatamente
