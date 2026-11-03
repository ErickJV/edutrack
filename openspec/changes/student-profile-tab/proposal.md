# Proposal

## Why
A plataforma EduTrack gerencia alunos da Faculdade Impacta. O modelo `User` possui `full_name`, `email` (institucional `@aluno.impacta.edu.br`), `course_offering` (chave estrangeira para `CourseOffering`), senha Argon2id e controle de onboarding. A API Django REST Framework já expõe `GET /api/v1/profile` e `PUT /api/v1/profile` (este último restrito à conclusão inicial). A interface React utiliza Tailwind CSS 4, componentes em `FormControls.tsx` e contexto global `AuthContext`.

## What Changes
- **Remoção na Home**: Remoção da seção `"Seu perfil"` / `"Informações acadêmicas"` e do ícone não utilizado `GraduationCap` em `frontend/src/pages/HomePage.tsx`.
- **Navegação Global**: Adição do item `"Perfil"` apontando para `/perfil` na barra de navegação principal em `frontend/src/components/AppNavigation.tsx`.
- **Rotas da Aplicação**: Registro da rota protegida `/perfil` renderizando `ProfilePage` em `frontend/src/App.tsx`.
- **Nova Tela de Perfil**: Criação de `frontend/src/pages/ProfilePage.tsx` contendo:
  - Cabeçalho padronizado (Brand, ThemeToggle, LogOut e AppNavigation);
  - Banner hero institucional ("Meu Perfil");
  - Card de informações acadêmicas e cadastrais atuais (Graduação, Grau, Modalidade, E-mail, Vínculo Verificado);
  - Formulário para atualização de Nome Completo e Curso/Modalidade de Graduação;
  - Formulário para alteração de E-mail Institucional (@aluno.impacta.edu.br);
  - Formulário para alteração de Senha (com validação de senha atual quando aplicável) ou definição de senha para contas originadas via Google OAuth;
  - Seção de preferências de sessão ("Manter conectado por 14 dias") e links institucionais/legais.
- **Novos Endpoints e Serializadores Backend**:
  - `PATCH /api/v1/profile`: Atualização parcial de nome completo, graduação (`course_offering_id`) e e-mail institucional via `ProfileUpdateSerializer`.
  - `POST /api/v1/profile/password`: Alteração ou definição de senha com suporte a contas sociais e atualização do hash de sessão (`update_session_auth_hash`) via `ChangePasswordSerializer`.
- **Cliente de API e Tipos Frontend**:
  - Adição de `ProfileUpdatePayload` e `ChangePasswordPayload` em `frontend/src/api/types.ts`.
  - Implementação das funções `updateProfile()` e `changePassword()` em `frontend/src/api/client.ts`.

## Capabilities

### New Capabilities
- `student-profile-tab`: Implements capabilities and behavior for Plano de Execução: Nova Aba de Perfil do Estudante e Remoção do Perfil da Home

### Modified Capabilities

## Impact
- `backend/apps/accounts/serializers.py`: Classes `ProfileUpdateSerializer` e `ChangePasswordSerializer`.
- `backend/apps/accounts/views.py`: Adição do método `patch` em `ProfileView` e criação da classe `ChangePasswordView`.
- `backend/apps/accounts/urls.py`: Mapeamento de `profile/password`.
- `frontend/src/components/AppNavigation.tsx`: Array `NAV_ITEMS`.
- `frontend/src/pages/HomePage.tsx`: Remoção da seção `academic-profile`.
- `frontend/src/pages/ProfilePage.tsx`: Novo componente com formulários de edição e dados acadêmicos.
- `frontend/src/App.tsx`: Definição da rota protegida `/perfil`.
