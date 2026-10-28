from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

ANTIGRAVITY_ENDPOINT = "https://cloudcode-pa.googleapis.com/v1internal:generateContent"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GEMINI_DIRECT_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
DEFAULT_MODEL = "gemini-3.8-flash"

CLIPPIT_SYSTEM_PROMPT = """Você é o Clippit (o lendário Clippy dos anos 90), assistente pessoal e copiloto de estudos do EduTrack.
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


class AntigravityClient:
    """
    Cliente para comunicação com o gateway Google Antigravity OAuth2 (Gemini 3.8 Flash).
    Suporta credenciais globais (.env) e override por requisição (header X-Antigravity-Token).
    """

    def __init__(self, custom_token: str | None = None):
        self.custom_token = (custom_token or "").strip()
        self.model = getattr(settings, "ANTIGRAVITY_MODEL", DEFAULT_MODEL)
        self.client_id = os.getenv("ANTIGRAVITY_CLIENT_ID", "")
        self.client_secret = os.getenv("ANTIGRAVITY_CLIENT_SECRET", "")
        self.refresh_token = os.getenv("ANTIGRAVITY_REFRESH_TOKEN", "")
        self.env_access_token = os.getenv("ANTIGRAVITY_ACCESS_TOKEN", "")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")

    def get_status(self) -> dict[str, Any]:
        """Retorna o status da configuração de credenciais."""
        if self.custom_token:
            mode = "custom_token"
            configured = True
        elif self.refresh_token and self.client_id:
            mode = "env_refresh"
            configured = True
        elif self.env_access_token:
            mode = "env_token"
            configured = True
        elif self.gemini_api_key:
            mode = "gemini_api_key"
            configured = True
        else:
            mode = "unconfigured"
            configured = False

        return {
            "configured": configured,
            "mode": mode,
            "model": self.model,
        }

    def _get_bearer_token(self) -> str | None:
        """Obtém o token Bearer válido, realizando refresh se necessário."""
        if self.custom_token:
            return self.custom_token

        # Se houver refresh token configurado, tenta obter token novo
        if self.refresh_token and self.client_id:
            try:
                resp = requests.post(
                    GOOGLE_TOKEN_ENDPOINT,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "refresh_token": self.refresh_token,
                        "grant_type": "refresh_token",
                    },
                    timeout=10,
                )
                if resp.status_code == 200:
                    token_data = resp.json()
                    return token_data.get("access_token")
                logger.warning(
                    "Falha ao renovar token OAuth Antigravity: %s %s", resp.status_code, resp.text
                )
            except Exception as e:
                logger.error("Exceção ao renovar token OAuth Antigravity: %s", e)

        if self.env_access_token:
            return self.env_access_token

        return None

    def _determine_animation(self, user_msg: str, reply: str) -> str:
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
        """
        Envia a mensagem e o contexto acadêmico ao Gemini 3.8 Flash via Antigravity OAuth.
        Retorna a resposta com a animação apropriada do Clippit.
        """
        system_instruction = CLIPPIT_SYSTEM_PROMPT.format(
            academic_context=academic_context_markdown
        )

        status = self.get_status()
        if not status["configured"]:
            # Resposta amigável do Clippit quando nenhuma credencial está configurada
            reply = (
                "📎 **Olá! Eu sou o Clippit!**\n\n"
                "Parece que o token do **Google Antigravity OAuth** ainda não foi configurado.\n\n"
                "Você pode clicar no botão **⚙ Configurar** na barra superior da minha janela "
                "e colar seu Access Token do Antigravity, ou definir `ANTIGRAVITY_ACCESS_TOKEN` / "
                "`ANTIGRAVITY_REFRESH_TOKEN` no arquivo `.env` do backend!\n\n"
                "Enquanto isso, ainda posso visualizar suas matérias e tarefas registradas no EduTrack."
            )
            return {
                "reply": reply,
                "animation": "alert",
                "timestamp": timezone.now().isoformat(),
            }

        # Montagem dos contents no formato Gemini
        contents: list[dict[str, Any]] = []

        # Histórico anterior (filtrando mensagens válidas)
        for msg in conversation_history[-10:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if not content:
                continue
            gemini_role = "model" if role in ("assistant", "model") else "user"
            contents.append({
                "role": gemini_role,
                "parts": [{"text": str(content)}],
            })

        # Adiciona a mensagem atual do usuário
        contents.append({
            "role": "user",
            "parts": [{"text": user_message}],
        })

        bearer_token = self._get_bearer_token()

        # 1. Tentar gateway Antigravity se houver Bearer token
        if bearer_token:
            headers = {
                "Authorization": f"Bearer {bearer_token}",
                "Content-Type": "application/json",
                "User-Agent": "antigravity/1.15.8 windows/amd64",
                "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
                "Client-Metadata": json.dumps({
                    "ideType": "ANTIGRAVITY",
                    "platform": "WINDOWS",
                    "pluginType": "GEMINI",
                }),
            }

            payload = {
                "model": self.model,
                "contents": contents,
                "systemInstruction": {
                    "parts": [{"text": system_instruction}]
                },
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 2048,
                },
            }

            try:
                resp = requests.post(
                    ANTIGRAVITY_ENDPOINT,
                    headers=headers,
                    json=payload,
                    timeout=30,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        reply_text = "".join(p.get("text", "") for p in parts if "text" in p)
                        if reply_text:
                            return {
                                "reply": reply_text.strip(),
                                "animation": self._determine_animation(user_message, reply_text),
                                "timestamp": timezone.now().isoformat(),
                            }

                logger.warning(
                    "Antigravity endpoint retornou status %s: %s", resp.status_code, resp.text
                )

                # Se foi erro 401/403, avisa o usuário sobre token inválido/expirado
                if resp.status_code in (401, 403):
                    return {
                        "reply": (
                            "📎 **Ops! Parece que suas credenciais do Antigravity expiraram.**\n\n"
                            "Por favor, renove seu token no botão **⚙ Configurar** na minha janela "
                            "ou verifique suas variáveis de ambiente no servidor."
                        ),
                        "animation": "alert",
                        "timestamp": timezone.now().isoformat(),
                    }

            except requests.RequestException as e:
                logger.error("Erro ao chamar Antigravity endpoint: %s", e)

        # 2. Fallback para Google Generative Language se GEMINI_API_KEY estiver configurada
        if self.gemini_api_key:
            direct_url = GEMINI_DIRECT_ENDPOINT.format(model="gemini-2.5-flash")
            try:
                direct_resp = requests.post(
                    f"{direct_url}?key={self.gemini_api_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": contents,
                        "systemInstruction": {"parts": [{"text": system_instruction}]},
                        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048},
                    },
                    timeout=30,
                )
                if direct_resp.status_code == 200:
                    data = direct_resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        reply_text = "".join(p.get("text", "") for p in parts if "text" in p)
                        if reply_text:
                            return {
                                "reply": reply_text.strip(),
                                "animation": self._determine_animation(user_message, reply_text),
                                "timestamp": timezone.now().isoformat(),
                            }
            except Exception as e:
                logger.error("Erro no fallback Gemini direct: %s", e)

        # Se nenhuma chamada deu certo, resposta segura de contingência
        return {
            "reply": (
                "📎 **Não consegui me conectar aos servidores do Antigravity no momento.**\n\n"
                "Verifique sua conexão e se o token de acesso informado está ativo nas configurações."
            ),
            "animation": "alert",
            "timestamp": timezone.now().isoformat(),
        }
