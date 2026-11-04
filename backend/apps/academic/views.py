import re
from typing import Any, cast
from uuid import UUID

from django.utils import timezone
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.accounts.models import User

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
    StudyFolder,
    StudyNote,
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
        course_enrollments = StudentSubject.objects.filter(
            user=user,
            subject__course=current_course,
            subject__active=True,
            status=StudentSubject.Status.ACTIVE,
        )
        if not course_enrollments.exists():
            first_sem_subjects = Subject.objects.filter(
                course=current_course, semester=1, active=True
            )
            for subj in first_sem_subjects:
                enrollment, _ = StudentSubject.objects.get_or_create(
                    user=user,
                    subject=subj,
                    defaults={"status": StudentSubject.Status.ACTIVE},
                )
                if enrollment.status != StudentSubject.Status.ACTIVE:
                    enrollment.status = StudentSubject.Status.ACTIVE
                    enrollment.save(update_fields=("status", "updated_at"))

        queryset = (
            StudentSubject.objects.select_related("subject", "subject__course")
            .filter(user=user, subject__course=current_course, subject__active=True)
            .order_by("subject__semester", "subject__name")
        )
        status_param = self.request.query_params.get("status")
        if status_param == "all":
            return queryset
        if status_param in StudentSubject.Status.values:
            return queryset.filter(status=status_param)
        return queryset.filter(status=StudentSubject.Status.ACTIVE)

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
        queryset = AcademicTask.objects.select_related(
            "student_subject", "student_subject__subject", "linked_event", "user"
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
                event_qs = event_qs.filter(student_subject_id=ss_id)
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
                    "subject_name": ev.student_subject.subject.name if ev.student_subject else None,
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
                task_qs = task_qs.filter(student_subject_id=ss_id)
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
                        else "Geral / Outras Atividades"
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
        Motor Semântico de Elaboração de Flashcards por Raciocínio Lógico.
        Classifica proposições da anotação nos eixos cognitivos de Avaliação Crítica,
        Finalidade e Abstração Seletiva, Análise Multivariável / Tomada de Decisão,
        Trade-offs Arquiteturais e Causa-Efeito / Pensamento Contrafactual.
        """
        cards: list[dict[str, str]] = []
        seen_signatures: set[str] = set()

        def add_card(front: str, back: str, hint: str, tags: str) -> None:
            sig = front[:80].lower()
            if sig not in seen_signatures and len(cards) < count:
                seen_signatures.add(sig)
                cards.append({
                    "front": front.strip(),
                    "back": back.strip(),
                    "hint": hint.strip()[:255],
                    "tags": tags.strip()[:255],
                })

        context_clause = (
            f"em {core_theme} ({subject_title})"
            if subject_title and subject_title.lower() not in core_theme.lower() and subject_title != "Estudos Acadêmicos"
            else f"em {core_theme}"
        )

        for ln in lines:
            if len(cards) >= count:
                break

            match = re.match(r"^([^:–—\-]{2,70})\s*[:–—\-]\s*(.{10,})$", ln)
            prefix = match.group(1).strip() if match else ""
            body = match.group(2).strip() if match else ln.strip()
            prefix_lower = prefix.lower()
            body_lower = body.lower()
            full_lower = ln.lower()

            # EIXO 1: Validação Crítica / Pergunta Norteadora / Critério de Aderência
            quoted_q = re.search(r"[\"“”']([^\"“”']+\?)[\"“”']|([^:]+?\?)", body)
            if quoted_q or "aderente" in full_lower or "específica" in full_lower:
                guiding_question = (
                    (quoted_q.group(1) or quoted_q.group(2)).strip()
                    if quoted_q
                    else body.strip(" \"'“”")
                )
                concept_focus = (
                    prefix
                    if prefix and not cls.META_PREFIX_REGEX.match(prefix) and not cls._is_generic_title(prefix)
                    else core_theme
                )
                add_card(
                    front=(
                        f"Ao trabalhar com {concept_focus} ({subject_title}), por que o questionamento "
                        f"\"{guiding_question}\" exige raciocínio crítico contextual em vez da adoção mecânica de um modelo padrão?"
                    ),
                    back=(
                        f"• Raciocínio Crítico: A validade lógica de uma solução em {concept_focus} não é absoluta; ela depende da aderência real às restrições e objetivos do problema (\"{guiding_question}\").\n"
                        f"• Implicação Prática: Adotar uma abstração sem julgar sua aderência leva à sobre-engenharia (complexidade excessiva) ou à sub-especificação (incapacidade de atender regras críticas).\n"
                        f"• Regra de Decisão: Validar se cada componente do modelo responde diretamente às demandas da aplicação em {subject_title}."
                    ),
                    hint="Relacione a validade do modelo às restrições específicas da aplicação vs. soluções genéricas",
                    tags="ia, raciocinio-logico, avaliacao-critica",
                )
                continue

            # EIXO 2: Finalidade, Propósito e Abstração Seletiva
            if (
                re.match(r"^(objetivos?|metas?|propósitos?|finalidades?)$", prefix_lower)
                or "capturar aspectos" in full_lower
                or "interesse da situação" in full_lower
            ):
                add_card(
                    front=(
                        f"Sob a ótica da abstração lógica {context_clause}, por que o propósito deve ser "
                        f"\"{body}\" e qual o impacto sistêmico de falhar nesse filtro de relevância?"
                    ),
                    back=(
                        f"• Princípio da Abstração Seletiva: O foco analítico consiste em {body}.\n"
                        f"• Relação de Causa e Efeito: Tentar representar todos os elementos da realidade sem filtro gera ruído cognitivo e inviabiliza a implementação; omitir variáveis de interesse da situação invalida as conclusões do modelo.\n"
                        f"• Aplicação Prática: Distinguir rigorosamente o que é essencial para o domínio em {subject_title} daquilo que é detalhe acidental."
                    ),
                    hint="Pense no papel do filtro seletivo (essencial vs. ruído) ao abstrair um problema real",
                    tags="ia, raciocinio-logico, abstracao, causa-e-efeito",
                )
                continue

            # EIXO 3: Análise Multivariável e Tomada de Decisão em Cenário Prático
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
                    front=(
                        f"Em um cenário prático de projeto {context_clause}, de que maneira a interação entre "
                        f"múltiplas variáveis ({factors_summary}) condiciona a tomada de decisão técnica e quais riscos surgem ao analisá-las isoladamente?"
                    ),
                    back=(
                        f"• Variáveis Interdependentes: A decisão exige ponderar em conjunto: {factors_summary}.\n"
                        f"• Raciocínio de Cenário: Escopo/tamanho do projeto e volatilidade dos requisitos definem o grau de formalismo e prototipação, enquanto a escolha tecnológica é limitada pela experiência e conhecimento real da equipe.\n"
                        f"• Consequência de Negligência: Desconsiderar o equilíbrio entre fatores técnicos e humanos produz soluções teoricamente elegantes, porém inviáveis de implementar ou manter em {subject_title}."
                    ),
                    hint="Analise como escopo, requisitos, tecnologia e maturidade da equipe se restringem mutuamente",
                    tags="ia, raciocinio-logico, tomada-de-decisao, cenario",
                )
                continue

            # EIXO 4: Trade-offs de Abstração, Complexidade, Manutenção e Evolução
            if (
                "mais detalhad" in full_lower
                or "menos complex" in full_lower
                or "manter" in full_lower
                or "evolução" in full_lower
                or "nossos modelos" in prefix_lower
                or ";" in body
            ):
                add_card(
                    front=(
                        f"Qual é o dilema técnico (trade-off) {context_clause} entre o nível de abstração dos requisitos e a complexidade de implementação, "
                        f"e como as propriedades \"{body}\" asseguram a evolução sustentável do sistema?"
                    ),
                    back=(
                        f"• Equilíbrio Estrutural (Trade-off): A solução deve operar no ponto ótimo onde os artefatos são {body}.\n"
                        f"• Justificativa Lógica: Se o nível for superficial como requisitos brutos, faltará precisão para guiar a construção; se tiver a mesma complexidade do código final, perde-se a clareza de entendimento e o baixo custo de mudança.\n"
                        f"• Impacto no Ciclo de Vida: Manter essa separação lógica garante que o sistema em {subject_title} seja facilmente compreendido, mantido e evoluído."
                    ),
                    hint="Compare o custo cognitivo dos dois extremos: requisitos vagos vs. código de baixo nível",
                    tags="ia, raciocinio-logico, trade-offs, arquitetura",
                )
                continue

            # EIXO 5: Conceito Técnico Real com Raciocínio de Causa, Efeito e Pensamento Contrafactual
            if prefix and not cls.META_PREFIX_REGEX.match(prefix) and not cls._is_generic_title(prefix):
                add_card(
                    front=(
                        f"Qual é o papel lógico de \"{prefix}\" {context_clause}, como ele se conecta a \"{body[:90]}\" "
                        f"e que falha ocorreria no projeto caso esse princípio fosse violado?"
                    ),
                    back=(
                        f"• Fundamento e Papel Lógico: {prefix} estabelece que {body}.\n"
                        f"• Análise Contrafactual (E se for violado?): Sem aplicar corretamente {prefix}, o sistema perde consistência estrutural e previsibilidade diante de casos-limite em {subject_title}.\n"
                        f"• Critério de Verificação: Confirmar como {prefix} sustenta as decisões práticas do domínio."
                    ),
                    hint=f"Relacione a premissa de {prefix[:35]} com a consequência de sua ausência",
                    tags="ia, raciocinio-logico, causa-e-efeito",
                )
            elif len(body) >= 25:
                add_card(
                    front=(
                        f"Analise criticamente a premissa estudada {context_clause}: \"{body}\". "
                        f"Por que essa condição é logicamente necessária e como validá-la na prática?"
                    ),
                    back=(
                        f"• Proposição Base: {body}.\n"
                        f"• Dedução Lógica: Essa premissa atua como restrição orientadora em {core_theme}, evitando decisões arbitrárias durante a resolução de problemas.\n"
                        f"• Validação Prática: Verificar se o comportamento observado em {subject_title} preserva essa propriedade sob diferentes cenários."
                    ),
                    hint="Avalie por que essa afirmação funciona como uma condição lógica necessária",
                    tags="ia, raciocinio-logico, analise-critica",
                )

        # Complemento analítico de domínio se o número de cartões pedidos for maior que as proposições da nota
        analytical_fallbacks = [
            {
                "front": (
                    f"Em um problema complexo de {core_theme} ({subject_title}), qual raciocínio lógico deve guiar a escolha "
                    f"entre uma solução altamente acoplada/otimizada e uma arquitetura modular e evolutiva?"
                ),
                "back": (
                    f"• Análise de Trade-off: Soluções fortemente acopladas podem reduzir latência imediata, mas elevam exponencialmente o custo de manutenção diante de mudanças de requisitos em {core_theme}.\n"
                    f"• Critério de Decisão: Avaliar a taxa esperada de mudança do domínio, o tamanho do projeto e a necessidade de evolução contínua em {subject_title}.\n"
                    f"• Conclusão Lógica: Priorizar clareza, coesão e facilidade de manutenção sempre que o sistema precisar evoluir."
                ),
                "hint": "Pondere o custo de mudança futura vs. ganho imediato",
                "tags": "ia, raciocinio-logico, trade-offs",
            },
            {
                "front": (
                    f"Como aplicar o pensamento contrafactual para validar se uma decisão técnica em {core_theme} "
                    f"realmente resolve a causa-raiz do problema em {subject_title}?"
                ),
                "back": (
                    f"• Teste Contrafactual: Perguntar 'Se alterarmos o volume de dados, os requisitos ou a tecnologia base, esta modelagem em {core_theme} continua coerente ou entra em colapso?'.\n"
                    f"• Diagnóstico de Causa-Raiz: Separa sintomas superficiais das restrições estruturais do domínio.\n"
                    f"• Resultado: Garante que a solução seja aderente ao contexto real e resiliente à evolução."
                ),
                "hint": "Teste os limites da solução alterando as variáveis do cenário",
                "tags": "ia, raciocinio-logico, validacao",
            },
            {
                "front": (
                    f"De que forma o excesso de detalhamento precoce (sobre-engenharia) e a falta de especificação "
                    f"afetam de maneiras opostas o sucesso de um projeto em {core_theme}?"
                ),
                "back": (
                    f"• Sub-especificação: Deixa lacunas lógicas que forçam decisões improvisadas durante a codificação em {subject_title}, gerando retrabalho.\n"
                    f"• Sobre-engenharia (Over-engineering): Introduz complexidade acidental antes de validar se o modelo é aderente à aplicação específica.\n"
                    f"• Ponto de Equilíbrio: Capturar exatamente os aspectos da realidade de interesse da situação, mantendo o modelo mais detalhado que os requisitos e menos complexo que o código."
                ),
                "hint": "Compare os riscos da ambiguidade com os riscos da complexidade acidental",
                "tags": "ia, raciocinio-logico, sintese",
            },
            {
                "front": (
                    f"Ao revisar {core_theme} antes de uma avaliação prática de {subject_title}, quais perguntas "
                    f"de causa e efeito permitem comprovar domínio profundo do tema (além da simples memorização)?"
                ),
                "back": (
                    f"1. Por que este modelo/solução existe e qual problema real ele abstrai?\n"
                    f"2. Quais fatores técnicos e humanos (requisitos, tamanho do projeto, tecnologia, experiência) condicionam sua aplicação?\n"
                    f"3. Quais são os trade-offs assumidos e sob qual cenário esta abordagem deixa de ser aderente?"
                ),
                "hint": "Por que existe + Quais variáveis condicionam + Quais os limites/trade-offs",
                "tags": "ia, raciocinio-logico, revisao-profunda",
            },
        ]

        for fb in analytical_fallbacks:
            if len(cards) >= count:
                break
            add_card(fb["front"], fb["back"], fb["hint"], fb["tags"])

        return cards[:count]

    def post(self, request, *args, **kwargs):
        import html
        import json
        import os
        import re
        import urllib.request
        from rest_framework import status as drf_status
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

        generated_specs: list[dict[str, str]] = []

        # 1. Tenta geração via Gemini API se houver chave configurada no ambiente, com prompt socrático rigoroso
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if api_key:
            try:
                prompt = (
                    f"Você é um professor universitário sênior especialista em aprendizagem baseada em problemas, "
                    f"método socrático e Taxonomia de Bloom (níveis de Aplicação, Análise, Avaliação e Síntese).\n"
                    f"Elabore exatamente {count} flashcards de alta profundidade em português do Brasil sobre:\n"
                    f"- Disciplina: {subject_title}\n"
                    f"- Tema Central: {core_theme}\n"
                    f"- Conteúdo da Anotação: {clean_source[:4000] if clean_source else full_context_label}\n\n"
                    f"REGRAS OBRIGATÓRIAS DE QUALIDADE:\n"
                    f"1. PROIBIDO gerar perguntas superficiais de mera definição de nomenclatura (ex.: 'O que é X?', 'Defina Y', 'O que significa Objetivo?').\n"
                    f"2. PROIBIDO usar títulos genéricos como 'Nova anotação' ou fragmentos conversacionais ('Temos que considerar', 'Nossos modelos') como conceitos isolados.\n"
                    f"3. Cada pergunta ('front') DEVE estimular o raciocínio lógico: análise de cenários práticos, relações de causa e efeito, avaliação de trade-offs técnicos, validação crítica de aderência ou pensamento contrafactual ('o que acontece se esta premissa for violada?').\n"
                    f"4. Cada resposta ('back') DEVE ser estruturada em tópicos claros contendo o raciocínio lógico, a justificativa causal e a implicação prática.\n\n"
                    f"Retorne APENAS um JSON array válido onde cada objeto tem as chaves: "
                    f"\"front\", \"back\", \"hint\" e \"tags\"."
                )
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
                req_body = json.dumps({
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"},
                }).encode("utf-8")
                req = urllib.request.Request(
                    url, data=req_body, headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=12) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    text_out = (
                        resp_data.get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [{}])[0]
                        .get("text", "")
                    )
                    parsed = json.loads(text_out)
                    if isinstance(parsed, list):
                        for item in parsed[:count]:
                            if isinstance(item, dict) and item.get("front") and item.get("back"):
                                generated_specs.append({
                                    "front": str(item["front"]).strip(),
                                    "back": str(item["back"]).strip(),
                                    "hint": str(item.get("hint") or "Raciocínio lógico e análise").strip()[:255],
                                    "tags": str(item.get("tags") or "ia, raciocinio-logico").strip()[:255],
                                })
            except Exception:
                generated_specs = []

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


