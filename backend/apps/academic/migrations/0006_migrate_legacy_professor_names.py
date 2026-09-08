from django.db import migrations


def migrate_professors(apps, schema_editor):
    StudentSubject = apps.get_model("academic", "StudentSubject")
    Professor = apps.get_model("academic", "Professor")

    for enrollment in StudentSubject.objects.filter(professor__isnull=True).exclude(professor_name=""):
        name = enrollment.professor_name.strip()
        if not name:
            continue
        professor, _ = Professor.objects.get_or_create(
            user=enrollment.user,
            name=name,
            defaults={"active": True},
        )
        enrollment.professor = professor
        enrollment.save(update_fields=["professor"])


def reverse_migration(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0005_professor_studentsubject_professor"),
    ]

    operations = [
        migrations.RunPython(migrate_professors, reverse_code=reverse_migration),
    ]
