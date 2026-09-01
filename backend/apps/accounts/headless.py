from allauth.headless.adapter import DefaultHeadlessAdapter

from apps.legal.services import has_current_acceptances


class EduTrackHeadlessAdapter(DefaultHeadlessAdapter):
    def serialize_user(self, user):
        data = super().serialize_user(user)
        offering = getattr(user, "course_offering", None)
        data.update(
            {
                "email": user.email,
                "full_name": user.full_name,
                "profile_complete": user.profile_complete and has_current_acceptances(user),
                "course_offering": (
                    {
                        "id": str(offering.id),
                        "course_name": offering.course.name,
                        "degree_type": offering.course.degree_type,
                        "degree_type_label": offering.course.get_degree_type_display(),
                        "modality": offering.modality,
                        "modality_label": offering.get_modality_display(),
                        "label": str(offering),
                    }
                    if offering
                    else None
                ),
            }
        )
        return data
