import datetime

import pytest
from django.test import Client
from django.utils import timezone

from apps.academic.models import AcademicReading, ReadingLog, StudentSubject, Subject
from apps.accounts.models import User

pytestmark = pytest.mark.django_db


def create_enrollment(user, offering):
    subject = (
        Subject.objects.filter(course=offering.course, active=True)
        .order_by("semester", "name")
        .first()
    )
    assert subject is not None
    return StudentSubject.objects.create(user=user, subject=subject, semester_period="2026/1")


def test_academic_reading_crud(client: Client, offering):
    user = User.objects.create_user(
        email="leitura.crud@aluno.impacta.edu.br",
        full_name="Aluno Leitura CRUD",
        course_offering=offering,
    )
    client.force_login(user)
    enrollment = create_enrollment(user, offering)

    exam_date = (timezone.now().date() + datetime.timedelta(days=10)).isoformat()

    # 1. Criação de leitura
    create_res = client.post(
        "/api/v1/academic-readings",
        data={
            "student_subject": str(enrollment.id),
            "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
            "author": "Robert C. Martin",
            "total_pages": 400,
            "current_page": 50,
            "daily_goal_pages": 20,
            "exam_name": "Prova 1 - Arquitetura de Software",
            "exam_questions_count": 60,
            "exam_date": exam_date,
        },
        content_type="application/json",
    )
    assert create_res.status_code == 201
    data = create_res.json()
    reading_id = data["id"]
    assert data["title"] == "Clean Code: A Handbook of Agile Software Craftsmanship"
    assert data["author"] == "Robert C. Martin"
    assert data["total_pages"] == 400
    assert data["current_page"] == 50
    assert data["progress_percent"] == 12  # (50/400)*100
    assert data["pages_remaining"] == 350
    assert data["days_until_exam"] == 10
    assert data["suggested_daily_pages"] == 35  # (350+10-1)//10 = 35
    assert data["status"] == "reading"

    # 2. Listagem de leituras
    list_res = client.get("/api/v1/academic-readings")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1
    assert list_res.json()[0]["id"] == reading_id

    # 3. Detalhes
    detail_res = client.get(f"/api/v1/academic-readings/{reading_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["title"] == "Clean Code: A Handbook of Agile Software Craftsmanship"

    # 4. Atualização parcial (PATCH)
    patch_res = client.patch(
        f"/api/v1/academic-readings/{reading_id}",
        data={"current_page": 100, "daily_goal_pages": 25},
        content_type="application/json",
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["current_page"] == 100
    assert patch_res.json()["progress_percent"] == 25
    assert patch_res.json()["pages_remaining"] == 300
    assert patch_res.json()["daily_goal_pages"] == 25

    # 5. Exclusão
    del_res = client.delete(f"/api/v1/academic-readings/{reading_id}")
    assert del_res.status_code == 204
    assert AcademicReading.objects.filter(id=reading_id).count() == 0


def test_academic_reading_log_and_auto_completion(client: Client, offering):
    user = User.objects.create_user(
        email="leitura.log@aluno.impacta.edu.br",
        full_name="Aluno Leitura Log",
        course_offering=offering,
    )
    client.force_login(user)

    reading = AcademicReading.objects.create(
        user=user,
        title="Estruturas de Dados e Seus Algoritmos",
        total_pages=100,
        current_page=20,
        daily_goal_pages=15,
    )

    # 1. Registrar progresso (+30 páginas)
    today_str = timezone.now().date().isoformat()
    log_res = client.post(
        f"/api/v1/academic-readings/{reading.id}/log",
        data={"pages_read": 30, "date": today_str},
        content_type="application/json",
    )
    assert log_res.status_code == 200
    data = log_res.json()
    assert data["current_page"] == 50
    assert data["progress_percent"] == 50
    assert data["status"] == "reading"

    # Verificar registro na tabela ReadingLog
    assert ReadingLog.objects.filter(reading=reading, user=user).count() == 1
    log = ReadingLog.objects.get(reading=reading, user=user)
    assert log.pages_read == 30

    # 2. Registrar mais páginas para concluir (ex: +60 páginas)
    log_res2 = client.post(
        f"/api/v1/academic-readings/{reading.id}/log",
        data={"pages_read": 60, "date": today_str},
        content_type="application/json",
    )
    assert log_res2.status_code == 200
    data2 = log_res2.json()
    assert data2["current_page"] == 100
    assert data2["progress_percent"] == 100
    assert data2["status"] == "completed"

    # 3. Listar logs
    logs_res = client.get("/api/v1/reading-logs?days=14")
    assert logs_res.status_code == 200
    logs_data = logs_res.json()
    assert len(logs_data) >= 1
    assert logs_data[0]["reading"] == str(reading.id)


def test_study_note_linked_to_reading(client: Client, offering):
    user = User.objects.create_user(
        email="leitura.nota@aluno.impacta.edu.br",
        full_name="Aluno Leitura Nota",
        course_offering=offering,
    )
    client.force_login(user)

    reading = AcademicReading.objects.create(
        user=user,
        title="O Programador Pragmático",
        total_pages=300,
    )

    # Criar anotação vinculada à leitura
    note_res = client.post(
        "/api/v1/study-notes",
        data={
            "reading": str(reading.id),
            "title": "Capítulo 1 - Filosofia Pragmática",
            "content": "Seja responsável por seu aprendizado contínuo.",
            "methodology": "feynman",
        },
        content_type="application/json",
    )
    assert note_res.status_code == 201
    note_data = note_res.json()
    assert note_data["reading"] == str(reading.id)
    assert note_data["reading_title"] == "O Programador Pragmático"

    # Verificar que o reading serializer expõe notes_count
    reading_res = client.get(f"/api/v1/academic-readings/{reading.id}")
    assert reading_res.status_code == 200
    assert reading_res.json()["notes_count"] == 1


def test_academic_reading_isolation_and_permissions(client: Client, offering):
    user_a = User.objects.create_user(
        email="user.a@aluno.impacta.edu.br",
        full_name="Usuário A",
        course_offering=offering,
    )
    user_b = User.objects.create_user(
        email="user.b@aluno.impacta.edu.br",
        full_name="Usuário B",
        course_offering=offering,
    )

    reading_a = AcademicReading.objects.create(
        user=user_a,
        title="Livro Privado de A",
        total_pages=200,
    )

    # 1. Acesso anônimo retorna 401
    anon_res = client.get(f"/api/v1/academic-readings/{reading_a.id}")
    assert anon_res.status_code == 401

    # 2. Usuário B não pode acessar leitura de A (404)
    client.force_login(user_b)
    res_b_get = client.get(f"/api/v1/academic-readings/{reading_a.id}")
    assert res_b_get.status_code == 404

    res_b_patch = client.patch(
        f"/api/v1/academic-readings/{reading_a.id}",
        data={"title": "Tentativa de Edição"},
        content_type="application/json",
    )
    assert res_b_patch.status_code == 404

    res_b_log = client.post(
        f"/api/v1/academic-readings/{reading_a.id}/log",
        data={"pages_read": 10},
        content_type="application/json",
    )
    assert res_b_log.status_code == 404

    res_b_delete = client.delete(f"/api/v1/academic-readings/{reading_a.id}")
    assert res_b_delete.status_code == 404
