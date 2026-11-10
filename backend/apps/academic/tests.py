from django.core.files.uploadedfile import SimpleUploadedFile
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
            code="ADS101",
            semester=1,
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
        self.assertIn("critério decisivo de aderência", combined_fronts)
        self.assertIn("razão lógica", combined_fronts)
        self.assertIn("fatores técnicos e humanos", combined_fronts)
        self.assertIn("trade-off", combined_fronts)
        self.assertEqual(Flashcard.objects.filter(user=self.user).count(), 4)

    def test_bidirectional_sync_between_tasks_and_calendar(self):
        # 1. Cria tarefa na aba Tarefas (com disciplina) -> deve constar em /api/v1/calendar
        resp_task = self.client.post(
            "/api/v1/tasks",
            {
                "student_subject": str(self.student_subject.id),
                "category": "assignment",
                "title": "Entrega do Protótipo",
                "due_date": "2026-11-05T19:00:00Z",
                "end_date": "2026-11-05T21:00:00Z",
                "estimated_minutes": 90,
            },
            format="json",
        )
        self.assertEqual(resp_task.status_code, 201)

        # 2. Cria atividade geral na aba Tarefas (sem disciplina) -> deve constar em /api/v1/tasks e /api/v1/calendar
        resp_general = self.client.post(
            "/api/v1/tasks",
            {
                "student_subject": None,
                "category": "other",
                "title": "Revisão Geral da Semana",
                "due_date": "2026-11-06T19:00:00Z",
            },
            format="json",
        )
        self.assertEqual(resp_general.status_code, 201)
        self.assertEqual(resp_general.json()["subject_name"], "Geral / Outras Atividades")

        # 3. Cria evento via endpoint de calendário (/api/v1/academic-events) -> sincroniza com /api/v1/tasks sem duplicar no calendário
        resp_event = self.client.post(
            "/api/v1/academic-events",
            {
                "title": "Prova P1",
                "kind": "exam",
                "starts_at": "2026-11-07T19:00:00Z",
                "ends_at": "2026-11-07T21:00:00Z",
                "student_subject_id": str(self.student_subject.id),
            },
            format="json",
        )
        self.assertEqual(resp_event.status_code, 201)

        tasks_list = self.client.get("/api/v1/tasks").json()
        self.assertEqual(len(tasks_list), 3)

        cal_resp = self.client.get(
            "/api/v1/calendar?from=2026-11-01T00:00:00Z&to=2026-11-10T23:59:59Z"
        )
        self.assertEqual(cal_resp.status_code, 200)
        cal_items = cal_resp.json()["items"]
        self.assertEqual(len(cal_items), 3)

    def test_study_document_ai_cognitive_pipeline_and_quiz_citations(self):
        from apps.academic.models import StudyDocument, StudyDocumentPage

        doc = StudyDocument.objects.create(
            user=self.user,
            student_subject=self.student_subject,
            title="Apresentação Normalização de Banco de Dados",
            file_type="pdf",
            page_count=3,
        )

        StudyDocumentPage.objects.create(
            document=doc,
            page_number=1,
            content="Primeira Forma Normal (1FN): exige atomicidade de todos os atributos e ausência de vetores repetidos.",
            token_count=18,
        )
        StudyDocumentPage.objects.create(
            document=doc,
            page_number=2,
            content="Segunda Forma Normal (2FN): além da 1FN, nenhum atributo não chave pode depender parcialmente da chave primária.",
            token_count=20,
        )
        StudyDocumentPage.objects.create(
            document=doc,
            page_number=3,
            content="Terceira Forma Normal (3FN): requer ausência de dependência transitiva entre atributos não chave na relação.",
            token_count=19,
        )

        # 1. Executa Análise Cognitiva com Citações Obrigatórias
        analyze_resp = self.client.post(f"/api/v1/study-documents/{doc.id}/ai-analyze")
        self.assertEqual(analyze_resp.status_code, 200)
        data = analyze_resp.json()

        # Valida que o resumo e tópicos complexos trazem a citação de página
        self.assertIn("Pág.", data["summary"])
        self.assertTrue(len(data["complex_topics"]) > 0)
        self.assertIn("Pág.", data["complex_topics"][0]["citation"])
        self.assertTrue(len(data["key_concepts"]) > 0)
        self.assertIn("Pág.", data["key_concepts"][0]["citation"])
        self.assertIn("graph TD", data["mental_map_mermaid"])
        self.assertTrue(len(data["study_roadmap"]) >= 3)
        self.assertTrue(len(data["reinforcement_topics"]) > 0)

        # 2. Gera Simulado de 10 Questões aprofundadas com citações
        quiz_resp = self.client.post(f"/api/v1/study-documents/{doc.id}/quiz")
        self.assertEqual(quiz_resp.status_code, 201)
        quiz_data = quiz_resp.json()
        self.assertEqual(quiz_data["total_questions"], 10)
        self.assertEqual(len(quiz_data["questions"]), 10)
        self.assertIn("Pág.", quiz_data["questions"][0]["citation"])

        # 3. Submete respostas do simulado e verifica pontuação e feedback
        quiz_id = quiz_data["id"]
        # Responde certo a primeira e a segunda pergunta
        answers = {
            "1": quiz_data["questions"][0]["correct_option_index"],
            "2": quiz_data["questions"][1]["correct_option_index"],
        }
        submit_resp = self.client.post(
            f"/api/v1/study-documents/{doc.id}/quiz",
            {"action": "submit", "quiz_id": quiz_id, "answers": answers},
            format="json",
        )
        self.assertEqual(submit_resp.status_code, 200)
        submit_data = submit_resp.json()
        self.assertEqual(submit_data["score"], 2)
        self.assertEqual(submit_data["total_questions"], 10)
        self.assertEqual(submit_data["percentage"], 20.0)
        self.assertEqual(len(submit_data["feedback"]), 10)
        self.assertTrue(submit_data["feedback"][0]["is_correct"])

        # 4. Valida upload multipart real via API (/api/v1/study-documents), bloqueio de .txt/.md e proteção SQLi
        rejected_md = SimpleUploadedFile(
            "notas.md",
            b"# Markdown nao permitido",
            content_type="text/markdown",
        )
        reject_resp = self.client.post(
            "/api/v1/study-documents",
            {"file": rejected_md},
            format="multipart",
        )
        self.assertEqual(reject_resp.status_code, 400)

        sqli_file = SimpleUploadedFile(
            "apostila.pdf",
            b"%PDF-1.4 Normalizacao de Dados",
            content_type="application/pdf",
        )
        sqli_resp = self.client.post(
            "/api/v1/study-documents",
            {"file": sqli_file, "title": "Teste'; DROP TABLE academic_studydocument; --"},
            format="multipart",
        )
        self.assertEqual(sqli_resp.status_code, 400)

        uploaded = SimpleUploadedFile(
            "apostila_normalizacao.pdf",
            b"%PDF-1.4 Normalizacao de Dados e Formas Normais",
            content_type="application/pdf",
        )
        upload_resp = self.client.post(
            "/api/v1/study-documents",
            {"file": uploaded},
            format="multipart",
        )
        self.assertEqual(upload_resp.status_code, 201)
        uploaded_json = upload_resp.json()
        self.assertEqual(uploaded_json["title"], "apostila_normalizacao.pdf")
        self.assertGreaterEqual(uploaded_json["page_count"], 1)
        self.assertTrue(len(uploaded_json["pages"]) >= 1)
        self.assertIn("summary", uploaded_json["analysis_cache"])

        list_resp = self.client.get("/api/v1/study-documents")
        self.assertEqual(list_resp.status_code, 200)
        self.assertIsInstance(list_resp.json(), list)
        self.assertGreaterEqual(len(list_resp.json()), 2)


