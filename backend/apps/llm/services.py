"""Serviços de IA validados usados pelas views do backend."""

from __future__ import annotations

import logging
import unicodedata
from datetime import date as dt_date
from typing import Any

from .client import LLMClient, LLMError
from .prompts import (
    build_calendar_extraction_prompt,
    build_document_analysis_prompt,
    build_flashcards_prompt,
    build_quiz_prompt,
)

logger = logging.getLogger(__name__)

FLASHCARD_HINT_LIMIT = 255
FLASHCARD_TAGS_LIMIT = 200
QUIZ_QUESTION_LIMIT = 1000
QUIZ_OPTION_LIMIT = 500
QUIZ_CITATION_LIMIT = 200
QUIZ_EXPLANATION_LIMIT = 2000
CALENDAR_SNIPPET_LIMIT = 500
CALENDAR_MIN_TEXT_CHARS = 20
CALENDAR_MIN_YEAR = 2000
CALENDAR_MAX_YEAR = 2100

DOCUMENT_ANALYSIS_LIST_KEYS = (
    "complex_topics",
    "key_concepts",
    "study_roadmap",
    "reinforcement_topics",
    "complementary_materials",
)

CALENDAR_TYPE_ALIASES = {
    "AP 1": "AP1",
    "AP1": "AP1",
    "AP 2": "AP2",
    "AP2": "AP2",
    "PAI I": "PAI 1",
    "PAI 1": "PAI 1",
    "PAI II": "PAI 2",
    "PAI 2": "PAI 2",
    "PAI III": "PAI 3",
    "PAI 3": "PAI 3",
    "AVALIACAO OFICIAL": "Avaliação Oficial",
    "PROVA SUBSTITUTIVA": "Prova Substitutiva",
}

_SYSTEM_INSTRUCTION = (
    "Você é um assistente do backend educacional e responde exclusivamente com JSON válido."
)


def _messages(prompt: str) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": _SYSTEM_INSTRUCTION},
        {"role": "user", "content": prompt},
    ]


def _normalize_assessment_type(raw_type: Any, allowed_types: list[str]) -> str | None:
    if not isinstance(raw_type, str):
        return None
    decomposed = unicodedata.normalize("NFKD", raw_type)
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    normalized = " ".join(stripped.upper().split())
    canonical = CALENDAR_TYPE_ALIASES.get(normalized)
    if canonical and canonical in allowed_types:
        return canonical
    return None


def generate_flashcards(
    *,
    count: int,
    subject_title: str,
    core_theme: str,
    source_text: str,
    fallback_context: str,
) -> list[dict[str, str]]:
    """Gera cards validados; devolve lista vazia sem chave ou em falha."""
    client = LLMClient()
    if not client.is_configured:
        return []

    prompt = build_flashcards_prompt(
        count=count,
        subject_title=subject_title,
        core_theme=core_theme,
        source_text=source_text,
        fallback_context=fallback_context,
    )

    try:
        payload = client.chat_json(
            _messages(prompt), temperature=0.4, max_tokens=4096
        )
        raw_cards = payload.get("cards") if isinstance(payload, dict) else payload
        if not isinstance(raw_cards, list):
            return []

        cards: list[dict[str, str]] = []
        for item in raw_cards:
            if not isinstance(item, dict):
                continue
            front = str(item.get("front") or "").strip()
            back = str(item.get("back") or "").strip()
            if not front or not back:
                continue
            hint = str(item.get("hint") or "Raciocínio lógico e análise").strip()
            tags = str(item.get("tags") or "ia, raciocinio-logico").strip()
            cards.append(
                {
                    "front": front,
                    "back": back,
                    "hint": hint[:FLASHCARD_HINT_LIMIT],
                    "tags": tags[:FLASHCARD_TAGS_LIMIT],
                }
            )
            if len(cards) >= count:
                break
        return cards
    except (LLMError, ValueError, TypeError, KeyError) as exc:
        logger.warning("Falha ao gerar flashcards pelo módulo de IA: %s", exc)
        return []


def generate_document_analysis(doc_title: str, full_text: str) -> dict[str, Any] | None:
    """Analisa o documento via LLM; devolve None sem chave ou em falha."""
    client = LLMClient()
    if not client.is_configured:
        return None

    prompt = build_document_analysis_prompt(doc_title, full_text)
    try:
        payload = client.chat_json(_messages(prompt), temperature=0.2, max_tokens=8192)
    except (LLMError, ValueError, TypeError, KeyError) as exc:
        logger.warning("Falha ao analisar documento pelo módulo de IA: %s", exc)
        return None

    if not isinstance(payload, dict):
        return None
    summary = payload.get("summary")
    if not isinstance(summary, str) or not summary.strip():
        return None
    mental_map = payload.get("mental_map_mermaid")
    if not isinstance(mental_map, str):
        return None
    for key in DOCUMENT_ANALYSIS_LIST_KEYS:
        if not isinstance(payload.get(key), list):
            return None

    return payload


