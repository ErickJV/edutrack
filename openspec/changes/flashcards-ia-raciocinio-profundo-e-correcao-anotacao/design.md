# Design: Motor de Elaboração de Flashcards por Raciocínio Lógico e Normalização de "Nova anotação"

## Context

No estado atual de `FlashcardAIGenerateView` (`backend/apps/academic/views.py`), a extração de conceitos dependia de uma expressão regular simples (`r"^([^:–—\-]{3,65})\s*[:–—\-]\s*(.{15,})$"`) que dividia qualquer linha com dois-pontos (`:`) em `left` e `right`, seguida de um template único e superficial:
```python
q = f'Em {effective_topic}, o que significa e como se aplica "{left}"?'
```
Quando o usuário escreveu uma anotação sobre Modelagem de Software na disciplina `Application Data Persistence` contendo linhas como:
- `"Modelos de Software: 'Este modelo é aderente o suficiente para esta aplicação específica?'"`
- `"Objetivo: capturar aspectos da realidade que sejam do interesse da situação"`
- `"Temos que considerar diversos fatores: requisitos, protótipos, tamanho do projeto, tecnologias, experiência..."`
- `"Nossos modelos: mais detalhados que requisitos e menos complexos que o código; fácil de ser entendido e manter; passível de evolução"`

E cujo título no banco estava salvo como `"Nova anotaço"`, o sistema gerou 4 flashcards superficiais e truncados:
1. `Em Nova anotaço, o que significa e como se aplica "Objetivo"?`
2. `Em Nova anotaço, o que significa e como se aplica "Temos que considerar diversos fatores"?`
3. `Em Nova anotaço, o que significa e como se aplica "Modelos de Software"?`
4. `Em Nova anotaço, o que significa e como se aplica "Nossos modelos"?`

## Goals / Non-Goals

**Goals:**
- Garantir que `"Nova anotação"` seja a única grafia padrão em `StudyNote` (corrigindo automaticamente `"Nova anotaço"` no modelo/serializer e limpando o banco de dados).
- Impedir que títulos genéricos (`"Nova anotação"`, `"Sem título"`, etc.) sejam usados como o sujeito temático das perguntas.
- Substituir o gerador superficial por um **Motor de Raciocínio Lógico e Análise Semântica em Duas Camadas**:
  1. **Camada LLM (Gemini via `AntigravityClient`)**: Quando houver credenciais configuradas no ambiente, invocar o modelo com um prompt pedagógico baseado na Taxonomia de Bloom (Aplicação, Análise, Avaliação e Síntese) e método socrático.
  2. **Camada Analítica Semântica Determinística (Local / Fallback Criterioso)**: Um analisador estrutural do texto que classifica proposições por natureza lógica (Fatores de Decisão, Trade-offs/Abstração, Objetivo/Finalidade, Critério de Validação/Pergunta Norteadora, Causa-Efeito) e elabora perguntas profundas que exigem raciocínio lógico em vez de memorização de nomenclatura.

**Non-Goals:**
- Alterar o algoritmo de repetição espaçada SM-2 (`FlashcardReviewView`), que já funciona conforme esperado.
- Exigir chave de API externa paga para que o gerador funcione localmente com alta qualidade.

## Decisions

### 1. Normalização Automática de `"Nova anotação"` no Modelo `StudyNote`
- **Decisão**: No método `save()` de `StudyNote` (`backend/apps/academic/models.py`) e no `StudyNoteSerializer` (`backend/apps/academic/serializers.py`), se `title` estiver vazio ou corresponder (case-insensitive) a `"nova anotaço"` / `"nova anotaco"`, converter automaticamente para `"Nova anotação"`.
- **Racional**: Protege tanto criações via API quanto edições acidentais e corrige de forma idempotente qualquer payload legado.

