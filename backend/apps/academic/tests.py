from django.test import TestCase
from rest_framework.test import APIClient

from apps.academic.models import AcademicTerm, Flashcard, StudentSubject, StudyNote, Subject
from apps.accounts.models import User
from apps.catalog.models import Course


class FlashcardsAndNotesQualityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="kariny.teste@aluno.impacta.edu.br",
            password="StrongPassword123!",
            full_name="Kariny Alves",
            is_active=True,
        )
        self.client.force_authenticate(user=self.user)

        self.course = Course.objects.create(name="Análise e Desenvolvimento de Sistemas")
        self.subject = Subject.objects.create(
            course=self.course,
            name="Application Data Persistence",
            code="ADP01",
            semester=3,
            workload_hours=80,
        )
        self.term = AcademicTerm.objects.create(
            user=self.user,
            name="2026-1",
            start_date="2026-02-01",
            end_date="2026-06-30",
        )
        self.student_subject = StudentSubject.objects.create(
            user=self.user,
            subject=self.subject,
            term=self.term,
            status=StudentSubject.Status.ACTIVE,
        )

    def test_study_note_normalizes_nova_anotacao_title(self):
        note_typo = StudyNote.objects.create(
            user=self.user,
            title="Nova anotaço",
            content="Conteúdo de teste",
        )
        self.assertEqual(note_typo.title, "Nova anotação")

        note_empty = StudyNote.objects.create(
            user=self.user,
            title="   ",
            content="Outro conteúdo",
        )
        self.assertEqual(note_empty.title, "Nova anotação")

    def test_ai_flashcards_generate_deep_logical_reasoning_questions_without_generic_title(self):
        note = StudyNote.objects.create(
            user=self.user,
            student_subject=self.student_subject,
            title="Nova anotação",
            content=(
                "<p>Modelos de Software: “Este modelo é aderente o suficiente para esta aplicação específica?”</p>"
                "<p>Objetivo: capturar aspectos da realidade que sejam do interesse da situação</p>"
                "<p>Temos que considerar diversos fatores: requisitos, protótipos, tamanho do projeto, tecnologias, experiência, conhecimento, etc.</p>"
                "<p>Nossos modelos: mais detalhados que requisitos e menos complexos que o código; fácil de ser entendido e manter; passível de evolução</p>"
            ),
        )

        resp = self.client.post(
            "/api/v1/flashcards/generate-ai",
            {
                "note_id": str(note.id),
                "topic": "Nova anotaço",
                "student_subject": str(self.student_subject.id),
                "count": 4,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["created_count"], 4)

        fronts = [item["front"] for item in data["items"]]
        for front in fronts:
            self.assertNotIn("Nova anotaço", front)
            self.assertNotIn("Nova anotação", front)
            self.assertNotIn('o que significa e como se aplica "Objetivo"', front)
            self.assertNotIn('o que significa e como se aplica "Temos que considerar', front)
            self.assertNotIn('o que significa e como se aplica "Nossos modelos"', front)

        combined_fronts = " ".join(fronts).lower()
        self.assertIn("raciocínio crítico", combined_fronts)
        self.assertIn("abstração lógica", combined_fronts)
        self.assertIn("múltiplas variáveis", combined_fronts)
        self.assertIn("trade-off", combined_fronts)
        self.assertEqual(Flashcard.objects.filter(user=self.user).count(), 4)
