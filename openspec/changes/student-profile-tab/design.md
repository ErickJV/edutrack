# Design

## Context
A plataforma EduTrack gerencia alunos da Faculdade Impacta. O modelo `User` possui `full_name`, `email` (institucional `@aluno.impacta.edu.br`), `course_offering` (chave estrangeira para `CourseOffering`), senha Argon2id e controle de onboarding. A API Django REST Framework já expõe `GET /api/v1/profile` e `PUT /api/v1/profile` (este último restrito à conclusão inicial). A interface React utiliza Tailwind CSS 4, componentes em `FormControls.tsx` e contexto global `AuthContext`.

## Goals / Non-Goals
**Goals:**
- Implement Plano de Execução: Nova Aba de Perfil do Estudante e Remoção do Perfil da Home cleanly and reliably

**Non-Goals:**
- Scope outside the core requirements of Plano de Execução: Nova Aba de Perfil do Estudante e Remoção do Perfil da Home

## Decisions
Follow standard modular design conventions for Plano de Execução: Nova Aba de Perfil do Estudante e Remoção do Perfil da Home.
- Ensure clean cutover without redundant backward-compatibility shims.
- Reuse existing project utilities and patterns.

## Risks / Trade-offs
[Unforeseen edge cases or regression] → Mitigation: Comprehensive end-to-end and unit verification tests.
