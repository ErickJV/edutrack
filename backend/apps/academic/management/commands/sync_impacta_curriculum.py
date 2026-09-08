import re
import urllib.error
import urllib.request
import uuid
from html import unescape

from django.core.management.base import BaseCommand

from apps.academic.models import Subject
from apps.catalog.models import Course

NAMESPACE = uuid.UUID("14d16756-76d5-4bc1-9657-04bd2597c44a")

PREFIXES = {
    "analise-e-desenvolvimento-de-sistemas": "ADS",
    "banco-de-dados": "BD",
    "ciencia-da-computacao": "CC",
    "defesa-cibernetica": "DC",
    "engenharia-da-computacao": "EC",
    "gestao-da-tecnologia-da-informacao": "GTI",
    "redes-de-computadores": "RC",
    "sistemas-de-informacao": "SI",
}


def clean_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    return unescape(text).strip()


def slugify_simple(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", cleaned).strip("-")


def fetch_course_curriculum(slug: str) -> list[tuple[int, list[dict]]]:
    url = f"https://www.impacta.edu.br/graduacoes/{slug}"
    req = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) EduTrack/1.0"}
    )
    with urllib.request.urlopen(req, timeout=12) as resp:
        html = resp.read().decode("utf-8")

    prefix = PREFIXES.get(slug, "DISC")
    parts = re.split(r"<h3>Semestre\s*0?(\d+)</h3>", html, flags=re.IGNORECASE)
    course_semesters: list[tuple[int, list[dict]]] = []

    for i in range(1, len(parts), 2):
        sem_num = int(parts[i])
        sem_html = parts[i + 1]
        cards = re.findall(
            r'<li class="disciplina_card">(.*?)</li>\s*'
            r'(?=<li class="disciplina_card"|</ul>\s*</div>)',
            sem_html,
            re.DOTALL,
        )
        sem_subjects = []
        for idx, card in enumerate(cards, 1):
            name_m = re.search(r"<strong>(.*?)</strong>", card, re.DOTALL)
            if not name_m:
                continue
            name = clean_html(name_m.group(1))
            if not name:
                continue

            hr_m = re.search(r"(\d+)\s*h", card, re.IGNORECASE)
            hours = int(hr_m.group(1)) if hr_m else 80

            topics_html = re.findall(r"<li[^>]*>(.*?)</li>", card, re.DOTALL)
            topics = [clean_html(t) for t in topics_html if clean_html(t) and clean_html(t) != name]
            description = " • ".join(topics) if topics else ""

            code = f"{prefix}{sem_num}{idx:02d}"

            sem_subjects.append(
                {
                    "name": name,
                    "code": code,
                    "workload_hours": hours,
                    "description": description,
                }
            )
        course_semesters.append((sem_num, sem_subjects))

    return course_semesters


class Command(BaseCommand):
    help = "Sincroniza a grade curricular oficial do site da Faculdade Impacta."

    def handle(self, *args, **options):
        courses = Course.objects.filter(active=True).order_by("name")
        total_created = 0
        total_updated = 0

        for course in courses:
            self.stdout.write(f"Sincronizando {course.name} ({course.slug})...")
            try:
                semesters = fetch_course_curriculum(course.slug)
            except Exception as exc:
                self.stderr.write(f"Erro ao buscar {course.slug}: {exc}")
                continue

            if not semesters:
                self.stdout.write(f"Nenhum semestre encontrado para {course.slug}.")
                continue

            scraped_names = set()
            for sem_num, subjects in semesters:
                for subj in subjects:
                    scraped_names.add(subj["name"])
                    subj_slug = slugify_simple(subj["name"])
                    subject_id = uuid.uuid5(
                        NAMESPACE, f"subject:{course.slug}:{sem_num}:{subj_slug}"
                    )
                    _, created = Subject.objects.update_or_create(
                        course=course,
                        name=subj["name"],
                        defaults={
                            "id": subject_id,
                            "code": subj["code"],
                            "semester": sem_num,
                            "workload_hours": subj["workload_hours"],
                            "description": subj["description"],
                            "active": True,
                        },
                    )
                    if created:
                        total_created += 1
                    else:
                        total_updated += 1

            # Desativar disciplinas antigas que não constam mais na grade oficial
            deactivated = (
                Subject.objects.filter(course=course)
                .exclude(name__in=scraped_names)
                .update(active=False)
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ {course.name}: {len(scraped_names)} disciplinas ativas "
                    f"(antigas removidas: {deactivated})."
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Sincronização concluída: {total_created} criadas, {total_updated} atualizadas."
            )
        )
