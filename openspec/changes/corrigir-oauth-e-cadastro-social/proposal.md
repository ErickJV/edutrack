## Why

O login e cadastro com Google OAuth apresenta duas falhas operacionais: após a seleção da conta Google, o redirecionamento é enviado para `127.0.0.1` em vez do domínio oficial da aplicação (`impatrack.dev`), e novos usuários sem cadastro prévio não completam o registro com as informações puxadas do e-mail institucional. Além disso, os estudantes precisam ajustar a carga horária e informar o professor de cada matéria cursada.

## What Changes

- Corrigir a montagem do redirect OAuth no backend e frontend para respeitar a origem pública da aplicação (`FRONTEND_URL` / cabeçalho `Host` público), garantindo retorno correto tanto em produção (`impatrack.dev`) quanto no desenvolvimento local.
- No primeiro acesso via Google OAuth com e-mail institucional válido `@aluno.impacta.edu.br`, caso o aluno ainda não tenha conta ou perfil concluído, direcioná-lo para a tela de cadastro/conclusão de perfil com nome e e-mail institucional já preenchidos e protegidos, solicitando apenas a definição de senha e a seleção da graduação/modalidade.
- Implementar a edição da carga horária declarada e do nome do professor diretamente no cartão ou modal da disciplina ativa, atualizando os cálculos de progresso e carga horária do estudante.

## Capabilities

### New Capabilities
- `social-auth-flow`: redirecionamento dinâmico por ambiente (local e produção) e finalização assistida de cadastro para novos usuários OAuth.

### Modified Capabilities
- `academic-curriculum`: suporte à personalização da carga horária e do professor da disciplina pelo estudante.

## Impact

- **Backend:** Ajustes no `EduTrackSocialAccountAdapter` e nas configurações do Django Allauth/DRF para repassar dados da sessão social e permitir definir senha e oferta de curso; endpoint de atualização parcial da matrícula (`PATCH /api/v1/student-subjects/{id}`).
- **Frontend:** Atualização do `ProfileCompletionPage` e `GoogleButton` para receber os dados do fluxo OAuth, pré-preencher nome e e-mail e exigir senha e graduação; adição do botão de edição de professor e carga horária nos cards de `/disciplinas`.
- **Banco:** Utilização dos modelos `StudentSubject` e `User` já existentes, sem perda de dados.
- **Segurança:** Manutenção da restrição estrita de e-mail institucional `@aluno.impacta.edu.br`, CSRF preservado e isolamento estrito por usuário.
- **Operação:** Nenhuma nova dependência; compatível com SQLite local, MSSQL e proxy Caddy no Azure.
