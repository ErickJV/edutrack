import pytest

from apps.catalog.models import CourseOffering


@pytest.fixture
def offering(db):
    return CourseOffering.objects.select_related("course").filter(active=True).first()


@pytest.fixture
def strong_password():
    return "Trilha-Segura-Impacta-2026!"
