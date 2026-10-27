from allauth.account.models import EmailAddress
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.catalog.models import CourseOffering
from apps.catalog.serializers import CourseOfferingSerializer
from apps.legal.services import has_current_acceptances, record_current_acceptances

from .models import User
from .validators import normalize_and_validate_institutional_email


class ProfileSerializer(serializers.ModelSerializer):
    course_offering = CourseOfferingSerializer(read_only=True)
    profile_complete = serializers.SerializerMethodField()
    has_usable_password = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "course_offering",
            "profile_complete",
            "has_usable_password",
        )

    def get_profile_complete(self, obj: User) -> bool:
        return obj.profile_complete and has_current_acceptances(obj)


class ProfileCompletionSerializer(serializers.Serializer):
    full_name = serializers.CharField(min_length=3, max_length=160, trim_whitespace=True)
    course_offering_id = serializers.UUIDField()
    accept_legal = serializers.BooleanField()
    password = serializers.CharField(
        required=False, write_only=True, min_length=12, allow_blank=True
    )

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

    def validate(self, attrs):
        password = attrs.get("password")
        if password and len(password.strip()) < 12:
            raise serializers.ValidationError(
                {"password": "Defina uma senha com no mínimo 12 caracteres."}
            )
        return attrs

    @transaction.atomic
    def update(self, instance: User, validated_data):
        if instance.profile_complete and has_current_acceptances(instance):
            raise serializers.ValidationError("O perfil já foi concluído.")
        instance.full_name = validated_data["full_name"]
        instance.course_offering = validated_data["course_offering_id"]
        instance.profile_completed_at = timezone.now()
        password = validated_data.get("password")
        if password:
            instance.set_password(password)
            instance.save(
                update_fields=("full_name", "course_offering", "profile_completed_at", "password")
            )
        else:
            instance.save(update_fields=("full_name", "course_offering", "profile_completed_at"))
        record_current_acceptances(instance)
        return instance

    def create(self, validated_data):
        raise NotImplementedError


class ProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(
        min_length=3, max_length=160, trim_whitespace=True, required=False
    )
    email = serializers.EmailField(required=False)
    course_offering_id = serializers.UUIDField(required=False)

    def validate_full_name(self, value: str) -> str:
        return " ".join(value.split())

    def validate_email(self, value: str) -> str:
        try:
            normalized = normalize_and_validate_institutional_email(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages[0]) from exc

        user = self.instance
        qs = User.objects.filter(email__iexact=normalized)
        if user is not None:
            qs = qs.exclude(pk=user.pk)
        if qs.exists():
            raise serializers.ValidationError("Este e-mail já está em uso por outra conta.")
        return normalized

    def validate_course_offering_id(self, value):
        try:
            return CourseOffering.objects.select_related("course").get(
                id=value, active=True, course__active=True
            )
        except CourseOffering.DoesNotExist as exc:
            raise serializers.ValidationError("Selecione uma graduação ativa.") from exc

    @transaction.atomic
    def update(self, instance: User, validated_data):
        update_fields: list[str] = []
        old_email = instance.email

        if "full_name" in validated_data:
            instance.full_name = validated_data["full_name"]
            update_fields.append("full_name")

        if "email" in validated_data and validated_data["email"] != old_email:
            new_email = validated_data["email"]
            instance.email = new_email
            update_fields.append("email")
            EmailAddress.objects.filter(user=instance).exclude(email__iexact=new_email).delete()
            EmailAddress.objects.update_or_create(
                user=instance,
                email=new_email,
                defaults={"verified": True, "primary": True},
            )

        if "course_offering_id" in validated_data:
            instance.course_offering = validated_data["course_offering_id"]
            update_fields.append("course_offering")

        if not instance.profile_completed_at and instance.full_name and instance.course_offering_id:
            instance.profile_completed_at = timezone.now()
            update_fields.append("profile_completed_at")

        if update_fields:
            instance.save(update_fields=tuple(update_fields))
        return instance

    def create(self, validated_data):
        raise NotImplementedError


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()


class SessionPreferenceSerializer(serializers.Serializer):
    remember = serializers.BooleanField()
