from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone

from apps.academic.models import AcademicTask, StudentSubject, Subject
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


def test_tasks_crud_and_filtering(client: Client, offering):
    user = User.objects.create_user(
        email="tarefas@aluno.impacta.edu.br",
        full_name="Aluno Tarefas",
        course_offering=offering,
    )
    client.force_login(user)
    enrollment = create_enrollment(user, offering)

    response = client.post(
        "/api/v1/tasks",
        data={
            "student_subject": str(enrollment.id),
            "title": "Lista 1 de algoritmos",
            "description": "Resolver exercícios iniciais",
            "due_date": (timezone.now() + timedelta(days=2)).isoformat(),
            "estimated_minutes": 90,
        },
        content_type="application/json",
    )
    assert response.status_code == 201
    task_id = response.json()["id"]

    listing = client.get("/api/v1/tasks?status=pending")
    assert listing.status_code == 200
    assert len(listing.json()) == 1
    assert listing.json()[0]["title"] == "Lista 1 de algoritmos"

    patch = client.patch(
        f"/api/v1/tasks/{task_id}",
        data={"status": "in_progress", "actual_minutes": 35},
        content_type="application/json",
    )
    assert patch.status_code == 200
    assert patch.json()["status"] == "in_progress"
    assert patch.json()["actual_minutes"] == 35

    toggle = client.post(f"/api/v1/tasks/{task_id}/toggle-complete")
    assert toggle.status_code == 200
    assert toggle.json()["status"] == "completed"
    assert toggle.json()["completed_at"] is not None

    delete = client.delete(f"/api/v1/tasks/{task_id}")
    assert delete.status_code == 204
    assert AcademicTask.objects.filter(id=task_id).count() == 0


def test_tasks_rejects_student_subject_from_other_user(client: Client, offering):
    owner = User.objects.create_user(
        email="dono@aluno.impacta.edu.br",
        full_name="Dono",
        course_offering=offering,
    )
    other = User.objects.create_user(
        email="outro@aluno.impacta.edu.br",
        full_name="Outro",
        course_offering=offering,
    )
    owner_enrollment = create_enrollment(owner, offering)
    client.force_login(other)

    response = client.post(
        "/api/v1/tasks",
        data={
            "student_subject": str(owner_enrollment.id),
            "title": "Tarefa indevida",
        },
        content_type="application/json",
    )
    assert response.status_code == 400
    assert "não pertence" in response.json()["errors"]["student_subject"][0].lower()


def test_tasks_rejects_creation_on_archived_student_subject_and_preserves_previous_tasks(
    client: Client, offering
):
    user = User.objects.create_user(
        email="archived.tasks@aluno.impacta.edu.br",
        full_name="Aluno Archived",
        course_offering=offering,
    )
    client.force_login(user)
    subject = Subject.objects.filter(course=offering.course, active=True).first()
    enrollment = StudentSubject.objects.create(
        user=user,
        subject=subject,
        status=StudentSubject.Status.ACTIVE,
    )

    # 1. Tarefa criada enquanto ativa
    task = AcademicTask.objects.create(
        user=user,
        student_subject=enrollment,
        title="Tarefa Antiga",
    )

    # 2. Arquiva o vínculo
    enrollment.status = StudentSubject.Status.DROPPED
    enrollment.save(update_fields=("status",))

    # 3. Tentativa de criar nova tarefa em vínculo arquivado é rejeitada (400)
    response = client.post(
        "/api/v1/tasks",
        data={
            "student_subject": str(enrollment.id),
            "title": "Nova Tarefa Inválida",
        },
        content_type="application/json",
    )
    assert response.status_code == 400
    assert "arquivada" in response.json()["errors"]["student_subject"][0].lower()

    # 4. Tarefa anterior permanece acessível na listagem
    listing = client.get("/api/v1/tasks")
    assert listing.status_code == 200
    assert any(t["id"] == str(task.id) for t in listing.json())

    # 5. E acessível por filtro de disciplina
    filtered = client.get(f"/api/v1/tasks?student_subject={enrollment.id}")
    assert filtered.status_code == 200
    assert len(filtered.json()) == 1
    assert filtered.json()[0]["id"] == str(task.id)

