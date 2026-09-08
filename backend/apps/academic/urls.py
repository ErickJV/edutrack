from django.urls import path

from .views import (
    AcademicTaskDetailView,
    AcademicTaskListCreateView,
    AcademicTaskToggleCompleteView,
    CurriculumListView,
    DashboardSummaryView,
    StudentSubjectListCreateView,
    StudentSubjectDetailView,
)

urlpatterns = [
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
