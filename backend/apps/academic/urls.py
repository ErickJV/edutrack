from django.urls import path

from .views import (
    AcademicTaskDetailView,
    AcademicTaskListCreateView,
    AcademicTaskToggleCompleteView,
    CurriculumListView,
    DashboardSummaryView,
    ProfessorDetailView,
    ProfessorListCreateView,
    StudentSubjectListCreateView,
    StudentSubjectDetailView,
)

urlpatterns = [
    path("professors", ProfessorListCreateView.as_view(), name="professor-list-create"),
    path("professors/<uuid:pk>", ProfessorDetailView.as_view(), name="professor-detail"),
    path("curriculum", CurriculumListView.as_view(), name="curriculum-list"),
    path(
        "student-subjects",
        StudentSubjectListCreateView.as_view(),
        name="student-subject-list-create",
    ),
    path(
        "student-subjects/<uuid:pk>",
        StudentSubjectDetailView.as_view(),
        name="student-subject-detail",
    ),
    path("tasks", AcademicTaskListCreateView.as_view(), name="academic-task-list-create"),
    path("tasks/<uuid:pk>", AcademicTaskDetailView.as_view(), name="academic-task-detail"),
    path(
        "tasks/<uuid:pk>/toggle-complete",
        AcademicTaskToggleCompleteView.as_view(),
        name="academic-task-toggle-complete",
    ),
    path("dashboard/summary", DashboardSummaryView.as_view(), name="dashboard-summary"),
]
