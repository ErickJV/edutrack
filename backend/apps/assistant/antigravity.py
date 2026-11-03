from __future__ import annotations

import json
import logging
import os
import sqlite3
from pathlib import Path
from typing import Any

import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

DAILY_ANTIGRAVITY_ENDPOINT = "https://daily-cloudcode-pa.googleapis.com/v1internal:generateContent"
PROD_ANTIGRAVITY_ENDPOINT = "https://cloudcode-pa.googleapis.com/v1internal:generateContent"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GEMINI_DIRECT_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
DEFAULT_MODEL = "gemini-3.8-flash"
DEFAULT_PROJECT_ID = "aicode-consumers"

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


def load_omp_antigravity_credentials() -> dict[str, Any] | None:
    """
    Tenta carregar dinamicamente as credenciais do Google Antigravity armazenadas
    pelo oh-my-pi (omp) no banco de dados local do usuário (~/.omp/agent/agent.db).
    """
    candidate_paths = [
        Path.home() / ".omp" / "agent" / "agent.db",
        Path("C:/Users/nyeer/.omp/agent/agent.db"),
    ]

    db_path: Path | None = None
    for cp in candidate_paths:
        if cp.is_file():
            db_path = cp
            break

    if not db_path:
        return None

    try:
        conn = sqlite3.connect(f"file:{db_path.as_posix()}?mode=ro", uri=True)
        cur = conn.cursor()
        cur.execute(
            "SELECT data FROM auth_credentials WHERE provider = 'google-antigravity' "
            "ORDER BY updated_at DESC LIMIT 1"
        )
        row = cur.fetchone()
        if not row:
            cur.execute(
                "SELECT data FROM auth_credentials WHERE provider = 'google-gemini-cli' "
                "ORDER BY updated_at DESC LIMIT 1"
            )
            row = cur.fetchone()
        conn.close()

        if row and row[0]:
            parsed = json.loads(row[0])
            access = parsed.get("access") or parsed.get("token") or ""
            refresh = parsed.get("refresh") or parsed.get("refreshToken") or ""
            project_id = parsed.get("projectId") or parsed.get("project_id") or DEFAULT_PROJECT_ID
            expires = parsed.get("expires") or parsed.get("expiresAt")

            if access:
                return {
                    "access_token": access,
                    "refresh_token": refresh,
                    "project_id": project_id,
                    "expires": expires,
                }
    except Exception as e:
        logger.debug("Não foi possível carregar credenciais do .omp: %s", e)

    return None


