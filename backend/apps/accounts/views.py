from django.db import connection
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    HealthSerializer,
    ProfileCompletionSerializer,
    ProfileSerializer,
    SessionPreferenceSerializer,
)


class ProfileView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ProfileCompletionSerializer

    @extend_schema(responses=ProfileSerializer)
    def get(self, request):
        return Response(ProfileSerializer(request.user).data)

    @extend_schema(request=ProfileCompletionSerializer, responses=ProfileSerializer)
    def put(self, request):
        serializer = ProfileCompletionSerializer(instance=request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(ProfileSerializer(user).data)


class HealthView(APIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = HealthSerializer

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class SessionPreferenceView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = SessionPreferenceSerializer

    def put(self, request):
        serializer = SessionPreferenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data["remember"]:
            request.session.set_expiry(60 * 60 * 24 * 14)
        else:
            request.session.set_expiry(0)
        request.session.modified = True
        return Response({"remember": serializer.validated_data["remember"]})
