FROM ghcr.io/astral-sh/uv:0.12.9 AS uv

FROM python:3.14-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:/opt/mssql-tools18/bin:${PATH}"

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl gnupg libgssapi-krb5-2 \
    && curl -fsSL -o /tmp/packages-microsoft-prod.deb \
        https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb \
    && dpkg -i /tmp/packages-microsoft-prod.deb \
    && rm /tmp/packages-microsoft-prod.deb \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install --yes --no-install-recommends \
        msodbcsql18 mssql-tools18 unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=uv /uv /uvx /bin/

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --all-groups --no-install-project

COPY . .
RUN uv sync --frozen --all-groups \
    && useradd --create-home --uid 1000 edutrack \
    && chown -R edutrack:edutrack /app

USER edutrack

EXPOSE 8000
CMD ["gunicorn", "edutrack.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
