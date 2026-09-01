from rest_framework import generics, permissions

from .models import CourseOffering
from .serializers import CourseOfferingSerializer


class CourseOfferingListView(generics.ListAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = CourseOfferingSerializer
    pagination_class = None

    def get_queryset(self):
        return CourseOffering.objects.select_related("course").filter(
            active=True, course__active=True
        )
