from rest_framework import permissions
from rest_framework.exceptions import AuthenticationFailed


class IsAuthenticatedOr401(permissions.BasePermission):
    message = "Authentication credentials were not provided."

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return True
        raise AuthenticationFailed(self.message)
