from __future__ import annotations

from rest_framework import serializers


class AssistantChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(
        required=True,
        max_length=4000,
        help_text="Mensagem enviada pelo estudante para o Clippit.",
    )
    history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        help_text="Histórico das últimas mensagens para manter o contexto da conversa.",
    )


class AssistantChatResponseSerializer(serializers.Serializer):
    reply = serializers.CharField(help_text="Resposta formatada do Clippit em Markdown.")
    animation = serializers.CharField(
        help_text="Estado de animação sugerido para o Clippit (ex: writing, alert, congratulate)."
    )
    timestamp = serializers.CharField(help_text="Horário da resposta no padrão ISO 8601.")


class AssistantStatusSerializer(serializers.Serializer):
    configured = serializers.BooleanField(help_text="Indica se há credenciais ativas do Antigravity.")
    mode = serializers.CharField(
        help_text="Modo de credenciais ativo (env_token, env_refresh, custom_token, unconfigured)."
    )
    model = serializers.CharField(help_text="Modelo de IA utilizado (ex: gemini-3.8-flash).")
