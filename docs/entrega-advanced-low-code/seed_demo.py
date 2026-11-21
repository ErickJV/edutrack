"""Popula o banco SQLite local com um usuario de demonstracao.

Execucao:
    cd backend
    DB_ENGINE=sqlite DJANGO_DEBUG=1 python manage.py shell < ../docs/entrega-advanced-low-code/seed_demo.py

O script e idempotente: remove o usuario de demonstracao (e os dados em cascata)
antes de recriar tudo. Nenhum dado de outro usuario e tocado.
"""

from datetime import timedelta

from django.utils import timezone

from apps.academic.models import (
    AcademicEvent,
    AcademicTask,
    AcademicTerm,
    Flashcard,
    StudentSubject,
    StudyFolder,
    StudyNote,
    Subject,
)
from apps.accounts.models import User
from apps.catalog.models import Course, CourseOffering
from apps.legal.services import record_current_acceptances

DEMO_EMAIL = "erick.demo@aluno.impacta.edu.br"
DEMO_PASSWORD = "EduTrack#2026"
DEMO_NAME = "Erick Jonathan Vasquez Pereira"
SEMESTER_PERIOD = "2026/2"

now = timezone.now()

# --- Usuario -----------------------------------------------------------------
User.objects.filter(email=DEMO_EMAIL).delete()

user = User.objects.create_superuser(
    email=DEMO_EMAIL,
    password=DEMO_PASSWORD,
    full_name=DEMO_NAME,
)

offering = CourseOffering.objects.filter(active=True).order_by("display_order", "id").first()
if offering is None:
    course, _ = Course.objects.get_or_create(
        slug="ads-demo",
        defaults={
            "name": "Analise e Desenvolvimento de Sistemas",
            "degree_type": Course.DegreeType.TECHNOLOGIST,
        },
    )
    offering = CourseOffering.objects.create(
        course=course,
        modality=CourseOffering.Modality.IN_PERSON,
        external_slug="ads-demo-presencial",
    )

course = offering.course
user.course_offering = offering
user.profile_completed_at = now
user.save(update_fields=["course_offering", "profile_completed_at"])
record_current_acceptances(user)

# --- Semestre ----------------------------------------------------------------
term = AcademicTerm.objects.create(
    user=user,
    name=SEMESTER_PERIOD,
    start_date=timezone.datetime(2026, 8, 3).date(),
    end_date=timezone.datetime(2026, 12, 12).date(),
)

# --- Disciplinas -------------------------------------------------------------
SUBJECT_PLAN = [
    ("AI & Machine Learning", "ADS501", 80, "Prof. Dr. Marcelo Tanaka"),
    ("Innovation Lab: SaaS Product", "ADS502", 80, "Profa. Dra. Renata Aguiar"),
    ("Mobile Applications", "ADS503", 80, "Prof. Dr. Caio Bernardes"),
    ("Software Quality Assurance", "ADS504", 80, "Profa. Dra. Helena Prado"),
    ("Data Governance", "ADS599", 80, "Prof. Dr. Marcelo Tanaka"),
]

enrollments = {}
for name, code, workload, professor in SUBJECT_PLAN:
    subject = Subject.objects.filter(course=course, name__iexact=name).first()
    if subject is None:
        subject = Subject.objects.create(
            course=course,
            name=name,
            code=code,
            semester=5,
            workload_hours=workload,
            description="Disciplina do semestre de demonstracao.",
        )
    enrollments[name] = StudentSubject.objects.create(
        user=user,
        subject=subject,
        term=term,
        professor_name=professor,
        status=StudentSubject.Status.ACTIVE,
        semester_period=SEMESTER_PERIOD,
    )

# --- Tarefas -----------------------------------------------------------------
# 4 vencidas concentradas em "Mobile Applications" (permite demonstrar o filtro
# has_overdue_tasks retornando uma unica disciplina).
OVERDUE = [
    ("Mobile Applications", "Entrega do modulo de navegacao", "task", "pending", 5, 180, 0),
    ("Mobile Applications", "Refatoracao do estado global", "assignment", "in_progress", 11, 240, 90),
    ("Mobile Applications", "Teste de usabilidade mobile", "task", "pending", 2, 120, 0),
    ("Mobile Applications", "Diario de bordo do projeto", "other", "in_progress", 15, 60, 45),
]

# Concluidas com antecedencia: conclusao no passado, prazo ainda no futuro.
COMPLETED = [
    ("AI & Machine Learning", "Relatorio de Banco de Dados", "assignment", 9, 25, 300, 280),
    ("Data Governance", "Fichamento de Artigo", "task", 6, 30, 90, 75),
    ("Software Quality Assurance", "Prova AP1", "exam", 20, 35, 120, 110),
    ("Innovation Lab: SaaS Product", "Entrega Sprint 1", "task", 14, 40, 180, 165),
]

UPCOMING = [
    ("AI & Machine Learning", "Prova AP2", "exam", 6, 120),
    ("Data Governance", "Politica de Dados - entrega", "assignment", 9, 240),
    ("Software Quality Assurance", "Plano de testes do release", "task", 12, 150),
    ("Innovation Lab: SaaS Product", "Entrega Sprint 2", "task", 18, 180),
]

