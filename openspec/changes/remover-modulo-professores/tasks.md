# Tasks

## 1. Telas & Componentes Frontend (Remoção do Módulo Professores e Ajuste da Aba Perfil)

- [x] 1.1 Remover o item `{ to: '/professores', label: 'Professores' }` de `frontend/src/components/AppNavigation.tsx`, alterar `"Meu Perfil"` para `"Perfil"` posicionando-o no extremo oposto da barra (`ml-auto`), retirar a rota `/professores` e a importação de `ProfessorsPage` em `frontend/src/App.tsx`, e excluir o arquivo `frontend/src/pages/ProfessorsPage.tsx`, mantendo o fluxo inline de professores no `SubjectEditModal` da aba `"Disciplinas"`.

## 2. Verificação Ponta a Ponta

- [x] 2.1 Executar verificação de tipos e build do frontend (`tsc -b` e `vite build`), validar que o menu superior não exibe mais `"Professores"` e exibe `"Perfil"` no extremo oposto, e publicar as alterações no GitHub.
