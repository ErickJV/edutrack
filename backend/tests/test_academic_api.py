import pytest
from uuid import UUID
from django.test import Client

from apps.academic.models import AcademicTask, StudentSubject, Subject
from apps.accounts.models import User

pytestmark = pytest.mark.django_db


def test_curriculum_endpoint_returns_only_student_course_subjects(client: Client, offering):
    user = User.objects.create_user(
        email="curriculo@aluno.impacta.edu.br",
        full_name="Aluno Curriculo",
        course_offering=offering,
    )
    client.force_login(user)

    response = client.get("/api/v1/curriculum")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == Subject.objects.filter(course=offering.course, active=True).count()
    assert all(item["course"] == str(offering.course_id) for item in payload)
    semesters = [item["semester"] for item in payload]
    assert semesters == sorted(semesters)


def test_curriculum_endpoint_rejects_anonymous_user(client: Client):
    response = client.get("/api/v1/curriculum")

    assert response.status_code == 401
    assert response.json()["errors"]["detail"] == "Authentication credentials were not provided."


def test_curriculum_endpoint_rejects_incomplete_profile(client: Client):
    user = User.objects.create_user(email="sem-perfil@aluno.impacta.edu.br")
    client.force_login(user)

    response = client.get("/api/v1/curriculum")

    assert response.status_code == 403
    assert "perfil acadêmico" in response.json()["errors"]["detail"].lower()


def test_student_subjects_list_and_replace_selection(client: Client, offering):
    user = User.objects.create_user(
        email="matriculas@aluno.impacta.edu.br",
        full_name="Aluno Matriculas",
        course_offering=offering,
    )
    client.force_login(user)

    subjects = list(
        Subject.objects.filter(course=offering.course, active=True).order_by("semester", "name")[:2]
    )
    response = client.post(
        "/api/v1/student-subjects",
        data={
            "semester_period": "2026/1",
            "subject_ids": [str(subjects[0].id), str(subjects[1].id)],
        },
        content_type="application/json",
    )

    assert response.status_code == 201
    assert len(response.json()) == 2
    assert [item["subject"]["id"] for item in response.json()] == [
        str(subjects[0].id),
        str(subjects[1].id),
    ]

    listing = client.get("/api/v1/student-subjects")
    assert listing.status_code == 200
    assert len(listing.json()) == 2
    assert all(item["semester_period"] == "2026/1" for item in listing.json())


def test_student_subjects_rejects_subject_from_other_course(client: Client, offering):
    user = User.objects.create_user(
        email="matriculas2@aluno.impacta.edu.br",
        full_name="Aluno Matriculas 2",
        course_offering=offering,
    )
    client.force_login(user)

    other_subject = Subject.objects.exclude(course=offering.course).first()
    assert other_subject is not None
    response = client.post(
        "/api/v1/student-subjects",
        data={
            "semester_period": "2026/1",
            "subject_ids": [str(other_subject.id)],
        },
        content_type="application/json",
    )
    assert response.status_code == 400
    assert "matriz do seu curso" in response.json()["errors"]["subject_ids"][0].lower()


def test_student_subject_patch_professor_and_workload(client: Client, offering):
    user = User.objects.create_user(
        email="patch@aluno.impacta.edu.br",
        full_name="Aluno Patch",
        course_offering=offering,
    )
    client.force_login(user)
    subject = Subject.objects.filter(course=offering.course, active=True).first()
    enrollment = StudentSubject.objects.create(
        user=user,
        subject=subject,
        semester_period="2026/1",
    )

    response = client.patch(
        f"/api/v1/student-subjects/{enrollment.id}",
        data={"professor_name": "Prof. Alan Turing", "custom_workload_hours": 90},
        content_type="application/json",
    )
    assert response.status_code == 200
    data = response.json()
    assert data["professor_name"] == "Prof. Alan Turing"
    assert data["custom_workload_hours"] == 90
    assert data["effective_workload_hours"] == 90

    # Test invalid workload bounds
    bad = client.patch(
        f"/api/v1/student-subjects/{enrollment.id}",
        data={"custom_workload_hours": 0},
        content_type="application/json",
    )
    assert bad.status_code == 400

    # Partial update: omit professor_name, should preserve it
    res_partial = client.patch(
        f"/api/v1/student-subjects/{enrollment.id}",
        data={"custom_workload_hours": 120},
        content_type="application/json",
    )
    assert res_partial.status_code == 200
    assert res_partial.json()["professor_name"] == "Prof. Alan Turing"
    assert res_partial.json()["custom_workload_hours"] == 120

    # Clearing custom_workload_hours (set to None) restores subject's original workload
    res_clear = client.patch(
        f"/api/v1/student-subjects/{enrollment.id}",
        data={"custom_workload_hours": None},
        content_type="application/json",
    )
    assert res_clear.status_code == 200
    assert res_clear.json()["custom_workload_hours"] is None
    assert res_clear.json()["effective_workload_hours"] == subject.workload_hours

    # Verifies catalog Subject was NOT modified
    subject.refresh_from_db()
    assert subject.workload_hours == 80

    # Rejection of other user's enrollment (HTTP 404)
    other_user = User.objects.create_user(email="outro.aluno@aluno.impacta.edu.br", course_offering=offering)
    client.force_login(other_user)
    res_404 = client.patch(
        f"/api/v1/student-subjects/{enrollment.id}",
        data={"professor_name": "Invasor"},
        content_type="application/json",
    )
    assert res_404.status_code == 404

