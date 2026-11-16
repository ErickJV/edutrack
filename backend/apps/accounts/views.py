from django.contrib.auth import logout
from django.core.files.storage import default_storage
from django.db import connection, transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academic.models import StudyDocument

from .export import build_user_export
from .serializers import (
    HealthSerializer,
    ProfileCompletionSerializer,
    ProfileDeleteSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
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

    @extend_schema(request=ProfileUpdateSerializer, responses=ProfileSerializer)
    def patch(self, request):
        serializer = ProfileUpdateSerializer(instance=request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(ProfileSerializer(user).data)

    @extend_schema(request=ProfileDeleteSerializer, responses={204: None})
    def delete(self, request):
        serializer = ProfileDeleteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        stored_files = [
            str(name)
            for name in StudyDocument.objects.filter(user=request.user)
            .exclude(file="")
            .values_list("file", flat=True)
        ]
        with transaction.atomic():
            request.user.delete()
        for name in stored_files:
            default_storage.delete(name)
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileExportView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        response = Response(build_user_export(request.user))
        filename = f'impatrack-dados-{timezone.now():%Y-%m-%d}.json'
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


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
