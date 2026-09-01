import uuid
from datetime import datetime

from django.db import migrations
from django.utils.timezone import make_aware

NAMESPACE = uuid.UUID("86598dc3-778f-41e2-9b45-85264a400291")
VERSION = "draft-2026-09-01"
PUBLISHED_AT = make_aware(datetime(2026, 9, 1, 0, 0, 0))

DOCUMENTS = {
    "terms": (
        "Termos de Uso",
        "DOCUMENTO ACADÊMICO PROVISÓRIO — PENDENTE DE REVISÃO JURÍDICA.\n\n"
        "O EduTrack é uma plataforma acadêmica autorizada destinada a alunos da Faculdade Impacta. "
        "Nesta versão, o serviço oferece somente autenticação e identificação da graduação. O usuário "
        "é responsável por manter suas credenciais seguras e por informar dados verdadeiros. O serviço "
        "não substitui os sistemas oficiais da instituição e pode ser alterado ou interrompido durante "
        "o desenvolvimento do projeto.\n",
    ),
    "privacy": (
        "Política de Privacidade",
        "DOCUMENTO ACADÊMICO PROVISÓRIO — PENDENTE DE REVISÃO JURÍDICA.\n\n"
        "O EduTrack trata nome, e-mail institucional, graduação, modalidade e registros técnicos de "
        "autenticação para disponibilizar o acesso. Senhas são armazenadas exclusivamente como hash "
        "seguro. O MVP não registra IP ou user-agent nos aceites legais e não compartilha dados com "
        "terceiros, exceto os serviços estritamente necessários de autenticação e infraestrutura.\n",
    ),
}


def seed_documents(apps, schema_editor):
    LegalDocument = apps.get_model("legal", "LegalDocument")
    for kind, (title, content) in DOCUMENTS.items():
        LegalDocument.objects.update_or_create(
            id=uuid.uuid5(NAMESPACE, kind),
            defaults={
                "kind": kind,
                "version": VERSION,
                "title": title,
                "content": content,
                "active": True,
                "is_draft": True,
                "published_at": PUBLISHED_AT,
            },
        )


def unseed_documents(apps, schema_editor):
    LegalDocument = apps.get_model("legal", "LegalDocument")
    LegalDocument.objects.filter(id__in=[uuid.uuid5(NAMESPACE, kind) for kind in DOCUMENTS]).delete()


class Migration(migrations.Migration):
    dependencies = [("legal", "0001_initial")]
    operations = [migrations.RunPython(seed_documents, unseed_documents)]
