# social-auth-flow Specification

## Purpose
Esta capacidade gerencia a integração de autenticação e cadastro via Google OAuth, garantindo redirecionamentos adequados ao ambiente de execução e a conclusão assistida do perfil com preenchimento de senha e graduação.

## Requirements

### Requirement: Redirecionamento de Retorno OAuth Dinâmico
O sistema DEVE construir e repassar URLs de redirecionamento que preservem o protocolo e o domínio público da aplicação (`impatrack.dev` em produção ou `localhost` em desenvolvimento), nunca redirecionando para `127.0.0.1` quando acessado por domínio público.

#### Scenario: Login com Google em ambiente de produção
- **WHEN** o usuário clica em "Continuar com Google" a partir de `https://impatrack.dev/entrar`
- **THEN** a requisição OAuth é iniciada com URI de callback correspondente ao domínio `https://impatrack.dev`
- **AND** após autorização no Google, o usuário é retornado para `https://impatrack.dev/home` (se já possuir perfil) ou para `https://impatrack.dev/completar-perfil` (se for primeiro acesso).

#### Scenario: Login com Google em ambiente local
- **WHEN** o usuário inicia o fluxo a partir de `http://localhost:5173` ou `http://localhost:8000`
- **THEN** a URI de retorno preserva a porta e o host local informados na requisição.

### Requirement: Conclusão Assistida de Cadastro para Usuário OAuth
Quando um estudante autenticar via Google com e-mail institucional válido `@aluno.impacta.edu.br` pela primeira vez, o sistema DEVE apresentá-lo à tela de conclusão de cadastro com seu nome e e-mail institucional previamente preenchidos e bloqueados para alteração, exigindo apenas a criação de uma senha forte e a escolha de sua graduação e modalidade.

#### Scenario: Primeiro acesso de usuário via Google
- **WHEN** um usuário sem cadastro prévio no EduTrack autentica com sucesso com sua conta Google `@aluno.impacta.edu.br`
- **THEN** a aplicação o direciona para a tela de conclusão de perfil
- **AND** os campos de nome completo e e-mail institucional aparecem já preenchidos
- **AND** o usuário informa sua graduação, aceita os termos e define sua senha local
- **AND** ao enviar o formulário, sua conta é ativada e o acesso ao Dashboard é liberado.
