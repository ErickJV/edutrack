from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings

from apps.llm.client import (
    DEEPSEEK_CHAT_ENDPOINT,
    LLMClient,
    LLMError,
    LLMNotConfiguredError,
)


def _response(status_code: int, payload: dict | None = None) -> MagicMock:
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = payload or {}
    response.text = ""
    return response


class LLMClientTransportTests(TestCase):
    @override_settings(DEEPSEEK_API_KEY="test-key", DEEPSEEK_MODEL="deepseek-flash")
    @patch("apps.llm.client.requests.post")
    def test_chat_sends_bearer_and_disables_thinking(self, mock_post):
        mock_post.return_value = _response(
            200, {"choices": [{"message": {"content": "  resposta do modelo  "}}]}
        )

        content = LLMClient().chat([{"role": "user", "content": "olá"}])

        self.assertEqual(content, "resposta do modelo")
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], DEEPSEEK_CHAT_ENDPOINT)
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer test-key")
        self.assertEqual(kwargs["json"]["model"], "deepseek-flash")
        self.assertEqual(kwargs["json"]["thinking"], {"type": "disabled"})
        self.assertFalse(kwargs["json"]["stream"])
        self.assertNotIn("response_format", kwargs["json"])

    @override_settings(DEEPSEEK_API_KEY="")
    @patch("apps.llm.client.requests.post")
    def test_chat_requires_api_key(self, mock_post):
        with self.assertRaises(LLMNotConfiguredError):
            LLMClient().chat([{"role": "user", "content": "olá"}])
        mock_post.assert_not_called()

    @override_settings(DEEPSEEK_API_KEY="test-key")
    @patch("apps.llm.client.requests.post")
    def test_chat_json_parses_fenced_object(self, mock_post):
        mock_post.return_value = _response(
            200, {"choices": [{"message": {"content": '```json\n{"ok": true}\n```'}}]}
        )

        result = LLMClient().chat_json([{"role": "user", "content": "json"}])

        self.assertEqual(result, {"ok": True})
        self.assertEqual(
            mock_post.call_args.kwargs["json"]["response_format"],
            {"type": "json_object"},
        )

    @override_settings(DEEPSEEK_API_KEY="test-key")
    @patch("apps.llm.client.requests.post")
    def test_chat_raises_on_http_error(self, mock_post):
        mock_post.return_value = _response(500)

        with self.assertRaises(LLMError):
            LLMClient().chat([{"role": "user", "content": "olá"}])
