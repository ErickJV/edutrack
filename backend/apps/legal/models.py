import uuid

from django.conf import settings
from django.db import models


class LegalDocument(models.Model):
    class Kind(models.TextChoices):
        TERMS = "terms", "Termos de Uso"
        PRIVACY = "privacy", "Política de Privacidade"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kind = models.CharField(max_length=20, choices=Kind.choices)
    version = models.CharField(max_length=40)
    title = models.CharField(max_length=120)
    content = models.TextField()
    active = models.BooleanField(default=True)
    is_draft = models.BooleanField(default=True)
    published_at = models.DateTimeField()

    class Meta:
        ordering = ("kind", "-published_at")
        constraints = [
            models.UniqueConstraint(fields=("kind", "version"), name="unique_legal_kind_version")
        ]
        verbose_name = "documento legal"
        verbose_name_plural = "documentos legais"

    def __str__(self) -> str:
        return f"{self.get_kind_display()} — {self.version}"


class LegalAcceptance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="legal_acceptances",
    )
    document = models.ForeignKey(
        LegalDocument,
        on_delete=models.PROTECT,
        related_name="acceptances",
    )
    accepted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("user", "document"), name="unique_user_legal_acceptance"
            )
        ]
        verbose_name = "aceite legal"
        verbose_name_plural = "aceites legais"

    def __str__(self) -> str:
        return f"{self.user} — {self.document}"
