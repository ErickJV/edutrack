from __future__ import annotations

from datetime import timedelta
from typing import Any

from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.academic.models import (
    AcademicEvent,
    AcademicReading,
    AcademicTask,
    ClassOccurrence,
    StudentSubject,
    StudyNote,
)

User = get_user_model()


def get_student_academic_context(user: Any) -> dict[str, Any]:
    """
    Sintetiza de forma estritamente isolada os dados acadêmicos do estudante autenticado.
    Apenas registros onde user=user ou vinculados ao usuário autenticado são acessados.
    """
    now = timezone.now()
    today = now.date()

    # 1. Perfil cadastral do aluno
    course_name = "Não informado"
    degree_type = ""
    modality = ""
    if user.course_offering and user.course_offering.course:
        course_name = user.course_offering.course.name
        degree_type = user.course_offering.course.get_degree_type_display()
        modality = user.course_offering.get_modality_display()

    student_profile = {
        "full_name": user.full_name or user.email.split("@")[0],
        "email": user.email,
        "course": course_name,
        "degree_type": degree_type,
        "modality": modality,
    }

    # 2. Disciplinas em andamento (ativas)
    active_enrollments = (
        StudentSubject.objects.filter(user=user, status=StudentSubject.Status.ACTIVE)
        .select_related("subject", "professor", "term")
        .order_by("subject__semester", "subject__name")
    )

    subjects_data: list[dict[str, Any]] = []
    for enr in active_enrollments:
        absent_count = ClassOccurrence.objects.filter(
            student_subject=enr, attendance_status=ClassOccurrence.AttendanceStatus.ABSENT
        ).count()
        recorded_classes = (
            ClassOccurrence.objects.filter(student_subject=enr)
            .exclude(attendance_status=ClassOccurrence.AttendanceStatus.UNRECORDED)
            .count()
        )
        total_tasks = enr.tasks.count()
        completed_tasks = enr.tasks.filter(status=AcademicTask.Status.COMPLETED).count()

        subjects_data.append(
            {
                "id": str(enr.id),
                "name": enr.subject.name,
                "code": enr.subject.code,
                "semester": enr.subject.semester,
                "professor": enr.display_professor_name,
                "workload_hours": enr.effective_workload_hours,
                "period": enr.semester_period or f"{enr.subject.semester}º Semestre",
                "faltas": absent_count,
                "aulas_registradas": recorded_classes,
                "tarefas_total": total_tasks,
                "tarefas_concluidas": completed_tasks,
            }
        )

    # 3. Tarefas acadêmicas (pendentes, atrasadas e recentes)
    user_tasks = (
        AcademicTask.objects.filter(user=user)
        .select_related("student_subject__subject")
        .order_by("due_date", "created_at")
    )

    pending_tasks: list[dict[str, Any]] = []
    overdue_tasks: list[dict[str, Any]] = []
    completed_recent_tasks: list[dict[str, Any]] = []

    for task in user_tasks:
        subj_name = task.student_subject.subject.name if task.student_subject else "Geral"
        task_info = {
            "id": str(task.id),
            "title": task.title,
            "subject": subj_name,
            "status": task.get_status_display(),
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "estimated_minutes": task.estimated_minutes,
        }

        if task.status == AcademicTask.Status.COMPLETED:
            if len(completed_recent_tasks) < 5:
                completed_recent_tasks.append(task_info)
        else:
            if task.due_date and task.due_date < now:
                overdue_tasks.append(task_info)
            else:
                if len(pending_tasks) < 15:
                    pending_tasks.append(task_info)

    # 4. Avaliações e Eventos nos próximos 30 dias
    upcoming_limit = now + timedelta(days=30)
    upcoming_events_qs = (
        AcademicEvent.objects.filter(user=user, starts_at__gte=now, starts_at__lte=upcoming_limit)
        .select_related("student_subject__subject")
        .order_by("starts_at")
    )

    upcoming_events: list[dict[str, Any]] = []
    for ev in upcoming_events_qs:
        subj_name = ev.student_subject.subject.name if ev.student_subject else "Geral"
        upcoming_events.append(
            {
                "id": str(ev.id),
                "title": ev.title,
                "kind": ev.get_kind_display(),
                "subject": subj_name,
                "starts_at": ev.starts_at.isoformat(),
                "all_day": ev.all_day,
                "room": ev.room,
            }
        )

    # 5. Leituras acadêmicas ativas
    active_readings_qs = (
        AcademicReading.objects.filter(user=user, status=AcademicReading.Status.READING)
        .select_related("student_subject__subject")
        .order_by("-updated_at")
    )

    readings_data: list[dict[str, Any]] = []
    for reading in active_readings_qs:
        subj_name = (
            reading.student_subject.subject.name if reading.student_subject else "Geral"
        )
        readings_data.append(
            {
                "id": str(reading.id),
                "title": reading.title,
                "author": reading.author,
                "subject": subj_name,
                "current_page": reading.current_page,
                "total_pages": reading.total_pages,
                "pages_remaining": reading.pages_remaining,
                "progress_percent": reading.progress_percent,
                "daily_goal_pages": reading.daily_goal_pages,
                "exam_name": reading.exam_name,
                "exam_date": reading.exam_date.isoformat() if reading.exam_date else None,
            }
        )

    # 6. Anotações recentes
    recent_notes_qs = (
        StudyNote.objects.filter(user=user)
        .select_related("student_subject__subject")
        .order_by("-updated_at")[:5]
    )
    notes_data = [
        {
            "id": str(note.id),
            "title": note.title,
            "methodology": note.methodology or "Livre",
            "subject": note.student_subject.subject.name if note.student_subject else "Geral",
            "updated_at": note.updated_at.isoformat(),
        }
        for note in recent_notes_qs
    ]

    return {
        "generated_at": now.isoformat(),
        "student": student_profile,
        "subjects": subjects_data,
        "tasks": {
            "overdue": overdue_tasks,
            "pending": pending_tasks,
            "completed_recent": completed_recent_tasks,
        },
        "upcoming_events": upcoming_events,
        "readings": readings_data,
        "recent_notes": notes_data,
    }


