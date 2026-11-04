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

        # 2. Academic events
        if not kind_filter or kind_filter in ("exam", "assignment", "other"):
            from django.db.models import Q
            event_qs = AcademicEvent.objects.select_related(
                "student_subject__subject"
            ).filter(
                user=user,
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

        # 3. Task due dates (no kind filter or kind==task)
        if not kind_filter or kind_filter == "task":
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
            for task in task_qs:
                items.append({
                    "id": f"task:{task.id}",
                    "source_type": "task",
                    "source_id": str(task.id),
                    "title": task.title,
                    "description": task.description,
                    "starts_at": task.due_date.isoformat(),
                    "ends_at": task.due_date.isoformat(),
                    "room": "",
                    "student_subject_id": str(task.student_subject_id),
                    "subject_name": task.student_subject.subject.name,
                    "cancelled": False,
                    "attendance_status": None,
                    "all_day": False,
                    "kind": "task",
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
