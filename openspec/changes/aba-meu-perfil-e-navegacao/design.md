# Design

## Context

Atualmente o cabeçalho compartilhado entre as páginas autenticadas (`HomePage`, `SubjectsPage`, `ProfessorsPage`, `TasksPage`, `StudySessionPage`) utiliza o componente `AppNavigation` (`frontend/src/components/AppNavigation.tsx`), cujo primeiro item possui o rótulo `"Home"`. Na `HomePage` (`frontend/src/pages/HomePage.tsx`), existe uma seção final estática (`aria-labelledby="academic-profile"`) que mostra Graduação, Modalidade e Vínculo. No backend (`backend/apps/accounts/`), o endpoint `PUT /api/v1/profile` (`ProfileView`) utiliza `ProfileCompletionSerializer`, que bloqueia novas chamadas caso `profile_complete` já seja verdadeiro (`"O perfil já foi concluído."`).

## Goals / Non-Goals

**Goals:**
- Substituir `"Home"` por `"Início"` e adicionar a aba `"Meu Perfil"` (`/perfil`) em `AppNavigation`.
- Remover a seção `"Seu perfil / Informações acadêmicas"` de `HomePage.tsx`.
- Criar a página `ProfilePage.tsx` (`/perfil`) exibindo nome do aluno, e-mail cadastrado, curso atual (nome, modalidade, vínculo) e seletor para alterar o curso.
- Adicionar suporte a `PATCH /api/v1/profile` no backend para atualizar o curso (`course_offering_id`) e opcionalmente o nome (`full_name`) de estudantes com perfil já concluído.

**Non-Goals:**
- Alteração de e-mail institucional cadastrado (o e-mail `@aluno.impacta.edu.br` permanece como identificador de vínculo).
- Exclusão automática de disciplinas ou tarefas anteriores ao trocar de curso.

## Decisions

1. **Endpoint `PATCH /api/v1/profile` com `ProfileUpdateSerializer`**:
   - *Decisão*: Manter `PUT /api/v1/profile` intacto para o fluxo de onboarding (`ProfileCompletionPage`) e adicionar o método `PATCH` em `ProfileView` utilizando `ProfileUpdateSerializer` (`course_offering_id` obrigatório/opcional e `full_name` opcional).
   - *Racional*: Evita quebrar o contrato de conclusão de perfil inicial (que exige `accept_legal` e definição de senha quando aplicável) e oferece uma operação limpa para atualização de curso na aba `"Meu Perfil"`.

2. **Página dedicada `ProfilePage` (`/perfil`) seguindo o layout padrão das páginas autenticadas**:
   - *Decisão*: Estruturar `ProfilePage.tsx` com o mesmo cabeçalho (`Brand`, `ThemeToggle`, botão `Sair` e `AppNavigation`) das demais páginas protegidas, apresentando os cartões de dados do aluno (nome, e-mail, curso, modalidade, vínculo) e o formulário de troca de curso alimentado por `listCourseOfferings()`.
   - *Racional*: Mantém consistência visual mobile-first e reutiliza `listCourseOfferings()`, `Select`, `PrimaryButton`, `Alert` e `useAuth().setUser` já existentes no código.

## Risks / Trade-offs

- **[Risk] Estudante possui disciplinas matriculadas do curso anterior ao trocar de curso** → **Mitigação**: Atualizar apenas o vínculo de `course_offering` no perfil do usuário sem apagar o histórico acadêmico existente; o catálogo de novas disciplinas passa a refletir imediatamente o novo curso selecionado.
