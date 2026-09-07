import pytest
from django.db import IntegrityError
from django.utils import timezone

from apps.academic.models import AcademicTask, StudentSubject, Subject
from apps.accounts.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def student_user(offering):
    return User.objects.create_user(
        email="aluno.teste@aluno.impacta.edu.br",
        full_name="Aluno Teste",
        course_offering=offering,
    )


@pytest.fixture
def sample_subject(offering):
    return Subject.objects.filter(course=offering.course).first()


def test_subject_uniqueness_per_course(sample_subject):
    with pytest.raises(IntegrityError):
        Subject.objects.create(
            course=sample_subject.course,
            name=sample_subject.name,
            semester=sample_subject.semester,
            workload_hours=sample_subject.workload_hours,
        )


def test_student_subject_enrollment_and_uniqueness(student_user, sample_subject):
    enrollment = StudentSubject.objects.create(
        user=student_user,
        subject=sample_subject,
        professor_name="Prof. Doutor Teste",
        semester_period="2026/1",
    )
    assert enrollment.status == StudentSubject.Status.ACTIVE
    assert str(enrollment) == f"{student_user.email} - {sample_subject.name}"

    with pytest.raises(IntegrityError):
        StudentSubject.objects.create(
            user=student_user,
            subject=sample_subject,
        )


def test_academic_task_lifecycle_and_progress_calculation(student_user, sample_subject):
    enrollment = StudentSubject.objects.create(
        user=student_user,
        subject=sample_subject,
    )
    assert enrollment.progress_percent == 0

    task1 = AcademicTask.objects.create(
        user=student_user,
        student_subject=enrollment,
        title="Entrega AC1 - Algoritmos",
        estimated_minutes=120,
        due_date=timezone.now(),
    )
    task2 = AcademicTask.objects.create(
        user=student_user,
        student_subject=enrollment,
        title="Entrega AC2 - Estrutura de Dados",
        estimated_minutes=90,
    )

    assert enrollment.progress_percent == 0

    task1.status = AcademicTask.Status.COMPLETED
    task1.actual_minutes = 110
    task1.completed_at = timezone.now()
    task1.save()

    assert enrollment.progress_percent == 50

    task2.status = AcademicTask.Status.COMPLETED
    task2.actual_minutes = 95
    task2.completed_at = timezone.now()
    task2.save()

    assert enrollment.progress_percent == 100


def test_cascade_deletion_of_tasks(student_user, sample_subject):
    enrollment = StudentSubject.objects.create(
        user=student_user,
        subject=sample_subject,
    )
    task = AcademicTask.objects.create(
        user=student_user,
        student_subject=enrollment,
        title="Trabalho em Grupo",
    )

    assert AcademicTask.objects.filter(id=task.id).exists()
    enrollment.delete()
    assert not AcademicTask.objects.filter(id=task.id).exists()
