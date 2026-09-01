from django.urls import path

from .views import CourseOfferingListView

urlpatterns = [
    path("course-offerings", CourseOfferingListView.as_view(), name="course-offering-list"),
]
