from django.core.exceptions import ValidationError
from django.core.validators import validate_email

INSTITUTIONAL_DOMAIN = "aluno.impacta.edu.br"


def normalize_and_validate_institutional_email(email: str) -> str:
    normalized = email.strip().lower()
    validate_email(normalized)
    _, separator, domain = normalized.rpartition("@")
    if not separator or domain != INSTITUTIONAL_DOMAIN:
        raise ValidationError(
            "Use seu e-mail institucional @aluno.impacta.edu.br.",
            code="institutional_email_required",
        )
    return normalized
