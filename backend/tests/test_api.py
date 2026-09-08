import pytest
from django.test import Client

from apps.accounts.models import User
from apps.legal.models import LegalAcceptance

pytestmark = pytest.mark.django_db


def test_course_offerings_are_public_and_only_active(client: Client, offering):
    offering.active = False
    offering.save(update_fields=("active",))

    response = client.get("/api/v1/course-offerings")

    assert response.status_code == 200
    ids = {item["id"] for item in response.json()}
    assert str(offering.id) not in ids
    assert len(ids) == 13


def test_profile_completion_records_legal_acceptances(client: Client, offering):
    user = User.objects.create_user(email="oauth@aluno.impacta.edu.br")
    client.force_login(user)

    response = client.put(
        "/api/v1/profile",
        data={
            "full_name": "Aluno OAuth",
            "course_offering_id": str(offering.id),
            "accept_legal": True,
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json()["profile_complete"] is True
    assert LegalAcceptance.objects.filter(user=user).count() == 2


def test_profile_completion_with_password(client: Client, offering):
    user = User.objects.create_user(email="social.novo@aluno.impacta.edu.br")
    assert not user.has_usable_password()
    client.force_login(user)

    response = client.put(
        "/api/v1/profile",
        data={
            "full_name": "Aluno Social Novo",
            "course_offering_id": str(offering.id),
            "accept_legal": True,
            "password": "Senha-Forte-OAuth-2026!",
        },
        content_type="application/json",
    )
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.has_usable_password()
    assert user.check_password("Senha-Forte-OAuth-2026!")

def test_profile_completion_rejects_inactive_offering(client: Client, offering):
    user = User.objects.create_user(email="oauth2@aluno.impacta.edu.br")
    client.force_login(user)
    offering.active = False
    offering.save(update_fields=("active",))

    response = client.put(
        "/api/v1/profile",
        data={
            "full_name": "Aluno OAuth",
            "course_offering_id": str(offering.id),
            "accept_legal": True,
        },
        content_type="application/json",
    )

    assert response.status_code == 400
    user.refresh_from_db()
    assert user.profile_complete is False


def test_session_preference_controls_browser_expiry(client: Client, strong_password: str):
    user = User.objects.create_user(email="sessao@aluno.impacta.edu.br", password=strong_password)
    client.force_login(user)

    remembered = client.put(
        "/api/v1/session", data={"remember": True}, content_type="application/json"
    )
    assert remembered.status_code == 200
    assert client.session.get_expire_at_browser_close() is False
    assert 60 * 60 * 24 * 13 < client.session.get_expiry_age() <= 60 * 60 * 24 * 14

    browser = client.put(
        "/api/v1/session", data={"remember": False}, content_type="application/json"
    )
    assert browser.status_code == 200
    assert client.session.get_expire_at_browser_close() is True


def test_mutating_api_requires_csrf(strong_password: str):
    user = User.objects.create_user(email="csrf@aluno.impacta.edu.br", password=strong_password)
    client = Client(enforce_csrf_checks=True)
    client.force_login(user)

    response = client.put(
        "/api/v1/session", data={"remember": True}, content_type="application/json"
    )

    assert response.status_code == 403


def test_legal_acceptance_does_not_store_ip_or_user_agent():
    field_names = {field.name for field in LegalAcceptance._meta.fields}
    assert "ip" not in field_names
    assert "ip_address" not in field_names
    assert "user_agent" not in field_names
