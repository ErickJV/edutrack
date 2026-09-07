from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Aplica as migrações que contêm o catálogo e documentos legais iniciais."

    def handle(self, *args, **options):
        call_command("migrate", interactive=False)
        try:
            call_command("sync_impacta_curriculum")
        except Exception:
            self.stdout.write(
                "Sincronização online da grade ignorada (usando dados oficiais da migração)."
            )
        self.stdout.write(self.style.SUCCESS("Dados iniciais disponíveis."))
