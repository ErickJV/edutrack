# Proposal: Módulo de Estudo com IA Multimodal, RAG Acadêmico e Simulados

## Why

Atualmente, o espaço de anotações do EduTrack suporta cadernos pautados manuais e geração básica de flashcards a partir do texto digitado. No entanto, os estudantes universitários estudam a partir de múltiplos formatos (slides de aula em PDF/PPTX, capítulos de livros, apostilas e roteiros de professores) e precisam de uma ferramenta completa de aprendizagem ativa que centralize seus materiais e gere valor imediato:
- **Sobrecarga de Conteúdo Sem Estruturação**: Ler dezenas de páginas de slides sem um roteiro direcionado leva à retenção superficial.
- **Falta de Citação Rastreável de Fontes**: As ferramentas genéricas de IA frequentemente alucinam ou explicam conceitos sem indicar de qual slide, página ou seção do material do professor aquela definição foi extraída.
- **Fragmentação entre Leitura, Simulados e Flashcards**: O aluno estuda em um leitor avulso, monta simulados em outro site e decora flashcards em outra plataforma, sem que os erros do simulado retroalimentem as revisões e o caderno de anotações.

## What Changes

Transformar a aba **Anotações / Estudo** em um **Módulo de Estudo Inteligente com IA Multimodal (RAG)**:

1. **Upload e Gestão de Documentos Acadêmicos**:
   - Upload de PDFs, apresentações (PDF/slides) e apostilas.
   - Organização automática por **Disciplina** e **Assunto / Pasta de Estudo**.
   - Extração estruturada de texto com metadados de página/slide (`pypdf`).
2. **Leitor e Pesquisa Inteligente Dentro dos Documentos**:
   - Visualizador de documento com busca textual e destaque de trechos.
3. **Copiloto Acadêmico com RAG e Citação Obrigatória de Página/Seção**:
   - Quando o estudante envia um material (ex: apresentação sobre Normalização de Banco de Dados), o copiloto acadêmico identifica os tópicos e oferece uma esteira completa de estudo:
     1. **Resumo Conceitual Estruturado** com citações explícitas de página/seção (ex: `[Slide 4, Seção 1FN]`);
     2. **Explicação de Tópicos Complexos & Exemplos de Aplicação Prática**;
     3. **Identificação e Glossário de Conceitos-Chave**;
     4. **Criação de Mapas Mentais** (renderizados com diagramas visuais interativos);
     5. **Elaboração de Roteiro de Estudos Guiado**;
     6. **Simulado de Verificação de Compreensão com 10 Questões Interativas** (com gabarito comentado, pontuação imediata e diagnóstico de pontos de reforço);
     7. **Geração Direta de Flashcards no Anki** (com front/back objetivos e vinculados ao documento);
     8. **Sugestão de Materiais e Tópicos Complementares** recomendados pela IA.
4. **Banco Pessoal de Anotações**:
   - Possibilidade de salvar qualquer resumo, trecho citado, mapa mental ou questão do simulado diretamente para uma folha do caderno de anotações com um clique.

## Capabilities

### New Capabilities
- `study-documents-rag`: Upload, indexação e extração de páginas de PDFs/documentos com busca semântica e citação rastreável (`documento + página/seção`).
- `study-ai-suite`: Geração de resumos, mapas mentais, simulados de 10 questões com diagnóstico de reforço, roteiros de estudo e sugestões complementares.

## Impact

- **Backend (`backend/apps/academic/`)**:
  - Novo modelo `StudyDocument` e `StudyDocumentChunk` (com número de página, texto extraído e metadados).
  - Novo modelo `StudyQuiz` e `StudyQuizQuestion` para persistência dos simulados interativos e histórico de desempenho do estudante.
  - Endpoints dedicados:
    - `POST /api/v1/study-documents` (upload multipart e extração via `pypdf`).
    - `GET /api/v1/study-documents` e `GET /api/v1/study-documents/{id}`.
    - `POST /api/v1/study-documents/{id}/ai-analyze` (esteira completa: resumo, tópicos complexos, conceitos, mapa mental, roteiro e complementares com citações).
    - `POST /api/v1/study-documents/{id}/ai-quiz` (geração do simulado de 10 questões com gabarito).
- **Frontend (`frontend/src/`)**:
  - Nova aba/submódulo de Documentos e RAG dentro de `StudyNotesWorkspace.tsx` ou visão integrada `StudyHub`:
    - Área de arrastar e soltar (drag & drop) arquivos PDF;
    - Painel do Copiloto de Estudo com visualização em abas: *Resumo*, *Conceitos-Chave*, *Mapa Mental*, *Roteiro*, *Simulado (10 questões)* e *Flashcards Anki*;
    - Citações clicáveis com badges de página (ex: `Pág. 7`);
    - Botão "Salvar no Bloco de Anotações" em cada bloco gerado.
