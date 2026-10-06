import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

for _env_candidate in (BASE_DIR.parent / ".env", BASE_DIR / ".env"):
    if _env_candidate.is_file():
        with open(_env_candidate, encoding="utf-8") as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _v = _line.split("=", 1)
                    os.environ.setdefault(_k.strip(), _v.strip())
        break


def env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).lower() in {"1", "true", "yes", "on"}


SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "unsafe-local-development-key")
DEBUG = env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "DJANGO_CSRF_TRUSTED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000",
    ).split(",")
    if origin.strip()
]
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
LOGIN_REDIRECT_URL = f"{FRONTEND_URL}/home"
LOGOUT_REDIRECT_URL = f"{FRONTEND_URL}/entrar"

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "rest_framework",
    "drf_spectacular",
    "allauth",
    "allauth.account",
    "allauth.headless",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "apps.catalog.apps.CatalogConfig",
    "apps.accounts.apps.AccountsConfig",
    "apps.legal.apps.LegalConfig",
    "apps.academic.apps.AcademicConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "edutrack.middleware.SecurityHeadersMiddleware",
]

ROOT_URLCONF = "edutrack.urls"
WSGI_APPLICATION = "edutrack.wsgi.application"
ASGI_APPLICATION = "edutrack.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

DB_ENGINE = os.getenv("DB_ENGINE", "postgresql").lower()
if DB_ENGINE == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "edutrack"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }

AUTH_USER_MODEL = "accounts.User"
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 12},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.ScryptPasswordHasher",
]
PASSWORD_RESET_TIMEOUT = 3600

SITE_ID = 1
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*"]
ACCOUNT_SIGNUP_FORM_CLASS = "apps.accounts.forms.EduTrackSignupForm"
ACCOUNT_ADAPTER = "apps.accounts.adapters.EduTrackAccountAdapter"
ACCOUNT_EMAIL_VERIFICATION = "none" if DEBUG else "mandatory"
ACCOUNT_EMAIL_VERIFICATION_BY_CODE_ENABLED = not DEBUG
ACCOUNT_EMAIL_VERIFICATION_BY_CODE_TIMEOUT = 600
ACCOUNT_EMAIL_VERIFICATION_BY_CODE_MAX_ATTEMPTS = 3
ACCOUNT_EMAIL_VERIFICATION_SUPPORTS_RESEND = True
ACCOUNT_EMAIL_VERIFICATION_SUPPORTS_CHANGE = False
ACCOUNT_PREVENT_ENUMERATION = True
ACCOUNT_EMAIL_UNKNOWN_ACCOUNTS = True
ACCOUNT_EMAIL_NOTIFICATIONS = True
ACCOUNT_SESSION_REMEMBER = None
ACCOUNT_LOGOUT_ON_GET = False
ACCOUNT_LOGIN_ON_PASSWORD_RESET = False
ALLAUTH_USER_CODE_FORMAT = {"numeric": True, "dashed": False, "length": 6}

HEADLESS_ONLY = True
HEADLESS_CLIENTS = ("browser",)
HEADLESS_ADAPTER = "apps.accounts.headless.EduTrackHeadlessAdapter"
HEADLESS_FRONTEND_URLS = {
    "account_confirm_email": f"{FRONTEND_URL}/verificar-email/{{key}}",
    "account_reset_password": f"{FRONTEND_URL}/esqueci-senha",
    "account_reset_password_from_key": f"{FRONTEND_URL}/redefinir-senha/{{key}}",
    "account_signup": f"{FRONTEND_URL}/cadastro",
}

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
SOCIALACCOUNT_ADAPTER = "apps.accounts.adapters.EduTrackSocialAccountAdapter"
SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = True
SOCIALACCOUNT_EMAIL_VERIFICATION = "none" if DEBUG else "mandatory"
SOCIALACCOUNT_QUERY_EMAIL = True
SOCIALACCOUNT_STORE_TOKENS = False
SOCIALACCOUNT_LOGIN_ON_GET = False
SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "APP": {"client_id": GOOGLE_CLIENT_ID, "secret": GOOGLE_CLIENT_SECRET, "key": ""},
        "SCOPE": ["openid", "email", "profile"],
        "AUTH_PARAMS": {"access_type": "online", "hd": "aluno.impacta.edu.br"},
        "OAUTH_PKCE_ENABLED": True,
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["apps.accounts.authentication.BrowserSessionAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.accounts.exceptions.api_exception_handler",
}
SPECTACULAR_SETTINGS = {
    "TITLE": "EduTrack API",
    "DESCRIPTION": "API acadêmica de autenticação e perfil do EduTrack.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend"
    if DEBUG
    else "django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = os.getenv("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "1025"))
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", False)
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "EduTrack <nao-responda@edutrack.local>")
ACCOUNT_EMAIL_SUBJECT_PREFIX = "[EduTrack] "

SESSION_COOKIE_NAME = "edutrack_session"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_AGE = 60 * 60 * 24 * 14
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
CSRF_COOKIE_NAME = "edutrack_csrf"
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = not DEBUG
CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