def test_tasks_filter_by_subject(client: Client, offering):
    user = User.objects.create_user(
        email="filtro@aluno.impacta.edu.br",
        full_name="Aluno Filtro",
        course_offering=offering,
    )
    client.force_login(user)
    first = create_enrollment(user, offering)
    second_subject = (
        Subject.objects.filter(course=offering.course, active=True)
        .exclude(id=first.subject_id)
        .first()
    )
    assert second_subject is not None
    second = StudentSubject.objects.create(
        user=user, subject=second_subject, semester_period="2026/1"
    )
    AcademicTask.objects.create(user=user, student_subject=first, title="T1")
    AcademicTask.objects.create(user=user, student_subject=second, title="T2")

    response = client.get(f"/api/v1/tasks?student_subject={first.id}")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "T1"


def test_dashboard_summary_reports_progress_and_upcoming_tasks(client: Client, offering):
    user = User.objects.create_user(
        email="dashboard@aluno.impacta.edu.br",
        full_name="Aluno Dashboard",
        course_offering=offering,
    )
    client.force_login(user)
    first = create_enrollment(user, offering)
    second_subject = (
        Subject.objects.filter(course=offering.course, active=True)
        .exclude(id=first.subject_id)
        .first()
    )
    assert second_subject is not None
    second = StudentSubject.objects.create(
        user=user, subject=second_subject, semester_period="2026/1"
    )

    AcademicTask.objects.create(
        user=user,
        student_subject=first,
        title="T1",
        due_date=timezone.now() + timedelta(days=1),
        estimated_minutes=60,
        actual_minutes=45,
        status=AcademicTask.Status.COMPLETED,
        completed_at=timezone.now(),
    )
    AcademicTask.objects.create(
        user=user,
        student_subject=first,
        title="T2",
        due_date=timezone.now() + timedelta(days=3),
        estimated_minutes=90,
        actual_minutes=20,
    )
    AcademicTask.objects.create(
        user=user,
        student_subject=second,
        title="T3",
        due_date=timezone.now() + timedelta(days=2),
        estimated_minutes=120,
        actual_minutes=100,
    )

    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    payload = response.json()
    assert payload["subjects_count"] == 2
    assert payload["pending_tasks_count"] == 2
    assert payload["overdue_tasks_count"] == 0
    assert payload["completed_tasks_count"] == 1
    assert payload["planned_minutes_total"] == 270
    assert payload["actual_minutes_total"] == 165
    assert payload["weighted_progress_percent"] > 0
    assert len(payload["upcoming_tasks"]) == 3


def test_dashboard_summary_with_overdue_and_completed_tasks(
    client: Client, offering
) -> None:
    user = User.objects.create_user(
        email="overdue@aluno.impacta.edu.br",
        full_name="Aluno Overdue",
        course_offering=offering,
    )
    student_subject = create_enrollment(user, offering)
    client.force_login(user)

    # Tarefa vencida e não concluída (deve contar em overdue)
    AcademicTask.objects.create(
        user=user,
        student_subject=student_subject,
        title="Vencida Pendente",
        due_date=timezone.now() - timedelta(days=1),
        estimated_minutes=30,
        actual_minutes=0,
        status=AcademicTask.Status.PENDING,
    )
    # Tarefa com data no passado, mas já concluída (não deve contar em overdue)
    AcademicTask.objects.create(
        user=user,
        student_subject=student_subject,
        title="Vencida Concluída",
        due_date=timezone.now() - timedelta(days=2),
        estimated_minutes=45,
        actual_minutes=40,
        status=AcademicTask.Status.COMPLETED,
        completed_at=timezone.now() - timedelta(days=1),
    )
    # Tarefa futura (não deve contar em overdue)
    AcademicTask.objects.create(
        user=user,
        student_subject=student_subject,
        title="Futura",
        due_date=timezone.now() + timedelta(days=2),
        estimated_minutes=60,
        actual_minutes=0,
        status=AcademicTask.Status.PENDING,
    )

    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    payload = response.json()
    assert payload["pending_tasks_count"] == 2
    assert payload["overdue_tasks_count"] == 1
    assert payload["completed_tasks_count"] == 1

