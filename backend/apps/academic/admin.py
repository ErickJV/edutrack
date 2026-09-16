from django.contrib import admin

from .models import AcademicTask, StudentSubject, StudyFolder, StudyNote, Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "course", "semester", "workload_hours", "active")
    list_filter = ("course", "semester", "active")
    search_fields = ("name", "code", "course__name")


@admin.register(StudentSubject)
class StudentSubjectAdmin(admin.ModelAdmin):
    list_display = ("user", "subject", "status", "professor_name", "created_at")
    list_filter = ("status", "subject__course")
    search_fields = ("user__email", "subject__name", "professor_name")


@admin.register(AcademicTask)
class AcademicTaskAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "student_subject", "status", "due_date")
    list_filter = ("status", "student_subject__subject__course")
    search_fields = ("title", "description", "user__email")


@admin.register(StudyFolder)
class StudyFolderAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "color", "icon", "created_at")
    list_filter = ("color",)
    search_fields = ("name", "user__email")


@admin.register(StudyNote)
class StudyNoteAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "folder", "methodology", "created_at", "updated_at")
    list_filter = ("methodology",)
    search_fields = ("title", "content", "user__email")

