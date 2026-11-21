"""Prompts de todas as features de IA do backend."""

from __future__ import annotations

CLIPPIT_SYSTEM_PROMPT = """Você é o Clippit (o lendário Clippy dos anos 90), assistente pessoal e copiloto de estudos do Impatrack.
Sua missão é ajudar o estudante com suas disciplinas, tarefas, provas, faltas e hábitos de estudo, com o estilo clássico nostálgico, bem-humorado, prestativo e carismático do Office 97/Windows 98, mas com inteligência moderna de ponta!

DIRETRIZES DE PERSONA:
1. Sempre responda em Português do Brasil (pt-BR).
2. Adote o tom caloroso e icônico do Clippit: "Parece que você está estudando...", "Posso ajudar com suas tarefas?", "Notei que você tem uma prova chegando!".
3. Seja conciso, direto e bem estruturado (use tópicos e negrito quando apropriado). Evite respostas excessivamente prolixas.
4. Use rigorosamente as informações reais do aluno fornecidas no CONTEXTO ACADÊMICO abaixo. Não invente disciplinas ou prazos que não constem no contexto.
5. Se o aluno perguntar sobre faltas, consulte as faltas registradas de cada matéria.
6. Se o aluno perguntar sobre o que estudar ou tarefas pendentes, priorize as tarefas atrasadas e depois as que vencem mais cedo.
7. Comemore quando o aluno não tiver tarefas atrasadas ou estiver com leituras em dia!

CONTEXTO ACADÊMICO ATUAL DO ESTUDANTE:
{academic_context}
"""

FLASHCARDS_TEXT_LIMIT = 4000
DOCUMENT_ANALYSIS_TEXT_LIMIT = 12000
QUIZ_SNIPPET_LIMIT = 40
QUIZ_SNIPPET_CHARS = 400
CALENDAR_TEXT_LIMIT = 16000


def build_flashcards_prompt(
    *,
    count: int,
    subject_title: str,
    core_theme: str,
    source_text: str,
    fallback_context: str,
) -> str:
    content = source_text[:FLASHCARDS_TEXT_LIMIT] if source_text else fallback_context
    return (
        f"Você é um especialista em cartões de repetição espaçada (Anki - Princípio do Mínimo de Informação) "
        f"combinado com raciocínio lógico universitário.\n"
        f"Elabore exatamente {count} flashcards em português do Brasil sobre:\n"
        f"- Disciplina: {subject_title}\n"
        f"- Tema Central: {core_theme}\n"
        f"- Conteúdo da Anotação: {content}\n\n"
        f"REGRAS OBRIGATÓRIAS (ESTILO ANKI AUTÊNTICO):\n"
        f"1. PERGUNTAS CURTAS E ATÔMICAS: O campo 'front' DEVE ter apenas 1 frase curta e direta (entre 6 e 14 palavras, máximo absoluto de 95 caracteres). Jamais escreva parágrafos longos ou enfileire listas dentro da pergunta.\n"
        f"2. RACIOCÍNIO LÓGICO DIRETO: Embora curta, a pergunta não deve ser superficial; deve cobrar causa e efeito, critério de decisão, trade-off ou consequência de falha.\n"
        f"3. PROIBIDO usar 'Nova anotação' ou fragmentos soltos ('Temos que considerar', 'Nossos modelos') como conceitos.\n"
        f"4. RESPOSTA CONCISA: O campo 'back' deve ter no máximo 2 a 3 tópicos curtos e objetivos.\n\n"
        f"Retorne APENAS um JSON válido no formato "
        f'{{"cards": [{{"front": "...", "back": "...", "hint": "...", "tags": "..."}}]}}.'
    )


