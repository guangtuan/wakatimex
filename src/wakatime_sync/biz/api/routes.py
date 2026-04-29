from __future__ import annotations

from hashlib import sha256

from fastapi import APIRouter, HTTPException, Request
from tortoise import Tortoise
from tortoise.exceptions import DBConnectionError

from wakatime_sync.biz.api.schemas import (
    AIStatsResponse,
    BreakdownItem,
    DailyStatItem,
    DebugDbResponse,
    HealthResponse,
    HourlyEditorSegment,
    HourlyStatItem,
    ProjectMappingItem,
    ProjectMappingsResponse,
    ProjectMappingUpsertRequest,
    StatsBreakdownResponse,
    StatsDailyResponse,
    StatsHourlyResponse,
    SyncRunResponse,
    SyncStateResponse,
)
from wakatime_sync.biz.stats.service import (
    load_heartbeats,
    load_project_mappings,
    load_user_agent_editors,
    parse_window,
    summarize_ai_stats,
    summarize_breakdown,
    summarize_daily,
    summarize_hourly,
)
from wakatime_sync.sys.config import Settings
from wakatime_sync.sys.db import Heartbeat, ProjectMapping, SyncState
from wakatime_sync.sys.version import get_app_version


def build_api_router() -> APIRouter:
    router = APIRouter()
    settings = Settings()

    @router.get("/api/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(status="ok", version=get_app_version())

    @router.post("/api/sync/run", response_model=SyncRunResponse)
    async def run_sync(request: Request) -> SyncRunResponse:
        sync_service = request.app.state.sync_service
        result = await sync_service.sync_recent()
        return SyncRunResponse(
            dates=result.dates,
            fetched=result.fetched,
            inserted=result.inserted,
            updated=result.updated,
        )

    @router.post("/api/sync/range", response_model=SyncRunResponse)
    async def run_sync_range(request: Request, start: str, end: str) -> SyncRunResponse:
        sync_service = request.app.state.sync_service
        result = await sync_service.sync_range(start, end)
        return SyncRunResponse(
            dates=result.dates,
            fetched=result.fetched,
            inserted=result.inserted,
            updated=result.updated,
        )

    @router.get("/api/sync/state", response_model=SyncStateResponse)
    async def sync_state(request: Request) -> SyncStateResponse:
        sync_service = request.app.state.sync_service
        return SyncStateResponse(last_sync_at=await sync_service.get_last_sync())

    @router.get("/api/stats/daily", response_model=StatsDailyResponse)
    async def stats_daily(start: str | None = None, end: str | None = None) -> StatsDailyResponse:
        try:
            window = parse_window(start, end, settings.app_timezone)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        rows = await load_heartbeats(window)
        daily = summarize_daily(rows, window.timezone)
        day_items = [DailyStatItem(date=day, **vals) for day, vals in daily.items()]

        total_heartbeats = sum(v["heartbeats"] for v in daily.values())
        total_active_minutes = sum(v["active_minutes"] for v in daily.values())
        best_day = max(daily.items(), key=lambda x: x[1]["active_minutes"])[0] if daily else None

        return StatsDailyResponse(
            total_heartbeats=total_heartbeats,
            total_active_minutes=total_active_minutes,
            best_day=best_day,
            days=day_items,
        )

    @router.get("/api/stats/breakdown", response_model=StatsBreakdownResponse)
    async def stats_breakdown(
        by: str = "language",
        start: str | None = None,
        end: str | None = None,
        limit: int = 10,
    ) -> StatsBreakdownResponse:
        supported = {"language", "project", "editor", "machine_name_id"}
        if by not in supported:
            raise HTTPException(
                status_code=400, detail=f"by must be one of: {', '.join(sorted(supported))}"
            )

        try:
            window = parse_window(start, end, settings.app_timezone)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        rows = await load_heartbeats(window)
        user_agent_editors = await load_user_agent_editors() if by == "editor" else None
        project_mappings = await load_project_mappings() if by == "project" else None
        items = summarize_breakdown(
            rows,
            key=by,
            limit=max(1, min(limit, 50)),
            user_agent_editors=user_agent_editors,
            project_mappings=project_mappings,
        )

        return StatsBreakdownResponse(
            start=window.start.isoformat(),
            end=window.end.isoformat(),
            by=by,
            total_items=len(items),
            items=[BreakdownItem(**item) for item in items],
        )

    @router.get("/api/stats/range", response_model=StatsDailyResponse)
    async def stats_range(start: str | None = None, end: str | None = None) -> StatsDailyResponse:
        return await stats_daily(start=start, end=end)

    @router.get("/api/stats/hourly", response_model=StatsHourlyResponse)
    async def stats_hourly(start: str | None = None, end: str | None = None) -> StatsHourlyResponse:
        try:
            window = parse_window(start, end, settings.app_timezone)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        rows = await load_heartbeats(window)
        user_agent_editors = await load_user_agent_editors()
        hours = summarize_hourly(rows, window.timezone, user_agent_editors=user_agent_editors)
        peak = (
            max(hours, key=lambda item: (item["active_seconds"], item["heartbeats"]))
            if hours
            else None
        )

        return StatsHourlyResponse(
            start=window.start.isoformat(),
            end=window.end.isoformat(),
            total_heartbeats=sum(item["heartbeats"] for item in hours),
            total_active_minutes=sum(item["active_minutes"] for item in hours),
            peak_hour=peak["hour"]
            if peak and (peak["active_seconds"] > 0 or peak["heartbeats"] > 0)
            else None,
            hours=[
                HourlyStatItem(
                    hour=item["hour"],
                    heartbeats=item["heartbeats"],
                    active_minutes=item["active_minutes"],
                    active_seconds=item["active_seconds"],
                    segments=[HourlyEditorSegment(**segment) for segment in item["segments"]],
                )
                for item in hours
            ],
        )

    @router.get("/api/stats/ai", response_model=AIStatsResponse)
    async def stats_ai(start: str | None = None, end: str | None = None) -> AIStatsResponse:
        try:
            window = parse_window(start, end, settings.app_timezone)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        rows = await load_heartbeats(window)
        stats = summarize_ai_stats(rows)

        return AIStatsResponse(
            start=window.start.isoformat(),
            end=window.end.isoformat(),
            ai_line_changes=stats.ai_line_changes,
            human_line_changes=stats.human_line_changes,
            total_changes=stats.total_changes,
            ai_percentage=stats.ai_percentage,
        )

    @router.get("/api/project-mappings", response_model=ProjectMappingsResponse)
    async def project_mappings() -> ProjectMappingsResponse:
        rows = await ProjectMapping.all().order_by("source_project").values(
            "source_project", "target_project"
        )
        return ProjectMappingsResponse(mappings=[ProjectMappingItem(**row) for row in rows])

    @router.post("/api/project-mappings", response_model=ProjectMappingsResponse)
    async def upsert_project_mapping(
        payload: ProjectMappingUpsertRequest,
    ) -> ProjectMappingsResponse:
        source_project = payload.source_project.strip()
        target_project = payload.target_project.strip()
        if not source_project or not target_project:
            raise HTTPException(
                status_code=400, detail="source_project and target_project are required"
            )

        mapping_id = sha256(source_project.encode("utf-8")).hexdigest()[:64]
        existing = await ProjectMapping.get_or_none(source_project=source_project)
        if existing is None:
            await ProjectMapping.create(
                id=mapping_id,
                source_project=source_project,
                target_project=target_project,
            )
        else:
            await ProjectMapping.filter(id=existing.id).update(target_project=target_project)

        return await project_mappings()

    @router.delete("/api/project-mappings/{source_project}", response_model=ProjectMappingsResponse)
    async def delete_project_mapping(source_project: str) -> ProjectMappingsResponse:
        deleted = await ProjectMapping.filter(source_project=source_project).delete()
        if not deleted:
            raise HTTPException(status_code=404, detail="project mapping not found")
        return await project_mappings()

    @router.get("/api/debug/db", response_model=DebugDbResponse)
    async def debug_db() -> DebugDbResponse:
        if settings.app_env.lower() != "dev":
            raise HTTPException(status_code=404, detail="not found")

        try:
            conn = Tortoise.get_connection("default")
            _, rows = await conn.execute_query("SELECT 1 AS v")
            select_1 = int(rows[0]["v"]) if rows else 0
            heartbeat_rows = await Heartbeat.all().count()
            sync_state_rows = await SyncState.all().count()
        except DBConnectionError as exc:
            raise HTTPException(status_code=500, detail=f"db connection error: {exc}") from exc

        return DebugDbResponse(
            ok=True,
            env=settings.app_env,
            select_1=select_1,
            heartbeat_rows=heartbeat_rows,
            sync_state_rows=sync_state_rows,
        )

    return router
