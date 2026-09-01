from django.contrib import admin

from .models import LegalAcceptance, LegalDocument


@admin.register(LegalDocument)
class LegalDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "version", "active", "is_draft", "published_at")
    list_filter = ("kind", "active", "is_draft")
    search_fields = ("title", "version")


@admin.register(LegalAcceptance)
class LegalAcceptanceAdmin(admin.ModelAdmin):
    list_display = ("user", "document", "accepted_at")
    list_filter = ("document__kind", "document__version")
    search_fields = ("user__email",)
    readonly_fields = ("user", "document", "accepted_at")
