from collections.abc import Callable

from django.http import HttpRequest, HttpResponse


class SecurityHeadersMiddleware:
    """Cabeçalhos seguros que também se aplicam às respostas da API."""

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
        )
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        )
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        return response
