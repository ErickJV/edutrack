from __future__ import annotations

import logging
from typing import Any

import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

DEEPSEEK_CHAT_ENDPOINT = "https://api.deepseek.com/chat/completions"
DEFAULT_MODEL = "deepseek-v4-flash"
REQUEST_TIMEOUT_SECONDS = 30

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


class DeepSeekClient:
    """Cliente do assistente Clippit usando a API compatível com OpenAI."""

    def __init__(self) -> None:
        self.api_key = (getattr(settings, "DEEPSEEK_API_KEY", "") or "").strip()
        self.model = getattr(settings, "DEEPSEEK_MODEL", "") or DEFAULT_MODEL

    def get_status(self) -> dict[str, Any]:
        """Retorna apenas se o assistente está configurado no servidor."""
        return {"configured": bool(self.api_key)}

    @staticmethod
    def _determine_animation(user_msg: str, reply: str) -> str:
        """Determina a animação do Clippit compatível com o contexto da resposta."""
        text = f"{user_msg} {reply}".lower()

        if any(w in text for w in ["parabéns", "conseguiu", "ótimo trabalho", "concluída", "100%"]):
            return "congratulate"
        if any(w in text for w in ["atrasad", "atenção", "perigo", "cuidado", "falta", "urgente", "erro"]):
            return "alert"
        if any(w in text for w in ["pesquis", "procur", "busc", "onde está", "qual"]):
            return "searching"
        if any(w in text for w in ["olá", "oi", "bom dia", "boa tarde", "boa noite", "clippy", "clippit"]):
            return "wave"
        return "writing"

    def generate_chat_response(
        self,
        user_message: str,
        conversation_history: list[dict[str, Any]],
        academic_context_markdown: str,
    ) -> dict[str, Any]:
        """Envia a mensagem e o contexto acadêmico ao assistente."""
        if not self.api_key:
            return {
                "reply": (
                    "📎 **Olá! Eu sou o Clippit!**\n\n"
                    "O assistente ainda não está configurado no servidor. "
                    "Avise o administrador para ativar a chave de acesso."
                ),
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
            response = requests.post(
                DEEPSEEK_CHAT_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 2048,
                    "stream": False,
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            if response.status_code == 200:
                data = response.json()
                choices = data.get("choices") if isinstance(data, dict) else []
                choices = choices or []
                if choices:
                    reply_text = (
                        (choices[0].get("message") or {}).get("content") or ""
                    ).strip()
                    if reply_text:
                        return {
                            "reply": reply_text,
                            "animation": self._determine_animation(
                                user_message, reply_text
                            ),
                            "timestamp": timezone.now().isoformat(),
                        }
            else:
                logger.warning(
                    "Falha ao chamar o serviço do assistente: HTTP %s",
                    response.status_code,
                )
        except (requests.RequestException, ValueError, TypeError) as exc:
            logger.error("Erro ao chamar o serviço do assistente: %s", exc)

        return {
            "reply": (
                "📎 **Não consegui me conectar ao serviço do assistente agora.**\n\n"
                "Tente novamente em instantes."
            ),
            "animation": "alert",
            "timestamp": timezone.now().isoformat(),
        }
