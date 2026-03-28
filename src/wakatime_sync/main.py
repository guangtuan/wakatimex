from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from importlib import resources

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, Response
from loguru import logger

from wakatime_sync.biz.api.routes import build_api_router
from wakatime_sync.biz.sync.service import SyncService
from wakatime_sync.biz.wakatime.client import WakaTimeClient
from wakatime_sync.sys.config import Settings
from wakatime_sync.sys.db import close_db, init_db
from wakatime_sync.sys.logging import setup_logging
from wakatime_sync.sys.scheduler import build_scheduler

settings = Settings()


def _read_web_asset(path: str) -> bytes:
    file_obj = resources.files("wakatime_sync.web").joinpath(path)
    if not file_obj.is_file():
        raise FileNotFoundError(path)
    return file_obj.read_bytes()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    setup_logging()
    await init_db(settings.mysql_dsn)

    api_key = settings.resolved_wakatime_api_key()
    if not api_key:
        raise RuntimeError("WAKATIME_API_KEY is required or set api_key in ~/.wakatime.cfg")
    client = WakaTimeClient(api_key=api_key, base_url=settings.wakatime_api_base)
    sync_service = SyncService(
        client=client,
        lookback_days=settings.sync_lookback_days,
        page_limit=settings.sync_page_limit,
        timezone_name=settings.app_timezone,
    )
    try:
        editor_by_user_agent_id = await sync_service.refresh_user_agents(backfill_heartbeats=True)
        logger.info("warmed user agent mappings count={}", len(editor_by_user_agent_id))
    except Exception:
        logger.exception("failed to warm user agent mappings during startup")
    scheduler = build_scheduler(sync_service, settings.sync_times_utc, settings.app_timezone)
    scheduler.start()

    app.state.sync_service = sync_service
    app.state.scheduler = scheduler
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)
        await close_db()


app = FastAPI(title=settings.app_name, lifespan=lifespan)


@app.get("/")
async def root() -> RedirectResponse:
    return RedirectResponse(url="/index.html", status_code=307)


@app.get("/{page_name}.html", response_class=HTMLResponse)
async def html_page(page_name: str) -> HTMLResponse:
    filename = f"{page_name}.html"
    try:
        content = _read_web_asset(filename).decode("utf-8")
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="page not found") from exc
    return HTMLResponse(content=content)


@app.get("/assets/{asset_path:path}")
async def web_assets(asset_path: str) -> Response:
    try:
        content = _read_web_asset(f"assets/{asset_path}")
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="asset not found") from exc

    media_type = "application/octet-stream"
    if asset_path.endswith(".css"):
        media_type = "text/css"
    elif asset_path.endswith(".js"):
        media_type = "text/javascript"
    elif asset_path.endswith(".svg"):
        media_type = "image/svg+xml"
    return Response(content=content, media_type=media_type)


app.include_router(build_api_router())