### 2. Inferência Inteligente de Domínio Temático (`_infer_domain_context`)
- **Decisão**: Definir um conjunto de títulos genéricos ignorados (`GENERIC_NOTE_TITLES = {"nova anotação", "nova anotaço", "nova anotaco", "sem título", "sem titulo", "anotação", "anotação de estudo", "nota"}`).
- Se o `topic` ou `note.title` pertencer a esse conjunto, o motor buscará o domínio temático nesta ordem de prioridade:
  1. O primeiro cabeçalho Markdown (`# Título`) ou a primeira expressão conceitual forte do texto (ex.: `"Modelos de Software"`, `"Persistência de Dados"`), combinada ao nome da disciplina (`subject.name`, ex.: `"Application Data Persistence"`).
  2. O nome da disciplina vinculada (`subject.name`).
  3. Expressão contextual neutra (`"no contexto estudado"`), sem jamais escrever `"Em Nova anotação"`.

### 3. Classificador Semântico de Proposições e Filtro de Metalinguagem
- **Decisão**: Antes de construir qualquer pergunta no motor analítico local, cada bloco/sentença da anotação passa por:
  - **Filtro de Prefixos Conversacionais/Metalinguísticos**: Prefixos antes de `:` como `objetivo`, `temos que considerar.*`, `nossos modelos`, `observação`, `obs`, `nota`, `exemplo`, `resumo`, `conclusão`, `importante`, `lembrete`, `atenção`, `fatores`, `características`, `vantagens`, `desvantagens` **não** são conceitos isolados; eles indicam o **papel lógico** da proposição!
  - **Classificação Lógica da Proposição**:
    1. **Eixo de Finalidade e Intenção Arquitetural (`PURPOSE_AXIS`)**: Detectado quando a proposição expressa um objetivo ou propósito (ex.: *"Objetivo: capturar aspectos da realidade que sejam do interesse da situação"*).
       - *Pergunta gerada*: Estimula o raciocínio sobre seletividade e abstração — por que devemos filtrar apenas os aspectos relevantes da realidade em vez de representar tudo, e como essa escolha afeta a eficácia da solução.
    2. **Eixo de Análise Multivariável e Tomada de Decisão (`FACTORS_DECISION_AXIS`)**: Detectado quando a proposição elenca variáveis, fatores ou condições (ex.: *"requisitos, protótipos, tamanho do projeto, tecnologias, experiência, conhecimento..."*).
       - *Pergunta gerada*: Propõe um cenário de decisão técnica perguntando como a interação entre variáveis humanas/técnicas (como tamanho do projeto, requisitos e maturidade da equipe) altera a estratégia adotada e qual o risco lógico de aplicar uma abordagem única sem ponderar esses fatores.
    3. **Eixo de Trade-off e Nível de Abstração (`TRADEOFF_ABSTRACTION_AXIS`)**: Detectado quando a proposição compara níveis de detalhe/complexidade ou propriedades de evolução/manutenção (ex.: *"mais detalhados que requisitos e menos complexos que o código; fácil de ser entendido e manter; passível de evolução"*).
       - *Pergunta gerada*: Questiona o *trade-off* lógico entre especificidade e simplicidade: por que um modelo ou solução precisa situar-se exatamente entre a abstração dos requisitos e a complexidade do código para permanecer manutenível e evolutivo?
    4. **Eixo de Validação Crítica e Aderência (`CRITICAL_EVALUATION_AXIS`)**: Detectado quando a proposição traz uma pergunta norteadora, critério de qualidade ou condição de aderência (ex.: *"Este modelo é aderente o suficiente para esta aplicação específica?"*).
       - *Pergunta gerada*: Desafia o estudante a formular o raciocínio crítico de validação: como avaliar na prática se uma abstração ou arquitetura é aderente ao problema específico sem incorrer em sobre-engenharia (*over-engineering*) ou sub-especificação?
    5. **Eixo de Causa, Efeito e Pensamento Contrafactual (`CAUSE_EFFECT_AXIS`)**: Para demais proposições densas do texto, constrói perguntas do tipo *"Por que [premissa] é condição necessária para [consequência], e que falha lógica ocorreria se essa relação fosse desconsiderada?"*.

## Risks / Trade-offs

- **[Risco] Flashcards antigos já salvos no banco com `"Nova anotaço"` continuarem visíveis para a usuária** → **Mitigação**: Durante a implementação, atualizar os registros existentes no banco SQLite (`StudyNote` e os 4 `Flashcard` gerados anteriormente para a nota de Modelagem de Software) para que a usuária veja imediatamente tanto o título `"Nova anotação"` corrigido quanto os novos flashcards profundos e analíticos.
