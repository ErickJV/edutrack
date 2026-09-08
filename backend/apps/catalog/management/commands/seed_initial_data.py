from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Aplica as migrações que contêm o catálogo e documentos legais iniciais."

    def handle(self, *args, **options):
        call_command("migrate", interactive=False)
        self.stdout.write(self.style.SUCCESS("Dados iniciais disponíveis."))
