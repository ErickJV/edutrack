import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("accounts", "0001_initial"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="LegalDocument",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("kind", models.CharField(choices=[("terms", "Termos de Uso"), ("privacy", "Política de Privacidade")], max_length=20)),
                ("version", models.CharField(max_length=40)),
                ("title", models.CharField(max_length=120)),
                ("content", models.TextField()),
                ("active", models.BooleanField(default=True)),
                ("is_draft", models.BooleanField(default=True)),
                ("published_at", models.DateTimeField()),
            ],
            options={"verbose_name": "documento legal", "verbose_name_plural": "documentos legais", "ordering": ("kind", "-published_at")},
        ),
        migrations.CreateModel(
            name="LegalAcceptance",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("accepted_at", models.DateTimeField(auto_now_add=True)),
                ("document", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="acceptances", to="legal.legaldocument")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="legal_acceptances", to=settings.AUTH_USER_MODEL)),
            ],
            options={"verbose_name": "aceite legal", "verbose_name_plural": "aceites legais"},
        ),
        migrations.AddConstraint(
            model_name="legaldocument",
            constraint=models.UniqueConstraint(fields=("kind", "version"), name="unique_legal_kind_version"),
        ),
        migrations.AddConstraint(
            model_name="legalacceptance",
            constraint=models.UniqueConstraint(fields=("user", "document"), name="unique_user_legal_acceptance"),
        ),
    ]
