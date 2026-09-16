import pytest
from django.test import Client

from apps.academic.models import AcademicTask, StudentSubject, StudyFolder, StudyNote, Subject
from apps.accounts.models import User

pytestmark = pytest.mark.django_db


def create_enrollment(user, offering):
    subject = (
        Subject.objects.filter(course=offering.course, active=True)
        .order_by("semester", "name")
        .first()
    )
    assert subject is not None
    return StudentSubject.objects.create(user=user, subject=subject, semester_period="2026/1")


def test_study_folders_crud(client: Client, offering):
    user = User.objects.create_user(
        email="estudo.pastas@aluno.impacta.edu.br",
        full_name="Aluno Estudo Pastas",
        course_offering=offering,
    )
    client.force_login(user)

    # 1. Criação de pasta
    create_res = client.post(
        "/api/v1/study-folders",
        data={
            "name": "Engenharia de Software",
            "color": "indigo",
            "icon": "folder",
        },
        content_type="application/json",
    )
    assert create_res.status_code == 201
    folder_data = create_res.json()
    folder_id = folder_data["id"]
    assert folder_data["name"] == "Engenharia de Software"
    assert folder_data["color"] == "indigo"
    assert folder_data["notes_count"] == 0

    # 2. Listagem de pastas
    list_res = client.get("/api/v1/study-folders")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1
    assert list_res.json()[0]["id"] == folder_id

    # 3. Atualização (PATCH)
    patch_res = client.patch(
        f"/api/v1/study-folders/{folder_id}",
        data={"name": "Engenharia de Software III", "color": "emerald"},
        content_type="application/json",
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Engenharia de Software III"
    assert patch_res.json()["color"] == "emerald"

    # 4. Detalhe
    detail_res = client.get(f"/api/v1/study-folders/{folder_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["name"] == "Engenharia de Software III"

    # 5. Exclusão
    delete_res = client.delete(f"/api/v1/study-folders/{folder_id}")
    assert delete_res.status_code == 204
    assert StudyFolder.objects.filter(id=folder_id).count() == 0


def test_study_notes_crud_and_relationships(client: Client, offering):
    user = User.objects.create_user(
        email="estudo.notas@aluno.impacta.edu.br",
        full_name="Aluno Estudo Notas",
        course_offering=offering,
    )
    client.force_login(user)
    enrollment = create_enrollment(user, offering)
    task = AcademicTask.objects.create(
        user=user,
        student_subject=enrollment,
        title="Estudar Design Patterns",
    )
    folder = StudyFolder.objects.create(user=user, name="Padrões de Projeto", color="purple")

    # 1. Criar anotação vinculada a pasta, matéria e tarefa
    create_res = client.post(
        "/api/v1/study-notes",
        data={
            "folder": str(folder.id),
            "student_subject": str(enrollment.id),
            "task": str(task.id),
            "title": "Anotações sobre Singleton e Factory",
            "content": "# Resumo\nPrincipais conceitos e diferenças práticas.",
            "methodology": "feynman",
        },
        content_type="application/json",
    )
    assert create_res.status_code == 201
    note_data = create_res.json()
    note_id = note_data["id"]
    assert note_data["title"] == "Anotações sobre Singleton e Factory"
    assert note_data["folder"] == str(folder.id)
    assert note_data["folder_name"] == "Padrões de Projeto"
    assert note_data["student_subject"] == str(enrollment.id)
    assert note_data["task"] == str(task.id)
    assert note_data["methodology"] == "feynman"

    # Verificar se notes_count na pasta reflete a nova anotação
    folder_res = client.get(f"/api/v1/study-folders/{folder.id}")
    assert folder_res.json()["notes_count"] == 1

    # 2. Filtrar notas por pasta
    filter_folder_res = client.get(f"/api/v1/study-notes?folder={folder.id}")
    assert filter_folder_res.status_code == 200
    assert len(filter_folder_res.json()) == 1

    # Filtrar por tarefa
    filter_task_res = client.get(f"/api/v1/study-notes?task={task.id}")
    assert filter_task_res.status_code == 200
    assert len(filter_task_res.json()) == 1

    # Filtrar por busca de título
    filter_search_res = client.get("/api/v1/study-notes?search=Singleton")
    assert filter_search_res.status_code == 200
    assert len(filter_search_res.json()) == 1

    # 3. Atualizar conteúdo e metodologia da nota
    patch_res = client.patch(
        f"/api/v1/study-notes/{note_id}",
        data={
            "title": "Anotações sobre Creational Patterns",
            "content": "# Resumo Atualizado\nAdicionando Builder pattern.",
            "methodology": "spaced_repetition",
        },
        content_type="application/json",
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Anotações sobre Creational Patterns"
    assert patch_res.json()["methodology"] == "spaced_repetition"

    # 4. Excluir nota
    delete_res = client.delete(f"/api/v1/study-notes/{note_id}")
    assert delete_res.status_code == 204
    assert StudyNote.objects.filter(id=note_id).count() == 0


def test_user_isolation_for_folders_and_notes(client: Client, offering):
    user_a = User.objects.create_user(
        email="usuario.a@aluno.impacta.edu.br",
        full_name="Usuário A",
        course_offering=offering,
    )
    user_b = User.objects.create_user(
        email="usuario.b@aluno.impacta.edu.br",
        full_name="Usuário B",
        course_offering=offering,
    )

    enrollment_a = create_enrollment(user_a, offering)
    task_a = AcademicTask.objects.create(
        user=user_a,
        student_subject=enrollment_a,
        title="Tarefa de A",
    )
    folder_a = StudyFolder.objects.create(user=user_a, name="Pasta Privada A")
    note_a = StudyNote.objects.create(
        user=user_a,
        folder=folder_a,
        title="Nota Privada A",
        content="Segredo de A",
    )

    # Login como Usuário B
    client.force_login(user_b)

    # B não vê as pastas de A na listagem
    folders_res = client.get("/api/v1/study-folders")
    assert folders_res.status_code == 200
    assert len(folders_res.json()) == 0

    # B não consegue acessar a pasta de A diretamente
    folder_detail_res = client.get(f"/api/v1/study-folders/{folder_a.id}")
    assert folder_detail_res.status_code == 404

    # B não consegue atualizar a pasta de A
    folder_patch_res = client.patch(
        f"/api/v1/study-folders/{folder_a.id}",
        data={"name": "Tentativa Invasão"},
        content_type="application/json",
    )
    assert folder_patch_res.status_code == 404

    # B não consegue excluir a pasta de A
    folder_del_res = client.delete(f"/api/v1/study-folders/{folder_a.id}")
    assert folder_del_res.status_code == 404

    # B não vê as notas de A na listagem
    notes_res = client.get("/api/v1/study-notes")
    assert notes_res.status_code == 200
    assert len(notes_res.json()) == 0

    # B não consegue acessar a nota de A diretamente
    note_detail_res = client.get(f"/api/v1/study-notes/{note_a.id}")
    assert note_detail_res.status_code == 404

    # B não consegue vincular nova nota à pasta de A
    create_with_folder_a = client.post(
        "/api/v1/study-notes",
        data={
            "folder": str(folder_a.id),
            "title": "Tentativa B",
        },
        content_type="application/json",
    )
    assert create_with_folder_a.status_code == 400
    assert "não pertence" in str(create_with_folder_a.json())

    # B não consegue vincular nova nota à tarefa de A
    create_with_task_a = client.post(
        "/api/v1/study-notes",
        data={
            "task": str(task_a.id),
            "title": "Tentativa B com tarefa de A",
        },
        content_type="application/json",
    )
    assert create_with_task_a.status_code == 400
    assert "não pertence" in str(create_with_task_a.json())


def test_anonymous_access_denied(client: Client):
    assert client.get("/api/v1/study-folders").status_code == 401
    assert client.post("/api/v1/study-folders", data={"name": "Teste"}).status_code == 401
    assert client.get("/api/v1/study-notes").status_code == 401
    assert client.post("/api/v1/study-notes", data={"title": "Teste"}).status_code == 401