class AntigravityClient:
    """
    Cliente para comunicação com o gateway Google Antigravity OAuth2 (Gemini 3.8 Flash).
    Suporta resolução automática a partir do oh-my-pi (~/.omp), credenciais globais (.env)
    e override manual opcional.
    """

    def __init__(self, custom_token: str | None = None):
        self.custom_token = (custom_token or "").strip()
        self.model = getattr(settings, "ANTIGRAVITY_MODEL", DEFAULT_MODEL)
        self.client_id = os.getenv("ANTIGRAVITY_CLIENT_ID", "")
        self.client_secret = os.getenv("ANTIGRAVITY_CLIENT_SECRET", "")
        self.refresh_token = os.getenv("ANTIGRAVITY_REFRESH_TOKEN", "")
        self.env_access_token = os.getenv("ANTIGRAVITY_ACCESS_TOKEN", "")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")

        # Resolução automática de credenciais locais do oh-my-pi (.omp)
        self.omp_creds = load_omp_antigravity_credentials()

        env_project_id = os.getenv("ANTIGRAVITY_PROJECT_ID", "").strip()
        if env_project_id:
            self.project_id = env_project_id
        elif self.omp_creds and self.omp_creds.get("project_id"):
            self.project_id = self.omp_creds["project_id"]
        else:
            self.project_id = DEFAULT_PROJECT_ID

    def get_status(self) -> dict[str, Any]:
        """Retorna o status da configuração de credenciais."""
        if self.custom_token:
            mode = "custom_token"
            configured = True
        elif self.env_access_token:
            mode = "env_token"
            configured = True
        elif self.refresh_token and self.client_id:
            mode = "env_refresh"
            configured = True
        elif self.omp_creds and self.omp_creds.get("access_token"):
            mode = "omp_credentials"
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

        if self.env_access_token:
            return self.env_access_token

        # Se houver refresh token configurado com client_id, tenta refresh
        refresh_to_use = self.refresh_token or (
            self.omp_creds.get("refresh_token") if self.omp_creds else ""
        )
        if refresh_to_use and self.client_id and self.client_secret:
            try:
                resp = requests.post(
                    GOOGLE_TOKEN_ENDPOINT,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "refresh_token": refresh_to_use,
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

        # Token extraído do oh-my-pi (.omp)
        if self.omp_creds and self.omp_creds.get("access_token"):
            return self.omp_creds["access_token"]

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
            reply = (
                "📎 **Olá! Eu sou o Clippit!**\n\n"
                "Não encontrei credenciais ativas do Google Antigravity OAuth no seu ambiente.\n\n"
                "Certifique-se de que o **oh-my-pi** está autenticado (`.omp`) ou defina "
                "`ANTIGRAVITY_ACCESS_TOKEN` no arquivo `.env` do backend!"
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
                "User-Agent": "antigravity/hub/2.26.0 (aidev_client; os_type=windows; arch=x64; cl=3959580.0)",
            }

            # Antigravity usa gemini-3.8-flash-tiered ou gemini-3-flash para Gemini Flash
            target_model = self.model
            if target_model in ("gemini-3.8-flash", "gemini-3.8"):
                candidate_models = ["gemini-3.8-flash-tiered", "gemini-3-flash", "gemini-2.5-flash"]
            else:
                candidate_models = [target_model, "gemini-3.8-flash-tiered", "gemini-3-flash"]

            endpoints = [DAILY_ANTIGRAVITY_ENDPOINT, PROD_ANTIGRAVITY_ENDPOINT]

            for endpoint in endpoints:
                for model_id in candidate_models:
                    payload = {
                        "project": self.project_id,
                        "model": model_id,
                        "request": {
                            "contents": contents,
                            "systemInstruction": {
                                "parts": [{"text": system_instruction}]
                            },
                            "generationConfig": {
                                "temperature": 0.7,
                                "maxOutputTokens": 2048,
                            },
                        },
                    }

                    try:
                        resp = requests.post(
                            endpoint,
                            headers=headers,
                            json=payload,
                            timeout=30,
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            candidates = (
                                data.get("response", {}).get("candidates", [])
                                or data.get("candidates", [])
                            )
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                text_parts = [
                                    p.get("text", "")
                                    for p in parts
                                    if not p.get("thought") and "text" in p
                                ]
                                reply_text = "".join(text_parts).strip()
                                if reply_text:
                                    return {
                                        "reply": reply_text,
                                        "animation": self._determine_animation(
                                            user_message, reply_text
                                        ),
                                        "timestamp": timezone.now().isoformat(),
                                    }

                        if resp.status_code in (401, 403):
                            logger.warning(
                                "Token Antigravity expirado ou não autorizado: %s %s",
                                resp.status_code,
                                resp.text,
                            )
                            # Não adianta tentar outros modelos se o token for inválido
                            break

                    except requests.RequestException as e:
                        logger.debug("Tentativa em %s (%s) falhou: %s", endpoint, model_id, e)

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

        # Resposta amigável se nenhuma chamada deu certo
        return {
            "reply": (
                "📎 **Não consegui me conectar aos servidores do Antigravity no momento.**\n\n"
                "Verifique se o seu ambiente do oh-my-pi (`.omp`) está com a sessão ativa "
                "ou se há credenciais válidas configuradas no servidor."
            ),
            "animation": "alert",
            "timestamp": timezone.now().isoformat(),
        }