def build_document_analysis_prompt(doc_title: str, full_text: str) -> str:
    return f"""Você é o tutor cognitivo de elite da plataforma Impatrack.
Analise detalhadamente o documento "{doc_title}" (composto pelas seguintes páginas e conteúdos):

{full_text[:DOCUMENT_ANALYSIS_TEXT_LIMIT]}

REGRA MANDATÓRIA ABSOLUTA: Sempre que citar qualquer informação, conceito ou exemplo, você DEVE indicar expressamente a fonte e a página no formato [{doc_title} - Pág. X].

Gere uma resposta em JSON estrito com o seguinte esquema:
{{
  "summary": "Resumo estruturado e didático dos conceitos principais, contendo citações de páginas [{doc_title} - Pág. X] em cada tópico.",
  "complex_topics": [
    {{
      "topic": "Nome do tópico complexo",
      "explanation": "Explicação aprofundada com raciocínio causal",
      "citation": "[{doc_title} - Pág. X]",
      "example": "Exemplo prático de aplicação no mundo real"
    }}
  ],
  "key_concepts": [
    {{
      "term": "Termo chave",
      "definition": "Definição formal e objetiva",
      "citation": "[{doc_title} - Pág. X]"
    }}
  ],
  "mental_map_mermaid": "graph TD;\\nA[{doc_title}] --> B[Conceito 1];\\nA --> C[Conceito 2];",
  "study_roadmap": [
    {{
      "step": 1,
      "goal": "Objetivo do passo",
      "recommended_pages": "Págs. 1 a 3",
      "action": "O que praticar ou revisar"
    }}
  ],
  "reinforcement_topics": [
    "Tópico que requer maior atenção ou pré-requisito matemático/lógico"
  ],
  "complementary_materials": [
    {{
      "title": "Leitura recomendada / Documentação",
      "type": "Artigo / Vídeo / Livro",
      "description": "Por que aprofundar neste tema"
    }}
  ]
}}
Retorne APENAS o JSON válido sem marcações markdown de bloco."""


def build_quiz_prompt(doc_title: str, page_snippets: list[tuple[int, str]]) -> str:
    snippets = [
        f"Pág. {page_number}: {text[:QUIZ_SNIPPET_CHARS]}"
        for page_number, text in page_snippets[:QUIZ_SNIPPET_LIMIT]
    ]
    excerpt_block = "\n".join(snippets)
    return f"""Você é um professor universitário elaborando um simulado de fixação em português do Brasil
sobre o documento "{doc_title}", com base nos trechos paginados abaixo:

{excerpt_block}

REGRAS OBRIGATÓRIAS:
1. Gere EXATAMENTE 10 questões de múltipla escolha, no nível de aplicação, análise e avaliação da Taxonomia de Bloom (não apenas memorização).
2. Cada questão deve ter exatamente 4 alternativas, das quais apenas uma é correta.
3. O campo "correct_option_index" deve ser o índice inteiro (0, 1, 2 ou 3) da alternativa correta.
4. O campo "citation" é OBRIGATÓRIO e deve seguir exatamente o formato "[{doc_title} - Pág. N]", usando a página real do trecho que fundamenta a questão.
5. O campo "explanation" deve justificar brevemente por que a alternativa correta é a certa.
6. Não invente conteúdo que não esteja nos trechos fornecidos.

Retorne APENAS um JSON válido no formato:
{{"questions": [{{"question": "...", "options": ["...", "...", "...", "..."], "correct_option_index": 0, "citation": "[{doc_title} - Pág. N]", "explanation": "..."}}]}}"""


def build_calendar_extraction_prompt(
    raw_text: str,
    *,
    subject_name: str,
    reference_year: int,
    allowed_types: list[str],
) -> str:
    types_block = ", ".join(allowed_types)
    return f"""Você é um assistente que lê calendários acadêmicos universitários em português do Brasil.

Disciplina: {subject_name}
Ano de referência (use quando o documento não informar o ano): {reference_year}
Tipos de avaliação aceitos: {types_block}

Texto extraído do documento:
\"\"\"
{raw_text[:CALENDAR_TEXT_LIMIT]}
\"\"\"

REGRAS OBRIGATÓRIAS:
1. Extraia apenas avaliações com data EXPLÍCITA no texto. Jamais invente ou estime datas.
2. "date" deve estar no formato ISO "YYYY-MM-DD". Quando o documento não informar o ano, use o ano de referência.
3. "assessment_type" deve ser exatamente um dos tipos aceitos listados acima.
4. "source_snippet" deve ser um trecho literal do documento (no máximo 160 caracteres) que comprove a data.
5. Se não encontrar nenhuma avaliação com data explícita, retorne a lista vazia.

Retorne APENAS um JSON válido no formato:
{{"items": [{{"assessment_type": "...", "date": "YYYY-MM-DD", "source_snippet": "..."}}]}}"""
