# Proposal: Elaboração Criteriosa de Flashcards por Raciocínio Lógico e Correção Ortográfica de "Nova anotação"

## Why

Ao utilizar a geração de flashcards por IA a partir do caderno de anotações, dois problemas prejudicaram a qualidade pedagógica e visual da funcionalidade:

1. **Perguntas Superficiais Baseadas em Fragmentos de Texto e Definição Mecânica**:
   O motor atual de geração (`FlashcardAIGenerateView`) dividia qualquer frase contendo dois-pontos (`:`) e transformava o trecho à esquerda no "conceito" de uma pergunta padronizada do tipo *"Em {título}, o que significa e como se aplica '{fragmento}'?"*. Isso gerou perguntas superficiais ou truncadas a partir de expressões conversacionais da nota (por exemplo: *"Em Nova anotaço, o que significa e como se aplica 'Temos que considerar diversos fatores'?"* ou *"o que significa e como se aplica 'Nossos modelos'?"*), limitando o estudo à memorização mecânica de nomenclaturas em vez de estimular o raciocínio lógico, a análise de causa e efeito, a avaliação de *trade-offs* e a resolução de problemas práticos.

2. **Erro Ortográfico em `"Nova anotaço"` e Uso Indevido de Títulos Genéricos como Tema**:
   Registros de notas e cartões apresentaram a grafia incorreta `"Nova anotaço"` (sem o `"ã"` de `"Nova anotação"`). Além disso, quando o estudante ainda não havia renomeado uma anotação recém-criada (`"Nova anotação"`), o gerador utilizava esse título genérico como se fosse o assunto acadêmico da pergunta (*"Em Nova anotação, ..."*).

## What Changes

- **Correção e Normalização de `"Nova anotação"`**:
  - Garantir que o título padrão no backend (`StudyNote`), nos serializers e no frontend (`StudyNotesWorkspace.tsx`) seja rigorosamente `"Nova anotação"`, normalizando automaticamente variações com erro de digitação (`"Nova anotaço"`, `"nova anotaco"`) ao salvar ou atualizar notas.
  - Higienizar os registros existentes no banco de dados (`StudyNote` e `Flashcard`) que contenham `"Nova anotaço"`.
- **Inferência Inteligente de Contexto e Filtro de Títulos Genéricos**:
  - Impedir que títulos genéricos (`"Nova anotação"`, `"Sem título"`, `"Anotação de Estudo"`) sejam inseridos no enunciado das perguntas dos flashcards. Quando o título da nota for genérico, o motor deduzirá o tema real a partir da disciplina vinculada (`StudentSubject.name`), dos subtítulos da anotação ou da tese central do texto.
- **Motor Criterioso de Elaboração de Perguntas por Raciocínio Lógico (Taxonomia de Bloom — Aplicação, Análise, Avaliação e Síntese)**:
  - Reformular `POST /api/v1/flashcards/generate-ai` com uma arquitetura híbrida de dois níveis:
    1. **Integração com LLM (`AntigravityClient` / Gemini) com Prompt Socrático Analítico** quando credenciais estiverem ativas, exigindo perguntas de raciocínio lógico, análise de cenários, relações de causa e efeito, *trade-offs* e pensamento contrafactual, proibindo perguntas superficiais do tipo *"O que é X?"*.
    2. **Motor Analítico Semântico Determinístico de Alta Profundidade**:
       - Filtrar prefixos conversacionais/metalinguísticos antes de dois-pontos (como *"Objetivo"*, *"Temos que considerar diversos fatores"*, *"Nossos modelos"*, *"Observação"*, *"Importante"*, *"Resumo"*) para nunca tratá-los como termos isolados de nomenclatura.
       - Sintetizar perguntas profundas estruturadas em quatro eixos cognitivos:
         - **Análise de Variáveis e Tomada de Decisão em Cenário Real** (como múltiplos fatores interagem e qual o impacto de negligenciá-los);
         - **Raciocínio de Trade-off e Equilíbrio de Abstração** (tensão entre detalhamento, simplicidade, manutenção e evolução);
         - **Avaliação Crítica e Critério de Aderência** (como validar se um modelo ou solução resolve o problema real sem sobre-engenharia ou sub-especificação);
         - **Dedução de Causa, Efeito e Pensamento Contrafactual** (por que uma premissa técnica conduz a determinada consequência e o que ocorre se essa premissa for violada).

## Capabilities

### New Capabilities
- `flashcards-and-notes-quality`: Geração criteriosa de flashcards orientada ao raciocínio lógico profundo (cenários, trade-offs, causa e efeito, avaliação crítica), inferência semântica de domínio sem uso de títulos genéricos e normalização ortográfica de `"Nova anotação"`.

### Modified Capabilities
- Nenhuma capability existente em `openspec/specs/` requer quebra de contrato.

## Impact

- **Backend (`backend/apps/academic/models.py`, `backend/apps/academic/serializers.py`, `backend/apps/academic/views.py`)**:
  - Normalização automática de `"Nova anotaço"` para `"Nova anotação"` em `StudyNote`.
  - Reescrita completa do analisador semântico e gerador de perguntas em `FlashcardAIGenerateView` + integração com `AntigravityClient` (`backend/apps/assistant/antigravity.py`).
  - Atualização/higienização das notas e flashcards existentes no banco de dados.
- **Frontend (`frontend/src/components/StudyNotesWorkspace.tsx`, `frontend/src/components/FlashcardsPage.tsx`)**:
  - Garantia de `"Nova anotação"` em todos os pontos de criação/exibição e atualização da descrição do modal de geração por IA para refletir a abordagem analítica e de raciocínio lógico.
