from typing import Any, cast
from uuid import UUID

from django.utils import timezone
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.accounts.models import User

from .models import AcademicTask, StudentSubject, Subject
from .permissions import IsAuthenticatedOr401
from .serializers import (
    AcademicTaskSerializer,
    AcademicTaskWriteSerializer,
    DashboardSummarySerializer,
    StudentSubjectSelectionSerializer,
    StudentSubjectSerializer,
    StudentSubjectUpdateSerializer,
    SubjectSerializer,
)


class CurriculumListView(generics.ListAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = SubjectSerializer
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        if not user.course_offering_id:
            raise PermissionDenied(
                "Complete seu perfil acadêmico antes de consultar a matriz curricular."
            )
        course_offering = user.course_offering
        if course_offering is None:
            raise PermissionDenied(
                "Complete seu perfil acadêmico antes de consultar a matriz curricular."
            )
        return (
            Subject.objects.select_related("course")
            .filter(course=course_offering.course, active=True)
            .order_by("semester", "name")
        )


class StudentSubjectListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        if not user.course_offering_id:
            raise PermissionDenied(
                "Complete seu perfil acadêmico antes de selecionar matérias ativas."
            )
        return (
            StudentSubject.objects.select_related("subject", "subject__course")
            .filter(user=user)
            .order_by("subject__semester", "subject__name")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return StudentSubjectSelectionSerializer
        return StudentSubjectSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = StudentSubjectSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = StudentSubjectSelectionSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        enrollments = serializer.save()
        output = StudentSubjectSerializer(enrollments, many=True)
        return Response(output.data, status=201)


class StudentSubjectDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticatedOr401,)

    def get_queryset(self):
        user = cast(User, self.request.user)
        return StudentSubject.objects.select_related("subject", "subject__course").filter(user=user)

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return StudentSubjectUpdateSerializer
        return StudentSubjectSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        output = StudentSubjectSerializer(instance)
        return Response(output.data)
class AcademicTaskMixin:
    def get_base_queryset(self: Any):
        user = cast(User, self.request.user)
        if not user.course_offering_id:
            raise PermissionDenied(
                "Complete seu perfil acadêmico antes de acessar tarefas acadêmicas."
            )
        queryset = AcademicTask.objects.select_related(
            "student_subject", "student_subject__subject", "user"
        ).filter(user=user)
        student_subject_id = self.request.query_params.get("student_subject")
        if student_subject_id:
            queryset = queryset.filter(student_subject_id=UUID(student_subject_id))
        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)
        return queryset.order_by("due_date", "created_at")

    def get_object(self: Any):
        return self.get_base_queryset().get(pk=self.kwargs["pk"])


class AcademicTaskListCreateView(AcademicTaskMixin, generics.ListCreateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    pagination_class = None

    def get_queryset(self):
        return self.get_base_queryset()

    def get_serializer_class(self):
        return (
            AcademicTaskSerializer if self.request.method == "GET" else AcademicTaskWriteSerializer
        )

    def list(self, request, *args, **kwargs):
        serializer = AcademicTaskSerializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = AcademicTaskWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(AcademicTaskSerializer(task).data, status=201)


class AcademicTaskDetailView(AcademicTaskMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    pagination_class = None

    def get_queryset(self):
        return self.get_base_queryset()

    def get_serializer_class(self):
        return (
            AcademicTaskSerializer if self.request.method == "GET" else AcademicTaskWriteSerializer
        )

    def retrieve(self, request, *args, **kwargs):
        return Response(AcademicTaskSerializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        serializer = AcademicTaskWriteSerializer(
            task,
            data=request.data,
            context={"request": request},
            partial=self.request.method == "PATCH",
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(AcademicTaskSerializer(task).data)


class AcademicTaskToggleCompleteView(AcademicTaskMixin, generics.GenericAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    pagination_class = None
    serializer_class = AcademicTaskSerializer

    def post(self, request, *args, **kwargs):
        task = self.get_object()
        if task.status == AcademicTask.Status.COMPLETED:
            task.status = AcademicTask.Status.PENDING
            task.completed_at = None
        else:
            task.status = AcademicTask.Status.COMPLETED
            task.completed_at = timezone.now()
        task.save(update_fields=("status", "completed_at", "updated_at"))
        return Response(AcademicTaskSerializer(task).data)


class DashboardSummaryView(AcademicTaskMixin, generics.GenericAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    pagination_class = None
    serializer_class = DashboardSummarySerializer

    def get(self, request, *args, **kwargs):
        user = cast(User, request.user)
        student_subjects = list(
            StudentSubject.objects.select_related("subject")
            .filter(user=user)
            .order_by("subject__semester", "subject__name")
        )
        tasks = list(self.get_base_queryset())
        pending_tasks = [task for task in tasks if task.status != AcademicTask.Status.COMPLETED]
        completed_tasks = [task for task in tasks if task.status == AcademicTask.Status.COMPLETED]
        total_planned = sum(task.estimated_minutes for task in tasks)
        total_actual = sum(task.actual_minutes for task in tasks)
        weighted_progress = 0
        if student_subjects:
            total_hours = sum(subject.effective_workload_hours for subject in student_subjects)
            if total_hours:
                weighted_progress = round(
                    sum(
                        subject.progress_percent * subject.effective_workload_hours
                        for subject in student_subjects
                    )
                    / total_hours
                )
        upcoming_tasks = [task for task in tasks if task.due_date is not None][:5]
        serializer = DashboardSummarySerializer(
            {
                "subjects_count": len(student_subjects),
                "pending_tasks_count": len(pending_tasks),
                "completed_tasks_count": len(completed_tasks),
                "planned_minutes_total": total_planned,
                "actual_minutes_total": total_actual,
                "weighted_progress_percent": weighted_progress,
                "upcoming_tasks": upcoming_tasks,
            }
        )
        return Response(serializer.data)
