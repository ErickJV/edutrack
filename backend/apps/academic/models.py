import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


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


class AcademicTerm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="academic_terms",
    )
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    timezone = models.CharField(max_length=64, default="America/Sao_Paulo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-start_date", "name")
        verbose_name = "semestre letivo"
        verbose_name_plural = "semestres letivos"

    def __str__(self) -> str:
        return f"{self.name} ({self.start_date} a {self.end_date})"


class Professor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="professors",
    )
    name = models.CharField(max_length=120)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name",)
        verbose_name = "professor"
        verbose_name_plural = "professores"

    def __str__(self) -> str:
        return self.name


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
    professor = models.ForeignKey(
        Professor,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="enrollments",
    )
    professor_name = models.CharField(max_length=120, blank=True)
    custom_workload_hours = models.PositiveIntegerField(null=True, blank=True)
    term = models.ForeignKey(
        AcademicTerm,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="enrollments",
    )
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
    def display_professor_name(self) -> str:
        if self.professor:
            return self.professor.name
        return self.professor_name

    @property
    def effective_workload_hours(self) -> int:
        if self.custom_workload_hours is not None:
            return self.custom_workload_hours
        return self.subject.workload_hours

    @property
    def progress_percent(self) -> int:
        total = self.tasks.count()
        if total == 0:
            return 0
        completed = self.tasks.filter(status=AcademicTask.Status.COMPLETED).count()
        return round((completed / total) * 100)


class ClassSchedule(models.Model):
    class Weekday(models.IntegerChoices):
        MONDAY = 0, "Segunda-feira"
        TUESDAY = 1, "Terça-feira"
        WEDNESDAY = 2, "Quarta-feira"
        THURSDAY = 3, "Quinta-feira"
        FRIDAY = 4, "Sexta-feira"
        SATURDAY = 5, "Sábado"
        SUNDAY = 6, "Domingo"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="class_schedules",
    )
    student_subject = models.ForeignKey(
        StudentSubject,
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    weekday = models.PositiveSmallIntegerField(choices=Weekday.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=80, blank=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("weekday", "start_time")
        verbose_name = "horário de aula"
        verbose_name_plural = "horários de aula"

    def __str__(self) -> str:
        subject_name = self.student_subject.subject.name
        return f"{self.get_weekday_display()} {self.start_time}-{self.end_time} ({subject_name})"


class ClassOccurrence(models.Model):
    class AttendanceStatus(models.TextChoices):
        PRESENT = "present", "Presente"
        ABSENT = "absent", "Falta"
        UNRECORDED = "unrecorded", "Não informado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_subject = models.ForeignKey(
        StudentSubject,
        on_delete=models.CASCADE,
        related_name="occurrences",
    )
    schedule = models.ForeignKey(
        ClassSchedule,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="occurrences",
    )
    # Stable origin key: schedule + local calendar date (for idempotent generation)
    origin_date = models.DateField(null=True, blank=True)
    replaces = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="replacement_occurrences",
    )
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    room = models.CharField(max_length=80, blank=True)
    cancelled = models.BooleanField(default=False)
    # Attendance (stored per-occurrence for integrity; initially unrecorded)
    attendance_status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.UNRECORDED,
    )
    # Marks occurrences edited individually – excluded from bulk series recalculation
    individually_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("starts_at",)
        verbose_name = "ocorrência de aula"
        verbose_name_plural = "ocorrências de aula"
        constraints = [
            # Prevent duplicate generation from the same schedule+date
            models.UniqueConstraint(
                fields=("schedule", "origin_date"),
                condition=models.Q(schedule__isnull=False, origin_date__isnull=False),
                name="unique_schedule_origin_date",
            )
        ]

    def __str__(self) -> str:
        status = " (Cancelada)" if self.cancelled else ""
        return f"{self.student_subject.subject.name} - {self.starts_at}{status}"


