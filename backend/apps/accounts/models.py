from __future__ import annotations

import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager["User"]):
    use_in_migrations = True

    def normalize_institutional_email(self, email: str) -> str:
        return self.normalize_email(email).strip().lower()

    def create_user(self, email: str, password: str | None = None, **extra_fields) -> User:
        if not email:
            raise ValueError("O e-mail é obrigatório.")
        user = self.model(email=self.normalize_institutional_email(email), **extra_fields)
        user.set_password(password) if password else user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str, **extra_fields) -> User:
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if not extra_fields.get("is_staff") or not extra_fields.get("is_superuser"):
            raise ValueError("Superusuários precisam de is_staff e is_superuser.")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=160, blank=True)
    course_offering = models.ForeignKey(
        "catalog.CourseOffering",
        on_delete=models.PROTECT,
        related_name="students",
        null=True,
        blank=True,
    )
    profile_completed_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ("email",)
        verbose_name = "usuário"
        verbose_name_plural = "usuários"

    def __str__(self) -> str:
        return self.email

    @property
    def profile_complete(self) -> bool:
        return bool(self.profile_completed_at and self.full_name and self.course_offering_id)

    def get_full_name(self) -> str:
        return self.full_name

    def get_short_name(self) -> str:
        if self.full_name:
            return self.full_name.split(maxsplit=1)[0]
        return self.email.split("@", 1)[0]
