from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import AcademicTask, StudentSubject, Subject


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


class StudentSubjectSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    progress_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = StudentSubject
        fields = (
            "id",
            "subject",
            "professor_name",
            "status",
            "semester_period",
            "progress_percent",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class StudentSubjectSelectionSerializer(serializers.Serializer):
    semester_period = serializers.CharField(required=False, allow_blank=True)
    subject_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        min_length=1,
    )

    def validate_subject_ids(self, value):
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
        StudentSubject.objects.filter(user=user).delete()
        enrollments = [
            StudentSubject.objects.create(
                user=user,
                subject=self._subjects[subject_id],
                semester_period=semester_period,
                status=StudentSubject.Status.ACTIVE,
            )
            for subject_id in self.validated_data["subject_ids"]
        ]
        return enrollments


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
