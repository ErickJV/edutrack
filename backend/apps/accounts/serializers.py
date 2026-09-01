from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.catalog.models import CourseOffering
from apps.catalog.serializers import CourseOfferingSerializer
from apps.legal.services import has_current_acceptances, record_current_acceptances

from .models import User


class ProfileSerializer(serializers.ModelSerializer):
    course_offering = CourseOfferingSerializer(read_only=True)
    profile_complete = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "course_offering", "profile_complete")

    def get_profile_complete(self, obj: User) -> bool:
        return obj.profile_complete and has_current_acceptances(obj)


class ProfileCompletionSerializer(serializers.Serializer):
    full_name = serializers.CharField(min_length=3, max_length=160, trim_whitespace=True)
    course_offering_id = serializers.UUIDField()
    accept_legal = serializers.BooleanField()

    def validate_full_name(self, value: str) -> str:
        return " ".join(value.split())

    def validate_course_offering_id(self, value):
        try:
            return CourseOffering.objects.select_related("course").get(
                id=value, active=True, course__active=True
            )
        except CourseOffering.DoesNotExist as exc:
            raise serializers.ValidationError("Selecione uma graduação ativa.") from exc

    def validate_accept_legal(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError("É necessário aceitar os documentos legais.")
        return value

    @transaction.atomic
    def update(self, instance: User, validated_data):
        if instance.profile_complete and has_current_acceptances(instance):
            raise serializers.ValidationError("O perfil já foi concluído.")
        instance.full_name = validated_data["full_name"]
        instance.course_offering = validated_data["course_offering_id"]
        instance.profile_completed_at = timezone.now()
        instance.save(update_fields=("full_name", "course_offering", "profile_completed_at"))
        record_current_acceptances(instance)
        return instance

    def create(self, validated_data):
        raise NotImplementedError


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()


class SessionPreferenceSerializer(serializers.Serializer):
    remember = serializers.BooleanField()
