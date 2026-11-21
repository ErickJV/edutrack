from __future__ import annotations

import logging
from typing import Any

from django.utils import timezone

from apps.llm.client import LLMClient, LLMError
from apps.llm.prompts import CLIPPIT_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

NOT_CONFIGURED_REPLY = (
    "📎 **Olá! Eu sou o Clippit!**\n\n"
    "O assistente ainda não está configurado no servidor. "
    "Avise o administrador para ativar a chave de acesso."
)

CONNECTION_FAILURE_REPLY = (
    "📎 **Não consegui me conectar ao serviço do assistente agora.**\n\n"
    "Tente novamente em instantes."
)


def _determine_animation(user_msg: str, reply: str) -> str:
    """Determina a animação do Clippit compatível com o contexto da resposta."""
    text = f"{user_msg} {reply}".lower()

    if any(
        w in text for w in ["parabéns", "conseguiu", "ótimo trabalho", "concluída", "100%"]
    ):
        return "congratulate"
    if any(
        w in text
        for w in ["atrasad", "atenção", "perigo", "cuidado", "falta", "urgente", "erro"]
    ):
        return "alert"
    if any(w in text for w in ["pesquis", "procur", "busc", "onde está", "qual"]):
        return "searching"
    if any(
        w in text
        for w in ["olá", "oi", "bom dia", "boa tarde", "boa noite", "clippy", "clippit"]
    ):
        return "wave"
    return "writing"


def generate_chat_response(
    user_message: str,
    conversation_history: list[dict[str, Any]],
    academic_context_markdown: str,
) -> dict[str, Any]:
    """Envia a mensagem e o contexto acadêmico ao assistente pelo módulo LLM."""
    client = LLMClient()
    if not client.is_configured:
        return {
            "reply": NOT_CONFIGURED_REPLY,
            "animation": "alert",
            "timestamp": timezone.now().isoformat(),
        }

    messages: list[dict[str, str]] = [
        {
            "role": "system",
            "content": CLIPPIT_SYSTEM_PROMPT.format(
                academic_context=academic_context_markdown
            ),
        }
    ]

    history = conversation_history[-10:]
    for index, message in enumerate(history):
        role = message.get("role")
        content = str(message.get("content") or "").strip()
        if role not in {"user", "assistant"} or not content:
            continue
        # O frontend inclui a mensagem atual no histórico e também a envia como
        # `message`; descarta essa duplicata final.
        if (
            index == len(history) - 1
            and role == "user"
            and content == user_message.strip()
        ):
            continue
        messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message.strip()})

    try:
        reply_text = client.chat(messages, temperature=0.7, max_tokens=2048)
    except LLMError as exc:
        logger.error("Erro ao chamar o módulo de IA no assistente: %s", exc)
        return {
            "reply": CONNECTION_FAILURE_REPLY,
            "animation": "alert",
            "timestamp": timezone.now().isoformat(),
        }

    return {
        "reply": reply_text,
        "animation": _determine_animation(user_message, reply_text),
        "timestamp": timezone.now().isoformat(),
    }
