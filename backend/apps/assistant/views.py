from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academic.permissions import IsAuthenticatedOr401
from apps.accounts.authentication import BrowserSessionAuthentication

from .antigravity import AntigravityClient
from .context import format_academic_context_for_prompt, get_student_academic_context
from .serializers import (
    AssistantChatRequestSerializer,
    AssistantChatResponseSerializer,
    AssistantStatusSerializer,
)


class AssistantChatView(APIView):
    """
    Endpoint para envio de mensagens para o assistente Clippit com Gemini 3.8 Flash.
    Injeta no prompt exclusivamente o contexto acadêmico do usuário autenticado.
    """

    authentication_classes = [BrowserSessionAuthentication]
    permission_classes = [IsAuthenticatedOr401]

    @extend_schema(
        request=AssistantChatRequestSerializer,
        responses={200: AssistantChatResponseSerializer},
        summary="Conversar com o assistente Clippit",
        description="Envia mensagem para o Clippit, que processa a dúvida com o contexto acadêmico do aluno via Gemini 3.8 Flash.",
    )
    def post(self, request, *args, **kwargs):
        serializer = AssistantChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_message = serializer.validated_data["message"]
        history = serializer.validated_data.get("history", [])

        # Token customizado opcional fornecido no header pelo frontend
        custom_token = request.headers.get("X-Antigravity-Token")

        # Contexto estritamente isolado do estudante autenticado
        academic_context = get_student_academic_context(request.user)
        academic_context_md = format_academic_context_for_prompt(academic_context)

        client = AntigravityClient(custom_token=custom_token)
        response_data = client.generate_chat_response(
            user_message=user_message,
            conversation_history=history,
            academic_context_markdown=academic_context_md,
        )

        resp_serializer = AssistantChatResponseSerializer(data=response_data)
        resp_serializer.is_valid(raise_exception=True)
        return Response(resp_serializer.data, status=status.HTTP_200_OK)


class AssistantContextView(APIView):
    """
    Retorna o contexto acadêmico sintetizado do usuário autenticado.
    Útil para depuração, auditoria e exibição no painel de suporte.
    """

    authentication_classes = [BrowserSessionAuthentication]
    permission_classes = [IsAuthenticatedOr401]

    @extend_schema(
        summary="Contexto acadêmico do estudante para o assistente",
        description="Retorna os dados consolidados de perfil, disciplinas, faltas, tarefas, provas e leituras do usuário logado.",
    )
    def get(self, request, *args, **kwargs):
        context_data = get_student_academic_context(request.user)
        return Response(context_data, status=status.HTTP_200_OK)


class AssistantStatusView(APIView):
    """
    Verifica o status da conexão e configuração com o Google Antigravity OAuth.
    """

    authentication_classes = [BrowserSessionAuthentication]
    permission_classes = [IsAuthenticatedOr401]

    @extend_schema(
        responses={200: AssistantStatusSerializer},
        summary="Status de configuração do Antigravity",
        description="Verifica se o backend possui credenciais ativas do Antigravity para o modelo Gemini 3.8 Flash.",
    )
    def get(self, request, *args, **kwargs):
        custom_token = request.headers.get("X-Antigravity-Token")
        client = AntigravityClient(custom_token=custom_token)
        status_data = client.get_status()
        serializer = AssistantStatusSerializer(data=status_data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