def format_academic_context_for_prompt(context: dict[str, Any]) -> str:
    """
    Formata o contexto do aluno em Markdown limpo para injeção no prompt do sistema da LLM.
    """
    student = context.get("student", {})
    subjects = context.get("subjects", [])
    tasks = context.get("tasks", {})
    events = context.get("upcoming_events", [])
    readings = context.get("readings", [])

    lines = [
        "### DADOS DO ESTUDANTE:",
        f"- Nome: {student.get('full_name')}",
        f"- Curso: {student.get('course')} ({student.get('degree_type')}, {student.get('modality')})",
        "",
        "### DISCIPLINAS ATIVAS MATRICULADAS:",
    ]

    if not subjects:
        lines.append("- Nenhuma disciplina ativa cadastrada no momento.")
    else:
        for s in subjects:
            lines.append(
                f"- **{s['name']}** (Cód: {s['code'] or 'S/C'}, {s['period']}) | "
                f"Prof: {s['professor'] or 'Não atribuído'} | Carga: {s['workload_hours']}h | "
                f"Faltas registradas: {s['faltas']} | Progresso tarefas: {s['tarefas_concluidas']}/{s['tarefas_total']}"
            )

    lines.append("")
    lines.append("### TAREFAS ACADÊMICAS:")
    overdue = tasks.get("overdue", [])
    pending = tasks.get("pending", [])

    if overdue:
        lines.append("**ATENÇÃO - TAREFAS ATRASADAS:**")
        for t in overdue:
            lines.append(
                f"- [ATRASADA] {t['title']} ({t['subject']}) - Venceu em: {t['due_date']}"
            )
    else:
        lines.append("- Nenhuma tarefa atrasada. Parabéns!")

    if pending:
        lines.append("**Próximas Tarefas Pendentes:**")
        for t in pending:
            prazo = t["due_date"] or "Sem prazo estipulado"
            lines.append(f"- {t['title']} ({t['subject']}) - Prazo: {prazo} (Status: {t['status']})")
    else:
        lines.append("- Nenhuma tarefa pendente no momento.")

    lines.append("")
    lines.append("### PRÓXIMAS AVALIAÇÕES E PROVAS (Próximos 30 dias):")
    if events:
        for ev in events:
            lines.append(
                f"- {ev['title']} ({ev['kind']}) - Disciplina: {ev['subject']} | Data: {ev['starts_at']} | Sala: {ev['room'] or 'Não informada'}"
            )
    else:
        lines.append("- Nenhuma prova ou avaliação agendada nos próximos 30 dias.")

    lines.append("")
    lines.append("### LEITURAS EM ANDAMENTO:")
    if readings:
        for r in readings:
            exam_info = f" (Foco na prova: {r['exam_name']})" if r.get("exam_name") else ""
            lines.append(
                f"- '{r['title']}' de {r['author'] or 'Autor não informado'} ({r['subject']}){exam_info}: "
                f"Página {r['current_page']}/{r['total_pages']} ({r['progress_percent']}%, restam {r['pages_remaining']} págs, meta diária: {r['daily_goal_pages']} págs)"
            )
    else:
        lines.append("- Nenhuma leitura ativa no momento.")

    return "\n".join(lines)
