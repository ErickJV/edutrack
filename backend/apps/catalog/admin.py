from django.contrib import admin

from .models import Course, CourseOffering


class CourseOfferingInline(admin.TabularInline):
    model = CourseOffering
    extra = 0


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("name", "degree_type", "active", "updated_at")
    list_filter = ("degree_type", "active")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = (CourseOfferingInline,)


@admin.register(CourseOffering)
class CourseOfferingAdmin(admin.ModelAdmin):
    list_display = ("course", "modality", "active", "display_order")
    list_filter = ("modality", "active", "course__degree_type")
    search_fields = ("course__name", "external_slug")
    autocomplete_fields = ("course",)
