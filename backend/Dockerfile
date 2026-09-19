FROM python:3.12-slim AS builder

WORKDIR /build

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY pyproject.toml ./
COPY api ./api
COPY core ./core
COPY models ./models
COPY schemas ./schemas
COPY services ./services
COPY repositories ./repositories

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .

FROM python:3.12-slim AS runner

WORKDIR /app

RUN useradd --create-home --uid 1000 appuser

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY --chown=appuser:appuser api ./api
COPY --chown=appuser:appuser core ./core
COPY --chown=appuser:appuser models ./models
COPY --chown=appuser:appuser schemas ./schemas
COPY --chown=appuser:appuser services ./services
COPY --chown=appuser:appuser repositories ./repositories
COPY --chown=appuser:appuser alembic.ini ./
COPY --chown=appuser:appuser alembic ./alembic
COPY --chown=appuser:appuser schema ./schema
COPY --chown=appuser:appuser scripts ./scripts
COPY --chown=appuser:appuser seeds ./seeds
COPY --chown=appuser:appuser docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

USER appuser
EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --start-period=45s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')"

ENTRYPOINT ["./docker-entrypoint.sh"]
