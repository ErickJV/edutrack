from __future__ import annotations

import json
import logging
from typing import Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

DEEPSEEK_CHAT_ENDPOINT = "https://api.deepseek.com/chat/completions"
DEFAULT_MODEL = "deepseek-flash"
DEFAULT_TIMEOUT_SECONDS = 60
MAX_LOGGED_BODY_CHARS = 200


class LLMError(RuntimeError):
    """Falha de transporte ou de formato ao consultar o provedor de LLM."""


class LLMNotConfiguredError(LLMError):
    """Nenhuma chave do módulo de IA configurada no servidor."""


class LLMClient:
    """Único ponto de saída HTTP para modelos de linguagem no backend."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        *,
        timeout: int | None = None,
    ) -> None:
        resolved_key = (
            api_key if api_key is not None else getattr(settings, "DEEPSEEK_API_KEY", "")
        )
        resolved_model = (
            model if model is not None else getattr(settings, "DEEPSEEK_MODEL", "")
        )
        self.api_key = (resolved_key or "").strip()
        self.model = (resolved_model or "").strip() or DEFAULT_MODEL
        self.timeout = timeout or DEFAULT_TIMEOUT_SECONDS

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    def get_status(self) -> dict[str, Any]:
        """Retorna apenas se o módulo está configurado no servidor."""
        return {"configured": self.is_configured}

    def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        json_mode: bool = False,
        thinking: bool = False,
    ) -> str:
        """Envia as mensagens e devolve o conteúdo textual da resposta."""
        if not self.is_configured:
            raise LLMNotConfiguredError("Módulo de IA não configurado no servidor.")

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
            "thinking": {"type": "enabled" if thinking else "disabled"},
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            response = requests.post(
                DEEPSEEK_CHAT_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            logger.warning("Falha de rede ao chamar o módulo de IA: %s", exc)
            raise LLMError("Falha de rede ao chamar o módulo de IA.") from exc

        if response.status_code != 200:
            body = str(getattr(response, "text", "") or "")[:MAX_LOGGED_BODY_CHARS]
            logger.warning(
                "Módulo de IA respondeu HTTP %s: %s", response.status_code, body
            )
            raise LLMError(
                f"Módulo de IA indisponível (HTTP {response.status_code})."
            )

        try:
            data = response.json()
        except ValueError as exc:
            logger.warning("Resposta do módulo de IA não é JSON válido.")
            raise LLMError("Resposta inválida do módulo de IA.") from exc

        content = ""
        if isinstance(data, dict):
            choices = data.get("choices") or []
            if choices and isinstance(choices[0], dict):
                message = choices[0].get("message") or {}
                if isinstance(message, dict):
                    content = str(message.get("content") or "")

        if not content.strip():
            logger.warning("Módulo de IA devolveu conteúdo vazio.")
            raise LLMError("Resposta vazia do módulo de IA.")

        return content.strip()

    def chat_json(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> Any:
        """Solicita JSON estruturado e devolve a estrutura já parseada."""
        content = self.chat(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
            json_mode=True,
        )
        return self.parse_json(content)

    @classmethod
    def parse_json(cls, content: str) -> Any:
        text = cls._strip_fences(content)
        try:
            return json.loads(text)
        except ValueError:
            pass

        sliced = cls._slice_payload(text)
        if sliced is not None:
            try:
                return json.loads(sliced)
            except ValueError:
                pass

        logger.warning("Módulo de IA devolveu JSON inválido.")
        raise LLMError("JSON inválido devolvido pelo módulo de IA.")

    @staticmethod
    def _strip_fences(content: str) -> str:
        text = (content or "").strip()
        if text.startswith("```"):
            newline = text.find("\n")
            text = text[newline + 1 :] if newline != -1 else ""
            text = text.rstrip()
            if text.endswith("```"):
                text = text[:-3]
        return text.strip()

    @staticmethod
    def _slice_payload(text: str) -> str | None:
        starts = [index for index in (text.find("{"), text.find("[")) if index != -1]
        if not starts:
            return None
        start = min(starts)
        closer = "}" if text[start] == "{" else "]"
        end = text.rfind(closer)
        if end <= start:
            return None
        return text[start : end + 1]
