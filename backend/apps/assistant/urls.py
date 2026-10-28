from __future__ import annotations

from django.urls import path

from .views import AssistantChatView, AssistantContextView, AssistantStatusView

app_name = "assistant"

urlpatterns = [
    path("assistant/chat", AssistantChatView.as_view(), name="assistant-chat"),
    path("assistant/context", AssistantContextView.as_view(), name="assistant-context"),
    path("assistant/status", AssistantStatusView.as_view(), name="assistant-status"),
]