def test_student_subject_reconciliation_preserves_data_and_tasks(client: Client, offering):
    user = User.objects.create_user(
        email="reconcile@aluno.impacta.edu.br",
        full_name="Aluno Reconcile",
        course_offering=offering,
    )
    client.force_login(user)
    subjects = list(Subject.objects.filter(course=offering.course, active=True)[:2])

    # 1. Seleciona duas matérias
    res1 = client.post(
        "/api/v1/student-subjects",
        data={"semester_period": "2026/1", "subject_ids": [str(s.id) for s in subjects]},
        content_type="application/json",
    )
    assert res1.status_code == 201
    enrollment1_id = res1.json()[0]["id"]
    enrollment2_id = res1.json()[1]["id"]

    # Cria tarefa na matéria 1
    task = AcademicTask.objects.create(
        user=user,
        student_subject_id=enrollment1_id,
        title="Tarefa Importante",
    )

    # 2. Desmarca matéria 1 (mantém apenas matéria 2)
    res2 = client.post(
        "/api/v1/student-subjects",
        data={"semester_period": "2026/1", "subject_ids": [str(subjects[1].id)]},
        content_type="application/json",
    )
    assert res2.status_code == 201
    assert len(res2.json()) == 1
    assert res2.json()[0]["id"] == enrollment2_id

    # Matéria 1 foi arquivada (DROPPED), tarefa continua intacta
    enr1 = StudentSubject.objects.get(id=enrollment1_id)
    assert enr1.status == StudentSubject.Status.DROPPED
    task.refresh_from_db()
    assert task.student_subject_id == enr1.id

    # 3. Reativa matéria 1
    res3 = client.post(
        "/api/v1/student-subjects",
        data={"semester_period": "2026/1", "subject_ids": [str(s.id) for s in subjects]},
        content_type="application/json",
    )
    assert res3.status_code == 201
    assert len(res3.json()) == 2
    # IDs foram preservados exatamente
    assert {e["id"] for e in res3.json()} == {enrollment1_id, enrollment2_id}

    # 4. Seleção vazia arquiva tudo sem erro
    res4 = client.post(
        "/api/v1/student-subjects",
        data={"semester_period": "2026/1", "subject_ids": []},
        content_type="application/json",
    )
    assert res4.status_code == 201
    assert len(res4.json()) == 0


def test_professors_api_crud_and_isolation(client: Client, offering):
    user = User.objects.create_user(
        email="prof.api@aluno.impacta.edu.br",
        full_name="Aluno Prof",
        course_offering=offering,
    )
    client.force_login(user)

    # 1. Cria professor
    res_create = client.post(
        "/api/v1/professors",
        data={"name": "  Prof. Ada Lovelace  "},
        content_type="application/json",
    )
    assert res_create.status_code == 201
    prof_data = res_create.json()
    assert prof_data["name"] == "Prof. Ada Lovelace"
    assert prof_data["active"] is True
    prof_id = prof_data["id"]

    # 2. Validação: nome vazio rejeitado (400)
    bad_create = client.post(
        "/api/v1/professors",
        data={"name": "   "},
        content_type="application/json",
    )
    assert bad_create.status_code == 400

    # 3. Lista professores do usuário
    res_list = client.get("/api/v1/professors")
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1
    assert res_list.json()[0]["id"] == prof_id

    # 4. Atualiza nome
    res_patch = client.patch(
        f"/api/v1/professors/{prof_id}",
        data={"name": "Profª Ada Lovelace, PhD"},
        content_type="application/json",
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["name"] == "Profª Ada Lovelace, PhD"

    # 5. Vincula professor à disciplina via PATCH student-subjects
    subject = Subject.objects.filter(course=offering.course, active=True).first()
    enrollment = StudentSubject.objects.create(user=user, subject=subject)
    res_link = client.patch(
        f"/api/v1/student-subjects/{enrollment.id}",
        data={"professor_id": prof_id},
        content_type="application/json",
    )
    assert res_link.status_code == 200
    assert res_link.json()["professor"]["id"] == prof_id
    assert res_link.json()["display_professor_name"] == "Profª Ada Lovelace, PhD"

    # 6. Exclui (arquiva) professor
    res_del = client.delete(f"/api/v1/professors/{prof_id}")
    assert res_del.status_code == 204

    # Não aparece na listagem ativa
    res_active = client.get("/api/v1/professors")
    assert len(res_active.json()) == 0

    # Mas o vínculo anterior na disciplina é preservado!
    enrollment.refresh_from_db()
    assert enrollment.professor_id == UUID(prof_id)
    assert enrollment.display_professor_name == "Profª Ada Lovelace, PhD"

    # 7. Isolamento: outro aluno recebe 404 ao tentar acessar ou editar esse professor
    other = User.objects.create_user(email="outro.prof.api@aluno.impacta.edu.br", course_offering=offering)
    client.force_login(other)
    assert client.get(f"/api/v1/professors/{prof_id}").status_code == 404
    assert client.patch(f"/api/v1/professors/{prof_id}", data={"name": "Hacked"}, content_type="application/json").status_code == 404
    assert client.delete(f"/api/v1/professors/{prof_id}").status_code == 404
