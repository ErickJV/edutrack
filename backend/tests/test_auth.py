import re

import pytest
from allauth.account.models import EmailAddress
from django.conf import settings
from django.contrib.auth.hashers import identify_hasher
from django.core import mail
from django.test import Client, override_settings

from apps.accounts.models import User
from apps.legal.models import LegalAcceptance

pytestmark = pytest.mark.django_db


def post_json(client: Client, path: str, data: dict):
    return client.post(path, data=data, content_type="application/json")


def test_security_configuration_matches_mvp_contract():
    google = settings.SOCIALACCOUNT_PROVIDERS["google"]
    assert settings.ACCOUNT_EMAIL_VERIFICATION_BY_CODE_TIMEOUT == 600
    assert settings.ACCOUNT_EMAIL_VERIFICATION_BY_CODE_MAX_ATTEMPTS == 3
    assert settings.PASSWORD_RESET_TIMEOUT == 3600
    assert settings.SESSION_COOKIE_HTTPONLY is True
    assert settings.SESSION_COOKIE_SAMESITE == "Lax"
    assert settings.SESSION_COOKIE_AGE == 60 * 60 * 24 * 14
    assert settings.SOCIALACCOUNT_STORE_TOKENS is False
    assert "http://localhost:5173" in settings.CSRF_TRUSTED_ORIGINS
    assert "http://127.0.0.1:5173" in settings.CSRF_TRUSTED_ORIGINS
    assert google["SCOPE"] == ["openid", "email", "profile"]
    assert google["OAUTH_PKCE_ENABLED"] is True


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_institutional_signup_verifies_with_six_digit_code(
    client: Client, offering, strong_password: str
):
    response = post_json(
        client,
        "/_allauth/browser/v1/auth/signup",
        {
            "email": "maria.silva@aluno.impacta.edu.br",
            "password": strong_password,
            "full_name": "Maria Silva",
            "course_offering_id": str(offering.id),
            "accept_legal": True,
        },
    )

    assert response.status_code == 401
    user = User.objects.get(email="maria.silva@aluno.impacta.edu.br")
    assert user.profile_complete
    assert user.course_offering == offering
    assert identify_hasher(user.password).algorithm == "argon2"
    assert LegalAcceptance.objects.filter(user=user).count() == 2
    assert len(mail.outbox) == 1

    match = re.search(r"\b(\d{6})\b", str(mail.outbox[0].body))
    assert match is not None
    verification = post_json(
        client, "/_allauth/browser/v1/auth/email/verify", {"key": match.group(1)}
    )
    assert verification.status_code == 200
    assert verification.json()["data"]["user"]["profile_complete"] is True
    assert EmailAddress.objects.get(user=user).verified is True


@pytest.mark.parametrize(
    "email",
    [
        "aluno@gmail.com",
        "aluno@sub.aluno.impacta.edu.br",
        "aluno@aluno.impacta.edu.br.evil.test",
    ],
)
@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_signup_rejects_non_institutional_domains(
    client: Client, offering, strong_password: str, email: str
):
    response = post_json(
        client,
        "/_allauth/browser/v1/auth/signup",
        {
            "email": email,
            "password": strong_password,
            "full_name": "Aluno Impacta",
            "course_offering_id": str(offering.id),
            "accept_legal": True,
        },
    )

    assert response.status_code == 400
    assert User.objects.count() == 0


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_signup_rejects_inactive_offering(client: Client, offering, strong_password: str):
    offering.active = False
    offering.save(update_fields=("active",))

    response = post_json(
        client,
        "/_allauth/browser/v1/auth/signup",
        {
            "email": "aluno@aluno.impacta.edu.br",
            "password": strong_password,
            "full_name": "Aluno Impacta",
            "course_offering_id": str(offering.id),
            "accept_legal": True,
        },
    )

    assert response.status_code == 400
    assert User.objects.count() == 0


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_unverified_user_cannot_log_in(client: Client, strong_password: str):
    user = User.objects.create_user(email="pendente@aluno.impacta.edu.br", password=strong_password)
    EmailAddress.objects.create(user=user, email=user.email, primary=True, verified=False)

    response = post_json(
        client,
        "/_allauth/browser/v1/auth/login",
        {"email": user.email, "password": strong_password},
    )

    assert response.status_code == 401
    assert any(flow["id"] == "verify_email" for flow in response.json()["data"]["flows"])


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_verification_is_blocked_after_three_wrong_codes(
    client: Client, offering, strong_password: str
):
    post_json(
        client,
        "/_allauth/browser/v1/auth/signup",
        {
            "email": "tentativas@aluno.impacta.edu.br",
            "password": strong_password,
            "full_name": "Teste Tentativas",
            "course_offering_id": str(offering.id),
            "accept_legal": True,
        },
    )
    correct_code = re.search(r"\b(\d{6})\b", str(mail.outbox[0].body))
    assert correct_code is not None

    for wrong_code in ("111111", "222222", "333333"):
        response = post_json(client, "/_allauth/browser/v1/auth/email/verify", {"key": wrong_code})
        assert response.status_code == 400

    blocked = post_json(
        client,
        "/_allauth/browser/v1/auth/email/verify",
        {"key": correct_code.group(1)},
    )
    assert blocked.status_code != 200


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_password_reset_is_generic_and_invalidates_old_password(
    client: Client, strong_password: str
):
    user = User.objects.create_user(
        email="recuperacao@aluno.impacta.edu.br", password=strong_password
    )
    EmailAddress.objects.create(user=user, email=user.email, primary=True, verified=True)

    existing_response = post_json(
        client,
        "/_allauth/browser/v1/auth/password/request",
        {"email": user.email},
    )
    existing_body = existing_response.json()
    assert existing_response.status_code == 200
    assert len(mail.outbox) == 1

    unknown_response = post_json(
        client,
        "/_allauth/browser/v1/auth/password/request",
        {"email": "nao-existe@aluno.impacta.edu.br"},
    )
    assert unknown_response.status_code == existing_response.status_code
    assert unknown_response.json() == existing_body

    match = re.search(r"/redefinir-senha/([^\s]+)", str(mail.outbox[0].body))
    assert match is not None
    new_password = "Nova-Trilha-Segura-Impacta-2026!"
    reset = post_json(
        client,
        "/_allauth/browser/v1/auth/password/reset",
        {"key": match.group(1), "password": new_password},
    )
    # O contrato headless retorna 401 para indicar que a redefinição encerra
    # qualquer autenticação e que o próximo passo é um novo login.
    assert reset.status_code == 401
    reused = post_json(
        client,
        "/_allauth/browser/v1/auth/password/reset",
        {"key": match.group(1), "password": "Terceira-Senha-Nao-Deve-Ser-Aceita!"},
    )
    assert reused.status_code == 400

    old_login = post_json(
        Client(),
        "/_allauth/browser/v1/auth/login",
        {"email": user.email, "password": strong_password},
    )
    new_login = post_json(
        Client(),
        "/_allauth/browser/v1/auth/login",
        {"email": user.email, "password": new_password},
    )
    assert old_login.status_code == 400
    assert new_login.status_code == 200
