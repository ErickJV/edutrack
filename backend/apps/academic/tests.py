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

    def test_flashcards_individual_crud_operations(self):
        # 1. Criar (POST /api/v1/flashcards)
        create_resp = self.client.post(
            "/api/v1/flashcards",
            {
                "student_subject": str(self.student_subject.id),
                "front": "Qual a complexidade de busca na Árvore Binária de Busca balanceada?",
                "back": "O(log n) no caso médio e pior caso.",
                "hint": "Divisão pela metade a cada nível",
                "tags": "algoritmos, arvores",
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, 201)
        created = create_resp.json()
        card_id = created["id"]
        self.assertEqual(
            created["front"],
            "Qual a complexidade de busca na Árvore Binária de Busca balanceada?",
        )

        # 2. Visualizar / Consultar (GET /api/v1/flashcards e GET /api/v1/flashcards/<id>)
        list_resp = self.client.get("/api/v1/flashcards")
        self.assertEqual(list_resp.status_code, 200)
        self.assertEqual(len(list_resp.json()), 1)

        detail_resp = self.client.get(f"/api/v1/flashcards/{card_id}")
        self.assertEqual(detail_resp.status_code, 200)
        self.assertEqual(detail_resp.json()["id"], card_id)

        # 3. Editar / Atualizar frente e verso (PATCH /api/v1/flashcards/<id>)
        update_resp = self.client.patch(
            f"/api/v1/flashcards/{card_id}",
            {
                "front": "Qual a complexidade de busca em uma AVL (Árvore Balanceada)?",
                "back": "Sempre O(log n), pois o fator de balanceamento é mantido em [-1, 0, 1].",
                "hint": "Fator de balanceamento AVL",
            },
            format="json",
        )
        self.assertEqual(update_resp.status_code, 200)
        updated = update_resp.json()
        self.assertEqual(
            updated["front"],
            "Qual a complexidade de busca em uma AVL (Árvore Balanceada)?",
        )
        self.assertIn("fator de balanceamento", updated["back"])
        db_card = Flashcard.objects.get(id=card_id)
        self.assertEqual(
            db_card.front,
            "Qual a complexidade de busca em uma AVL (Árvore Balanceada)?",
        )

        # 4. Excluir (DELETE /api/v1/flashcards/<id>)
        delete_resp = self.client.delete(f"/api/v1/flashcards/{card_id}")
        self.assertEqual(delete_resp.status_code, 204)
        self.assertFalse(Flashcard.objects.filter(id=card_id).exists())

    def test_notes_tab_active_semester_filtering_excludes_application_data_persistence(self):
        from apps.catalog.models import CourseOffering

        offering = CourseOffering.objects.create(
            course=self.course,
            modality=CourseOffering.Modality.IN_PERSON,
            external_slug="ads-presencial",
        )
        self.user.course_offering = offering
        self.user.save(update_fields=["course_offering"])

        subj_sem2_pa = Subject.objects.create(
            course=self.course,
            name="Programming & Algorithms",
            code="ADS201",
            semester=2,
            workload_hours=80,
        )
        subj_sem2_se = Subject.objects.create(
            course=self.course,
            name="Software Engineering",
            code="ADS202",
            semester=2,
            workload_hours=80,
        )
        ss_pa = StudentSubject.objects.create(
            user=self.user,
            subject=subj_sem2_pa,
            status=StudentSubject.Status.ACTIVE,
            semester_period="2026/2",
        )
        StudentSubject.objects.create(
            user=self.user,
            subject=subj_sem2_se,
            status=StudentSubject.Status.ACTIVE,
            semester_period="2026/2",
        )

        # Cria anotação com vínculo incorreto à disciplina de 1º semestre (Application Data Persistence)
        existing_note = StudyNote.objects.create(
            user=self.user,
            student_subject=self.student_subject,
            title="Anotação de Aula Importante",
            content="<p>Conteúdo preservado integralmente.</p>",
        )

        # Consulta matérias do semestre vigente
        ss_resp = self.client.get("/api/v1/student-subjects")
        self.assertEqual(ss_resp.status_code, 200)
        returned_names = [item["subject"]["name"] for item in ss_resp.json()]
        self.assertIn("Programming & Algorithms", returned_names)
        self.assertIn("Software Engineering", returned_names)
        self.assertNotIn("Application Data Persistence", returned_names)

        # Verifica que a anotação existente foi preservada e desvinculada da disciplina do 1º semestre
        notes_resp = self.client.get("/api/v1/study-notes")
        self.assertEqual(notes_resp.status_code, 200)
        notes_data = notes_resp.json()
        self.assertEqual(len(notes_data), 1)
        self.assertEqual(notes_data[0]["id"], str(existing_note.id))
        self.assertEqual(notes_data[0]["title"], "Anotação de Aula Importante")
        self.assertIsNone(notes_data[0]["student_subject"])

        # Tentar associar anotação à disciplina de 1º semestre deve ser rejeitado
        bad_patch = self.client.patch(
            f"/api/v1/study-notes/{existing_note.id}",
            {"student_subject": str(self.student_subject.id)},
            format="json",
        )
        self.assertEqual(bad_patch.status_code, 400)

        # Associar à disciplina ativa do 2º semestre funciona normalmente
        good_patch = self.client.patch(
            f"/api/v1/study-notes/{existing_note.id}",
            {"student_subject": str(ss_pa.id)},
            format="json",
        )
        self.assertEqual(good_patch.status_code, 200)
        self.assertEqual(good_patch.json()["subject_name"], "Programming & Algorithms")

    def test_calendar_pdf_extraction_nomenclature_variations_and_confirmation(self):
        from apps.academic.models import AcademicEvent, AcademicTask
        from apps.academic.views import CalendarPdfExtractView

        subj_pa = Subject.objects.create(
            course=self.course,
            name="Programming & Algorithms",
            code="ADS201",
            semester=2,
            workload_hours=80,
        )
        ss_pa = StudentSubject.objects.create(
            user=self.user,
            subject=subj_pa,
            status=StudentSubject.Status.ACTIVE,
            semester_period="2026/2",
        )

        # 1. Simula a estrutura real do PDF de Programming & Algorithms (palavra por linha no pypdf)
        real_pdf_like_text = "\n \n".join(
            (
                "Disciplina: Programming & Algorithms Carga Horária: 80 horas "
                "Critérios de Avaliação PAI I (Livro 1) e PAI SUB (Livro 2) "
                "Semana 8 21/09 Aula 12 – Aplicação da Avaliação Parcial 1 (AP1). Disponibilização da AP1 (realizada durante a aula). "
                "24/09 Aula 13 – Resolução da AP1 e Entrega da lista de Exercícios "
                "Semana 12 22/10 Aula 20 – Aplicação da Avaliação Parcial 2 (AP2). Disponibilização da AP2 (realizada durante a aula). "
                "29/10 Aplicação da Prova PAI II - Período Noturno (Vide Regulamento) "
                "13 02/11 Feriado - Finados "
                "17 26/11 Avaliações Oficiais Disciplinas Presenciais e Híbridas"
            ).split(" ")
        )

        parsed_real = CalendarPdfExtractView.parse_calendar_text(
            raw_text=real_pdf_like_text,
            student_subject=ss_pa,
            user=self.user,
            filename="Plano_Programming_Algorithms.pdf",
        )
        extracted_map = {item["assessment_type"]: item["date"] for item in parsed_real["items"]}
        self.assertEqual(extracted_map.get("AP1"), "2026-09-21")
        self.assertEqual(extracted_map.get("AP2"), "2026-10-22")
        self.assertEqual(extracted_map.get("PAI 2"), "2026-10-29")
        # Avaliação Oficial agora é incluída automaticamente nos itens principais (não em sugestões)
        self.assertEqual(extracted_map.get("Avaliação Oficial"), "2026-11-26")
        self.assertIn("PAI 1", parsed_real["missing_types"])
        self.assertIn("PAI 3", parsed_real["missing_types"])

        # PAI 2 deve ser universal (sem vínculo a uma disciplina específica)
        pai2_item = next(it for it in parsed_real["items"] if it["assessment_type"] == "PAI 2")
        self.assertIsNone(pai2_item["student_subject_id"])
        self.assertEqual(pai2_item["subject_name"], "Interdisciplinar (Geral)")
        self.assertEqual(pai2_item["title"], "Prova PAI 2")

        # 2. Testa todas as variações de nomenclatura exigidas (AP 1, AP1, Avaliação Parcial 1/2, Prova PAI I/II/III e Programa de Aprendizagem Interdisciplinar)
        variations_pdf_bytes = (
            b"%PDF-1.4\n"
            b"1 0 obj << /Type /Page >> endobj\n"
            b"(AP 1: 14/09/2026) Tj\n"
            b"(Avaliacao Parcial 2 - 19/10/2026) Tj\n"
            b"(Prova PAI I: 25/09/2026) Tj\n"
            b"(Programa de Aprendizagem Interdisciplinar 2: 30/10/2026) Tj\n"
            b"(Programa de Aprendizagem Interdisciplinar III em 20/11/2026) Tj\n"
        )
        pdf_upload = SimpleUploadedFile(
            "calendario_variacoes.pdf",
            variations_pdf_bytes,
            content_type="application/pdf",
        )
        extract_resp = self.client.post(
            "/api/v1/calendar/extract-pdf",
            {"file": pdf_upload, "student_subject_id": str(ss_pa.id)},
            format="multipart",
        )
        self.assertEqual(extract_resp.status_code, 200)
        ext_data = extract_resp.json()
        var_map = {it["assessment_type"]: it["date"] for it in ext_data["items"]}
        self.assertEqual(var_map.get("AP1"), "2026-09-14")
        self.assertEqual(var_map.get("AP2"), "2026-10-19")
        self.assertEqual(var_map.get("PAI 1"), "2026-09-25")
        self.assertEqual(var_map.get("PAI 2"), "2026-10-30")
        self.assertEqual(var_map.get("PAI 3"), "2026-11-20")
        self.assertEqual(ext_data["missing_types"], [])

        # 3. Confirma o cadastro das datas extraídas e verifica persistência e ausência de duplicidade
        confirm_resp = self.client.post(
            "/api/v1/calendar/confirm-extracted",
            {
                "student_subject_id": str(ss_pa.id),
                "items": ext_data["items"],
            },
            format="json",
        )
        self.assertEqual(confirm_resp.status_code, 201)
        confirm_data = confirm_resp.json()
        self.assertEqual(confirm_data["created_count"], 5)

        # 2 eventos de disciplina (AP1, AP2) e 3 eventos universais (PAI 1, PAI 2, PAI 3)
        self.assertEqual(
            AcademicEvent.objects.filter(user=self.user, student_subject=ss_pa).count(),
            2,
        )
        self.assertEqual(
            AcademicEvent.objects.filter(user=self.user, student_subject__isnull=True).count(),
            3,
        )

        # Simula o envio do calendário de uma SEGUNDA disciplina com as mesmas provas PAI
        subj_bd = Subject.objects.create(
            course=self.course,
            name="Database Modeling",
            code="ADS202",
            semester=2,
            workload_hours=80,
        )
        ss_bd = StudentSubject.objects.create(
            user=self.user,
            subject=subj_bd,
            status=StudentSubject.Status.ACTIVE,
            semester_period="2026/2",
        )
        pdf_upload2 = SimpleUploadedFile(
            "calendario_variacoes_bd.pdf",
            variations_pdf_bytes,
            content_type="application/pdf",
        )
        extract_resp2 = self.client.post(
            "/api/v1/calendar/extract-pdf",
            {"file": pdf_upload2, "student_subject_id": str(ss_bd.id)},
            format="multipart",
        )
        self.assertEqual(extract_resp2.status_code, 200)
        ext_data2 = extract_resp2.json()
        pai_items2 = [it for it in ext_data2["items"] if "PAI" in it["assessment_type"]]
        for p_it in pai_items2:
            self.assertTrue(
                p_it["already_exists"],
                "A prova PAI universal já existente deve ser reconhecida como já cadastrada",
            )

        # Ao confirmar o segundo PDF, os eventos universais PAI NÃO duplicam
        confirm_resp2 = self.client.post(
            "/api/v1/calendar/confirm-extracted",
            {
                "student_subject_id": str(ss_bd.id),
                "items": ext_data2["items"],
            },
            format="json",
        )
        self.assertEqual(confirm_resp2.status_code, 201)
        # AP1 e AP2 da nova disciplina criados (2), e as 3 PAIs foram atualizadas/reutilizadas sem duplicação
        self.assertEqual(confirm_resp2.json()["created_count"], 2)
        self.assertEqual(confirm_resp2.json()["updated_count"], 3)
        self.assertEqual(
            AcademicEvent.objects.filter(user=self.user, student_subject__isnull=True).count(),
            3,
        )

        # 4. Verifica consulta ao calendário /api/v1/calendar exibindo eventos universais com Interdisciplinar (Geral)
        cal_resp = self.client.get("/api/v1/calendar?from=2026-09-01T00:00:00Z&to=2026-11-30T23:59:59Z")
        self.assertEqual(cal_resp.status_code, 200)
        cal_items = cal_resp.json()["items"]
        pai_cal_item = next(it for it in cal_items if it["title"] == "Prova PAI 1")
        self.assertEqual(pai_cal_item["subject_name"], "Interdisciplinar (Geral)")
        self.assertIsNone(pai_cal_item["student_subject_id"])

        # 5. Permite editar ou excluir pós-cadastro
        event_id = confirm_data["items"][0]["id"]
        patch_ev = self.client.patch(
            f"/api/v1/academic-events/{event_id}",
            {"title": "Avaliação Parcial 1 (AP1) — Retificada"},
            format="json",
        )
        self.assertEqual(patch_ev.status_code, 200)

        del_ev = self.client.delete(f"/api/v1/academic-events/{event_id}")
        self.assertEqual(del_ev.status_code, 204)

    def test_calendar_pdf_official_and_substitute_exams_automatic_extraction(self):
        from apps.academic.models import AcademicEvent
        from apps.academic.views import CalendarPdfExtractView

        subj = Subject.objects.create(
            course=self.course,
            name="Sistemas Distribuídos",
            code="ADS301",
            semester=3,
            workload_hours=80,
        )
        ss = StudentSubject.objects.create(
            user=self.user,
            subject=subj,
            status=StudentSubject.Status.ACTIVE,
            semester_period="2026/2",
        )

        raw_text = (
            "Cronograma de Aulas e Avaliações\n"
            "26/11 Avaliações Oficiais Disciplinas Presenciais e Híbridas\n"
            "30/11 Avaliação Oficial Presencial\n"
            "10/12 Prova Substitutiva Disciplinas Presenciais\n"
            "14/12 Avaliação Substitutiva Especial\n"
        )
        parsed = CalendarPdfExtractView.parse_calendar_text(
            raw_text=raw_text,
            student_subject=ss,
            user=self.user,
            filename="cronograma.pdf",
        )

        # Devem ser extraídas automaticamente nos items principais (não em other_detected_items)
        self.assertEqual(len(parsed["items"]), 4)
        types = [it["assessment_type"] for it in parsed["items"]]
        self.assertIn("Avaliação Oficial", types)
        self.assertIn("Prova Substitutiva", types)
        # NUNCA o tipo genérico "OUTRA" ou "Outra avaliação" quando o tipo real é reconhecido
        self.assertNotIn("OUTRA", types)
        self.assertNotIn("Outra avaliação", types)

        # Confirma o cadastro e confere persistência
        confirm_resp = self.client.post(
            "/api/v1/calendar/confirm-extracted",
            {
                "student_subject_id": str(ss.id),
                "items": parsed["items"],
            },
            format="json",
        )
        self.assertEqual(confirm_resp.status_code, 201)
        self.assertEqual(confirm_resp.json()["created_count"], 4)

        # Verifica tipo exato registrado na descrição e persistência
        events = AcademicEvent.objects.filter(user=self.user, student_subject=ss)
        self.assertEqual(events.count(), 4)
        for ev in events:
            self.assertTrue(
                "Tipo: Avaliação Oficial" in ev.description
                or "Tipo: Prova Substitutiva" in ev.description
            )
            self.assertFalse("Tipo: OUTRA" in ev.description)

    def test_calendar_pdf_other_suggestions_removal_and_deduplication(self):
        from apps.academic.models import AcademicEvent
        from apps.academic.views import CalendarPdfExtractView

        subj = Subject.objects.create(
            course=self.course,
            name="Engenharia de Requisitos",
            code="ADS302",
            semester=3,
            workload_hours=80,
        )
        ss = StudentSubject.objects.create(
            user=self.user,
            subject=subj,
            status=StudentSubject.Status.ACTIVE,
            semester_period="2026/2",
        )

        raw_text = (
            "Cronograma da Disciplina:\n"
            "15/12 Exame Final da Turma\n"
        )
        parsed = CalendarPdfExtractView.parse_calendar_text(
            raw_text=raw_text,
            student_subject=ss,
            user=self.user,
            filename="plano.pdf",
        )

        # Deve aparecer como sugestão inicial em other_detected_items
        self.assertEqual(len(parsed["other_detected_items"]), 1)
        suggested = parsed["other_detected_items"][0]
        self.assertEqual(suggested["date"], "2026-12-15")

        # Cadastra o evento sugerido
        confirm_resp = self.client.post(
            "/api/v1/calendar/confirm-extracted",
            {
                "student_subject_id": str(ss.id),
                "items": [
                    {
                        "title": suggested["title"],
                        "date": suggested["date"],
                        "assessment_type": "OUTRA",
                    }
                ],
            },
            format="json",
        )
        self.assertEqual(confirm_resp.status_code, 201)
        self.assertEqual(AcademicEvent.objects.filter(user=self.user, student_subject=ss).count(), 1)

        # Ao processar novamente o mesmo documento (ou nova leitura), o evento já cadastrado NÃO aparece em sugestões
        re_parsed = CalendarPdfExtractView.parse_calendar_text(
            raw_text=raw_text,
            student_subject=ss,
            user=self.user,
            filename="plano.pdf",
        )
        self.assertEqual(
            len(re_parsed["other_detected_items"]),
            0,
            "Uma sugestão já cadastrada no banco não deve voltar a aparecer como opção a adicionar",
        )

    def test_calendar_docx_upload_extraction_and_file_signature_validation(self):
        import io
        import zipfile

        subj = Subject.objects.create(
            course=self.course,
            name="Arquitetura de Software",
            code="ADS303",
            semester=3,
            workload_hours=80,
        )
        ss = StudentSubject.objects.create(
            user=self.user,
            subject=subj,
            status=StudentSubject.Status.ACTIVE,
            semester_period="2026/2",
        )

        # 1. Cria um arquivo Word (.docx) genuíno contendo parágrafos com datas de avaliação
        docx_buf = io.BytesIO()
        with zipfile.ZipFile(docx_buf, "w") as zf:
            zf.writestr(
                "[Content_Types].xml",
                '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
            )
            zf.writestr(
                "word/document.xml",
                '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
                '<w:body>'
                '<w:p><w:r><w:t>Disciplina: Arquitetura de Software</w:t></w:r></w:p>'
                '<w:p><w:r><w:t>Semana 8 - 18/09/2026: Aplicação da Avaliação Parcial 1 (AP1)</w:t></w:r></w:p>'
                '<w:p><w:r><w:t>Semana 12 - 23/10/2026: Avaliação Parcial 2 (AP2)</w:t></w:r></w:p>'
                '<w:p><w:r><w:t>29/10/2026 - Prova PAI 2 Geral</w:t></w:r></w:p>'
                '</w:body></w:document>',
            )
        docx_bytes = docx_buf.getvalue()

        docx_upload = SimpleUploadedFile(
            "calendario_semestre.docx",
            docx_bytes,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        resp_docx = self.client.post(
            "/api/v1/calendar/extract-pdf",
            {"file": docx_upload, "student_subject_id": str(ss.id)},
            format="multipart",
        )
        self.assertEqual(resp_docx.status_code, 200)
        data_docx = resp_docx.json()
        items_map = {it["assessment_type"]: it["date"] for it in data_docx["items"]}
        self.assertEqual(items_map.get("AP1"), "2026-09-18")
        self.assertEqual(items_map.get("AP2"), "2026-10-23")
        self.assertEqual(items_map.get("PAI 2"), "2026-10-29")

        # 2. Rejeição de arquivo com extensão adulterada (arquivo texto fingindo ser .pdf)
        fake_pdf = SimpleUploadedFile(
            "documento_falso.pdf",
            b"Este arquivo e apenas um texto simples sem assinatura de PDF",
            content_type="application/pdf",
        )
        resp_fake_pdf = self.client.post(
            "/api/v1/calendar/extract-pdf",
            {"file": fake_pdf, "student_subject_id": str(ss.id)},
            format="multipart",
        )
        self.assertEqual(resp_fake_pdf.status_code, 400)
        self.assertIn("Arquivo corrompido ou formato inválido", resp_fake_pdf.json()["errors"]["file"])

        # 3. Rejeição de arquivo com extensão adulterada (binário aleatório fingindo ser .docx)
        fake_docx = SimpleUploadedFile(
            "arquivo_falso.docx",
            b"\x7fELF\x02\x01\x01\x00executavel_falso",
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        resp_fake_docx = self.client.post(
            "/api/v1/calendar/extract-pdf",
            {"file": fake_docx, "student_subject_id": str(ss.id)},
            format="multipart",
        )
        self.assertEqual(resp_fake_docx.status_code, 400)
        self.assertIn("Arquivo corrompido ou formato inválido", resp_fake_docx.json()["errors"]["file"])

        # 4. Rejeição de formato não suportado (ex.: .xlsx, .txt)
        unsupported_file = SimpleUploadedFile(
            "tabela.xlsx",
            b"PK\x03\x04conteudo_qualquer",
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        resp_unsupported = self.client.post(
            "/api/v1/calendar/extract-pdf",
            {"file": unsupported_file, "student_subject_id": str(ss.id)},
            format="multipart",
        )
        self.assertEqual(resp_unsupported.status_code, 400)
        self.assertIn("Formato não suportado", resp_unsupported.json()["errors"]["file"])

    def test_calendar_upload_and_confirmation_sql_injection_defense(self):
        from apps.academic.models import AcademicEvent

        subj = Subject.objects.create(
            course=self.course,
            name="Segurança da Informação",
            code="ADS304",
            semester=3,
            workload_hours=80,
        )
        ss = StudentSubject.objects.create(
            user=self.user,
            subject=subj,
            status=StudentSubject.Status.ACTIVE,
            semester_period="2026/2",
        )

        # 1. Tentativa de SQL Injection no parâmetro student_subject_id
        valid_pdf_bytes = b"%PDF-1.4\n1 0 obj << /Type /Page >> endobj\n(AP 1: 15/09/2026) Tj\n"
        pdf_file = SimpleUploadedFile("prova.pdf", valid_pdf_bytes, content_type="application/pdf")

        sqli_extract = self.client.post(
            "/api/v1/calendar/extract-pdf",
            {
                "file": pdf_file,
                "student_subject_id": "' OR 1=1 --",
            },
            format="multipart",
        )
        self.assertEqual(sqli_extract.status_code, 400)
        self.assertIn("student_subject_id", sqli_extract.json()["errors"])

        # 2. Tentativa de SQL Injection no endpoint de confirmação
        sqli_confirm = self.client.post(
            "/api/v1/calendar/confirm-extracted",
            {
                "student_subject_id": str(ss.id),
                "items": [
                    {
                        "title": "Avaliação'; DROP TABLE academic_academicevent; --",
                        "date": "2026-10-15",
                        "assessment_type": "PROVA' OR '1'='1",
                        "source_snippet": "'; SELECT * FROM auth_user; --",
                    }
                ],
            },
            format="json",
        )
        self.assertEqual(sqli_confirm.status_code, 201)

        # O evento é salvo com parametrização íntegra do ORM sem quebrar a tabela ou executar comandos arbitrários
        saved_ev = AcademicEvent.objects.filter(user=self.user, student_subject=ss).first()
        self.assertIsNotNone(saved_ev)
        self.assertIn("Avaliação", saved_ev.title)
        # Confirma que a tabela continua intacta e funcional
        self.assertTrue(AcademicEvent.objects.exists())



