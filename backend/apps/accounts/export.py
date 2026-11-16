from __future__ import annotations

import json
from typing import Any

from allauth.socialaccount.models import SocialAccount
from django.core.serializers import serialize
from django.db.models import QuerySet
from django.utils import timezone

from apps.academic.models import ClassOccurrence, StudyDocumentPage

from .models import User


def serialize_queryset(queryset: QuerySet) -> list[dict[str, Any]]:
    """Serialize a queryset with the Django JSON serializer, dropping the outer list."""
    return json.loads(serialize("json", queryset))


def build_account_payload(user: User) -> dict[str, Any]:
    offering = user.course_offering
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "date_joined": user.date_joined.isoformat(),
        "profile_completed_at": user.profile_completed_at.isoformat()
        if user.profile_completed_at
        else None,
        "is_active": user.is_active,
        "has_usable_password": user.has_usable_password(),
        "course_offering": {
            "id": str(offering.id),
            "course_name": offering.course.name,
            "course_slug": offering.course.slug,
            "modality": offering.modality,
            "modality_label": offering.get_modality_display(),
        }
        if offering
        else None,
    }


def build_legal_acceptances(user: User) -> list[dict[str, Any]]:
    return [
        {
            "kind": acceptance.document.kind,
            "version": acceptance.document.version,
            "title": acceptance.document.title,
            "accepted_at": acceptance.accepted_at.isoformat(),
        }
        for acceptance in user.legal_acceptances.select_related("document").order_by(
            "accepted_at"
        )
    ]


def build_social_accounts(user: User) -> list[dict[str, Any]]:
    return [
        {
            "provider": account.provider,
            "uid": account.uid,
            "date_joined": account.date_joined.isoformat(),
        }
        for account in SocialAccount.objects.filter(user=user).order_by("date_joined")
    ]


def build_user_export(user: User) -> dict[str, Any]:
    """Collect every record owned by ``user`` as a single JSON-serializable mapping."""
    return {
        "exported_at": timezone.now().isoformat(),
        "account": build_account_payload(user),
        "legal_acceptances": build_legal_acceptances(user),
        "social_accounts": build_social_accounts(user),
        "academic_terms": serialize_queryset(user.academic_terms.all()),
        "professors": serialize_queryset(user.professors.all()),
        "student_subjects": serialize_queryset(user.student_subjects.all()),
        "class_schedules": serialize_queryset(user.class_schedules.all()),
        "class_occurrences": serialize_queryset(
            ClassOccurrence.objects.filter(student_subject__user=user)
        ),
        "academic_events": serialize_queryset(user.academic_events.all()),
        "academic_tasks": serialize_queryset(user.academic_tasks.all()),
        "study_folders": serialize_queryset(user.study_folders.all()),
        "academic_readings": serialize_queryset(user.academic_readings.all()),
        "reading_logs": serialize_queryset(user.reading_logs.all()),
        "study_notes": serialize_queryset(user.study_notes.all()),
        "flashcards": serialize_queryset(user.flashcards.all()),
        "study_documents": serialize_queryset(user.study_documents.all()),
        "study_document_pages": serialize_queryset(
            StudyDocumentPage.objects.filter(document__user=user)
        ),
        "study_quizzes": serialize_queryset(user.study_quizzes.all()),
    }
