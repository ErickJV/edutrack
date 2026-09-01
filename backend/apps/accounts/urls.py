from django.urls import path

from .views import HealthView, ProfileView, SessionPreferenceView

urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
    path("profile", ProfileView.as_view(), name="profile"),
    path("session", SessionPreferenceView.as_view(), name="session-preference"),
]
