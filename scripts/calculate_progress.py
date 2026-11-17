#!/usr/bin/env python3
"""
Utilitário de cálculo de progresso acadêmico do EduTrack.

Calcula o percentual de conclusão de tarefas por disciplina e o progresso
ponderado pela carga horária do semestre vigente, tratando cenários sem
tarefas cadastradas (divisão por zero).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any


def calculate_task_progress(total_tasks: int, completed_tasks: int) -> dict[str, Any]:
    """
    Calcula a porcentagem de conclusão a partir do total de tarefas
    e da quantidade de tarefas concluídas.
    """
    total = max(0, int(total_tasks))
    completed = max(0, min(int(completed_tasks), total))

    if total == 0:
        progress_percent = 0.0
    else:
        progress_percent = round((completed / total) * 100, 1)

    pending = total - completed
    return {
        "total_tasks": total,
        "completed_tasks": completed,
        "pending_tasks": pending,
        "progress_percent": progress_percent,
        "formatted": f"{progress_percent:.1f}%",
    }


def calculate_weighted_progress(subjects_summary: list[dict[str, Any]]) -> float:
    """
    Calcula o progresso acadêmico ponderado pela carga horária de cada disciplina.
    """
    total_hours = sum(int(item.get("workload_hours", 0)) for item in subjects_summary)
    if total_hours <= 0:
        return 0.0

    weighted_sum = sum(
        float(item.get("progress_percent", 0.0)) * int(item.get("workload_hours", 0))
        for item in subjects_summary
    )
    return round(weighted_sum / total_hours, 1)


def _load_from_database() -> list[dict[str, Any]] | None:
    root_dir = Path(__file__).resolve().parent.parent
    backend_dir = root_dir / "backend"
    if not backend_dir.exists():
        return None

    sys.path.insert(0, str(backend_dir))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    os.environ.setdefault("DB_ENGINE", "sqlite")

    try:
        import django

        django.setup()
        from apps.academic.models import AcademicTask, StudentSubject

        enrollments = (
            StudentSubject.objects.select_related("subject", "user")
            .filter(status=StudentSubject.Status.ACTIVE, subject__active=True)
            .order_by("subject__semester", "subject__name")
        )
        if not enrollments.exists():
            return None

        results: list[dict[str, Any]] = []
        for item in enrollments:
            total = item.tasks.count()
            completed = item.tasks.filter(status=AcademicTask.Status.COMPLETED).count()
            metrics = calculate_task_progress(total, completed)
            results.append(
                {
                    "subject": item.subject.name,
                    "semester": item.subject.semester,
                    "workload_hours": item.effective_workload_hours,
                    **metrics,
                }
            )
        return results
    except Exception:
        return None


def main() -> None:
    records = _load_from_database()
    if not records:
        sample_subjects = [
            ("Agile Software Development", 2, 80, 5, 4),
            ("Data Governance", 2, 80, 4, 3),
            ("Distributed Systems & Cloud Computing", 2, 80, 6, 4),
            ("Inovacao Lab - No/Low Code", 2, 40, 8, 7),
            ("Artificial Intelligence Fundamentals", 2, 80, 0, 0),
        ]
        records = []
        for name, semester, hours, total, completed in sample_subjects:
            metrics = calculate_task_progress(total, completed)
            records.append(
                {
                    "subject": name,
                    "semester": semester,
                    "workload_hours": hours,
                    **metrics,
                }
            )

    print("=" * 74)
    print("EDUTRACK - RELATORIO DE PROGRESSO DE TAREFAS POR DISCIPLINA")
    print("=" * 74)
    print(f"{'Disciplina':<40} | {'CH':>4} | {'Concl./Total':>12} | {'Progresso':>9}")
    print("-" * 74)

    total_tasks_all = 0
    completed_tasks_all = 0
    for row in records:
        total_tasks_all += row["total_tasks"]
        completed_tasks_all += row["completed_tasks"]
        ratio = f"{row['completed_tasks']}/{row['total_tasks']}"
        print(
            f"{row['subject'][:40]:<40} | {row['workload_hours']:>3}h | "
            f"{ratio:>12} | {row['formatted']:>9}"
        )

    overall = calculate_task_progress(total_tasks_all, completed_tasks_all)
    weighted = calculate_weighted_progress(records)

    print("-" * 74)
    print(
        f"Total Geral de Tarefas : {overall['completed_tasks']}/{overall['total_tasks']} "
        f"concluidas ({overall['formatted']})"
    )
    print(f"Progresso Ponderado CH : {weighted:.1f}%")
    print("=" * 74)


if __name__ == "__main__":
    main()
