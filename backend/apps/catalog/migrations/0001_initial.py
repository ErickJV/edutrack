import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    operations = [
        migrations.CreateModel(
            name="Course",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("slug", models.SlugField(max_length=120, unique=True)),
                ("name", models.CharField(max_length=160)),
                (
                    "degree_type",
                    models.CharField(
                        choices=[("bachelor", "Bacharelado"), ("technologist", "Tecnólogo")],
                        max_length=20,
                    ),
                ),
                ("active", models.BooleanField(default=True)),
                ("source_url", models.URLField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "graduação",
                "verbose_name_plural": "graduações",
                "ordering": ("name",),
            },
        ),
        migrations.CreateModel(
            name="CourseOffering",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                (
                    "modality",
                    models.CharField(
                        choices=[("in_person", "Presencial"), ("digital", "Digital")],
                        max_length=20,
                    ),
                ),
                ("external_slug", models.SlugField(max_length=140, unique=True)),
                ("active", models.BooleanField(default=True)),
                ("display_order", models.PositiveSmallIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "course",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="offerings",
                        to="catalog.course",
                    ),
                ),
            ],
            options={
                "verbose_name": "oferta de graduação",
                "verbose_name_plural": "ofertas de graduação",
                "ordering": ("display_order", "course__name", "modality"),
            },
        ),
        migrations.AddConstraint(
            model_name="courseoffering",
            constraint=models.UniqueConstraint(
                fields=("course", "modality"), name="unique_course_modality"
            ),
        ),
    ]
