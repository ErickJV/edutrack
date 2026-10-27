# Tasks

## 1. Telas & Componentes Frontend (Remoção do Módulo Professores, Aba Perfil e Popup de Edição/Remoção de Professor)

- [x] 1.1 Remover o item `{ to: '/professores', label: 'Professores' }` de `frontend/src/components/AppNavigation.tsx`, alterar `"Meu Perfil"` para `"Perfil"` posicionando-o no extremo oposto da barra (`ml-auto`), retirar a rota `/professores` de `frontend/src/App.tsx` e excluir `frontend/src/pages/ProfessorsPage.tsx`.
- [x] 1.2 Adicionar ao lado de `"+ Cadastrar novo"` em `frontend/src/components/SubjectEditModal.tsx` a opção `"Editar"`, abrindo um popup para editar o nome (`updateProfessor`) e/ou remover (`deleteProfessor`) professores cadastrados.

## 2. Verificação Ponta a Ponta

- [x] 2.1 Executar verificação de tipos e build do frontend (`tsc -b` e `vite build`), validar com `openspec validate`, e publicar as alterações no GitHub.
