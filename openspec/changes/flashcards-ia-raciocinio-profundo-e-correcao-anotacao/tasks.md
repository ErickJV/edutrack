# Tasks: Elaboração Criteriosa de Flashcards por Raciocínio Lógico e Correção de "Nova anotação"

## 1. Normalização Ortográfica de "Nova anotação" no Backend, Frontend e Banco de Dados

- [x] 1.1 Atualizar `StudyNote.save()` em `backend/apps/academic/models.py` e `StudyNoteSerializer` em `backend/apps/academic/serializers.py` para normalizar automaticamente títulos vazios ou com erro (`"Nova anotaço"`, `"nova anotaco"`) para `"Nova anotação"`.
- [x] 1.2 Revisar `frontend/src/components/StudyNotesWorkspace.tsx` e `frontend/src/components/FlashcardsPage.tsx` garantindo que todos os textos padrão, placeholders e fallbacks exibam `"Nova anotação"` e atualizando a descrição do gerador IA para destacar perguntas analíticas e de raciocínio lógico.

## 2. Motor Criterioso de Elaboração de Flashcards por Raciocínio Lógico (`FlashcardAIGenerateView`)

- [x] 2.1 Implementar o inferidor de domínio `_infer_domain_context` em `backend/apps/academic/views.py` para ignorar títulos genéricos (`"Nova anotação"`, `"Nova anotaço"`, `"Sem título"`, `"Anotação de Estudo"`) e extrair o tema real a partir da disciplina vinculada (`StudentSubject.name`) e do conceito central da nota.
- [x] 2.2 Implementar o classificador semântico de proposições e filtro de metalinguagem em `FlashcardAIGenerateView` (`backend/apps/academic/views.py`), impedindo que expressões conversacionais antes de dois-pontos (`"Objetivo"`, `"Temos que considerar diversos fatores"`, `"Nossos modelos"`, `"Observação"`, etc.) virem conceitos isolados e estruturando a geração em eixos de raciocínio lógico (Cenário e Tomada de Decisão, Trade-off e Nível de Abstração, Validação Crítica de Aderência, Causa e Efeito / Contrafactual) com suporte híbrido ao `AntigravityClient`.

## 3. Higienização dos Registros Existentes, Testes Automatizados e Verificação

- [x] 3.1 Higienizar no banco de dados os registros existentes de `StudyNote` (`"Nova anotaço"` → `"Nova anotação"`) e regenerar os flashcards superficiais anteriores com o novo motor de raciocínio lógico profundo.
- [x] 3.2 Adicionar testes automatizados em `backend/apps/academic/tests.py` validando que notas intituladas `"Nova anotação"` ou contendo frases introdutórias com dois-pontos geram perguntas profundas de raciocínio lógico (sem `"Em Nova anotação"` nem `"o que significa 'Objetivo'"`), e validar o build do frontend (`npm run build`).
