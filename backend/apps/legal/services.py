import uuid

from django.contrib.auth import get_user_model

from .models import LegalAcceptance, LegalDocument


def active_legal_documents():
    return LegalDocument.objects.filter(active=True).order_by("kind", "-published_at")


def record_current_acceptances(user=None, *, user_id=None) -> None:
    if user is None:
        user = get_user_model().objects.get(pk=user_id)
    documents_by_kind: dict[str, LegalDocument] = {}
    for document in active_legal_documents():
        documents_by_kind.setdefault(document.kind, document)
    for document in documents_by_kind.values():
        LegalAcceptance.objects.get_or_create(user=user, document=document)


def has_current_acceptances(user) -> bool:
    current: dict[str, uuid.UUID] = {}
    for document in active_legal_documents():
        current.setdefault(document.kind, document.id)
    accepted = set(
        LegalAcceptance.objects.filter(
            user=user, document_id__in=list(current.values())
        ).values_list("document_id", flat=True)
    )
    return bool(current) and accepted == set(current.values())
