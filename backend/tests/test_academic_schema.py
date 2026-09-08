import pytest
import yaml
from django.test import Client

pytestmark = pytest.mark.django_db


def test_academic_endpoints_are_exposed_in_openapi_schema(client: Client):
    response = client.get("/api/schema/")

    assert response.status_code == 200
    payload = yaml.safe_load(response.content)
    paths = payload["paths"]
    assert "/api/v1/curriculum" in paths
    assert "/api/v1/student-subjects" in paths
    assert "/api/v1/tasks" in paths
    assert "/api/v1/dashboard/summary" in paths
    assert any(path.startswith("/api/v1/tasks/") for path in paths)
