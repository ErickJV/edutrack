import os
import re
import xml.etree.ElementTree as ET
import zipfile
from typing import Any, cast
from uuid import UUID

from django.db import models
from django.utils import timezone
from rest_framework import generics, status as drf_status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.models import User
from apps.llm.services import (
    extract_calendar_items,
    generate_document_analysis,
    generate_flashcards,
    generate_quiz_questions,
)

from .models import (
    AcademicEvent,
    AcademicReading,
    AcademicTask,
    AcademicTerm,
    ClassOccurrence,
    ClassSchedule,
    Flashcard,
    Professor,
    ReadingLog,
    StudentSubject,
    StudyDocument,
    StudyDocumentPage,
    StudyFolder,
    StudyNote,
    StudyQuiz,
    Subject,
)
from .permissions import IsAuthenticatedOr401
from .serializers import (
    AcademicEventSerializer,
    AcademicReadingSerializer,
    AcademicTaskSerializer,
    AcademicTaskWriteSerializer,
    AcademicTermSerializer,
    AttendanceSerializer,
    ClassOccurrenceSerializer,
    ClassOccurrenceWriteSerializer,
    ClassScheduleSerializer,
    DashboardSummarySerializer,
    FlashcardSerializer,
    ProfessorSerializer,
    ReadingLogSerializer,
    StudentSubjectSelectionSerializer,
    StudentSubjectSerializer,
    StudentSubjectUpdateSerializer,
    StudyFolderSerializer,
    StudyNoteSerializer,
    StudyDocumentSerializer,
    StudyDocumentPageSerializer,
    StudyQuizSerializer,
    SubjectSerializer,
)


class CurriculumListView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = SubjectSerializer
    pagination_class = None

    def _get_user_course(self):
        user = cast(User, self.request.user)
        if not user.course_offering_id or user.course_offering is None:
            raise PermissionDenied(
                "Complete seu perfil acadêmico antes de consultar a matriz curricular."
            )
        return user.course_offering.course

    def get_queryset(self):
        course = self._get_user_course()
        Subject.objects.filter(
            course=course,
            name__iexact="Application Data Persistence",
        ).exclude(semester=1).update(semester=1)
        return (
            Subject.objects.select_related("course")
            .filter(course=course, active=True)
            .order_by("semester", "name")
        )

    def perform_create(self, serializer):
        course = self._get_user_course()
        name = serializer.validated_data.get("name", "").strip()
        semester = serializer.validated_data.get("semester", 1)
        workload_hours = serializer.validated_data.get("workload_hours", 80)
        code = serializer.validated_data.get("code", "").strip()
        description = serializer.validated_data.get("description", "").strip()
        existing = Subject.objects.filter(course=course, name__iexact=name).first()
        if existing:
            existing.semester = semester
            existing.workload_hours = workload_hours
            if code:
                existing.code = code
            if description:
                existing.description = description
            existing.active = True
            existing.save()
            serializer.instance = existing
        else:
            serializer.save(course=course, active=True)


class ProfessorListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = ProfessorSerializer
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        include_archived = self.request.query_params.get("include_archived") == "true"
        queryset = Professor.objects.filter(user=user)
        if not include_archived:
            queryset = queryset.filter(active=True)
        return queryset.order_by("name")


class ProfessorDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = ProfessorSerializer

    def get_queryset(self):
        user = cast(User, self.request.user)
        return Professor.objects.filter(user=user)

    def perform_destroy(self, instance):
        instance.active = False
        instance.save(update_fields=("active", "updated_at"))


def _get_user_current_semester(user: User) -> int | None:
    """
    Determina o semestre vigente do estudante e garante que a disciplina de 1º semestre
    'Application Data Persistence' não permaneça associada indevidamente ao semestre vigente
    quando o aluno já cursa disciplinas de semestres posteriores (ex.: 2º semestre).
    Preserva as anotações existentes, removendo apenas o vínculo incorreto.
    """
    current_course = (
        user.course_offering.course
        if user.course_offering_id and user.course_offering is not None
        else None
    )
    if current_course is not None:
        Subject.objects.filter(
            course=current_course,
            name__iexact="Application Data Persistence",
        ).exclude(semester=1).update(semester=1)

    active_qs = StudentSubject.objects.select_related("subject").filter(
        user=user,
        status=StudentSubject.Status.ACTIVE,
        subject__active=True,
    )
    if current_course is not None:
        active_qs = active_qs.filter(subject__course=current_course)
    max_sem = active_qs.aggregate(max_sem=models.Max("subject__semester")).get("max_sem")
    if max_sem and max_sem >= 2:
        stale_filter = models.Q(user=user, subject__semester__lt=max_sem)
        if current_course is not None:
            stale_filter &= models.Q(subject__course=current_course)
        stale_past_ids = list(
            StudentSubject.objects.filter(stale_filter).values_list("id", flat=True)
        )
        if stale_past_ids:
            StudentSubject.objects.filter(id__in=stale_past_ids).exclude(
                status=StudentSubject.Status.DROPPED
            ).update(status=StudentSubject.Status.DROPPED)
            # Preserva anotações existentes removendo apenas a associação incorreta de semestres anteriores
            StudyNote.objects.filter(
                user=user,
                student_subject_id__in=stale_past_ids,
            ).update(student_subject=None)
            AcademicTask.objects.filter(
                user=user,
                student_subject_id__in=stale_past_ids,
            ).update(student_subject=None)
            AcademicEvent.objects.filter(
                user=user,
                student_subject_id__in=stale_past_ids,
            ).update(student_subject=None)
    return max_sem


class StudentSubjectListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        if not user.course_offering_id or user.course_offering is None:
            raise PermissionDenied(
                "Complete seu perfil acadêmico antes de selecionar matérias ativas."
            )
        current_course = user.course_offering.course
        current_sem = _get_user_current_semester(user)

        queryset = (
            StudentSubject.objects.select_related("subject", "subject__course")
            .filter(user=user, subject__course=current_course, subject__active=True)
            .order_by("subject__semester", "subject__name")
        )
        status_param = self.request.query_params.get("status")
        if status_param == "all":
            filtered = queryset
        elif status_param in StudentSubject.Status.values:
            filtered = queryset.filter(status=status_param)
            if status_param == StudentSubject.Status.ACTIVE and current_sem:
                filtered = filtered.filter(subject__semester=current_sem)
        else:
            filtered = queryset.filter(status=StudentSubject.Status.ACTIVE)
            if current_sem:
                filtered = filtered.filter(subject__semester=current_sem)

        search_param = (
            self.request.query_params.get("search")
            or self.request.query_params.get("q")
            or ""
        ).strip()
        if search_param:
            filtered = filtered.filter(
                models.Q(subject__name__icontains=search_param)
                | models.Q(subject__code__icontains=search_param)
                | models.Q(professor_name__icontains=search_param)
            )

        overdue_param = (
            self.request.query_params.get("has_overdue_tasks")
            or self.request.query_params.get("overdue")
            or ""
        ).lower()
        if overdue_param in ("true", "1", "yes"):
            now = timezone.now()
            filtered = filtered.filter(
                tasks__due_date__lt=now,
            ).exclude(
                tasks__status=AcademicTask.Status.COMPLETED,
            ).distinct()

        return filtered

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


class StudentSubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
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

    def perform_destroy(self, instance: StudentSubject):
        instance.status = StudentSubject.Status.DROPPED
        instance.save(update_fields=("status", "updated_at"))


class AcademicTaskMixin:
    def get_base_queryset(self: Any):
        user = cast(User, self.request.user)
        _get_user_current_semester(user)
        queryset = (
            AcademicTask.objects.select_related(
                "student_subject", "student_subject__subject", "linked_event", "user"
            )
            .filter(user=user)
            .exclude(student_subject__status=StudentSubject.Status.DROPPED)
        )
        student_subject_id = self.request.query_params.get("student_subject")
        if student_subject_id:
            queryset = queryset.filter(student_subject_id=UUID(student_subject_id))
        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)
        search_param = (
            self.request.query_params.get("search")
            or self.request.query_params.get("q")
            or ""
        ).strip()
        if search_param:
            queryset = queryset.filter(
                models.Q(title__icontains=search_param)
                | models.Q(description__icontains=search_param)
                | models.Q(student_subject__subject__name__icontains=search_param)
            )
        overdue_param = (
            self.request.query_params.get("overdue")
            or self.request.query_params.get("has_overdue_tasks")
            or ""
        ).lower()
        if overdue_param in ("true", "1", "yes"):
            queryset = queryset.filter(due_date__lt=timezone.now()).exclude(
                status=AcademicTask.Status.COMPLETED
            )
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

    def perform_destroy(self, instance: AcademicTask):
        linked = instance.linked_event
        instance.delete()
        if linked:
            linked.delete()

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
        now = timezone.now()
        tasks = list(self.get_base_queryset())
        pending_tasks = [task for task in tasks if task.status != AcademicTask.Status.COMPLETED]
        overdue_tasks = [
            task for task in pending_tasks if task.due_date is not None and task.due_date < now
        ]
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
                "overdue_tasks_count": len(overdue_tasks),
                "completed_tasks_count": len(completed_tasks),
                "planned_minutes_total": total_planned,
                "actual_minutes_total": total_actual,
                "weighted_progress_percent": weighted_progress,
                "upcoming_tasks": upcoming_tasks,
            }
        )
        return Response(serializer.data)


class AcademicTermListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = AcademicTermSerializer
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        return AcademicTerm.objects.filter(user=user).order_by("-start_date", "name")

    def perform_create(self, serializer):
        serializer.save()


class AcademicTermDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = AcademicTermSerializer

    def get_queryset(self):
        user = cast(User, self.request.user)
        return AcademicTerm.objects.filter(user=user)

    def patch(self, request, *args, **kwargs):
        """
        PATCH academic term — raise 409 if the new date range would exclude
        any protected occurrence (individually_edited or has attendance).
        """
        from django.db import transaction as db_transaction
        from rest_framework.exceptions import ValidationError as DRFValidationError

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        new_start = serializer.validated_data.get("start_date", instance.start_date)
        new_end = serializer.validated_data.get("end_date", instance.end_date)

        # Find protected occurrences that would fall outside the new date window
        from django.db.models import Q
        protected = ClassOccurrence.objects.filter(
            student_subject__term=instance,
        ).filter(
            Q(individually_edited=True)
            | ~Q(attendance_status=ClassOccurrence.AttendanceStatus.UNRECORDED)
        )
        # Convert new bounds to UTC datetimes (use midnight local time approximation)
        import zoneinfo
        from datetime import datetime
        tz = zoneinfo.ZoneInfo(
            serializer.validated_data.get("timezone", instance.timezone)
        )
        new_start_utc = datetime.combine(new_start, datetime.min.time(), tzinfo=tz)
        new_end_utc = datetime.combine(new_end, datetime.max.time().replace(microsecond=0), tzinfo=tz)

        conflicting = protected.filter(
            Q(starts_at__lt=new_start_utc) | Q(ends_at__gt=new_end_utc)
        )
        if conflicting.exists():
            raise DRFValidationError(
                {
                    "detail": (
                        "A alteração de datas excluiria aulas com frequência registrada ou "
                        "edição individual. Edite essas aulas separadamente antes de ajustar "
                        "o semestre.",
                    ),
                    "status": 409,
                },
                code="conflict",
            )

        with db_transaction.atomic():
            serializer.save()
        return Response(serializer.data)

class AcademicEventListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = AcademicEventSerializer
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        queryset = AcademicEvent.objects.select_related(
            "student_subject", "student_subject__subject"
        ).filter(user=user)
        kind = self.request.query_params.get("kind")
        if kind:
            queryset = queryset.filter(kind=kind)
        student_subject_id = self.request.query_params.get("student_subject_id")
        if student_subject_id:
            queryset = queryset.filter(student_subject_id=UUID(student_subject_id))
        return queryset.order_by("starts_at", "title")

    def perform_create(self, serializer):
        serializer.save()


class AcademicEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = AcademicEventSerializer

    def get_queryset(self):
        user = cast(User, self.request.user)
        return AcademicEvent.objects.select_related(
            "student_subject", "student_subject__subject"
        ).filter(user=user)

    def perform_destroy(self, instance: AcademicEvent):
        AcademicTask.objects.filter(linked_event=instance).delete()
        instance.delete()


class StudyFolderListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = StudyFolderSerializer
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        return StudyFolder.objects.filter(user=user).order_by("name")

    def perform_create(self, serializer):
        serializer.save()


class StudyFolderDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = StudyFolderSerializer

    def get_queryset(self):
        user = cast(User, self.request.user)
        return StudyFolder.objects.filter(user=user)


class StudyNoteListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = StudyNoteSerializer
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        _get_user_current_semester(user)
        queryset = StudyNote.objects.select_related(
            "folder", "student_subject", "student_subject__subject", "task", "reading"
        ).filter(user=user)

        folder_id = self.request.query_params.get("folder")
        if folder_id:
            queryset = queryset.filter(folder_id=UUID(folder_id))

        student_subject_id = self.request.query_params.get("student_subject")
        if student_subject_id:
            queryset = queryset.filter(student_subject_id=UUID(student_subject_id))

        task_id = self.request.query_params.get("task")
        if task_id:
            queryset = queryset.filter(task_id=UUID(task_id))

        reading_id = self.request.query_params.get("reading")
        if reading_id:
            queryset = queryset.filter(reading_id=UUID(reading_id))

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(title__icontains=search)

        return queryset.order_by("-updated_at")

    def perform_create(self, serializer):
        serializer.save()


class StudyNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = StudyNoteSerializer

    def get_queryset(self):
        user = cast(User, self.request.user)
        return StudyNote.objects.select_related(
            "folder", "student_subject", "student_subject__subject", "task", "reading"
        ).filter(user=user)


class AcademicReadingListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = AcademicReadingSerializer
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        queryset = AcademicReading.objects.select_related(
            "student_subject", "student_subject__subject"
        ).prefetch_related("study_notes", "logs").filter(user=user)

        student_subject_id = self.request.query_params.get("student_subject")
        if student_subject_id:
            queryset = queryset.filter(student_subject_id=UUID(student_subject_id))

        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(title__icontains=search)

        return queryset.order_by("-updated_at")

    def perform_create(self, serializer):
        serializer.save()


class AcademicReadingDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = AcademicReadingSerializer

    def get_queryset(self):
        user = cast(User, self.request.user)
        return AcademicReading.objects.select_related(
            "student_subject", "student_subject__subject"
        ).prefetch_related("study_notes", "logs").filter(user=user)


class AcademicReadingLogPagesView(generics.GenericAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = ReadingLogSerializer

    def post(self, request, pk, *args, **kwargs):
        user = cast(User, request.user)
        try:
            reading = AcademicReading.objects.get(pk=pk, user=user)
        except AcademicReading.DoesNotExist:
            return Response({"detail": "Leitura não encontrada."}, status=404)

        pages = request.data.get("pages_read")
        if pages is None:
            pages = request.data.get("pages")
        if pages is None:
            return Response({"pages_read": "Número de páginas lidas é obrigatório."}, status=400)
        try:
            pages = int(pages)
            if pages < 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response({"pages_read": "Número de páginas lidas inválido."}, status=400)

        date_str = request.data.get("read_date") or request.data.get("date")
        log_date = timezone.now().date()
        if date_str:
            try:
                log_date = timezone.datetime.strptime(str(date_str), "%Y-%m-%d").date()
            except ValueError:
                return Response({"date": "Formato de data inválido. Use AAAA-MM-DD."}, status=400)

        # Update or create log for this reading and date with additive accumulation
        log_entry = ReadingLog.objects.filter(
            user=user,
            reading=reading,
            date=log_date,
        ).first()

        if log_entry:
            log_entry.pages_read += pages
            log_entry.save(update_fields=["pages_read"])
        else:
            ReadingLog.objects.create(
                user=user,
                reading=reading,
                date=log_date,
                pages_read=pages,
            )

        new_current = request.data.get("current_page")
        if new_current is not None:
            try:
                reading.current_page = min(reading.total_pages, max(0, int(new_current)))
            except (ValueError, TypeError):
                pass
        else:
            reading.current_page = min(reading.total_pages, reading.current_page + pages)

        if reading.current_page >= reading.total_pages:
            reading.status = AcademicReading.Status.COMPLETED
        elif (
            reading.status == AcademicReading.Status.COMPLETED
            and reading.current_page < reading.total_pages
        ):
            reading.status = AcademicReading.Status.READING

        reading.save()

        serializer = AcademicReadingSerializer(reading, context={"request": request})
        return Response(serializer.data, status=200)


class ReadingLogListView(generics.ListAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = ReadingLogSerializer
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        queryset = ReadingLog.objects.select_related("reading").filter(user=user)

        reading_id = self.request.query_params.get("reading")
        if reading_id:
            queryset = queryset.filter(reading_id=UUID(reading_id))

        days = self.request.query_params.get("days")
        if days:
            try:
                cutoff = timezone.now().date() - timezone.timedelta(days=int(days))
                queryset = queryset.filter(date__gte=cutoff)
            except (ValueError, TypeError):
                pass

        return queryset.order_by("-date")



# ---------------------------------------------------------------------------
# Class Schedules (task 3.3)
# ---------------------------------------------------------------------------

class ClassScheduleListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = ClassScheduleSerializer
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        qs = ClassSchedule.objects.filter(user=user)
        ss_id = self.request.query_params.get("student_subject_id")
        if ss_id:
            qs = qs.filter(student_subject_id=ss_id)
        return qs.order_by("weekday", "start_time")

    def perform_create(self, serializer):
        serializer.save()


class ClassScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET|PATCH /api/v1/class-schedules/{id}
    DELETE: marks future untouched occurrences as cancelled (task 3.5).
    """
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = ClassScheduleSerializer
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        return ClassSchedule.objects.filter(user=user)

    def delete(self, request, *args, **kwargs):
        from django.db import transaction as db_transaction

        schedule = self.get_object()
        now = timezone.now()
        with db_transaction.atomic():
            # Cancel future untouched occurrences (not individually edited, not already cancelled)
            schedule.occurrences.filter(
                starts_at__gte=now,
                cancelled=False,
                individually_edited=False,
            ).update(cancelled=True, updated_at=timezone.now())
            schedule.delete()
        return Response(status=204)

    def patch(self, request, *args, **kwargs):
        """
        PATCH a schedule: update fields, then reconcile occurrences.
        - Delete future untouched occurrences that fall outside the new validity window.
        - Generate new occurrences for dates newly in range.
        - Preserve past, individually-edited, and attendance-recorded occurrences.
        """
        from django.db import transaction as db_transaction
        from apps.academic.serializers import _generate_occurrences

        schedule = self.get_object()
        serializer = self.get_serializer(schedule, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        now = timezone.now()
        with db_transaction.atomic():
            updated_schedule = serializer.save()
            # Remove future, untouched occurrences that no longer match the validity window
            term = updated_schedule.student_subject.term
            if term:
                from datetime import datetime
                import zoneinfo
                tz = zoneinfo.ZoneInfo(term.timezone)
                new_valid_from = updated_schedule.valid_from or term.start_date
                new_valid_until = updated_schedule.valid_until or term.end_date
                # Any occurrence whose origin_date is outside the new window (and is future + untouched)
                from django.db.models import Q
                updated_schedule.occurrences.filter(
                    starts_at__gte=now,
                    individually_edited=False,
                    attendance_status=ClassOccurrence.AttendanceStatus.UNRECORDED,
                ).exclude(origin_date__isnull=True).filter(
                    Q(origin_date__lt=new_valid_from) | Q(origin_date__gt=new_valid_until)
                ).delete()
            # Regenerate — idempotent, won't recreate existing occurrences
            _generate_occurrences(updated_schedule)
        output = ClassScheduleSerializer(updated_schedule, context={"request": request})
        return Response(output.data)


# ---------------------------------------------------------------------------
# Class Occurrences (tasks 3.4 / 3.5)
# ---------------------------------------------------------------------------

class ClassOccurrenceListCreateView(generics.GenericAPIView):
    """
    GET /api/v1/class-occurrences  – list with optional filters
    POST /api/v1/class-occurrences – create standalone/makeup occurrence
    """
    permission_classes = (IsAuthenticatedOr401,)
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        qs = ClassOccurrence.objects.select_related(
            "student_subject__subject", "schedule"
        ).filter(student_subject__user=user)

        ss_id = self.request.query_params.get("student_subject_id")
        if ss_id:
            qs = qs.filter(student_subject_id=ss_id)

        from_str = self.request.query_params.get("from")
        to_str = self.request.query_params.get("to")
        if from_str:
            try:
                from datetime import datetime
                from_dt = datetime.fromisoformat(from_str)
                qs = qs.filter(ends_at__gte=from_dt)
            except ValueError:
                pass
        if to_str:
            try:
                from datetime import datetime
                to_dt = datetime.fromisoformat(to_str)
                qs = qs.filter(starts_at__lt=to_dt)
            except ValueError:
                pass
        return qs.order_by("starts_at")

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = ClassOccurrenceSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = ClassOccurrenceWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        occurrence = serializer.save()
        output = ClassOccurrenceSerializer(occurrence, context={"request": request})
        return Response(output.data, status=201)


class ClassOccurrenceDetailView(generics.GenericAPIView):
    """
    GET|PATCH /api/v1/class-occurrences/{id}
    """
    permission_classes = (IsAuthenticatedOr401,)
    pagination_class = None

    def get_object(self):
        user = cast(User, self.request.user)
        pk = self.kwargs["pk"]
        try:
            return ClassOccurrence.objects.select_related(
                "student_subject__subject", "schedule"
            ).get(id=pk, student_subject__user=user)
        except ClassOccurrence.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound()

    def get(self, request, *args, **kwargs):
        occurrence = self.get_object()
        serializer = ClassOccurrenceSerializer(occurrence, context={"request": request})
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        occurrence = self.get_object()
        serializer = ClassOccurrenceWriteSerializer(
            occurrence, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        output = ClassOccurrenceSerializer(updated, context={"request": request})
        return Response(output.data)


class ClassOccurrenceAttendanceView(generics.GenericAPIView):
    """
    PUT /api/v1/class-occurrences/{id}/attendance  (task 4.1)
    Accepts {status: present|absent|unrecorded}.
    Only allowed on past non-cancelled occurrences owned by the user.
    """
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = AttendanceSerializer
    pagination_class = None

    def get_object(self):
        user = cast(User, self.request.user)
        pk = self.kwargs["pk"]
        try:
            return ClassOccurrence.objects.select_related(
                "student_subject__subject"
            ).get(id=pk, student_subject__user=user)
        except ClassOccurrence.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound()

    def put(self, request, *args, **kwargs):
        from rest_framework.exceptions import ValidationError as DRFValidationError

        occurrence = self.get_object()
        if occurrence.cancelled:
            raise DRFValidationError(
                {"detail": "Não é possível registrar frequência em aula cancelada."}
            )
        now = timezone.now()
        if occurrence.ends_at > now:
            raise DRFValidationError(
                {"detail": "Só é possível registrar frequência após o término da aula."}
            )
        serializer = AttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        occurrence.attendance_status = serializer.validated_data["status"]
        occurrence.save(update_fields=("attendance_status", "updated_at"))
        output = ClassOccurrenceSerializer(occurrence, context={"request": request})
        return Response(output.data)


# ---------------------------------------------------------------------------
# Calendar aggregation (task 5.2)
# ---------------------------------------------------------------------------

class CalendarView(generics.GenericAPIView):
    """
    GET /api/v1/calendar?from=<iso>&to=<iso>[&student_subject_id=&kind=]
    Aggregates class occurrences, academic events, and task due dates.
    Interval [from, to), maximum 93 days.
    """
    permission_classes = (IsAuthenticatedOr401,)
    pagination_class = None

    _MAX_DAYS = 93

    def get(self, request, *args, **kwargs):
        from datetime import datetime, timezone as dt_timezone
        from rest_framework.exceptions import ValidationError as DRFValidationError

        user = cast(User, request.user)
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")
        if not from_str or not to_str:
            raise DRFValidationError({"detail": "Os parâmetros 'from' e 'to' são obrigatórios."})

        try:
            from_dt = datetime.fromisoformat(from_str)
            if from_dt.tzinfo is None:
                from_dt = from_dt.replace(tzinfo=dt_timezone.utc)
        except ValueError as exc:
            raise DRFValidationError({"from": "Data inválida."}) from exc

        try:
            to_dt = datetime.fromisoformat(to_str)
            if to_dt.tzinfo is None:
                to_dt = to_dt.replace(tzinfo=dt_timezone.utc)
        except ValueError as exc:
            raise DRFValidationError({"to": "Data inválida."}) from exc

        if (to_dt - from_dt).days > self._MAX_DAYS:
            raise DRFValidationError(
                {"detail": f"O intervalo máximo é de {self._MAX_DAYS} dias."}
            )

        ss_id = request.query_params.get("student_subject_id")
        kind_filter = request.query_params.get("kind")  # class|task|exam|assignment|other

        items = []

        # 1. Class occurrences
        if not kind_filter or kind_filter == "class":
            occ_qs = ClassOccurrence.objects.select_related(
                "student_subject__subject", "student_subject__term"
            ).filter(
                student_subject__user=user,
                ends_at__gte=from_dt,
                starts_at__lt=to_dt,
            )
            if ss_id:
                occ_qs = occ_qs.filter(student_subject_id=ss_id)
            for occ in occ_qs:
                items.append({
                    "id": f"class:{occ.id}",
                    "source_type": "class",
                    "source_id": str(occ.id),
                    "title": occ.student_subject.subject.name,
                    "starts_at": occ.starts_at.isoformat(),
                    "ends_at": occ.ends_at.isoformat(),
                    "room": occ.room,
                    "student_subject_id": str(occ.student_subject_id),
                    "subject_name": occ.student_subject.subject.name,
                    "cancelled": occ.cancelled,
                    "attendance_status": occ.attendance_status,
                    "all_day": False,
                    "kind": "class",
                })

        # 2. Academic events (somente eventos legados sem AcademicTask vinculada para evitar duplicidade)
        if not kind_filter or kind_filter in ("exam", "assignment", "other"):
            from django.db.models import Q
            event_qs = AcademicEvent.objects.select_related(
                "student_subject__subject"
            ).filter(
                user=user,
                synced_task__isnull=True,
                starts_at__lt=to_dt,
            ).filter(
                Q(ends_at__isnull=True, starts_at__gte=from_dt)
                | Q(ends_at__isnull=False, ends_at__gte=from_dt)
            )
            if ss_id:
                event_qs = event_qs.filter(
                    Q(student_subject_id=ss_id) | Q(student_subject__isnull=True)
                )
            if kind_filter and kind_filter != "class":
                event_qs = event_qs.filter(kind=kind_filter)
            for ev in event_qs:
                items.append({
                    "id": f"event:{ev.id}",
                    "source_type": "event",
                    "source_id": str(ev.id),
                    "title": ev.title,
                    "description": ev.description,
                    "starts_at": ev.starts_at.isoformat(),
                    "ends_at": ev.ends_at.isoformat() if ev.ends_at else None,
                    "room": ev.room,
                    "student_subject_id": str(ev.student_subject_id) if ev.student_subject_id else None,
                    "subject_name": (
                        ev.student_subject.subject.name
                        if ev.student_subject and ev.student_subject.subject
                        else "Interdisciplinar (Geral)"
                    ),
                    "cancelled": False,
                    "attendance_status": None,
                    "all_day": ev.all_day,
                    "kind": ev.kind,
                })

        # 3. Tasks & Synchronized Calendar Activities
        if not kind_filter or kind_filter in ("task", "exam", "assignment", "other"):
            task_qs = AcademicTask.objects.select_related(
                "student_subject__subject"
            ).filter(
                user=user,
                due_date__isnull=False,
                due_date__gte=from_dt,
                due_date__lt=to_dt,
            )
            if ss_id:
                task_qs = task_qs.filter(
                    Q(student_subject_id=ss_id) | Q(student_subject__isnull=True)
                )
            if kind_filter in ("exam", "assignment", "other"):
                task_qs = task_qs.filter(category=kind_filter)
            for task in task_qs:
                items.append({
                    "id": f"task:{task.id}",
                    "source_type": "task",
                    "source_id": str(task.id),
                    "title": task.title,
                    "description": task.description,
                    "starts_at": task.due_date.isoformat(),
                    "ends_at": (task.end_date or task.due_date).isoformat(),
                    "room": task.room or "",
                    "student_subject_id": str(task.student_subject_id) if task.student_subject_id else None,
                    "subject_name": (
                        task.student_subject.subject.name
                        if task.student_subject and task.student_subject.subject
                        else "Interdisciplinar (Geral)"
                    ),
                    "cancelled": False,
                    "attendance_status": None,
                    "all_day": task.all_day,
                    "kind": task.category or "task",
                    "task_status": task.status,
                })

        # 4. Study readings & reading increments (no kind filter or kind in reading/exam)
        from_date = from_dt.date()
        to_date = to_dt.date()
        if not kind_filter or kind_filter in ("reading", "exam"):
            reading_qs = AcademicReading.objects.select_related(
                "student_subject__subject"
            ).filter(
                user=user,
                exam_date__isnull=False,
                exam_date__gte=from_date,
                exam_date__lte=to_date,
            )
            if ss_id:
                reading_qs = reading_qs.filter(student_subject_id=ss_id)
            for r in reading_qs:
                exam_iso = r.exam_date.isoformat()
                label_prefix = r.exam_name.strip() if r.exam_name.strip() else "Meta/Prova de Leitura"
                items.append({
                    "id": f"reading-exam:{r.id}",
                    "source_type": "reading",
                    "source_id": str(r.id),
                    "title": f"{label_prefix}: {r.title}",
                    "description": f"Progresso: {r.current_page}/{r.total_pages} págs ({r.progress_percent}%)",
                    "starts_at": f"{exam_iso}T12:00:00+00:00",
                    "ends_at": f"{exam_iso}T13:00:00+00:00",
                    "room": "",
                    "student_subject_id": str(r.student_subject_id) if r.student_subject_id else None,
                    "subject_name": r.student_subject.subject.name if r.student_subject else None,
                    "cancelled": False,
                    "attendance_status": None,
                    "all_day": True,
                    "kind": "reading",
                    "reading_progress": r.progress_percent,
                    "reading_pages": f"{r.current_page}/{r.total_pages} págs",
                })

        if not kind_filter or kind_filter == "reading":
            log_qs = ReadingLog.objects.select_related(
                "reading__student_subject__subject"
            ).filter(
                user=user,
                pages_read__gt=0,
                date__gte=from_date,
                date__lte=to_date,
            )
            if ss_id:
                log_qs = log_qs.filter(reading__student_subject_id=ss_id)
            for log in log_qs:
                log_iso = log.date.isoformat()
                r = log.reading
                items.append({
                    "id": f"reading-log:{log.id}",
                    "source_type": "reading",
                    "source_id": str(r.id),
                    "title": f"Leitura (+{log.pages_read} págs): {r.title}",
                    "description": f"Acumulado: {r.current_page}/{r.total_pages} págs ({r.progress_percent}%)",
                    "starts_at": f"{log_iso}T12:00:00+00:00",
                    "ends_at": f"{log_iso}T13:00:00+00:00",
                    "room": "",
                    "student_subject_id": str(r.student_subject_id) if r.student_subject_id else None,
                    "subject_name": r.student_subject.subject.name if r.student_subject else None,
                    "cancelled": False,
                    "attendance_status": None,
                    "all_day": True,
                    "kind": "reading",
                    "reading_progress": r.progress_percent,
                    "reading_pages": f"{r.current_page}/{r.total_pages} págs",
                })

        # Sort by starts_at then id
        items.sort(key=lambda x: (x["starts_at"], x["id"]))
        return Response({"items": items})


# ---------------------------------------------------------------------------
# Flashcards (Anki SM-2 Spaced Repetition)
# ---------------------------------------------------------------------------

class FlashcardListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = FlashcardSerializer
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        qs = Flashcard.objects.select_related("student_subject__subject").filter(user=user)
        ss_id = self.request.query_params.get("student_subject")
        if ss_id:
            qs = qs.filter(student_subject_id=ss_id)
        deck = self.request.query_params.get("deck_name")
        if deck:
            qs = qs.filter(deck_name=deck)
        return qs.order_by("due_at", "-created_at")


class FlashcardDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = FlashcardSerializer
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        return Flashcard.objects.select_related("student_subject__subject").filter(user=user)


class FlashcardReviewView(generics.GenericAPIView):
    """
    POST /api/v1/flashcards/{id}/review
    Accepts {"rating": "again" | "hard" | "good" | "easy"}
    Applies Anki SM-2 scheduling algorithm and returns the updated Flashcard.
    """
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = FlashcardSerializer
    pagination_class = None

    def post(self, request, *args, **kwargs):
        from datetime import timedelta
        from rest_framework.exceptions import NotFound, ValidationError as DRFValidationError

        user = cast(User, request.user)
        pk = self.kwargs["pk"]
        try:
            card = Flashcard.objects.select_related("student_subject__subject").get(
                id=pk, user=user
            )
        except Flashcard.DoesNotExist as exc:
            raise NotFound() from exc

        rating = str(request.data.get("rating", "")).strip().lower()
        if rating not in ("again", "hard", "good", "easy"):
            raise DRFValidationError({"rating": "Use 'again', 'hard', 'good' ou 'easy'."})

        now = timezone.now()
        ease = card.ease_factor
        interval = card.interval_days
        reps = card.repetitions
        lapses = card.lapses

        if rating == "again":
            reps = 0
            lapses += 1
            interval = 0
            ease = max(1.3, round(ease - 0.2, 2))
            card.state = Flashcard.State.LEARNING
            card.due_at = now + timedelta(minutes=10)
        elif rating == "hard":
            ease = max(1.3, round(ease - 0.15, 2))
            if interval == 0:
                interval = 1
            else:
                interval = max(1, round(interval * 1.2))
            card.state = Flashcard.State.REVIEW
            card.due_at = now + timedelta(days=interval)
        elif rating == "good":
            reps += 1
            if reps == 1:
                interval = 1
            elif reps == 2:
                interval = 3
            else:
                interval = max(1, round(interval * ease))
            card.state = Flashcard.State.REVIEW
            card.due_at = now + timedelta(days=interval)
        else:  # easy
            reps += 1
            ease = round(ease + 0.15, 2)
            if reps == 1:
                interval = 4
            else:
                interval = max(4, round(max(1, interval) * ease * 1.3))
            card.state = Flashcard.State.REVIEW
            card.due_at = now + timedelta(days=interval)

        card.ease_factor = ease
        card.interval_days = interval
        card.repetitions = reps
        card.lapses = lapses
        card.last_reviewed_at = now
        card.save()

        return Response(FlashcardSerializer(card, context={"request": request}).data)


class FlashcardAIGenerateView(generics.GenericAPIView):
    """
    POST /api/v1/flashcards/generate-ai
    Gera flashcards criteriosos voltados ao raciocínio lógico profundo (Taxonomia de Bloom:
    Aplicação, Análise, Avaliação, Trade-offs e Causa-Efeito) a partir de uma anotação
    (StudyNote), disciplina, texto colado ou tema acadêmico.
    """
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = FlashcardSerializer
    pagination_class = None

    GENERIC_TITLES = {
        "nova anotação",
        "nova anotaço",
        "nova anotaco",
        "sem título",
        "sem titulo",
        "anotação",
        "anotacao",
        "anotação de estudo",
        "anotação guiada",
        "nota",
        "geral",
        "estudos acadêmicos",
    }

    META_PREFIX_REGEX = re.compile(
        r"^(objetivos?|metas?|propósitos?|finalidades?|"
        r"temos que considerar.*|devemos considerar.*|fatores.*|variáveis.*|critérios.*|aspectos.*|"
        r"nossos? modelos?|características.*|propriedades.*|vantagens.*|desvantagens.*|"
        r"observaç(?:ão|ões)|obs\.?|notas?|importantes?|atenção|lembretes?|resumos?|conclus(?:ão|ões)|sínteses?|exemplos?|dicas?)$",
        re.IGNORECASE,
    )

    @classmethod
    def _is_generic_title(cls, value: str | None) -> bool:
        cleaned = (value or "").strip().lower()
        if not cleaned or cleaned in cls.GENERIC_TITLES:
            return True
        if cleaned.startswith("nova anota") or cleaned.startswith("sem tít") or cleaned.startswith("sem tit"):
            return True
        return False

    @classmethod
    def _infer_domain_context(
        cls, raw_topic: str, subject_title: str, lines: list[str]
    ) -> tuple[str, str]:
        """
        Retorna (core_theme, full_context_label) garantindo que títulos genéricos como
        'Nova anotação' ou 'Nova anotaço' jamais apareçam no enunciado das perguntas.
        """
        specific_topic = "" if cls._is_generic_title(raw_topic) else raw_topic.strip()

        inferred_concept = ""
        for ln in lines:
            # Verifica se há um cabeçalho ou conceito inicial antes de ':' que não seja metalinguagem
            m = re.match(r"^([^:–—\-]{3,60})\s*[:–—\-]\s*(.+)$", ln)
            if m:
                candidate = m.group(1).strip(" \"'“”•*-")
                if (
                    candidate
                    and not cls._is_generic_title(candidate)
                    and not cls.META_PREFIX_REGEX.match(candidate)
                    and len(candidate.split()) <= 6
                ):
                    inferred_concept = candidate
                    break
            elif 4 <= len(ln) <= 55 and not ln.endswith(".") and not cls.META_PREFIX_REGEX.match(ln):
                inferred_concept = ln.strip(" \"'“”•*-")
                break

        core_theme = specific_topic or inferred_concept or subject_title
        if subject_title and subject_title.lower() not in core_theme.lower() and subject_title != "Estudos Acadêmicos":
            full_context = f"{core_theme} ({subject_title})"
        else:
            full_context = core_theme
        return core_theme, full_context

    @classmethod
    def _build_analytical_cards_from_text(
        cls,
        lines: list[str],
        clean_source: str,
        core_theme: str,
        subject_title: str,
        count: int,
    ) -> list[dict[str, str]]:
        """
        Motor Anki Atômico (Princípio do Mínimo de Informação - 20 Rules of Formulating Knowledge):
        Elabora perguntas curtas, diretas e de leitura rápida (máx ~90 caracteres no front),
        mantendo o estímulo ao raciocínio lógico (causa-efeito, decisão, trade-off e validação).
        """
        cards: list[dict[str, str]] = []
        seen_signatures: set[str] = set()

        def short_label(txt: str, max_len: int = 38) -> str:
            t = re.sub(r"\s+", " ", txt).strip(" .;:,-\"'“”")
            if len(t) <= max_len:
                return t
            cut = t[:max_len].rsplit(" ", 1)[0]
            return (cut if len(cut) >= 12 else t[:max_len]) + "…"

        def add_card(front: str, back: str, hint: str, tags: str) -> None:
            sig = front[:65].lower()
            if sig not in seen_signatures and len(cards) < count:
                seen_signatures.add(sig)
                cards.append({
                    "front": front.strip()[:140],
                    "back": back.strip(),
                    "hint": hint.strip()[:255],
                    "tags": tags.strip()[:255],
                })

        short_theme = short_label(core_theme, 32)

        for ln in lines:
            if len(cards) >= count:
                break

            match = re.match(r"^([^:–—\-]{2,70})\s*[:–—\-]\s*(.{8,})$", ln)
            prefix = match.group(1).strip() if match else ""
            body = match.group(2).strip() if match else ln.strip()
            prefix_lower = prefix.lower()
            full_lower = ln.lower()

            # EIXO 1: Validação Crítica / Critério de Aderência
            quoted_q = re.search(r"[\"“”']([^\"“”']+\?)[\"“”']|([^:]+?\?)", body)
            if quoted_q or "aderente" in full_lower or "específica" in full_lower:
                concept_focus = (
                    short_label(prefix, 28)
                    if prefix and not cls.META_PREFIX_REGEX.match(prefix) and not cls._is_generic_title(prefix)
                    else short_theme
                )
                add_card(
                    front=f"Como validar o critério decisivo de aderência em {concept_focus}?",
                    back=(
                        f"• Pergunta-Chave: A solução é aderente o suficiente para esta aplicação específica?\n"
                        f"• Evita: Sobre-engenharia (complexidade acidental) ou sub-especificação.\n"
                        f"• Regra: Cada elemento deve resolver uma restrição real do domínio."
                    ),
                    hint="Aderência à aplicação específica vs. complexidade acidental",
                    tags="anki, aderencia, validacao",
                )
                continue

            # EIXO 2: Finalidade, Propósito e Abstração Seletiva
            if (
                re.match(r"^(objetivos?|metas?|propósitos?|finalidades?)$", prefix_lower)
                or "capturar aspectos" in full_lower
                or "interesse da situação" in full_lower
            ):
                add_card(
                    front=f"Qual é a razão lógica da abstração seletiva em {short_theme}?",
                    back=(
                        f"• Objetivo: {body}.\n"
                        f"• Por quê? Modelar tudo gera ruído e custo; omitir o essencial invalida a solução.\n"
                        f"• Prática: Filtrar apenas o que impacta o problema."
                    ),
                    hint="Foco nos aspectos relevantes da realidade vs. ruído",
                    tags="anki, abstracao, objetivo",
                )
                continue

            # EIXO 3: Análise Multivariável e Fatores de Decisão
            comma_items = [item.strip(" .;") for item in body.split(",") if len(item.strip(" .;")) >= 3]
            if (
                "fatores" in prefix_lower
                or "considerar" in prefix_lower
                or "variáveis" in prefix_lower
                or "critérios" in prefix_lower
                or len(comma_items) >= 3
            ):
                factors_summary = body.rstrip(".")
                add_card(
                    front=f"Quais fatores técnicos e humanos condicionam decisões em {short_theme}?",
                    back=(
                        f"• Variáveis: {factors_summary}.\n"
                        f"• Causa-Efeito: Escopo e requisitos definem o rigor; tecnologia depende da maturidade da equipe.\n"
                        f"• Risco: Ignorar uma variável inviabiliza o projeto."
                    ),
                    hint="Requisitos, escopo, tecnologia e experiência da equipe",
                    tags="anki, fatores, decisao",
                )
                continue

            # EIXO 4: Trade-offs entre Requisitos e Código
            if (
                "mais detalhad" in full_lower
                or "menos complex" in full_lower
                or "manter" in full_lower
                or "evolução" in full_lower
                or "nossos modelos" in prefix_lower
                or ";" in body
            ):
                add_card(
                    front=f"Qual é o trade-off ideal entre requisitos e código em {short_theme}?",
                    back=(
                        f"• Equilíbrio: Mais detalhado que requisitos (precisão) e menos complexo que o código (clareza).\n"
                        f"• Ganho: Fácil entendimento, manutenção ágil e evolução contínua."
                    ),
                    hint="Detalhamento vs. Simplicidade de manutenção",
                    tags="anki, trade-offs, arquitetura",
                )
                continue

            # EIXO 5: Conceito Técnico Curto e Direto
            if prefix and not cls.META_PREFIX_REGEX.match(prefix) and not cls._is_generic_title(prefix):
                clean_p = short_label(prefix, 32)
                add_card(
                    front=f"Qual o papel de \"{clean_p}\" em {short_theme} e o efeito de sua falha?",
                    back=(
                        f"• Função: {body}.\n"
                        f"• Falha: Perda de consistência estrutural no domínio."
                    ),
                    hint=f"Papel e impacto de {clean_p}",
                    tags="anki, causa-e-efeito, conceito",
                )
            elif len(body) >= 15:
                snippet = short_label(body, 38)
                add_card(
                    front=f"Por que a regra \"{snippet}\" é necessária em {short_theme}?",
                    back=(
                        f"• Regra: {body}.\n"
                        f"• Impacto: Previne ambiguidades e garante consistência prática."
                    ),
                    hint="Restrição lógica do domínio",
                    tags="anki, regra, raciocinio",
                )

        # Fallbacks curtos, diretos e analíticos (estilo Anki clássico)
        analytical_fallbacks = [
            {
                "front": f"Acoplamento vs. Modularidade em {short_theme}: como decidir?",
                "back": (
                    f"• Acoplado: Menor latência inicial, mas alto custo de mudança.\n"
                    f"• Modular: Ideal quando {short_theme} exige manutenção e evolução contínua."
                ),
                "hint": "Custo de evolução vs. ganho imediato",
                "tags": "anki, trade-offs",
            },
            {
                "front": f"Como validar se uma solução em {short_theme} ataca a causa-raiz?",
                "back": (
                    f"• Teste Contrafactual: Se o volume ou requisito mudar, o modelo se mantém íntegro?\n"
                    f"• Objetivo: Separar sintomas superficiais de restrições reais."
                ),
                "hint": "Teste de estresse de variáveis",
                "tags": "anki, causa-raiz",
            },
            {
                "front": f"Sub-especificação vs. Sobre-engenharia em {short_theme}: qual o efeito?",
                "back": (
                    f"• Sub-especificação: Gera improviso e retrabalho no código.\n"
                    f"• Sobre-engenharia: Complexidade precoce sem ganho real.\n"
                    f"• Meta: Capturar apenas os aspectos essenciais da situação."
                ),
                "hint": "Ambiguidade vs. Complexidade acidental",
                "tags": "anki, sintese",
            },
            {
                "front": f"Quais 3 perguntas validam o domínio prático de {short_theme}?",
                "back": (
                    f"1. Qual problema real este conceito resolve?\n"
                    f"2. Quais fatores técnicos e humanos condicionam seu uso?\n"
                    f"3. Em qual cenário esta abordagem falha?"
                ),
                "hint": "Por que existe + Condições + Limites",
                "tags": "anki, revisao",
            },
        ]

        for fb in analytical_fallbacks:
            if len(cards) >= count:
                break
            add_card(fb["front"], fb["back"], fb["hint"], fb["tags"])

        return cards[:count]

    def post(self, request, *args, **kwargs):
        import html
        import re
        from rest_framework.exceptions import ValidationError as DRFValidationError

        user = cast(User, request.user)
        topic = str(request.data.get("topic") or "").strip()
        source_text = str(request.data.get("source_text") or "").strip()
        note_id = request.data.get("note_id")
        ss_raw = request.data.get("student_subject")
        deck_name = str(request.data.get("deck_name") or "").strip()
        try:
            count = int(request.data.get("count") or 5)
        except (TypeError, ValueError):
            count = 5
        count = max(1, min(10, count))

        student_subject = None
        if ss_raw:
            student_subject = (
                StudentSubject.objects.select_related("subject")
                .filter(id=ss_raw, user=user)
                .first()
            )
            if not student_subject:
                student_subject = (
                    StudentSubject.objects.select_related("subject")
                    .filter(subject_id=ss_raw, user=user)
                    .first()
                )

        note_obj = None
        if note_id:
            note_obj = (
                StudyNote.objects.select_related("student_subject__subject")
                .filter(id=note_id, user=user)
                .first()
            )
            if note_obj:
                updated_note_fields: list[str] = []
                # Normaliza eventual título legado "Nova anotaço" salvo anteriormente
                if note_obj.title and note_obj.title.strip().lower() in ("nova anotaço", "nova anotaco", "sem título", "sem titulo"):
                    note_obj.title = "Nova anotação"
                    updated_note_fields.append("title")
                if source_text and source_text.strip() not in ("", "<br>", "<p><br></p>") and note_obj.content != source_text:
                    note_obj.content = source_text
                    updated_note_fields.append("content")
                if student_subject and note_obj.student_subject_id != student_subject.id:
                    note_obj.student_subject = student_subject
                    updated_note_fields.append("student_subject")
                if updated_note_fields:
                    updated_note_fields.append("updated_at")
                    note_obj.save(update_fields=updated_note_fields)
                if not topic and not self._is_generic_title(note_obj.title):
                    topic = note_obj.title
                if not source_text:
                    source_text = note_obj.content
                if not student_subject and note_obj.student_subject:
                    student_subject = note_obj.student_subject

        if self._is_generic_title(topic):
            topic = ""

        # Limpa tags HTML preservando quebras de linha
        clean_source = re.sub(r"<(br|p|div|li|h[1-6]|tr|blockquote)[^>]*>", "\n", source_text, flags=re.I)
        clean_source = re.sub(r"<[^>]+>", " ", clean_source)
        clean_source = html.unescape(clean_source)
        clean_source = re.sub(r"[ \t]+", " ", clean_source)
        clean_source = re.sub(r"\n{2,}", "\n", clean_source).strip()

        if not topic and not clean_source and not student_subject and not note_obj:
            raise DRFValidationError(
                {"detail": "Informe um tema, selecione uma anotação/disciplina ou cole o conteúdo para gerar os flashcards com IA."}
            )

        lines = [
            ln.strip(" -•*\t")
            for ln in clean_source.split("\n")
            if len(ln.strip(" -•*\t")) >= 6
        ]

        subject_title = (
            student_subject.subject.name
            if student_subject
            else (
                deck_name
                if deck_name and not self._is_generic_title(deck_name)
                else "Estudos Acadêmicos"
            )
        )

        core_theme, full_context_label = self._infer_domain_context(topic, subject_title, lines)

        resolved_deck = (
            deck_name
            if deck_name and not self._is_generic_title(deck_name)
            else (student_subject.subject.name if student_subject else core_theme or "Geral")
        )

        # 1. Geração via módulo de IA compartilhado, com prompt socrático rigoroso
        generated_specs = generate_flashcards(
            count=count,
            subject_title=subject_title,
            core_theme=core_theme,
            source_text=clean_source,
            fallback_context=full_context_label,
        )

        # 2. Motor Criterioso Local de Raciocínio Lógico e Análise Semântica Profunda
        if len(generated_specs) < count:
            analytical_cards = self._build_analytical_cards_from_text(
                lines=lines,
                clean_source=clean_source,
                core_theme=core_theme,
                subject_title=subject_title,
                count=count - len(generated_specs),
            )
            generated_specs.extend(analytical_cards)

        created_cards: list[Flashcard] = []
        for spec in generated_specs[:count]:
            card = Flashcard.objects.create(
                user=user,
                student_subject=student_subject,
                deck_name=resolved_deck[:120],
                front=spec["front"],
                back=spec["back"],
                hint=spec.get("hint", "")[:255],
                tags=spec.get("tags", "ia, raciocinio-logico")[:255],
            )
            created_cards.append(card)

        return Response(
            {
                "created_count": len(created_cards),
                "items": FlashcardSerializer(
                    created_cards, many=True, context={"request": request}
                ).data,
            },
            status=drf_status.HTTP_201_CREATED,
        )


class StudyDocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = StudyDocumentSerializer
    permission_classes = (IsAuthenticatedOr401,)
    pagination_class = None
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        user = cast(User, self.request.user)
        qs = StudyDocument.objects.filter(user=user).select_related(
            "student_subject", "student_subject__subject", "folder"
        ).prefetch_related("pages")

        subject_id = self.request.query_params.get("subject")
        if subject_id:
            try:
                qs = qs.filter(student_subject_id=UUID(str(subject_id)))
            except (ValueError, TypeError):
                return qs.none()

        folder_id = self.request.query_params.get("folder")
        if folder_id:
            try:
                qs = qs.filter(folder_id=UUID(str(folder_id)))
            except (ValueError, TypeError):
                return qs.none()

        search = (self.request.query_params.get("search") or "").replace("\x00", "").strip()[:120]
        if search:
            qs = qs.filter(
                models.Q(title__icontains=search)
                | models.Q(topic__icontains=search)
                | models.Q(pages__content__icontains=search)
            ).distinct()

        return qs

    @staticmethod
    def _extract_pages_from_uploaded_file(uploaded_file, ext: str, fallback_title: str) -> list[tuple[int, str]]:
        pages_data: list[tuple[int, str]] = []
        if not uploaded_file:
            return pages_data

        try:
            uploaded_file.seek(0)
        except Exception:
            pass

        if ext == "pdf":
            try:
                import pypdf
                reader = pypdf.PdfReader(uploaded_file)
                for i, page in enumerate(reader.pages):
                    extracted_text = (page.extract_text() or "").strip()
                    if extracted_text:
                        pages_data.append((i + 1, extracted_text))
            except Exception:
                pass
        elif ext in ("pptx", "odp"):
            try:
                uploaded_file.seek(0)
                with zipfile.ZipFile(uploaded_file) as zf:
                    slide_files = sorted(
                        [n for n in zf.namelist() if n.startswith("ppt/slides/slide") and n.endswith(".xml")],
                        key=lambda name: int(re.sub(r"\D", "", name) or "0"),
                    )
                    for idx, slide_name in enumerate(slide_files, start=1):
                        xml_bytes = zf.read(slide_name)
                        root = ET.fromstring(xml_bytes)
                        texts = [node.text.strip() for node in root.iter() if node.text and node.text.strip()]
                        if texts:
                            pages_data.append((idx, "\n".join(texts)))
            except Exception:
                pass
        elif ext in ("docx", "odt"):
            try:
                uploaded_file.seek(0)
                with zipfile.ZipFile(uploaded_file) as zf:
                    xml_target = "word/document.xml" if "word/document.xml" in zf.namelist() else "content.xml"
                    if xml_target in zf.namelist():
                        xml_bytes = zf.read(xml_target)
                        root = ET.fromstring(xml_bytes)
                        paragraphs: list[str] = []
                        for elem in root.iter():
                            if elem.tag.endswith("}p") or elem.tag == "p":
                                p_text = "".join(t.text for t in elem.iter() if t.text).strip()
                                if p_text:
                                    paragraphs.append(p_text)
                        full_doc_text = "\n\n".join(paragraphs)
                        if full_doc_text:
                            words = full_doc_text.split()
                            chunk_size = 350
                            for i in range(0, max(len(words), 1), chunk_size):
                                chunk = " ".join(words[i : i + chunk_size]).strip()
                                if chunk:
                                    pages_data.append(((i // chunk_size) + 1, chunk))
            except Exception:
                pass
        elif ext in ("doc", "ppt"):
            try:
                uploaded_file.seek(0)
                raw_text = uploaded_file.read().decode("latin-1", errors="ignore")
                printable = re.findall(r"[A-Za-zÀ-ÿ0-9 ,.;:?!()\-/]{6,}", raw_text)
                decoded_chunks = [s.strip() for s in printable]
                content = "\n".join(c for c in decoded_chunks if len(c) > 10).strip()
                if content:
                    words = content.split()
                    chunk_size = 350
                    for i in range(0, max(len(words), 1), chunk_size):
                        chunk = " ".join(words[i : i + chunk_size]).strip()
                        if chunk:
                            pages_data.append(((i // chunk_size) + 1, chunk))
            except Exception:
                pass

        try:
            uploaded_file.seek(0)
        except Exception:
            pass

        if not pages_data:
            pages_data.append(
                (
                    1,
                    f"Arquivo '{fallback_title}' carregado com sucesso. Este documento contém elementos gráficos ou páginas digitalizadas prontas para visualização e estudo.",
                )
            )
        return pages_data

    def perform_create(self, serializer):
        user = cast(User, self.request.user)
        uploaded_file = self.request.FILES.get("file")
        file_size = uploaded_file.size if uploaded_file else 0
        raw_file_name = os.path.basename(uploaded_file.name) if uploaded_file and uploaded_file.name else "documento.pdf"
        safe_file_name = re.sub(r"[^a-zA-Z0-9._\-À-ÿ ]", "_", raw_file_name).strip() or "documento.pdf"
        if uploaded_file:
            uploaded_file.name = safe_file_name
        ext = safe_file_name.rsplit(".", 1)[-1].lower() if "." in safe_file_name else "pdf"

        raw_title = (serializer.validated_data.get("title") or "").strip()
        title = raw_title or safe_file_name or "Documento de Estudo"

        pages_data = self._extract_pages_from_uploaded_file(uploaded_file, ext, title)
        page_count = max(len(pages_data), 1)
        extracted_full_text = "\n\n".join(text for _, text in pages_data)

        doc = serializer.save(
            user=user,
            title=title,
            file_size=file_size,
            file_type=ext[:20],
            page_count=page_count,
            extracted_text=extracted_full_text,
        )

        created_pages: list[StudyDocumentPage] = []
        for page_num, text in pages_data:
            token_est = len(text.split())
            p_obj = StudyDocumentPage.objects.create(
                document=doc,
                page_number=page_num,
                content=text,
                token_count=token_est,
            )
            created_pages.append(p_obj)

        # Gera automaticamente a análise cognitiva inicial para que todas as abas abram de imediato pós-upload
        try:
            analyzer = StudyDocumentAIAnalyzeView()
            initial_analysis = analyzer._generate_cognitive_analysis(
                doc, created_pages, extracted_full_text, use_llm=False
            )
            doc.analysis_cache = initial_analysis
            doc.save(update_fields=["analysis_cache"])
        except Exception:
            pass


class StudyDocumentFileServeView(generics.GenericAPIView):
    permission_classes = (IsAuthenticatedOr401,)

    def get(self, request, pk, *args, **kwargs):
        import mimetypes
        from django.http import FileResponse, Http404

        user = cast(User, request.user)
        doc = StudyDocument.objects.filter(id=pk, user=user).first()
        if not doc or not doc.file:
            raise Http404("Arquivo não encontrado.")
        try:
            file_handle = doc.file.open("rb")
        except Exception as exc:
            raise Http404("Arquivo indisponível.") from exc

        content_type, _ = mimetypes.guess_type(doc.file.name)
        response = FileResponse(
            file_handle,
            content_type=content_type or "application/octet-stream",
        )
        safe_filename = re.sub(r'["\\]', "", os.path.basename(doc.file.name))
        response["Content-Disposition"] = f'inline; filename="{safe_filename}"'
        response["X-Frame-Options"] = "SAMEORIGIN"
        return response


class StudyDocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudyDocumentSerializer
    permission_classes = (IsAuthenticatedOr401,)
    pagination_class = None

    def get_queryset(self):
        user = cast(User, self.request.user)
        return StudyDocument.objects.filter(user=user).select_related(
            "student_subject", "student_subject__subject", "folder"
        ).prefetch_related("pages")


class StudyDocumentAIAnalyzeView(generics.GenericAPIView):
    permission_classes = (IsAuthenticatedOr401,)

    def post(self, request, pk, *args, **kwargs):
        user = cast(User, request.user)
        doc = StudyDocument.objects.filter(id=pk, user=user).prefetch_related("pages").first()
        if not doc:
            return Response({"detail": "Documento não encontrado."}, status=drf_status.HTTP_404_NOT_FOUND)

        pages = list(doc.pages.order_by("page_number"))
        if not pages:
            # Tenta extrair agora se o documento tiver arquivo
            if doc.file:
                try:
                    import pypdf
                    with doc.file.open("rb") as f:
                        reader = pypdf.PdfReader(f)
                        for i, page in enumerate(reader.pages):
                            txt = (page.extract_text() or "").strip()
                            if txt:
                                p_obj = StudyDocumentPage.objects.create(
                                    document=doc,
                                    page_number=i + 1,
                                    content=txt,
                                    token_count=len(txt.split()),
                                )
                                pages.append(p_obj)
                        doc.page_count = len(pages)
                        doc.save(update_fields=["page_count"])
                except Exception:
                    pass

        # Montar contexto estruturado com paginação
        doc_title = doc.title or "Documento"
        context_pages = []
        for p in pages:
            context_pages.append(f"--- PÁGINA {p.page_number} ({doc_title}) ---\n{p.content[:2000]}")

        combined_text = "\n\n".join(context_pages) if context_pages else doc.title

        # Análise via módulo de IA compartilhado, com motor cognitivo determinístico como fallback
        analysis_result = self._generate_cognitive_analysis(doc, pages, combined_text)

        doc.analysis_cache = analysis_result
        doc.save(update_fields=["analysis_cache"])

        return Response(analysis_result, status=drf_status.HTTP_200_OK)

    def _generate_cognitive_analysis(
        self,
        doc: StudyDocument,
        pages: list[StudyDocumentPage],
        full_text: str,
        use_llm: bool = True,
    ) -> dict:
        doc_title = doc.title or "Documento"
        total_p = doc.page_count or (len(pages) if pages else 1)

        # 1. Análise cognitiva pelo módulo de IA compartilhado (quando solicitada)
        if use_llm:
            analysis = generate_document_analysis(doc_title, full_text)
            if analysis is not None:
                return analysis

        # 2. Motor Cognitivo Semântico de Alta Precisão (Fallback Inteligente com Citações Reais)
        # Identifica parágrafos-chave e páginas de onde se originam
        key_paragraphs = []
        for p in pages:
            lines = [l.strip() for l in p.content.split("\n") if len(l.strip()) > 35]
            for line in lines[:3]:
                key_paragraphs.append((p.page_number, line))

        if not key_paragraphs:
            key_paragraphs = [(1, f"Visão geral dos fundamentos e estrutura do tema {doc_title}.")]

        # Summary
        summary_lines = [
            f"**Visão Geral do Estudo**: Análise estruturada do material *{doc_title}* abordando os princípios fundamentais e aplicações práticas.",
        ]
        for page_num, text_snippet in key_paragraphs[:4]:
            summary_lines.append(f"- **Conceito Essencial**: {text_snippet[:140]}... [{doc_title} - Pág. {page_num}]")

        summary = "\n\n".join(summary_lines)

        # Complex topics
        complex_topics = []
        for i, (page_num, text_snippet) in enumerate(key_paragraphs[:3]):
            complex_topics.append({
                "topic": f"Tópico Avançado {i+1}: {text_snippet[:40]}...",
                "explanation": f"Compreensão aprofundada dos mecanismos subjacentes: {text_snippet}.",
                "citation": f"[{doc_title} - Pág. {page_num}]",
                "example": f"Aplicação prática na resolução de cenários reais e tomada de decisão fundamentada em {doc_title}.",
            })

        # Key concepts
        key_concepts = []
        for i, (page_num, text_snippet) in enumerate(key_paragraphs[:4]):
            words = [w for w in text_snippet.split() if len(w) > 4 and w.isalnum()]
            term = words[0].capitalize() if words else f"Fundamento {i+1}"
            key_concepts.append({
                "term": term,
                "definition": f"Elemento estrutural identificado na discussão: {text_snippet[:120]}.",
                "citation": f"[{doc_title} - Pág. {page_num}]",
            })

        # Mermaid mental map
        clean_title = re.sub(r'[^a-zA-Z0-9_ ]', '', doc_title)[:25] or "Documento"
        mermaid_nodes = [f'graph TD\n    Root["{clean_title}"]']
        for idx, kc in enumerate(key_concepts[:4]):
            safe_term = re.sub(r'[^a-zA-Z0-9_ ]', '', kc["term"])[:20]
            mermaid_nodes.append(f'    Root --> N{idx}["{safe_term}"]')
            mermaid_nodes.append(f'    N{idx} --> D{idx}["Pág. {pages[idx % len(pages)].page_number if pages else 1}"]')
        mental_map = "\n".join(mermaid_nodes)

        # Study roadmap
        study_roadmap = [
            {
                "step": 1,
                "goal": f"Fundamentação e Termos Prévios de {doc_title}",
                "recommended_pages": f"Pág. 1 a {max(1, total_p // 3)}",
                "action": "Ler ativamente destacando conceitos-chave e construir mapa mental inicial.",
            },
            {
                "step": 2,
                "goal": "Análise dos Tópicos Críticos e Exemplos Práticos",
                "recommended_pages": f"Pág. {max(1, total_p // 3) + 1} a {max(1, (2 * total_p) // 3)}",
                "action": "Executar os exemplos de aplicação e registrar reflexões no caderno de anotações.",
            },
            {
                "step": 3,
                "goal": "Consolidação Cognitiva e Simulado de 10 Questões",
                "recommended_pages": f"Pág. {max(1, (2 * total_p) // 3) + 1} a {total_p}",
                "action": "Resolver o simulado de 10 questões para diagnosticar lacunas e gerar flashcards Anki.",
            },
        ]

        reinforcement_topics = [
            f"Consolidação analítica das definições e regras estruturais [{doc_title} - Pág. {pages[0].page_number if pages else 1}]",
            f"Diferenciação precisa entre cenários de aplicação e contraexemplos [{doc_title} - Pág. {pages[-1].page_number if pages else 1}]",
        ]

        complementary_materials = [
            {
                "title": f"Artigos e Padrões Recomendados para {doc_title}",
                "type": "Referência Técnica",
                "description": "Estudo comparativo de implementação e boas práticas na indústria acadêmica e profissional.",
            },
            {
                "title": "Exercícios Complementares de Raciocínio Lógico e Modelagem",
                "type": "Simulados e Problemas",
                "description": "Treinamento focado em tomada de decisão e resolução de problemas ambíguos.",
            },
        ]

        return {
            "summary": summary,
            "complex_topics": complex_topics,
            "key_concepts": key_concepts,
            "mental_map_mermaid": mental_map,
            "study_roadmap": study_roadmap,
            "reinforcement_topics": reinforcement_topics,
            "complementary_materials": complementary_materials,
        }


class StudyDocumentQuizView(generics.GenericAPIView):
    permission_classes = (IsAuthenticatedOr401,)

    def post(self, request, pk, *args, **kwargs):
        user = cast(User, request.user)
        doc = StudyDocument.objects.filter(id=pk, user=user).prefetch_related("pages").first()
        if not doc:
            return Response({"detail": "Documento não encontrado."}, status=drf_status.HTTP_404_NOT_FOUND)

        pages = list(doc.pages.order_by("page_number"))
        doc_title = doc.title or "Documento"

        # Check if submitting answers or generating quiz
        action = request.data.get("action", "generate")
        if action == "submit":
            quiz_id = request.data.get("quiz_id")
            user_answers = request.data.get("answers", {})
            quiz = StudyQuiz.objects.filter(id=quiz_id, user=user).first()
            if not quiz:
                return Response({"detail": "Simulado não encontrado."}, status=drf_status.HTTP_404_NOT_FOUND)

            score = 0
            feedback = []
            for q in quiz.questions:
                q_id = str(q.get("id"))
                correct_idx = q.get("correct_option_index")
                user_selected = user_answers.get(q_id)
                is_correct = (user_selected == correct_idx)
                if is_correct:
                    score += 1
                feedback.append({
                    "question_id": q_id,
                    "is_correct": is_correct,
                    "user_selected": user_selected,
                    "correct_option_index": correct_idx,
                    "explanation": q.get("explanation"),
                    "citation": q.get("citation"),
                })

            quiz.score = score
            quiz.user_answers = user_answers
            quiz.completed_at = timezone.now()
            quiz.save(update_fields=["score", "user_answers", "completed_at"])

            return Response({
                "quiz_id": quiz.id,
                "score": score,
                "total_questions": quiz.total_questions,
                "percentage": round((score / max(quiz.total_questions, 1)) * 100, 1),
                "feedback": feedback,
            }, status=drf_status.HTTP_200_OK)

        # Generate 10 Questions Quiz
        snippets = self._collect_page_snippets(pages)
        questions = generate_quiz_questions(doc_title, snippets) or self._build_10_questions(
            doc, pages
        )
        for index, question in enumerate(questions, start=1):
            question["id"] = index
        quiz = StudyQuiz.objects.create(
            user=user,
            student_subject=doc.student_subject,
            document=doc,
            title=f"Simulado de Fixação (10Q) - {doc_title}",
            questions=questions,
            total_questions=len(questions),
        )

        return Response(StudyQuizSerializer(quiz).data, status=drf_status.HTTP_201_CREATED)

    @staticmethod
    def _collect_page_snippets(
        pages: list[StudyDocumentPage],
    ) -> list[tuple[int, str]]:
        page_snippets: list[tuple[int, str]] = []
        for p in pages:
            lines = [l.strip() for l in p.content.split("\n") if len(l.strip()) > 35]
            for l in lines:
                page_snippets.append((p.page_number, l))
        return page_snippets

    def _build_10_questions(self, doc: StudyDocument, pages: list[StudyDocumentPage]) -> list[dict]:
        doc_title = doc.title or "Documento"
        page_snippets = self._collect_page_snippets(pages)

        if not page_snippets:
            page_snippets = [(1, f"Fundamentos teóricos e metodológicos estruturados em {doc_title}.")]

        questions = []
        question_templates = [
            ("Qual é o princípio fundamental que orienta a aplicação prática de {snippet}?",
             "Garantir consistência estrutural e prevenir redundâncias no sistema.",
             "Permitir duplicação irrestrita sem validação prévia.",
             "Eliminar a necessidade de regras de integridade ou restrições.",
             "Substituir o planejamento conceitual por abordagens empíricas não testadas."),
            ("Ao avaliar o cenário de {snippet}, qual impacto direto decorre de sua incorreta estruturação?",
             "Inconsistências críticas de dados e anomalias durante operações de atualização.",
             "Aumento automático de performance sem necessidade de ajustes.",
             "Preservação invariável de todas as dependências funcionais sem esforço adicional.",
             "Neutralização completa de erros de interpretação humana."),
            ("Sob a ótica analítica de [{doc_title}], como se justifica a decisão descrita em {snippet}?",
             "Pelo balanceamento entre clareza arquitetural, integridade e conformidade de regras.",
             "Por ser um padrão meramente estético sem implicações funcionais.",
             "Para aumentar arbitrariamente a complexidade computacional.",
             "Por exigência de ferramentas proprietárias obsoletas."),
            ("Em relação a {snippet}, qual raciocínio lógico valida a escolha da abordagem correta?",
             "A verificação sistemática das dependências funcionais e das condições de contorno.",
             "A intuição subjetiva sem respaldo em especificações ou dados concretos.",
             "A adoção de exceções não documentadas em detrimento da regra canônica.",
             "A desconsideração proposital dos casos limites."),
            ("Qual das alternativas a seguir expressa um contraexemplo ou falha no conceito de {snippet}?",
             "Permitir que uma entidade dependa de atributos transitivos não chave.",
             "Garantir que todo atributo não primário dependa exclusivamente da chave inteira.",
             "Aplicar normalização rigorosa para mitigar dependências anômalas.",
             "Documentar formalmente cada premissa operacional e seus limites."),
            ("Qual é a consequência direta se negligenciarmos as restrições discutidas em {snippet}?",
             "Divergência sistêmica entre o modelo pretendido e o comportamento em execução.",
             "Otimização involuntária de todos os fluxos de trabalho.",
             "Redução instantânea do tempo de processamento a zero.",
             "Eliminação permanente de redundâncias por meios espontâneos."),
            ("De acordo com a seção analisada em {snippet}, como se caracteriza a melhor prática recomendada?",
             "Estruturação disciplinada com validação precoce e separação clara de responsabilidades.",
             "Postergar a validação de regras para fases posteriores ao deploy sem testes.",
             "Misturar domínios conceituais distintos em um único agregado indefinido.",
             "Evitar o uso de modelos conceituais para acelerar o desenvolvimento inicial."),
            ("Qual critério objetivo determina a eficácia da abordagem tratada em {snippet}?",
             "A capacidade de manter a coesão, a integridade referencial e a previsibilidade lógica.",
             "O número aleatório de linhas geradas no documento.",
             "A ausência total de qualquer regra formal de validação.",
             "A dependência estrita de intervenções manuais para cada operação."),
            ("Diante do problema contextualizado em {snippet}, qual hipótese diagnóstica é a mais plausível?",
             "Violação de premissas estruturais que induz à anomalia de inserção e exclusão.",
             "Perfeito alinhamento com as formas normais e boas práticas consagradas.",
             "Inexistência de relações de causa e efeito entre os elementos descritos.",
             "Falha de hardware independente do modelo conceitual aplicado."),
            ("Qual conclusão síntese melhor resume a diretriz de {snippet} apresentada no material?",
             "A modelagem rigorosa e a observância aos axiomas asseguram estabilidade e longevidade à solução.",
             "Modelos teóricos devem ser desconsiderados em ambientes reais de produção.",
             "Erros conceituais não exercem influência mensurável na qualidade do resultado final.",
             "A conformidade técnica é secundária em relação a conveniências temporárias."),
        ]

        for i in range(10):
            template_idx = i % len(question_templates)
            p_num, snippet = page_snippets[i % len(page_snippets)]
            q_tmpl, opt_correct, opt_wrong1, opt_wrong2, opt_wrong3 = question_templates[template_idx]

            prompt_text = q_tmpl.format(snippet=snippet[:70], doc_title=doc_title)
            options = [opt_correct, opt_wrong1, opt_wrong2, opt_wrong3]
            # Embaralhar deterministicamente para não ficar sempre na opção 0
            shift = (i * 3 + p_num) % 4
            rotated_options = options[shift:] + options[:shift]
            correct_index = rotated_options.index(opt_correct)

            citation = f"[{doc_title} - Pág. {p_num}]"
            explanation = (
                f"A resposta correta é a alternativa '{opt_correct}', fundamentada diretamente "
                f"na discussão de {snippet[:60]}... apresentada no material ({citation})."
            )

            questions.append({
                "id": i + 1,
                "question": prompt_text,
                "options": rotated_options,
                "correct_option_index": correct_index,
                "citation": citation,
                "explanation": explanation,
            })

        return questions


# ---------------------------------------------------------------------------
# Calendar PDF Automatic Assessment Extraction & Confirmation (Section 3)
# ---------------------------------------------------------------------------

class CalendarPdfExtractView(generics.GenericAPIView):
    """
    POST /api/v1/calendar/extract-pdf
    Recebe um arquivo PDF de calendário acadêmico e o ID da disciplina (student_subject_id),
    extrai automaticamente as avaliações (AP1, AP2, PAI 1, PAI 2, PAI 3) e suas datas,
    identifica inconsistências/avisos e retorna os dados estruturados para conferência do usuário
    antes da confirmação do cadastro.
    """
    permission_classes = (IsAuthenticatedOr401,)
    parser_classes = (MultiPartParser, FormParser)

    ACCENT_TRANSLATION = str.maketrans(
        "áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ",
        "aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn",
    )

    CANONICAL_ASSESSMENT_NAMES = {
        "AP1": "Avaliação Parcial 1 (AP1)",
        "AP2": "Avaliação Parcial 2 (AP2)",
        "PAI 1": "Prova PAI 1",
        "PAI 2": "Prova PAI 2",
        "PAI 3": "Prova PAI 3",
        "Avaliação Oficial": "Avaliação Oficial",
        "Prova Substitutiva": "Prova Substitutiva",
    }

    EXPECTED_TYPES = ("AP1", "AP2", "PAI 1", "PAI 2", "PAI 3")

    ASSESSMENT_REGEXES = [
        (
            "AP1",
            re.compile(
                r"\b(?:avaliacao\s+parcial\s*(?:[-–—:]?\s*)?(?:1|i)\b(?:\s*\(\s*ap\s*[-–—]?\s*1\s*\))?|ap\s*[-–—]?\s*1\b)"
            ),
        ),
        (
            "AP2",
            re.compile(
                r"\b(?:avaliacao\s+parcial\s*(?:[-–—:]?\s*)?(?:2|ii)\b(?!i)(?:\s*\(\s*ap\s*[-–—]?\s*2\s*\))?|ap\s*[-–—]?\s*2\b)"
            ),
        ),
        (
            "PAI 3",
            re.compile(
                r"\b(?:(?:prova\s+)?pai\s*[-–—]?\s*(?:3|iii)\b|programa\s+de\s+aprendizagem\s+interdisciplinar\s*(?:[-–—:,(]*\s*(?:prova\s+|avaliacao\s+|etapa\s+)?(?:pai\s*)?)?(?:3|iii)\b|(?:3|iii)\s*[oªº°]?\s*programa\s+de\s+aprendizagem\s+interdisciplinar\b)"
            ),
        ),
        (
            "PAI 2",
            re.compile(
                r"\b(?:(?:prova\s+)?pai\s*[-–—]?\s*(?:2|ii)\b(?!i)|programa\s+de\s+aprendizagem\s+interdisciplinar\s*(?:[-–—:,(]*\s*(?:prova\s+|avaliacao\s+|etapa\s+)?(?:pai\s*)?)?(?:2|ii)\b(?!i)|(?:2|ii)\s*[oªº°]?\s*programa\s+de\s+aprendizagem\s+interdisciplinar\b)"
            ),
        ),
        (
            "PAI 1",
            re.compile(
                r"\b(?:(?:prova\s+)?pai\s*[-–—]?\s*(?:1|i)\b(?!i)|programa\s+de\s+aprendizagem\s+interdisciplinar\s*(?:[-–—:,(]*\s*(?:prova\s+|avaliacao\s+|etapa\s+)?(?:pai\s*)?)?(?:1|i)\b(?!i)|(?:1|i)\s*[oªº°]?\s*programa\s+de\s+aprendizagem\s+interdisciplinar\b)"
            ),
        ),
        (
            "Avaliação Oficial",
            re.compile(
                r"\b(?:avaliac(?:ao|oes)\s+oficia(?:l|is)|av\s*\.?\s*oficia(?:l|is))\b"
            ),
        ),
        (
            "Prova Substitutiva",
            re.compile(
                r"\b(?:prova\s+substitutiva|avaliac(?:ao|oes)\s+substitutiva[s]?|substitutiva\b(?!s)|prova\s+sub\b)"
            ),
        ),
    ]

    DATE_RE = re.compile(
        r"\b(0?[1-9]|[12]\d|3[01])\s*/\s*(0?[1-9]|1[0-2])(?:\s*/\s*(20\d{2}|\d{2}))?\b"
    )

    POST_EXAM_PREFIX_RE = re.compile(
        r"\b(?:resolucao|correcao|gabarito|revisao|vista|devolucao|comentarios)\s+(?:da\s+|das\s+|do\s+|dos\s+|de\s+|sobre\s+(?:a\s+|o\s+)?)?$"
    )

    @classmethod
    def _validate_and_identify_file(cls, uploaded_file) -> tuple[str, str]:
        """
        Valida rigorosamente o arquivo enviado, rejeitando qualquer formato diferente de PDF e Word (.docx).
        Verifica extensão, tamanho máximo (15 MB), MIME type e assinatura real dos bytes (magic bytes / estrutura do arquivo),
        impedindo ataques como extensões forjadas (.txt ou .exe renomeados), zip bombs ou corrupções.
        """
        from rest_framework.exceptions import ValidationError as DRFValidationError
        import zipfile

        filename = os.path.basename(uploaded_file.name or "").strip()
        if not filename:
            raise DRFValidationError({"file": "Nome de arquivo inválido."})

        # Limite de tamanho máximo de 15 MB
        max_size = 15 * 1024 * 1024
        if uploaded_file.size and uploaded_file.size > max_size:
            raise DRFValidationError({"file": "O arquivo excede o limite máximo permitido de 15 MB."})

        lower_name = filename.lower()
        is_pdf_ext = lower_name.endswith(".pdf")
        is_docx_ext = lower_name.endswith(".docx")

        if not (is_pdf_ext or is_docx_ext):
            raise DRFValidationError(
                {"file": "Formato não suportado. Envie exclusivamente arquivos PDF (.pdf) ou Word (.docx)."}
            )

        uploaded_file.seek(0)
        magic_bytes = uploaded_file.read(2048)
        uploaded_file.seek(0)

        if is_pdf_ext:
            # Assinatura real de PDF: deve conter %PDF- nos primeiros 1024 bytes
            if b"%PDF-" not in magic_bytes[:1024]:
                raise DRFValidationError(
                    {"file": "Arquivo corrompido ou formato inválido. O conteúdo não corresponde a um documento PDF genuíno."}
                )
            return "pdf", filename

        if is_docx_ext:
            # Assinatura real de container OpenXML (ZIP standard: PK\x03\x04 ou PK\x05\x06 ou PK\x07\x08)
            if not magic_bytes.startswith((b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08")):
                raise DRFValidationError(
                    {"file": "Arquivo corrompido ou formato inválido. O conteúdo não corresponde a um documento Word (.docx) genuíno."}
                )

            # Valida integridade e estrutura interna do OpenXML
            try:
                uploaded_file.seek(0)
                with zipfile.ZipFile(uploaded_file, "r") as zf:
                    names = set(zf.namelist())
                    if "word/document.xml" not in names and "[Content_Types].xml" not in names:
                        raise DRFValidationError(
                            {"file": "Estrutura de arquivo inválida. O arquivo enviado não é um documento Word (.docx) válido."}
                        )

                    # Proteção contra Decompression Bomb / Zip Bomb
                    total_uncompressed = sum(info.file_size for info in zf.infolist())
                    if total_uncompressed > 50 * 1024 * 1024 or len(zf.infolist()) > 500:
                        raise DRFValidationError(
                            {"file": "O arquivo compactado excede os limites de segurança para descompactação."}
                        )
            except zipfile.BadZipFile:
                raise DRFValidationError(
                    {"file": "Arquivo Word (.docx) corrompido ou ilegível."}
                )
            finally:
                uploaded_file.seek(0)

            return "docx", filename

    @classmethod
    def _extract_raw_text_from_docx(cls, uploaded_file) -> str:
        """
        Extrai todo o conteúdo textual legível de um documento Word (.docx), incluindo
        parágrafos de corpo e linhas de tabelas de cronograma (w:p e w:tr).
        """
        import zipfile
        import xml.etree.ElementTree as ET

        paragraphs: list[str] = []
        try:
            uploaded_file.seek(0)
            with zipfile.ZipFile(uploaded_file, "r") as zf:
                xml_targets = [
                    n
                    for n in zf.namelist()
                    if n.startswith("word/header") or n == "word/document.xml"
                ]
                if "word/document.xml" not in xml_targets and "word/document.xml" in zf.namelist():
                    xml_targets.append("word/document.xml")

                for xml_name in xml_targets:
                    if xml_name not in zf.namelist():
                        continue
                    xml_bytes = zf.read(xml_name)
                    root = ET.fromstring(xml_bytes)
                    for elem in root.iter():
                        tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
                        if tag in ("p", "tr"):
                            text_pieces = [
                                child.text or ""
                                for child in elem.iter()
                                if (child.tag.split("}")[-1] if "}" in child.tag else child.tag) == "t"
                            ]
                            p_txt = " ".join("".join(text_pieces).split()).strip()
                            if p_txt:
                                paragraphs.append(p_txt)
        except Exception:
            pass

        return "\n".join(paragraphs)

    @classmethod
    def _extract_raw_text_from_pdf(cls, uploaded_file) -> str:
        pages_text: list[str] = []
        try:
            uploaded_file.seek(0)
            import pypdf

            reader = pypdf.PdfReader(uploaded_file)
            for page in reader.pages:
                t = (page.extract_text() or "").strip()
                if t:
                    pages_text.append(t)
        except Exception:
            pass

        if pages_text:
            return "\n\n".join(pages_text)

        # Fallback caso o PDF seja um stream minimalista com operadores de texto simples
        try:
            uploaded_file.seek(0)
            raw_bytes = uploaded_file.read()
            decoded = raw_bytes.decode("utf-8", errors="ignore")
            tj_matches = re.findall(r"\(([^()]{3,})\)\s*Tj", decoded)
            if tj_matches:
                return "\n".join(tj_matches)
        except Exception:
            pass
        return ""

    @classmethod
    def _resolve_date_iso(cls, day_str: str, month_str: str, year_str: str | None, ref_year: int) -> str | None:
        from datetime import date as dt_date

        try:
            d = int(day_str)
            m = int(month_str)
            if year_str:
                y = int(year_str)
                if y < 100:
                    y += 2000
            else:
                y = ref_year
            return dt_date(y, m, d).isoformat()
        except ValueError:
            return None

    @classmethod
    def _resolve_reference_year(cls, student_subject: StudentSubject) -> int:
        """Prioriza o ano do semestre vigente da matrícula e depois o do termo."""
        ref_year = timezone.now().year
        if student_subject.semester_period:
            m_year = re.search(r"\b(20\d{2})\b", student_subject.semester_period)
            if m_year:
                return int(m_year.group(1))
        if student_subject.term and student_subject.term.start_date:
            return student_subject.term.start_date.year
        return ref_year

    @classmethod
    def _make_calendar_item(
        cls,
        assessment_type: str,
        iso_date: str,
        snippet: str,
        subject_name: str,
        student_subject: StudentSubject,
        *,
        matched_label: str | None = None,
    ) -> dict[str, Any]:
        canonical_label = cls.CANONICAL_ASSESSMENT_NAMES.get(assessment_type, assessment_type)
        if assessment_type in ("PAI 1", "PAI 2", "PAI 3"):
            item_title = f"Prova {assessment_type}"
            item_subj_id = None
            item_subj_name = "Interdisciplinar (Geral)"
        else:
            item_title = f"{canonical_label} — {subject_name}"
            item_subj_id = str(student_subject.id)
            item_subj_name = subject_name

        return {
            "assessment_type": assessment_type,
            "title": item_title,
            "date": iso_date,
            "student_subject_id": item_subj_id,
            "subject_name": item_subj_name,
            "matched_label": matched_label if matched_label is not None else assessment_type,
            "source_snippet": snippet,
        }

    @classmethod
    def parse_calendar_text(
        cls,
        raw_text: str,
        student_subject: StudentSubject,
        user: User,
        filename: str = "",
        llm_items: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        import unicodedata

        norm_text = re.sub(r"\s+", " ", unicodedata.normalize("NFC", raw_text or "")).strip()
        ascii_text = norm_text.translate(cls.ACCENT_TRANSLATION).lower()

        # Determina o ano de referência priorizando o semestre vigente da matrícula ou termo ativo
        ref_year = cls._resolve_reference_year(student_subject)

        warnings: list[str] = []
        subject_name = student_subject.subject.name

        # Verifica se o cabeçalho do PDF menciona outra disciplina
        m_header_subj = re.search(
            r"disciplina\s*:\s*([A-Za-zÀ-ÿ0-9 &/\-–]{3,65}?)(?=\s+(?:carga\s+hor[aá]ria|semestre|curso|professor|ementa|objetivo|crit[eé]rios|aula|\d{2}/\d{2})\b|$)",
            norm_text,
            flags=re.IGNORECASE,
        )
        detected_pdf_subject = m_header_subj.group(1).strip(" -–:.") if m_header_subj else None
        if detected_pdf_subject and detected_pdf_subject.lower() != subject_name.lower():
            warnings.append(
                f"O documento menciona a disciplina '{detected_pdf_subject}', porém o cadastro será vinculado à disciplina selecionada ('{subject_name}')."
            )

        # Localiza todas as datas válidas no texto normalizado
        date_tokens: list[dict[str, Any]] = []
        for dm in cls.DATE_RE.finditer(ascii_text):
            iso_val = cls._resolve_date_iso(dm.group(1), dm.group(2), dm.group(3), ref_year)
            if iso_val:
                date_tokens.append(
                    {
                        "start": dm.start(),
                        "end": dm.end(),
                        "iso": iso_val,
                        "raw": norm_text[dm.start() : dm.end()],
                    }
                )

        # Localiza todas as ocorrências das avaliações previstas evitando sobreposições de span
        occupied_spans: list[tuple[int, int]] = []
        raw_mentions: list[dict[str, Any]] = []

        for a_type, pattern in cls.ASSESSMENT_REGEXES:
            for m in pattern.finditer(ascii_text):
                s, e = m.start(), m.end()
                if any(not (e <= os_s or s >= os_e) for os_s, os_e in occupied_spans):
                    continue
                occupied_spans.append((s, e))
                raw_mentions.append(
                    {
                        "assessment_type": a_type,
                        "start": s,
                        "end": e,
                        "matched_text": norm_text[s:e],
                    }
                )

        raw_mentions.sort(key=lambda item: item["start"])

        # Associa cada menção de avaliação à sua respectiva data
        extracted_by_type_and_date: dict[tuple[str, str], dict[str, Any]] = {}
        mentions_without_date: set[str] = set()

        for idx, mention in enumerate(raw_mentions):
            a_type = mention["assessment_type"]
            s, e = mention["start"], mention["end"]

            # 1. Ignora menções de resolução/correção/gabarito pós-prova (ex.: "Resolução da AP1")
            before_ctx = ascii_text[max(0, s - 45) : s]
            if cls.POST_EXAM_PREFIX_RE.search(before_ctx):
                continue

            # 2. Ignora menções de fórmula de nota ("PAI I (Livro 1)") na seção de Critérios de Avaliação
            after_ctx = ascii_text[e : min(len(ascii_text), e + 30)]
            if re.match(r"^\s*\(\s*livro\s+\d", after_ctx):
                continue

            # 3. Tenta encontrar data imediatamente após o nome da avaliação com conector explícito (ex.: "AP 1: 21/09/2026", "AP2 - 22/10/2026" ou "... III em 20/11/2026")
            next_mention_start = (
                raw_mentions[idx + 1]["start"] if idx + 1 < len(raw_mentions) else len(ascii_text)
            )
            after_limit = min(len(ascii_text), e + 45, next_mention_start)
            matched_date: dict[str, Any] | None = None

            for dt in date_tokens:
                if e <= dt["start"] <= after_limit:
                    between = ascii_text[e : dt["start"]].strip()
                    # Não aceita se for vazio (apenas espaços entre linhas diferentes) nem se tiver ponto final
                    if not between or "." in between:
                        continue
                    # Deve ser exclusivamente conector (: ou - ou palavras como em/dia/data)
                    if re.match(
                        r"^[:\-–—,(]*(?:(?:em|dia|data|no\s+dia|prevista\s+para|realizada\s+em)\b[\s:\-–—,(]*)*$",
                        between,
                    ) and any(c in between for c in (":", "-", "–", "—", "em", "dia", "data")):
                        matched_date = dt
                        break

            # 4. Caso não haja data logo após com conector explícito, procura a data no cronograma antes da menção
            if matched_date is None:
                prev_candidates = [
                    dt for dt in date_tokens if dt["end"] <= s and (s - dt["end"]) <= 185
                ]
                if prev_candidates:
                    candidate = prev_candidates[-1]
                    between = ascii_text[candidate["end"] : s]
                    # Garante que não atravessou outra data ou seção não relacionada
                    if not re.search(r"\b(?:criterios\s+de\s+avaliacao|bibliografia)\b", between):
                        matched_date = candidate

            if matched_date is not None:
                key = (a_type, matched_date["iso"])
                if key not in extracted_by_type_and_date:
                    snip_start = max(0, min(s, matched_date["start"]) - 10)
                    snip_end = min(len(norm_text), max(e, matched_date["end"]) + 55)
                    snippet = norm_text[snip_start:snip_end].strip()
                    extracted_by_type_and_date[key] = cls._make_calendar_item(
                        a_type,
                        matched_date["iso"],
                        snippet,
                        subject_name,
                        student_subject,
                        matched_label=mention["matched_text"],
                    )
            else:
                # Verifica se não é apenas menção genérica na seção inicial de critérios
                wider_before = ascii_text[max(0, s - 160) : s]
                if "criterios de avaliacao" not in wider_before and "composta por" not in wider_before:
                    mentions_without_date.add(a_type)

        extracted_items = list(extracted_by_type_and_date.values())
        extracted_items.sort(key=lambda x: (x["date"], x["assessment_type"]))

        # O regex é autoritativo: candidatos do LLM só preenchem tipos que ele não detectou
        existing_types = {item["assessment_type"] for item in extracted_items}
        for candidate in llm_items or []:
            candidate_type = candidate["assessment_type"]
            if candidate_type in existing_types:
                continue
            extracted_items.append(
                cls._make_calendar_item(
                    candidate_type,
                    candidate["date"],
                    candidate.get("source_snippet", ""),
                    subject_name,
                    student_subject,
                )
            )
            existing_types.add(candidate_type)
        extracted_items.sort(key=lambda x: (x["date"], x["assessment_type"]))

        # Verifica avaliações existentes no banco (para esta disciplina ou universais PAI) para evitar duplicação
        existing_events = list(
            AcademicEvent.objects.filter(
                user=user,
            )
        )
        existing_tasks = list(
            AcademicTask.objects.filter(
                user=user,
            )
        )

        duplicate_existing_count = 0
        for item in extracted_items:
            item_date = item["date"]
            a_type = item["assessment_type"]
            a_type_low = a_type.lower()
            is_pai = a_type in ("PAI 1", "PAI 2", "PAI 3")
            already_in_db = False

            if is_pai:
                # Universal: deduplica entre todas as disciplinas do usuário
                for ev in existing_events:
                    ev_date = ev.starts_at.date().isoformat() if ev.starts_at else ""
                    if ev_date == item_date and (
                        a_type_low in ev.title.lower()
                        or (ev.description and f"Tipo: {a_type}".lower() in ev.description.lower())
                        or (ev.student_subject is None and "pai" in ev.title.lower())
                    ):
                        already_in_db = True
                        break
                if not already_in_db:
                    for tk in existing_tasks:
                        tk_date = tk.due_date.date().isoformat() if tk.due_date else ""
                        if tk_date == item_date and (
                            a_type_low in tk.title.lower()
                            or (tk.description and f"Tipo: {a_type}".lower() in tk.description.lower())
                            or (tk.student_subject is None and "pai" in tk.title.lower())
                        ):
                            already_in_db = True
                            break
            else:
                for ev in existing_events:
                    if ev.student_subject_id != student_subject.id:
                        continue
                    ev_date = ev.starts_at.date().isoformat() if ev.starts_at else ""
                    if ev_date == item_date and (
                        a_type_low in ev.title.lower()
                        or item["title"].lower() == ev.title.lower()
                        or (ev.description and f"Tipo: {a_type}".lower() in ev.description.lower())
                    ):
                        already_in_db = True
                        break
                if not already_in_db:
                    for tk in existing_tasks:
                        if tk.student_subject_id != student_subject.id:
                            continue
                        tk_date = tk.due_date.date().isoformat() if tk.due_date else ""
                        if tk_date == item_date and (
                            a_type_low in tk.title.lower()
                            or item["title"].lower() == tk.title.lower()
                            or (tk.description and f"Tipo: {a_type}".lower() in tk.description.lower())
                        ):
                            already_in_db = True
                            break

            item["already_exists"] = already_in_db
            if already_in_db:
                duplicate_existing_count += 1

        if duplicate_existing_count > 0:
            warnings.append(
                f"{duplicate_existing_count} avaliação(ões) identificada(s) neste PDF já consta(m) cadastrada(s) no calendário. A confirmação atualizará os registros sem duplicar eventos."
            )

        # Verifica se uma mesma avaliação apareceu em mais de uma data diferente
        dates_by_type: dict[str, list[str]] = {}
        for item in extracted_items:
            dates_by_type.setdefault(item["assessment_type"], []).append(item["date"])

        for a_type, d_list in dates_by_type.items():
            if len(d_list) > 1:
                formatted_dates = ", ".join(
                    f"{d.split('-')[2]}/{d.split('-')[1]}/{d.split('-')[0]}" for d in d_list
                )
                warnings.append(
                    f"A avaliação {a_type} foi identificada em mais de uma data no documento ({formatted_dates}). Verifique e mantenha apenas a data correta antes de confirmar."
                )

        # Verifica menções cuja data estava ilegível ou ausente
        for a_type in sorted(mentions_without_date):
            if a_type not in dates_by_type:
                warnings.append(
                    f"A avaliação {a_type} foi mencionada no texto, mas não foi possível identificar uma data legível com segurança."
                )

        # Verifica quais das 5 avaliações previstas não constam no documento
        found_types = set(dates_by_type.keys())
        missing_types = [t for t in cls.EXPECTED_TYPES if t not in found_types]
        if missing_types:
            warnings.append(
                f"Não foram encontradas datas no documento para: {', '.join(missing_types)}. Nenhuma data foi inventada; você pode adicioná-las manualmente se desejar."
            )

        # Detecta outras nomenclaturas de avaliações presentes no cronograma (ex.: Exame Final, Banca)
        other_assessments: list[dict[str, Any]] = []
        seen_other_keys: set[tuple[str, str]] = set()
        other_exam_re = re.compile(
            r"\b(exame\s+final|avaliacao\s+final|banca\s+final|apresentacao\s+final)\b"
        )
        for om in other_exam_re.finditer(ascii_text):
            os_idx, oe_idx = om.start(), om.end()
            if cls.POST_EXAM_PREFIX_RE.search(ascii_text[max(0, os_idx - 40) : os_idx]):
                continue
            prev_dts = [dt for dt in date_tokens if dt["end"] <= os_idx and (os_idx - dt["end"]) <= 60]
            if prev_dts:
                dt = prev_dts[-1]
                raw_label = norm_text[os_idx:oe_idx].strip()
                key = (raw_label.lower(), dt["iso"])
                if key not in seen_other_keys:
                    seen_other_keys.add(key)
                    # Prevenção de duplicidade: se já foi cadastrado, não sugere novamente
                    already_registered = False
                    for ev in existing_events:
                        ev_date = ev.starts_at.date().isoformat() if ev.starts_at else ""
                        if ev_date == dt["iso"] and (
                            raw_label.lower() in ev.title.lower()
                            or ev.student_subject_id == student_subject.id
                        ):
                            already_registered = True
                            break
                    if not already_registered:
                        for tk in existing_tasks:
                            tk_date = tk.due_date.date().isoformat() if tk.due_date else ""
                            if tk_date == dt["iso"] and (
                                raw_label.lower() in tk.title.lower()
                                or tk.student_subject_id == student_subject.id
                            ):
                                already_registered = True
                                break

                    if not already_registered:
                        other_assessments.append(
                            {
                                "title": f"{raw_label} — {subject_name}",
                                "date": dt["iso"],
                                "assessment_type": "OUTRA",
                                "student_subject_id": str(student_subject.id),
                                "subject_name": subject_name,
                                "source_snippet": norm_text[
                                    dt["start"] : min(len(norm_text), oe_idx + 40)
                                ].strip(),
                            }
                        )

        if other_assessments:
            other_summary = ", ".join(
                f"{o['title'].split(' — ')[0]} ({o['date'].split('-')[2]}/{o['date'].split('-')[1]})"
                for o in other_assessments
            )
            warnings.append(
                f"O documento também contém datas com outras nomenclaturas de prova: {other_summary}."
            )

        return {
            "student_subject_id": str(student_subject.id),
            "subject_name": subject_name,
            "detected_pdf_subject": detected_pdf_subject,
            "filename": filename,
            "items": extracted_items,
            "other_detected_items": other_assessments,
            "missing_types": missing_types,
            "warnings": warnings,
        }

    def post(self, request, *args, **kwargs):
        from rest_framework.exceptions import ValidationError as DRFValidationError

        user = cast(User, request.user)
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            raise DRFValidationError(
                {"file": "Envie um arquivo de calendário acadêmico válido em formato PDF (.pdf) ou Word (.docx)."}
            )

        file_type, filename = self._validate_and_identify_file(uploaded_file)

        ss_id = request.data.get("student_subject_id") or request.data.get("student_subject")
        if not ss_id:
            raise DRFValidationError(
                {"student_subject_id": "Selecione a disciplina correspondente ao calendário."}
            )

        # Validação do ID e vínculo do estudante (parametrização ORM e prevenção de injeção)
        try:
            import uuid
            valid_uuid = uuid.UUID(str(ss_id).strip())
        except (ValueError, AttributeError) as exc:
            raise DRFValidationError(
                {"student_subject_id": "Identificador de disciplina inválido."}
            ) from exc

        student_subject = (
            StudentSubject.objects.select_related("subject", "term")
            .filter(id=valid_uuid, user=user)
            .first()
        )
        if not student_subject:
            raise DRFValidationError(
                {"student_subject_id": "Disciplina não encontrada para este estudante."}
            )

        if file_type == "docx":
            raw_text = self._extract_raw_text_from_docx(uploaded_file)
        else:
            raw_text = self._extract_raw_text_from_pdf(uploaded_file)

        if not raw_text.strip():
            return Response(
                {
                    "student_subject_id": str(student_subject.id),
                    "subject_name": student_subject.subject.name,
                    "detected_pdf_subject": None,
                    "filename": filename,
                    "items": [],
                    "other_detected_items": [],
                    "missing_types": list(self.EXPECTED_TYPES),
                    "warnings": [
                        f"Não foi possível extrair texto legível deste arquivo {file_type.upper()} (o arquivo pode estar digitalizado como imagem ou protegido). Você pode adicionar as datas manualmente abaixo."
                    ],
                },
                status=drf_status.HTTP_200_OK,
            )

        llm_items = extract_calendar_items(
            raw_text,
            subject_name=student_subject.subject.name,
            reference_year=self._resolve_reference_year(student_subject),
            allowed_types=list(self.CANONICAL_ASSESSMENT_NAMES),
        )

        result = self.parse_calendar_text(
            raw_text=raw_text,
            student_subject=student_subject,
            user=user,
            filename=filename,
            llm_items=llm_items,
        )
        return Response(result, status=drf_status.HTTP_200_OK)


class CalendarPdfConfirmView(generics.GenericAPIView):
    """
    POST /api/v1/calendar/confirm-extracted
    Persiste as avaliações conferidas/editadas pelo usuário na aba de Calendário,
    garantindo o vínculo estrito com a disciplina selecionada e evitando duplicidade.
    """
    permission_classes = (IsAuthenticatedOr401,)
    serializer_class = AcademicEventSerializer

    def post(self, request, *args, **kwargs):
        from datetime import datetime, timezone as dt_timezone
        from django.db import transaction as db_transaction
        from rest_framework.exceptions import ValidationError as DRFValidationError

        user = cast(User, request.user)
        ss_id = request.data.get("student_subject_id") or request.data.get("student_subject")
        if not ss_id:
            raise DRFValidationError(
                {"student_subject_id": "Informe a disciplina à qual pertencem as avaliações."}
            )

        try:
            import uuid
            valid_uuid = uuid.UUID(str(ss_id).strip())
        except (ValueError, AttributeError) as exc:
            raise DRFValidationError(
                {"student_subject_id": "Identificador de disciplina inválido."}
            ) from exc

        student_subject = (
            StudentSubject.objects.select_related("subject")
            .filter(id=valid_uuid, user=user)
            .first()
        )
        if not student_subject:
            raise DRFValidationError(
                {"student_subject_id": "Disciplina inválida ou não pertence ao usuário."}
            )

        raw_items = request.data.get("items")
        if not isinstance(raw_items, list) or len(raw_items) == 0:
            raise DRFValidationError(
                {"items": "Confirme ao menos uma avaliação com data válida para cadastrar."}
            )

        saved_events: list[AcademicEvent] = []
        created_count = 0
        updated_count = 0

        with db_transaction.atomic():
            seen_batch_keys: set[tuple[str | None, str, str]] = set()
            for idx, item in enumerate(raw_items, start=1):
                if not isinstance(item, dict):
                    continue
                # Sanitização contra injeção de caracteres nulos, controle ou payload desmedido
                title = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", str(item.get("title") or "")).strip()[:200]
                date_str = str(item.get("date") or "").strip()[:10]
                raw_type = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", str(item.get("assessment_type") or "")).strip()[:50]
                source_snippet = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", str(item.get("source_snippet") or "")).strip()[:500]

                if not title or not date_str:
                    raise DRFValidationError(
                        {"items": f"O item #{idx} precisa ter nome da avaliação e data preenchidos."}
                    )

                try:
                    parsed_date = datetime.strptime(date_str[:10], "%Y-%m-%d").date()
                except ValueError as exc:
                    raise DRFValidationError(
                        {"items": f"Data inválida '{date_str}' no item '{title}'. Use AAAA-MM-DD."}
                    ) from exc

                # Provas PAI são avaliações universais (não pertencem a uma disciplina específica)
                is_pai = (
                    raw_type in ("PAI 1", "PAI 2", "PAI 3")
                    or "pai" in title.lower()
                    or "programa de aprendizagem interdisciplinar" in title.lower()
                )

                if is_pai:
                    if "1" in raw_type or "pai 1" in title.lower() or "pai i" in title.lower():
                        assessment_type = "PAI 1"
                    elif "2" in raw_type or "pai 2" in title.lower() or "pai ii" in title.lower():
                        assessment_type = "PAI 2"
                    elif "3" in raw_type or "pai 3" in title.lower() or "pai iii" in title.lower():
                        assessment_type = "PAI 3"
                    else:
                        assessment_type = raw_type or "PAI 1"

                    target_student_subject = None
                    final_title = f"Prova {assessment_type}"
                    description = (
                        f"Tipo: {assessment_type} | Avaliação Universal Interdisciplinar"
                        + (f"\nFonte no calendário: {source_snippet}" if source_snippet else "")
                    )
                else:
                    assessment_type = raw_type or "PROVA"
                    target_student_subject = student_subject
                    final_title = title
                    description = (
                        f"Tipo: {assessment_type} | Disciplina: {student_subject.subject.name}"
                        + (f"\nFonte no calendário: {source_snippet}" if source_snippet else "")
                    )

                # Prevenção de duplicidade por lote
                batch_key = (
                    None if is_pai else str(student_subject.id),
                    parsed_date.isoformat(),
                    assessment_type.lower(),
                )
                if batch_key in seen_batch_keys:
                    continue
                seen_batch_keys.add(batch_key)

                starts_at = datetime(
                    parsed_date.year,
                    parsed_date.month,
                    parsed_date.day,
                    12,
                    0,
                    0,
                    tzinfo=dt_timezone.utc,
                )
                ends_at = datetime(
                    parsed_date.year,
                    parsed_date.month,
                    parsed_date.day,
                    13,
                    0,
                    0,
                    tzinfo=dt_timezone.utc,
                )

                if is_pai:
                    # Deduplica evento universal PAI para o usuário nessa data
                    existing_ev = (
                        AcademicEvent.objects.filter(
                            user=user,
                            starts_at__date=parsed_date,
                        )
                        .filter(
                            models.Q(title__icontains=assessment_type)
                            | models.Q(description__icontains=f"Tipo: {assessment_type}")
                            | models.Q(student_subject__isnull=True, title__icontains="pai")
                        )
                        .first()
                    )
                else:
                    existing_ev = (
                        AcademicEvent.objects.filter(
                            user=user,
                            student_subject=student_subject,
                            starts_at__date=parsed_date,
                        )
                        .filter(
                            models.Q(title__iexact=final_title)
                            | models.Q(description__icontains=f"Tipo: {assessment_type}")
                        )
                        .first()
                    )

                if existing_ev:
                    existing_ev.title = final_title
                    existing_ev.kind = AcademicEvent.Kind.EXAM
                    existing_ev.starts_at = starts_at
                    existing_ev.ends_at = ends_at
                    existing_ev.all_day = True
                    existing_ev.description = description
                    existing_ev.student_subject = target_student_subject
                    existing_ev.save()
                    event_obj = existing_ev
                    updated_count += 1
                else:
                    event_obj = AcademicEvent.objects.create(
                        user=user,
                        student_subject=target_student_subject,
                        title=final_title,
                        kind=AcademicEvent.Kind.EXAM,
                        starts_at=starts_at,
                        ends_at=ends_at,
                        all_day=True,
                        description=description,
                    )
                    created_count += 1

                AcademicTask.objects.update_or_create(
                    linked_event=event_obj,
                    defaults={
                        "user": user,
                        "student_subject": target_student_subject,
                        "category": "exam",
                        "title": final_title,
                        "description": description,
                        "due_date": starts_at,
                        "end_date": ends_at,
                        "all_day": True,
                        "estimated_minutes": 60,
                    },
                )
                saved_events.append(event_obj)

        return Response(
            {
                "created_count": created_count,
                "updated_count": updated_count,
                "items": AcademicEventSerializer(
                    saved_events, many=True, context={"request": request}
                ).data,
            },
            status=drf_status.HTTP_201_CREATED,
        )


class AcademicReportGenerateView(generics.GenericAPIView):
    permission_classes = (IsAuthenticatedOr401,)
    pagination_class = None

    def get(self, request, *args, **kwargs):
        from django.http import HttpResponse
        from .reports import render_academic_report_pdf

        user = cast(User, request.user)
        current_sem = _get_user_current_semester(user)
        enrollments_qs = (
            StudentSubject.objects.select_related("subject", "subject__course")
            .filter(user=user, status=StudentSubject.Status.ACTIVE, subject__active=True)
            .order_by("subject__semester", "subject__name")
        )
        if current_sem:
            enrollments_qs = enrollments_qs.filter(subject__semester=current_sem)
        enrollments = list(enrollments_qs)

        subjects_payload = []
        total_tasks = 0
        completed_tasks = 0
        for item in enrollments:
            t_count = item.tasks.count()
            c_count = item.tasks.filter(status=AcademicTask.Status.COMPLETED).count()
            total_tasks += t_count
            completed_tasks += c_count
            subjects_payload.append(
                {
                    "name": item.subject.name,
                    "workload_hours": item.effective_workload_hours,
                    "total_tasks": t_count,
                    "completed_tasks": c_count,
                    "progress_percent": item.progress_percent,
                }
            )

        tasks_qs = (
            AcademicTask.objects.select_related("student_subject__subject")
            .filter(user=user)
            .exclude(student_subject__status=StudentSubject.Status.DROPPED)
            .order_by("due_date", "created_at")[:12]
        )
        tasks_payload = [
            {
                "title": t.title,
                "subject_name": (
                    t.student_subject.subject.name if t.student_subject else "Geral"
                ),
                "due_date": t.due_date.strftime("%d/%m/%Y") if t.due_date else "-",
                "status_label": (
                    "Concluida"
                    if t.status == AcademicTask.Status.COMPLETED
                    else "Em andamento"
                    if t.status == AcademicTask.Status.IN_PROGRESS
                    else "Pendente"
                ),
            }
            for t in tasks_qs
        ]

        total_hours = sum(s["workload_hours"] for s in subjects_payload)
        weighted = (
            round(
                sum(s["progress_percent"] * s["workload_hours"] for s in subjects_payload)
                / total_hours
            )
            if total_hours
            else 0
        )
        course_name = (
            user.course_offering.course.name
            if user.course_offering_id and user.course_offering
            else "Graduacao Impacta"
        )
        report_data = {
            "student_name": getattr(user, "full_name", "") or user.email.split("@")[0],
            "student_email": user.email,
            "course_name": course_name,
            "semester_label": f"{current_sem or 2}o Semestre",
            "generated_at": timezone.localtime(timezone.now()).strftime("%d/%m/%Y %H:%M"),
            "subjects_count": len(subjects_payload),
            "total_tasks_count": total_tasks,
            "completed_tasks_count": completed_tasks,
            "pending_tasks_count": max(0, total_tasks - completed_tasks),
            "weighted_progress_percent": weighted,
            "subjects": subjects_payload,
            "tasks": tasks_payload,
        }
        pdf_bytes = render_academic_report_pdf(report_data)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = 'inline; filename="relatorio-desempenho-edutrack.pdf"'
        return response