class AcademicEvent(models.Model):
    class Kind(models.TextChoices):
        EXAM = "exam", "Prova"
        ASSIGNMENT = "assignment", "Entrega"
        OTHER = "other", "Outro"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="academic_events",
    )
    student_subject = models.ForeignKey(
        StudentSubject,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="events",
    )
    title = models.CharField(max_length=200)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.OTHER)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)
    all_day = models.BooleanField(default=False)
    room = models.CharField(max_length=80, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("starts_at", "title")
        verbose_name = "evento acadêmico"
        verbose_name_plural = "eventos acadêmicos"

    def __str__(self) -> str:
        return f"{self.title} ({self.get_kind_display()})"


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


class StudyFolder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_folders",
    )
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=30, default="indigo")
    icon = models.CharField(max_length=50, default="folder")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name",)
        verbose_name = "pasta de estudo"
        verbose_name_plural = "pastas de estudo"

    def __str__(self) -> str:
        return self.name


class AcademicReading(models.Model):
    class Status(models.TextChoices):
        READING = "reading", "Lendo"
        COMPLETED = "completed", "Concluído"
        DROPPED = "dropped", "Pausado/Abandonado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="academic_readings",
    )
    student_subject = models.ForeignKey(
        StudentSubject,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="academic_readings",
    )
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True, default="")
    total_pages = models.PositiveIntegerField()
    current_page = models.PositiveIntegerField(default=0)
    daily_goal_pages = models.PositiveIntegerField(default=15)
    exam_name = models.CharField(max_length=120, blank=True, default="")
    exam_questions_count = models.PositiveIntegerField(null=True, blank=True)
    exam_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.READING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)
        verbose_name = "leitura acadêmica"
        verbose_name_plural = "leituras acadêmicas"

    def __str__(self) -> str:
        return self.title

    @property
    def progress_percent(self) -> int:
        if not self.total_pages:
            return 0
        return min(100, int((self.current_page / self.total_pages) * 100))

    @property
    def pages_remaining(self) -> int:
        return max(0, self.total_pages - self.current_page)


class ReadingLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reading_logs",
    )
    reading = models.ForeignKey(
        AcademicReading,
        on_delete=models.CASCADE,
        related_name="logs",
    )
    date = models.DateField(default=timezone.now)
    pages_read = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-date", "-created_at")
        unique_together = ("reading", "date")
        verbose_name = "registro de leitura"
        verbose_name_plural = "registros de leitura"

    def __str__(self) -> str:
        return f"{self.reading.title} - {self.pages_read} págs ({self.date})"


class StudyNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_notes",
    )
    folder = models.ForeignKey(
        StudyFolder,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="notes",
    )
    student_subject = models.ForeignKey(
        StudentSubject,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="study_notes",
    )
    task = models.ForeignKey(
        AcademicTask,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="study_notes",
    )
    reading = models.ForeignKey(
        AcademicReading,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="study_notes",
    )
    title = models.CharField(max_length=200, default="Sem título")
    content = models.TextField(blank=True, default="")
    methodology = models.CharField(max_length=50, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)
        verbose_name = "anotação de estudo"
        verbose_name_plural = "anotações de estudo"

    def __str__(self) -> str:
        return self.title


class Flashcard(models.Model):
    class State(models.TextChoices):
        NEW = "new", "Novo"
        LEARNING = "learning", "Aprendendo"
        REVIEW = "review", "Revisão"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="flashcards",
    )
    student_subject = models.ForeignKey(
        StudentSubject,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="flashcards",
    )
    deck_name = models.CharField(max_length=120, default="Geral")
    front = models.TextField()
    back = models.TextField()
    hint = models.CharField(max_length=255, blank=True, default="")
    tags = models.CharField(max_length=200, blank=True, default="")

    # Anki SM-2 spaced repetition state
    state = models.CharField(
        max_length=20,
        choices=State.choices,
        default=State.NEW,
    )
    ease_factor = models.FloatField(default=2.5)
    interval_days = models.PositiveIntegerField(default=0)
    repetitions = models.PositiveIntegerField(default=0)
    lapses = models.PositiveIntegerField(default=0)
    due_at = models.DateTimeField(default=timezone.now)
    last_reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("due_at", "-created_at")
        verbose_name = "flashcard"
        verbose_name_plural = "flashcards"

    def __str__(self) -> str:
        return f"[{self.deck_name}] {self.front[:50]}"


