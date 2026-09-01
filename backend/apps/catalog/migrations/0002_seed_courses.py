import uuid

from django.db import migrations

NAMESPACE = uuid.UUID("14d16756-76d5-4bc1-9657-04bd2597c44a")
SOURCE = "https://www.impacta.edu.br/graduacao"

COURSES = [
    ("analise-e-desenvolvimento-de-sistemas", "Análise e Desenvolvimento de Sistemas", "technologist", ("in_person", "digital")),
    ("banco-de-dados", "Banco de Dados", "technologist", ("in_person", "digital")),
    ("ciencia-da-computacao", "Ciência da Computação", "bachelor", ("in_person",)),
    ("defesa-cibernetica", "Defesa Cibernética", "technologist", ("in_person", "digital")),
    ("engenharia-da-computacao", "Engenharia da Computação", "bachelor", ("in_person",)),
    ("gestao-da-tecnologia-da-informacao", "Gestão da Tecnologia da Informação", "technologist", ("in_person", "digital")),
    ("redes-de-computadores", "Redes de Computadores", "technologist", ("in_person", "digital")),
    ("sistemas-de-informacao", "Sistemas de Informação", "bachelor", ("in_person", "digital")),
]


def seed_courses(apps, schema_editor):
    Course = apps.get_model("catalog", "Course")
    CourseOffering = apps.get_model("catalog", "CourseOffering")
    order = 0
    for slug, name, degree_type, modalities in COURSES:
        course_id = uuid.uuid5(NAMESPACE, f"course:{slug}")
        course, _ = Course.objects.update_or_create(
            id=course_id,
            defaults={
                "slug": slug,
                "name": name,
                "degree_type": degree_type,
                "active": True,
                "source_url": SOURCE,
            },
        )
        for modality in modalities:
            suffix = "-ead" if modality == "digital" else ""
            external_slug = f"{slug}{suffix}"
            CourseOffering.objects.update_or_create(
                id=uuid.uuid5(NAMESPACE, f"offering:{external_slug}"),
                defaults={
                    "course": course,
                    "modality": modality,
                    "external_slug": external_slug,
                    "active": True,
                    "display_order": order,
                },
            )
            order += 1


def unseed_courses(apps, schema_editor):
    Course = apps.get_model("catalog", "Course")
    ids = [uuid.uuid5(NAMESPACE, f"course:{slug}") for slug, *_ in COURSES]
    Course.objects.filter(id__in=ids).delete()


class Migration(migrations.Migration):
    dependencies = [("catalog", "0001_initial")]
    operations = [migrations.RunPython(seed_courses, unseed_courses)]
