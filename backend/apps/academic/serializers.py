from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import AcademicEvent, AcademicTask, AcademicTerm, Professor, StudentSubject, Subject


class SubjectSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)

    class Meta:
        model = Subject
        fields = (
            "id",
            "course",
            "course_name",
            "name",
            "code",
            "semester",
            "workload_hours",
            "description",
            "active",
        )
        read_only_fields = fields


class AcademicTermSerializer(serializers.ModelSerializer):
    name = serializers.CharField(min_length=1, max_length=100, trim_whitespace=True)
    timezone = serializers.CharField(required=False, default="America/Sao_Paulo", max_length=64)

    class Meta:
        model = AcademicTerm
        fields = (
            "id",
            "name",
            "start_date",
            "end_date",
            "timezone",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_timezone(self, value):
        import zoneinfo

        if value not in zoneinfo.available_timezones():
            raise serializers.ValidationError("Fuso horário IANA inválido.")
        return value

    def validate(self, attrs):
        start = attrs.get("start_date") or getattr(self.instance, "start_date", None)
        end = attrs.get("end_date") or getattr(self.instance, "end_date", None)
        if start and end:
            if start > end:
                raise serializers.ValidationError(
                    {"start_date": "Data inicial não pode ser posterior à data final."}
                )
            if (end - start).days > 366:
                raise serializers.ValidationError(
                    {"end_date": "Duração máxima do semestre é de 366 dias."}
                )
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        return AcademicTerm.objects.create(user=user, **validated_data)


class ProfessorSerializer(serializers.ModelSerializer):
    name = serializers.CharField(min_length=1, max_length=120, trim_whitespace=True)

    class Meta:
        model = Professor
        fields = ("id", "name", "active", "created_at")
        read_only_fields = ("id", "active", "created_at")

    def create(self, validated_data):
        user = self.context["request"].user
        return Professor.objects.create(user=user, **validated_data)


class StudentSubjectSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    professor = ProfessorSerializer(read_only=True)
    term = AcademicTermSerializer(read_only=True)
    display_professor_name = serializers.CharField(read_only=True)
    progress_percent = serializers.IntegerField(read_only=True)
    effective_workload_hours = serializers.IntegerField(read_only=True)

    class Meta:
        model = StudentSubject
        fields = (
            "id",
            "subject",
            "professor",
            "professor_name",
            "display_professor_name",
            "term",
            "custom_workload_hours",
            "effective_workload_hours",
            "status",
            "semester_period",
            "progress_percent",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "subject",
            "professor",
            "term",
            "display_professor_name",
            "status",
            "semester_period",
            "progress_percent",
            "effective_workload_hours",
            "created_at",
            "updated_at",
        )


class StudentSubjectUpdateSerializer(serializers.ModelSerializer):
    custom_workload_hours = serializers.IntegerField(
        required=False, allow_null=True, min_value=1, max_value=2000
    )
    professor_name = serializers.CharField(
        required=False, allow_blank=True, max_length=120, trim_whitespace=True
    )
    professor_id = serializers.UUIDField(required=False, allow_null=True)
    term_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = StudentSubject
        fields = ("id", "professor_name", "custom_workload_hours", "professor_id", "term_id")

    def validate_professor_id(self, value):
        if value is None:
            return None
        user = self.context["request"].user
        try:
            return Professor.objects.get(id=value, user=user)
        except Professor.DoesNotExist as exc:
            raise serializers.ValidationError("Professor não encontrado.") from exc

    def validate_term_id(self, value):
        if value is None:
            return None
        user = self.context["request"].user
        try:
            return AcademicTerm.objects.get(id=value, user=user)
        except AcademicTerm.DoesNotExist as exc:
            raise serializers.ValidationError("Semestre letivo não encontrado.") from exc

    def update(self, instance, validated_data):
        if "professor_id" in validated_data:
            prof = validated_data.pop("professor_id")
            instance.professor = prof
            if prof:
                instance.professor_name = prof.name
        if "term_id" in validated_data:
            instance.term = validated_data.pop("term_id")
        return super().update(instance, validated_data)


class StudentSubjectSelectionSerializer(serializers.Serializer):
    semester_period = serializers.CharField(required=False, allow_blank=True)
    subject_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=True,
    )

    def validate_subject_ids(self, value):
        if not value:
            self._subjects = {}
            return value
        request = self.context["request"]
        user = request.user
        course = getattr(user.course_offering, "course", None)
        subjects = list(Subject.objects.filter(id__in=value, course=course, active=True))
        if len(subjects) != len(set(value)):
            raise serializers.ValidationError(
                "Uma ou mais disciplinas não pertencem à matriz do seu curso."
            )
        self._subjects = {subject.id: subject for subject in subjects}
        return value

    @transaction.atomic
    def save(self, **kwargs):
        request = self.context["request"]
        user = request.user
        semester_period = self.validated_data.get("semester_period", "")
        selected_ids = set(self.validated_data.get("subject_ids", []))

        existing_enrollments = {
            enrollment.subject_id: enrollment
            for enrollment in StudentSubject.objects.filter(user=user)
        }

        # 1. Arquivar desmarcadas (DROPPED), preservando histórico e tarefas
        for subj_id, enrollment in existing_enrollments.items():
            if subj_id not in selected_ids and enrollment.status == StudentSubject.Status.ACTIVE:
                enrollment.status = StudentSubject.Status.DROPPED
                enrollment.save(update_fields=("status", "updated_at"))

        # 2. Reativar existentes ou criar novas
        result = []
        for subj_id in self.validated_data.get("subject_ids", []):
            if subj_id in existing_enrollments:
                enrollment = existing_enrollments[subj_id]
                update_fields = []
                if enrollment.status != StudentSubject.Status.ACTIVE:
                    enrollment.status = StudentSubject.Status.ACTIVE
                    update_fields.append("status")
                if semester_period and enrollment.semester_period != semester_period:
                    enrollment.semester_period = semester_period
                    update_fields.append("semester_period")
                if update_fields:
                    update_fields.append("updated_at")
                    enrollment.save(update_fields=update_fields)
                result.append(enrollment)
            else:
                enrollment = StudentSubject.objects.create(
                    user=user,
                    subject=self._subjects[subj_id],
                    semester_period=semester_period,
                    status=StudentSubject.Status.ACTIVE,
                )
                result.append(enrollment)

        return result


class AcademicTaskSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="student_subject.subject.name", read_only=True)
    subject_id = serializers.UUIDField(source="student_subject.subject.id", read_only=True)
    subject_semester = serializers.IntegerField(
        source="student_subject.subject.semester", read_only=True
    )

    class Meta:
        model = AcademicTask
        fields = (
            "id",
            "student_subject",
            "subject_id",
            "subject_name",
            "subject_semester",
            "title",
            "description",
            "due_date",
            "status",
            "estimated_minutes",
            "actual_minutes",
            "completed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "completed_at",
            "created_at",
            "updated_at",
            "subject_id",
            "subject_name",
            "subject_semester",
        )


class DashboardSummarySerializer(serializers.Serializer):
    subjects_count = serializers.IntegerField()
    pending_tasks_count = serializers.IntegerField()
    completed_tasks_count = serializers.IntegerField()
    planned_minutes_total = serializers.IntegerField()
    actual_minutes_total = serializers.IntegerField()
    weighted_progress_percent = serializers.IntegerField()
    upcoming_tasks = AcademicTaskSerializer(many=True)


class AcademicTaskWriteSerializer(serializers.ModelSerializer):
    student_subject = serializers.PrimaryKeyRelatedField(
        queryset=StudentSubject.objects.select_related("subject")
    )

    class Meta:
        model = AcademicTask
        fields = (
            "id",
            "student_subject",
            "title",
            "description",
            "due_date",
            "status",
            "estimated_minutes",
            "actual_minutes",
            "completed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "completed_at", "created_at", "updated_at")

    def validate_student_subject(self, value):
        request = self.context["request"]
        if value.user_id != request.user.id:
            raise serializers.ValidationError(
                "A disciplina selecionada não pertence ao estudante autenticado."
            )
        if value.status != StudentSubject.Status.ACTIVE:
            raise serializers.ValidationError(
                "Não é possível vincular tarefas a uma disciplina arquivada."
            )
        return value

    def create(self, validated_data):
        if validated_data.get("status") == AcademicTask.Status.COMPLETED and not validated_data.get(
            "completed_at"
        ):
            validated_data["completed_at"] = timezone.now()
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        status = validated_data.get("status", instance.status)
        if status == AcademicTask.Status.COMPLETED and instance.completed_at is None:
            validated_data["completed_at"] = timezone.now()
        elif status != AcademicTask.Status.COMPLETED:
            validated_data["completed_at"] = None
        return super().update(instance, validated_data)


class AcademicEventSerializer(serializers.ModelSerializer):
    title = serializers.CharField(min_length=1, max_length=200, trim_whitespace=True)
    student_subject_id = serializers.UUIDField(required=False, allow_null=True)
    subject_name = serializers.CharField(source="student_subject.subject.name", read_only=True)

    class Meta:
        model = AcademicEvent
        fields = (
            "id",
            "title",
            "kind",
            "starts_at",
            "ends_at",
            "all_day",
            "room",
            "description",
            "student_subject_id",
            "subject_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "subject_name", "created_at", "updated_at")

    def validate_student_subject_id(self, value):
        if value is None:
            return None
        user = self.context["request"].user
        try:
            return StudentSubject.objects.get(id=value, user=user)
        except StudentSubject.DoesNotExist as exc:
            raise serializers.ValidationError("Disciplina do aluno não encontrada.") from exc

    def validate(self, attrs):
        starts_at = attrs.get("starts_at") or getattr(self.instance, "starts_at", None)
        ends_at = attrs.get("ends_at") or getattr(self.instance, "ends_at", None)
        all_day = attrs.get("all_day", getattr(self.instance, "all_day", False))
        if starts_at and ends_at:
            if ends_at < starts_at:
                raise serializers.ValidationError(
                    {"ends_at": "Término não pode ser anterior ao início."}
                )
            if all_day and ends_at == starts_at:
                raise serializers.ValidationError(
                    {"ends_at": "Evento de dia inteiro exige término posterior ao início."}
                )
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        student_subject = validated_data.pop("student_subject_id", None)
        return AcademicEvent.objects.create(
            user=user, student_subject=student_subject, **validated_data
        )

    def update(self, instance, validated_data):
        if "student_subject_id" in validated_data:
            instance.student_subject = validated_data.pop("student_subject_id")
        return super().update(instance, validated_data)
