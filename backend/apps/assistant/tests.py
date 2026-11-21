from unittest.mock import MagicMock, patch
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.academic.models import (
    AcademicEvent,
    AcademicReading,
    AcademicTask,
    ClassOccurrence,
    ClassSchedule,
    StudentSubject,
    Subject,
)
from apps.assistant.context import format_academic_context_for_prompt, get_student_academic_context
from apps.llm.client import LLMClient
from apps.catalog.models import Course, CourseOffering

User = get_user_model()


class AssistantContextAndChatTestCase(TestCase):
    def setUp(self):
        self.course = Course.objects.create(
            name="Engenharia de Software",
            slug="eng-software",
            degree_type=Course.DegreeType.BACHELOR,
        )
        self.offering = CourseOffering.objects.create(
            course=self.course,
            modality=CourseOffering.Modality.IN_PERSON,
            external_slug="eng-software-presencial",
        )
        self.user1 = User.objects.create_user(
            email="aluno1@edutrack.com",
            password="StrongPassword123!",
            full_name="Aluno Um",
            course_offering=self.offering,
        )
        self.user2 = User.objects.create_user(
            email="aluno2@edutrack.com",
            password="StrongPassword123!",
            full_name="Aluno Dois",
            course_offering=self.offering,
        )

        self.subject1 = Subject.objects.create(
            course=self.course,
            name="Banco de Dados",
            code="BD101",
            workload_hours=80,
            semester=2,
        )
        self.subject2 = Subject.objects.create(
            course=self.course,
            name="Algoritmos Avançados",
            code="ALG201",
            workload_hours=80,
            semester=2,
        )

        self.enr1 = StudentSubject.objects.create(
            user=self.user1,
            subject=self.subject1,
            status=StudentSubject.Status.ACTIVE,
        )
        self.enr2 = StudentSubject.objects.create(
            user=self.user2,
            subject=self.subject2,
            status=StudentSubject.Status.ACTIVE,
        )

        # Tarefas
        self.task1 = AcademicTask.objects.create(
            user=self.user1,
            student_subject=self.enr1,
            title="Modelagem ER da Biblioteca",
            status=AcademicTask.Status.PENDING,
            due_date=timezone.now() + timezone.timedelta(days=2),
        )
        self.task2 = AcademicTask.objects.create(
            user=self.user2,
            student_subject=self.enr2,
            title="Trabalho de Grafos",
            status=AcademicTask.Status.PENDING,
            due_date=timezone.now() + timezone.timedelta(days=3),
        )

        # Provas
        self.event1 = AcademicEvent.objects.create(
            user=self.user1,
            student_subject=self.enr1,
            title="P1 - Álgebra Relacional",
            kind=AcademicEvent.Kind.EXAM,
            starts_at=timezone.now() + timezone.timedelta(days=5),
        )

        # Leituras
        self.reading1 = AcademicReading.objects.create(
            user=self.user1,
            student_subject=self.enr1,
            title="Sistemas de Banco de Dados",
            author="Navathe",
            total_pages=500,
            current_page=120,
        )

        self.client1 = APIClient()
        self.client1.force_authenticate(user=self.user1)

    def test_context_isolation_between_users(self):
        """Verifica que o contexto acadêmico de user1 não contém dados de user2."""
        ctx1 = get_student_academic_context(self.user1)
        self.assertEqual(ctx1["student"]["full_name"], "Aluno Um")
        self.assertEqual(len(ctx1["subjects"]), 1)
        self.assertEqual(ctx1["subjects"][0]["name"], "Banco de Dados")

        # Verifica tarefas
        pending_titles = [t["title"] for t in ctx1["tasks"]["pending"]]
        self.assertIn("Modelagem ER da Biblioteca", pending_titles)
        self.assertNotIn("Trabalho de Grafos", pending_titles)

        # Contexto de user2
        ctx2 = get_student_academic_context(self.user2)
        self.assertEqual(ctx2["student"]["full_name"], "Aluno Dois")
        self.assertEqual(len(ctx2["subjects"]), 1)
        self.assertEqual(ctx2["subjects"][0]["name"], "Algoritmos Avançados")

    def test_context_markdown_format(self):
        """Verifica a conversão para Markdown legível para o prompt do modelo."""
        ctx = get_student_academic_context(self.user1)
        md = format_academic_context_for_prompt(ctx)
        self.assertIn("Aluno Um", md)
        self.assertIn("Banco de Dados", md)
        self.assertIn("Modelagem ER da Biblioteca", md)
        self.assertIn("P1 - Álgebra Relacional", md)
        self.assertIn("Sistemas de Banco de Dados", md)

    def test_assistant_context_api_endpoint(self):
        """Endpoint GET /api/v1/assistant/context retorna 200 OK com dados isolados."""
        resp = self.client1.get("/api/v1/assistant/context")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["student"]["email"], "aluno1@edutrack.com")

    @override_settings(DEEPSEEK_API_KEY="")
    def test_assistant_status_api_endpoint(self):
        """Endpoint GET /api/v1/assistant/status retorna apenas se está configurado."""
        resp = self.client1.get("/api/v1/assistant/status")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), {"configured": False})

    @override_settings(DEEPSEEK_API_KEY="")
    @patch("apps.llm.client.requests.post")
    def test_assistant_chat_unconfigured_fallback(self, mock_post):
        """Sem chave configurada, responde educadamente sem chamar o serviço externo."""
        self.assertFalse(LLMClient().get_status()["configured"])

        resp = self.client1.post(
            "/api/v1/assistant/chat",
            {"message": "O que devo estudar hoje?"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("Clippit", data["reply"])
        self.assertEqual(data["animation"], "alert")
        mock_post.assert_not_called()

    @override_settings(DEEPSEEK_API_KEY="test-key", DEEPSEEK_MODEL="deepseek-flash")
    @patch("apps.llm.client.requests.post")
    def test_assistant_chat_with_deepseek_api_key(self, mock_post):
        """Com chave configurada, envia o contexto ao endpoint compatível com OpenAI."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "Olá! Notei que você tem tarefas de Banco de Dados para entregar.",
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        resp = self.client1.post(
            "/api/v1/assistant/chat",
            {
                "message": "Quais tarefas eu tenho pendentes?",
                "history": [
                    {
                        "role": "user",
                        "content": "Quais tarefas eu tenho pendentes?",
                    }
                ],
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("Banco de Dados", resp.json()["reply"])
        self.assertEqual(resp.json()["animation"], "wave")

        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], "https://api.deepseek.com/chat/completions")
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer test-key")
        self.assertEqual(kwargs["json"]["model"], "deepseek-flash")
        self.assertEqual(kwargs["json"]["messages"][0]["role"], "system")
        self.assertIn("Banco de Dados", kwargs["json"]["messages"][0]["content"])
        user_messages = [
            message
            for message in kwargs["json"]["messages"]
            if message["role"] == "user"
        ]
        self.assertEqual(
            user_messages,
            [{"role": "user", "content": "Quais tarefas eu tenho pendentes?"}],
        )
