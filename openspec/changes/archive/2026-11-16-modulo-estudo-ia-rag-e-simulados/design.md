# Design: Módulo de Estudo com IA Multimodal, RAG Acadêmico e Simulados

## Context

O estudante utiliza a plataforma EduTrack para gerenciar sua vida acadêmica. Para tornar a sessão de estudo de fato inteligente, precisamos transformar a área de anotações em um hub cognitivo que acolha os arquivos reais de estudo (PDFs de aulas, apresentações de professores, apostilas) e aplique inteligência artificial rastreável e interativa.

## Architecture & Data Model

### 1. Modelos no Backend (`backend/apps/academic/models.py`)

- **`StudyDocument`**:
  - `id`: UUID
  - `user`: ForeignKey(User)
  - `student_subject`: ForeignKey(StudentSubject, null=True, blank=True)
  - `folder`: ForeignKey(StudyFolder, null=True, blank=True)
  - `title`: CharField(max_length=255)
  - `file`: FileField(upload_to="study_documents/%Y/%m/")
  - `file_type`: CharField(max_length=20, default="pdf")
  - `page_count`: PositiveIntegerField(default=0)
  - `file_size_bytes`: PositiveIntegerField(default=0)
  - `extracted_text`: TextField(blank=True) # texto completo consolidado
  - `summary_ai`: JSONField(default=dict, blank=True) # armazena o cache da análise cognitiva (resumo, tópicos complexos, conceitos, mapa mental, roteiro, reforço)
  - `created_at`, `updated_at`

- **`StudyDocumentPage`**:
  - `id`: UUID
  - `document`: ForeignKey(StudyDocument, related_name="pages")
  - `page_number`: PositiveIntegerField() # página 1, 2, ... ou slide 1, 2...
  - `content`: TextField()
  - `token_count_approx`: PositiveIntegerField(default=0)

- **`StudyQuiz`**:
  - `id`: UUID
  - `user`: ForeignKey(User)
  - `document`: ForeignKey(StudyDocument, null=True, blank=True, related_name="quizzes")
  - `student_subject`: ForeignKey(StudentSubject, null=True, blank=True)
  - `title`: CharField(max_length=255)
  - `score_percent`: FloatField(null=True, blank=True)
  - `questions_data`: JSONField() # Array de 10 questões com alternativas, gabarito, explicação e citação de página
  - `completed_at`: DateTimeField(null=True, blank=True)
  - `created_at`: DateTimeField(auto_now_add=True)

### 2. Pipeline de Extração e IA com Citação Rastreável

1. **Ingestão Local Zero-Dependência Externa**:
   - Uso de `pypdf` para extrair o texto de cada página e armazenar os chunks associados ao `page_number`.
2. **Motor de IA Multimodal (Gemini 3.8 Flash via `AntigravityClient` com Fallback Analítico)**:
   - O prompt instrui o modelo a analisar as páginas indexadas e retornar um JSON estrito com:
     - `summary`: Lista de tópicos com citação explícita `[Pág. X]`;
     - `complex_topics`: Tópicos difíceis com explicação simples e exemplos de código ou projeto real;
     - `key_concepts`: Glossário termo -> definição + página;
     - `mindmap`: Estrutura hierárquica e diagrama Mermaid renderizável visualmente;
     - `study_roadmap`: Plano de estudo passo a passo (30 min / 1h / 2h);
     - `reinforcement_topics`: Pontos de atenção e armadilhas que mais caem em provas;
     - `quiz_10`: 10 questões de múltipla escolha para autoavaliação com citação exata de página;
     - `suggested_flashcards`: Cartões prontos para o Anki.
   - Em ambiente offline ou sem token, um motor analítico semântico extrai os títulos de slides, listas numeradas, termos em destaque e formula o roteiro, glossário e simulado determinístico mantendo as citações de página.

### 3. Frontend: Experiência Integrada

- No topo do caderno de anotações (`StudyNotesWorkspace.tsx`), adicionar a aba **"Materiais & Documentos IA"** ao lado de *"Anotações"* e *"Leituras"*.
- Área de dropzone elegante para upload instantâneo de PDF.
- Menu lateral dos documentos da matéria com visualização do arquivo e botão *"✨ Analisar com IA"*.
- Painel com abas organizadas:
  - 📑 **Resumo & Conceitos** (com badges clicáveis de páginas);
  - 🧠 **Mapa Mental** (diagrama interativo);
  - 🎯 **Simulado 10Q** (interface interativa de resolução de prova com pontuação e correção);
  - 🎴 **Gerar Flashcards Anki**;
  - 📝 **Exportar para o Caderno de Anotações** (adiciona os resumos ou mapa mental na folha pautada atual com um clique).
