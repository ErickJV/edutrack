from rest_framework import serializers

from .models import CourseOffering


class CourseOfferingSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name")
    course_slug = serializers.CharField(source="course.slug")
    degree_type = serializers.CharField(source="course.degree_type")
    degree_type_label = serializers.CharField(source="course.get_degree_type_display")
    modality_label = serializers.CharField(source="get_modality_display")
    label = serializers.SerializerMethodField()  # type: ignore[assignment]

    class Meta:
        model = CourseOffering
        fields = (
            "id",
            "course_name",
            "course_slug",
            "degree_type",
            "degree_type_label",
            "modality",
            "modality_label",
            "label",
        )

    def get_label(self, obj: CourseOffering) -> str:
        return str(obj)