for subject_name, title, category, status, days_ago, estimated, actual in OVERDUE:
    AcademicTask.objects.create(
        user=user,
        student_subject=enrollments[subject_name],
        title=title,
        description="Atividade pendente da disciplina de demonstracao.",
        category=category,
        status=status,
        due_date=now - timedelta(days=days_ago),
        estimated_minutes=estimated,
        actual_minutes=actual,
    )

for subject_name, title, category, days_ago, days_ahead, estimated, actual in COMPLETED:
    done_at = now - timedelta(days=days_ago)
    AcademicTask.objects.create(
        user=user,
        student_subject=enrollments[subject_name],
        title=title,
        description="Atividade concluida antes do prazo.",
        category=category,
        status=AcademicTask.Status.COMPLETED,
        due_date=now + timedelta(days=days_ahead),
        completed_at=done_at,
        estimated_minutes=estimated,
        actual_minutes=actual,
    )

for subject_name, title, category, days_ahead, estimated in UPCOMING:
    AcademicTask.objects.create(
        user=user,
        student_subject=enrollments[subject_name],
        title=title,
        description="Atividade planejada da disciplina de demonstracao.",
        category=category,
        status=AcademicTask.Status.PENDING,
        due_date=now + timedelta(days=days_ahead),
        estimated_minutes=estimated,
        actual_minutes=0,
    )

# --- Eventos -----------------------------------------------------------------
AcademicEvent.objects.create(
    user=user,
    student_subject=enrollments["AI & Machine Learning"],
    title="Prova AP2 - AI & Machine Learning",
    kind=AcademicEvent.Kind.EXAM,
    starts_at=now + timedelta(days=6, hours=2),
    ends_at=now + timedelta(days=6, hours=4),
    room="Sala 402",
    description="Avaliacao individual com consulta.",
)
AcademicEvent.objects.create(
    user=user,
    student_subject=enrollments["Innovation Lab: SaaS Product"],
    title="Entrega Sprint 2 - Innovation Lab",
    kind=AcademicEvent.Kind.ASSIGNMENT,
    starts_at=now + timedelta(days=9, hours=1),
    room="Laboratorio 3",
    description="Demonstracao do incremento para a turma.",
)
AcademicEvent.objects.create(
    user=user,
    student_subject=enrollments["Data Governance"],
    title="Palestra: LGPD na pratica",
    kind=AcademicEvent.Kind.OTHER,
    starts_at=now + timedelta(days=12, hours=5),
    room="Auditorio",
    description="Evento aberto do curso.",
)

# --- Estudos -----------------------------------------------------------------
folder = StudyFolder.objects.create(user=user, name="Revisao", color="teal", icon="folder")

StudyNote.objects.create(
    user=user,
    folder=folder,
    student_subject=enrollments["Software Quality Assurance"],
    title="Resumo de Arquitetura",
    content=(
        "## Camadas\n\n"
        "O EduTrack separa o backend Django (modelos, serializers e views DRF) do "
        "frontend React, consumindo a API versionada em `/api/v1/`.\n\n"
        "## Isolamento por usuario\n\n"
        "Toda consulta de disciplinas, tarefas, eventos e anotacoes passa por "
        "`filter(user=request.user)`, garantindo que um estudante nunca leia dados de outro.\n\n"
        "## Registro de decisoes\n\n"
        "Cada mudanca relevante nasce como proposta em `openspec/changes/`, e so e "
        "arquivada depois de implementada e validada com testes automatizados."
    ),
)

FLASHCARDS = [
    ("O que o filtro has_overdue_tasks retorna?", "Disciplinas com ao menos uma tarefa nao concluida e com prazo vencido."),
    ("Qual e o status HTTP do DELETE de student-subjects?", "204 No Content, com baixa logica (status dropped)."),
    ("Onde ficam as propostas concluidas do OpenSpec?", "Em openspec/changes/archive/<data>-<nome>/."),
    ("Qual biblioteca gera o relatorio em PDF?", "A implementacao propria em apps/academic/reports.py, apoiada por pypdf."),
    ("Como o progresso evita divisao por zero?", "calculate_task_progress retorna 0.0 quando o total de tarefas e zero."),
    ("Qual o formato da API do backend?", "/api/v1/<recurso>, documentado em /api/docs/."),
]
for front, back in FLASHCARDS:
    Flashcard.objects.create(
        user=user,
        student_subject=enrollments["Software Quality Assurance"],
        deck_name="Revisao",
        front=front,
        back=back,
        due_at=now,
    )

# --- Verificacao -------------------------------------------------------------
counts = {
    "usuarios": User.objects.count(),
    "disciplinas": StudentSubject.objects.filter(user=user).count(),
    "tarefas": AcademicTask.objects.filter(user=user).count(),
    "eventos": AcademicEvent.objects.filter(user=user).count(),
    "anotacoes": StudyNote.objects.filter(user=user).count(),
    "flashcards": Flashcard.objects.filter(user=user).count(),
}

for label, value in counts.items():
    print(f"{label}: {value}")
    if value == 0:
        raise SystemExit(f"FALHA: nenhum registro em {label}")

overdue_subjects = (
    StudentSubject.objects.filter(user=user, tasks__due_date__lt=now)
    .exclude(tasks__status=AcademicTask.Status.COMPLETED)
    .distinct()
)
print("disciplinas com tarefas vencidas:", overdue_subjects.count())
print("usuario de demonstracao:", user.email)
