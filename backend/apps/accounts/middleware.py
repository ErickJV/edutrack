from collections.abc import Callable

from allauth.usersessions.models import UserSession
from django.http import HttpRequest, HttpResponse


class EnsureUserSessionMiddleware:
    """Garante que a sessão atual apareça na lista de sessões ativas do usuário.

    O allauth só cria ``UserSession`` no login; sessões abertas antes da instalação
    do ``allauth.usersessions`` ficariam invisíveis. A marcação na sessão evita
    repetir a consulta a cada requisição.
    """

    SESSION_FLAG = "_edutrack_user_session_synced"

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if request.user.is_authenticated and self.SESSION_FLAG not in request.session:
            session_key = request.session.session_key
            if not session_key or not UserSession.objects.filter(session_key=session_key).exists():
                UserSession.objects.create_from_request(request)
            request.session[self.SESSION_FLAG] = True
        return self.get_response(request)
