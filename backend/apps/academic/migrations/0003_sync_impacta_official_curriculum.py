import re
import uuid

from django.db import migrations
from apps.academic.official_curricula import OFFICIAL_CURRICULA

NAMESPACE = uuid.UUID("14d16756-76d5-4bc1-9657-04bd2597c44a")

PREFIXES = {
    "analise-e-desenvolvimento-de-sistemas": "ADS",
    "banco-de-dados": "BD",
    "ciencia-da-computacao": "CC",
    "defesa-cibernetica": "DC",
    "engenharia-da-computacao": "EC",
    "gestao-da-tecnologia-da-informacao": "GTI",
    "redes-de-computadores": "RC",
    "sistemas-de-informacao": "SI",
}


def slugify_simple(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", cleaned).strip("-")


def apply_official_curriculum(apps, schema_editor):
    Course = apps.get_model("catalog", "Course")
    Subject = apps.get_model("academic", "Subject")

    for course_slug, semesters in OFFICIAL_CURRICULA.items():
        try:
            course = Course.objects.get(slug=course_slug)
        except Course.DoesNotExist:
            continue

        prefix = PREFIXES.get(course_slug, "DISC")
        valid_names = set()

        for sem_num, subjects in semesters:
            for idx, (name, workload_hours, description) in enumerate(subjects, 1):
                valid_names.add(name)
                code = f"{prefix}{sem_num}{idx:02d}"
                subject_slug = slugify_simple(name)
                subject_id = uuid.uuid5(
                    NAMESPACE, f"subject:{course_slug}:{sem_num}:{subject_slug}"
                )
                Subject.objects.update_or_create(
                    course=course,
                    name=name,
                    defaults={
                        "id": subject_id,
                        "code": code,
                        "semester": sem_num,
                        "workload_hours": workload_hours,
                        "description": description,
                        "active": True,
                    },
                )

        # Inativar disciplinas legadas não existentes na grade oficial
        Subject.objects.filter(course=course).exclude(name__in=valid_names).update(active=False)


def revert_official_curriculum(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0002_seed_curriculum"),
    ]

    operations = [
        migrations.RunPython(apply_official_curriculum, reverse_code=revert_official_curriculum),
    ]
