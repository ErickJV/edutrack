from django.urls import path

from .views import HealthView, ProfileExportView, ProfileView, SessionPreferenceView

urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
    path("profile", ProfileView.as_view(), name="profile"),
    path("profile/export", ProfileExportView.as_view(), name="profile-export"),
    path("session", SessionPreferenceView.as_view(), name="session-preference"),
]
