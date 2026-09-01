from types import SimpleNamespace

import pytest
from django.core.exceptions import PermissionDenied

from apps.accounts.adapters import EduTrackSocialAccountAdapter


def social_login(email: str, *, verified: bool = True, provider: str = "google"):
    return SimpleNamespace(
        account=SimpleNamespace(provider=provider),
        email_addresses=[SimpleNamespace(email=email, verified=verified)],
        user=SimpleNamespace(email=""),
    )


def test_google_accepts_verified_institutional_email():
    login = social_login("Aluno@aluno.impacta.edu.br")

    EduTrackSocialAccountAdapter().pre_social_login(None, login)

    assert login.user.email == "aluno@aluno.impacta.edu.br"


@pytest.mark.parametrize(
    "login",
    [
        social_login("aluno@gmail.com"),
        social_login("aluno@aluno.impacta.edu.br", verified=False),
        social_login("aluno@aluno.impacta.edu.br", provider="github"),
    ],
)
def test_social_login_rejects_unverified_external_or_non_google(login):
    with pytest.raises(PermissionDenied):
        EduTrackSocialAccountAdapter().pre_social_login(None, login)
