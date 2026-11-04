# Tasks: Módulo de Estudo com IA Multimodal, RAG Acadêmico e Simulados

## 1. Backend: Modelos, Ingestão de Documentos (pypdf) e RAG por Página

- [x] 1.1 Criar modelos `StudyDocument`, `StudyDocumentPage` e `StudyQuiz` em `backend/apps/academic/models.py` e executar migrações.
- [x] 1.2 Implementar serializers e views em `backend/apps/academic/views.py`:
  - `POST /api/v1/study-documents` (upload e extração de páginas com `pypdf`);
  - `GET /api/v1/study-documents` e `GET /api/v1/study-documents/{id}`;
  - `POST /api/v1/study-documents/{id}/ai-analyze` (esteira de resumo, tópicos complexos, conceitos, mapa mental, roteiro e reforço com citações de página);
  - `POST /api/v1/study-documents/{id}/ai-quiz` (geração de simulado com 10 questões e correção interativa).

## 2. Frontend: Hub de Materiais, Copiloto de Documentos e Simulados

- [x] 2.1 Adicionar clientes de API em `frontend/src/api/client.ts` e tipos em `frontend/src/api/types.ts` para documentos de estudo, análise e simulados.
- [x] 2.2 Implementar componente `StudyDocumentsHub.tsx` integrado ao bloco de anotações (`StudyNotesWorkspace.tsx`):
  - Upload drag-and-drop de PDFs de apresentações/aulas;
  - Visualização de documentos com busca por página;
  - Abas cognitivas do Copiloto IA (Resumo com citações `[Pág. X]`, Tópicos Complexos, Mapa Mental visual, Roteiro e Simulador com 10 questões);
  - Botão de envio dos flashcards gerados para o módulo Anki e exportação de notas para o caderno pautado.

## 3. Testes Automatizados e Validação

- [x] 3.1 Criar testes em `backend/apps/academic/tests.py` validando extração de PDFs, citações rastreáveis por página e geração de simulado de 10 questões.
- [x] 3.2 Executar build de produção do frontend (`npm run build`) e smoke verification.