def _validate_quiz_question(item: Any) -> dict[str, Any] | None:
    if not isinstance(item, dict):
        return None

    question = item.get("question")
    if not isinstance(question, str):
        return None
    question = question.strip()
    if not question or len(question) > QUIZ_QUESTION_LIMIT:
        return None

    options = item.get("options")
    if not isinstance(options, list) or len(options) != 4:
        return None
    normalized_options: list[str] = []
    for option in options:
        if not isinstance(option, str):
            return None
        option = option.strip()
        if not option or len(option) > QUIZ_OPTION_LIMIT:
            return None
        normalized_options.append(option)

    correct_index = item.get("correct_option_index")
    if isinstance(correct_index, bool) or not isinstance(correct_index, int):
        return None
    if not 0 <= correct_index <= 3:
        return None

    citation = item.get("citation")
    if not isinstance(citation, str):
        return None
    citation = citation.strip()
    if not citation or "Pág." not in citation or len(citation) > QUIZ_CITATION_LIMIT:
        return None

    explanation = item.get("explanation")
    if not isinstance(explanation, str):
        return None
    explanation = explanation.strip()
    if not explanation or len(explanation) > QUIZ_EXPLANATION_LIMIT:
        return None

    return {
        "question": question,
        "options": normalized_options,
        "correct_option_index": correct_index,
        "citation": citation,
        "explanation": explanation,
    }


def generate_quiz_questions(
    doc_title: str,
    page_snippets: list[tuple[int, str]],
    count: int = 10,
) -> list[dict[str, Any]] | None:
    """Gera o simulado via LLM; devolve None se não houver questões válidas suficientes."""
    client = LLMClient()
    if not client.is_configured or not page_snippets:
        return None

    prompt = build_quiz_prompt(doc_title, page_snippets)
    try:
        payload = client.chat_json(_messages(prompt), temperature=0.3, max_tokens=8192)
    except (LLMError, ValueError, TypeError, KeyError) as exc:
        logger.warning("Falha ao gerar simulado pelo módulo de IA: %s", exc)
        return None

    raw_questions = payload.get("questions") if isinstance(payload, dict) else None
    if not isinstance(raw_questions, list):
        return None

    questions: list[dict[str, Any]] = []
    for item in raw_questions:
        validated = _validate_quiz_question(item)
        if validated is not None:
            questions.append(validated)
        if len(questions) >= count:
            break

    if len(questions) < count:
        logger.warning(
            "Simulado do módulo de IA rejeitado: %s de %s questões válidas.",
            len(questions),
            count,
        )
        return None

    return questions


def extract_calendar_items(
    raw_text: str,
    *,
    subject_name: str,
    reference_year: int,
    allowed_types: list[str],
) -> list[dict[str, str]]:
    """Extrai candidatos de avaliação do texto; devolve [] sem chave ou em falha."""
    client = LLMClient()
    if not client.is_configured:
        return []
    if len((raw_text or "").strip()) < CALENDAR_MIN_TEXT_CHARS:
        return []

    prompt = build_calendar_extraction_prompt(
        raw_text,
        subject_name=subject_name,
        reference_year=reference_year,
        allowed_types=allowed_types,
    )

    try:
        payload = client.chat_json(_messages(prompt), temperature=0.1, max_tokens=4096)
        raw_items = payload.get("items") if isinstance(payload, dict) else None
        if not isinstance(raw_items, list):
            return []

        items: list[dict[str, str]] = []
        seen: set[tuple[str, str]] = set()
        for candidate in raw_items:
            if not isinstance(candidate, dict):
                continue
            assessment_type = _normalize_assessment_type(
                candidate.get("assessment_type"), allowed_types
            )
            if assessment_type is None:
                continue

            raw_date = candidate.get("date")
            if not isinstance(raw_date, str):
                continue
            try:
                parsed_date = dt_date.fromisoformat(raw_date.strip()[:10])
            except ValueError:
                continue
            if not CALENDAR_MIN_YEAR <= parsed_date.year <= CALENDAR_MAX_YEAR:
                continue

            iso_date = parsed_date.isoformat()
            key = (assessment_type, iso_date)
            if key in seen:
                continue
            seen.add(key)

            snippet = candidate.get("source_snippet")
            snippet_text = snippet.strip()[:CALENDAR_SNIPPET_LIMIT] if isinstance(snippet, str) else ""
            items.append(
                {
                    "assessment_type": assessment_type,
                    "date": iso_date,
                    "source_snippet": snippet_text,
                }
            )
        return items
    except (LLMError, ValueError, TypeError, KeyError) as exc:
        logger.warning("Falha ao extrair avaliações pelo módulo de IA: %s", exc)
        return []
