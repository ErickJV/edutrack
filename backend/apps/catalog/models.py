import uuid

from django.db import models


class Course(models.Model):
    class DegreeType(models.TextChoices):
        BACHELOR = "bachelor", "Bacharelado"
        TECHNOLOGIST = "technologist", "Tecnólogo"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=120, unique=True)
    name = models.CharField(max_length=160)
    degree_type = models.CharField(max_length=20, choices=DegreeType.choices)
    active = models.BooleanField(default=True)
    source_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name",)
        verbose_name = "graduação"
        verbose_name_plural = "graduações"

    def __str__(self) -> str:
        return self.name


class CourseOffering(models.Model):
    class Modality(models.TextChoices):
        IN_PERSON = "in_person", "Presencial"
        DIGITAL = "digital", "Digital"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="offerings")
    modality = models.CharField(max_length=20, choices=Modality.choices)
    external_slug = models.SlugField(max_length=140, unique=True)
    active = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("display_order", "course__name", "modality")
        constraints = [
            models.UniqueConstraint(fields=("course", "modality"), name="unique_course_modality")
        ]
        verbose_name = "oferta de graduação"
        verbose_name_plural = "ofertas de graduação"

    def __str__(self) -> str:
        return f"{self.course.name} — {self.get_modality_display()}"
