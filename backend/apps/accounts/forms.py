from django import forms
from django.db import transaction
from django.utils import timezone

from apps.catalog.models import CourseOffering
from apps.legal.services import record_current_acceptances


class EduTrackSignupForm(forms.Form):
    full_name = forms.CharField(max_length=160, strip=True)
    course_offering_id = forms.UUIDField()
    accept_legal = forms.BooleanField()

    def clean_full_name(self) -> str:
        value = " ".join(self.cleaned_data["full_name"].split())
        if len(value) < 3:
            raise forms.ValidationError("Informe seu nome completo.")
        return value

    def clean_course_offering_id(self):
        offering_id = self.cleaned_data["course_offering_id"]
        try:
            return CourseOffering.objects.select_related("course").get(
                id=offering_id, active=True, course__active=True
            )
        except CourseOffering.DoesNotExist as exc:
            raise forms.ValidationError("Selecione uma graduação ativa.") from exc

    @transaction.atomic
    def signup(self, request, user) -> None:
        user.full_name = self.cleaned_data["full_name"]
        user.course_offering = self.cleaned_data["course_offering_id"]
        user.profile_completed_at = timezone.now()
        user.save(update_fields=("full_name", "course_offering", "profile_completed_at"))
        record_current_acceptances(user)
