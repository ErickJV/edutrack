import uuid

from django.conf import settings
from django.db import models


class Subject(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        "catalog.Course",
        on_delete=models.PROTECT,
        related_name="subjects",
    )
    name = models.CharField(max_length=160)
    code = models.CharField(max_length=40, blank=True)
    workload_hours = models.PositiveIntegerField(default=40)
    semester = models.PositiveSmallIntegerField(default=1)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("course__name", "semester", "name")
        constraints = [
            models.UniqueConstraint(fields=("course", "name"), name="unique_course_subject_name")
        ]
        verbose_name = "disciplina"
        verbose_name_plural = "disciplinas"

    def __str__(self) -> str:
        return f"{self.name} ({self.workload_hours}h) - {self.course.name}"


class StudentSubject(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Em andamento"
        COMPLETED = "completed", "Concluída"
        DROPPED = "dropped", "Trancada"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_subjects",
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.PROTECT,
        related_name="enrollments",
    )
    professor_name = models.CharField(max_length=120, blank=True)
    custom_workload_hours = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    semester_period = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("subject__semester", "subject__name")
        constraints = [
            models.UniqueConstraint(fields=("user", "subject"), name="unique_user_subject")
        ]
        verbose_name = "disciplina do aluno"
        verbose_name_plural = "disciplinas do aluno"

    def __str__(self) -> str:
        return f"{self.user.email} - {self.subject.name}"
    @property
    def effective_workload_hours(self) -> int:
        return self.custom_workload_hours if self.custom_workload_hours is not None else self.subject.workload_hours

    @property
    def progress_percent(self) -> int:
        total = self.tasks.count()
        if total == 0:
            return 0
        completed = self.tasks.filter(status=AcademicTask.Status.COMPLETED).count()
        return round((completed / total) * 100)


class AcademicTask(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        IN_PROGRESS = "in_progress", "Em andamento"
        COMPLETED = "completed", "Concluída"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="academic_tasks",
    )
    student_subject = models.ForeignKey(
        StudentSubject,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    estimated_minutes = models.PositiveIntegerField(default=60)
    actual_minutes = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("due_date", "created_at")
        verbose_name = "tarefa acadêmica"
        verbose_name_plural = "tarefas acadêmicas"

    def __str__(self) -> str:
        return f"{self.title} ({self.get_status_display()})"
