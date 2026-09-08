import pytest
from django.test import Client

from apps.academic.models import StudentSubject, Subject
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
