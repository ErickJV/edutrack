from django.urls import path

from .views import (
    AcademicTaskDetailView,
    AcademicTaskListCreateView,
    AcademicTaskToggleCompleteView,
    CurriculumListView,
    DashboardSummaryView,
    StudentSubjectListCreateView,
)

urlpatterns = [
    path("curriculum", CurriculumListView.as_view(), name="curriculum-list"),
    path(
        "student-subjects",
        StudentSubjectListCreateView.as_view(),
        name="student-subject-list-create",
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
