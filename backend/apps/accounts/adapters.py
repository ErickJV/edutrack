from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.core.exceptions import PermissionDenied

from .validators import normalize_and_validate_institutional_email


class EduTrackAccountAdapter(DefaultAccountAdapter):
    def clean_email(self, email: str) -> str:
        return normalize_and_validate_institutional_email(email)


class EduTrackSocialAccountAdapter(DefaultSocialAccountAdapter):
    def _verified_institutional_email(self, sociallogin) -> str | None:
        for address in sociallogin.email_addresses:
            if not address.verified:
                continue
            try:
                return normalize_and_validate_institutional_email(address.email)
            except Exception:
                continue
        return None

    def pre_social_login(self, request, sociallogin) -> None:
        if sociallogin.account.provider != "google":
            raise PermissionDenied("Provedor de autenticação não permitido.")
        email = self._verified_institutional_email(sociallogin)
        if not email:
            raise PermissionDenied("Use uma conta Google institucional verificada da Impacta.")
        sociallogin.user.email = email

    def is_open_for_signup(self, request, sociallogin) -> bool:
        return self._verified_institutional_email(sociallogin) is not None

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        name = " ".join((data.get("name") or "").split())
        if not name:
            name = " ".join(filter(None, (data.get("first_name"), data.get("last_name"))))
        user.full_name = name[:160]
        return user
