import uuid

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models

import apps.accounts.models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("auth", "0012_alter_user_first_name_max_length"), ("catalog", "0002_seed_courses")]

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("full_name", models.CharField(blank=True, max_length=160)),
                ("profile_completed_at", models.DateTimeField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("is_staff", models.BooleanField(default=False)),
                ("date_joined", models.DateTimeField(default=django.utils.timezone.now)),
                ("is_superuser", models.BooleanField(default=False, help_text="Designates that this user has all permissions without explicitly assigning them.", verbose_name="superuser status")),
                (
                    "course_offering",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="students", to="catalog.courseoffering"),
                ),
                ("groups", models.ManyToManyField(blank=True, help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.", related_name="user_set", related_query_name="user", to="auth.group", verbose_name="groups")),
                ("user_permissions", models.ManyToManyField(blank=True, help_text="Specific permissions for this user.", related_name="user_set", related_query_name="user", to="auth.permission", verbose_name="user permissions")),
            ],
            options={"verbose_name": "usuário", "verbose_name_plural": "usuários", "ordering": ("email",)},
            managers=[("objects", apps.accounts.models.UserManager())],
        )
    ]
