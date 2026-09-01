from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = ("email", "full_name", "course_offering", "is_staff", "is_active")
    list_filter = ("is_staff", "is_active", "course_offering__modality")
    search_fields = ("email", "full_name")
    readonly_fields = ("last_login", "date_joined", "profile_completed_at")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Perfil"), {"fields": ("full_name", "course_offering", "profile_completed_at")}),
        (
            _("Permissões"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (_("Datas"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "is_staff", "is_active"),
            },
        ),
    )
