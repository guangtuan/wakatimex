FROM python:3.12-slim AS build

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

COPY uv.lock pyproject.toml hatch.toml README.md ./
RUN uv sync --frozen --no-install-project --no-dev

FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app

ARG VERSION=0.0.0
ENV SETUPTOOLS_SCM_PRETEND_VERSION=$VERSION

COPY --from=build /app /app
COPY src/ ./src/

RUN uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:$PATH" \
    VIRTUAL_ENV="/app/.venv"

CMD ["uvicorn", "wakatime_sync.main:app", "--host", "0.0.0.0", "--port", "9506"]
