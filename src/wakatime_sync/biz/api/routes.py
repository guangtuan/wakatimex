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
    EditorMappingItem,
    EditorMappingsResponse,
    EditorMappingUpsertRequest,
    HealthResponse,
    MappingOptionItem,
    MappingOptionsResponse,
    HourlyEditorSegment,
    HourlyStatItem,
    ProjectMappingItem,
    ProjectMappingsResponse,
    ProjectMappingUpsertRequest,
    SyncHistoryItemResponse,
    SyncHistoryResponse,
    StatsBreakdownResponse,
    StatsDailyResponse,
    StatsHourlyResponse,
    SyncRunResponse,
    SyncRunStepResponse,
    SyncStateResponse,
    UserAgentRefreshResponse,
)
from wakatime_sync.biz.stats.service import (
    load_heartbeats,
    load_editor_mappings,
    load_editor_options,
    load_project_mappings,
    load_project_options,
    load_user_agent_editors,
    parse_window,
    summarize_ai_stats,
    summarize_breakdown,
    summarize_daily,
    summarize_hourly,
)
from wakatime_sync.sys.config import Settings
from wakatime_sync.sys.db import EditorMapping, Heartbeat, ProjectMapping, SyncRun, SyncState
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
        result = await sync_service.sync_recent(trigger="manual")
        return SyncRunResponse(
            dates=result.dates,
            fetched=result.fetched,
            inserted=result.inserted,
            updated=result.updated,
        )

    @router.post("/api/sync/range", response_model=SyncRunResponse)
    async def run_sync_range(request: Request, start: str, end: str) -> SyncRunResponse:
        sync_service = request.app.state.sync_service
        result = await sync_service.sync_range(start, end, trigger="manual")
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

    @router.post("/api/sync/user-agents", response_model=UserAgentRefreshResponse)
    async def refresh_user_agents(request: Request) -> UserAgentRefreshResponse:
        sync_service = request.app.state.sync_service
        result = await sync_service.refresh_user_agents(backfill_heartbeats=True, trigger="manual")
        return UserAgentRefreshResponse(
            total_user_agents=result.total_user_agents,
            backfilled_heartbeats=result.backfilled_heartbeats,
        )

    @router.get("/api/sync/history", response_model=SyncHistoryResponse)
    async def sync_history(limit: int = 10) -> SyncHistoryResponse:
        rows = (
            await SyncRun.all()
            .order_by("-started_at")
            .limit(max(1, min(limit, 30)))
            .prefetch_related("steps")
        )

        runs = [
            SyncHistoryItemResponse(
                id=row.id,
                sync_type=row.sync_type,
                trigger_source=row.trigger_source,
                status=row.status,
                started_at=row.started_at.isoformat(),
                finished_at=row.finished_at.isoformat() if row.finished_at else None,
                duration_ms=row.duration_ms,
                request_payload=row.request_payload if isinstance(row.request_payload, dict) else None,
                summary=row.summary if isinstance(row.summary, dict) else None,
                error_message=row.error_message,
                steps=[
                    SyncRunStepResponse(
                        step_key=step.step_key,
                        status=step.status,
                        started_at=step.started_at.isoformat(),
                        finished_at=step.finished_at.isoformat() if step.finished_at else None,
                        duration_ms=step.duration_ms,
                        details=step.details if isinstance(step.details, dict) else None,
                        error_message=step.error_message,
                    )
                    for step in sorted(row.steps, key=lambda item: (item.step_order, item.id))
                ],
            )
            for row in rows
        ]
        return SyncHistoryResponse(runs=runs)

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
        editor_mappings = await load_editor_mappings() if by == "editor" else None
        items = summarize_breakdown(
            rows,
            key=by,
            limit=max(1, min(limit, 50)),
            user_agent_editors=user_agent_editors,
            project_mappings=project_mappings,
            editor_mappings=editor_mappings,
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
        editor_mappings = await load_editor_mappings()
        hours = summarize_hourly(
            rows,
            window.timezone,
            user_agent_editors=user_agent_editors,
            editor_mappings=editor_mappings,
        )
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

    @router.get("/api/project-options", response_model=MappingOptionsResponse)
    async def project_options() -> MappingOptionsResponse:
        rows = await load_project_options()
        return MappingOptionsResponse(options=[MappingOptionItem(**row) for row in rows])

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
        if source_project == target_project:
            raise HTTPException(status_code=400, detail="source_project and target_project must differ")

        project_names = {item["name"] for item in await load_project_options()}
        if source_project not in project_names or target_project not in project_names:
            raise HTTPException(status_code=400, detail="project mapping must use existing project names")

        existing = await ProjectMapping.get_or_none(source_project=source_project)
        if existing is None:
            await ProjectMapping.create(
                id=sha256(source_project.encode("utf-8")).hexdigest(),
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

    @router.get("/api/editor-mappings", response_model=EditorMappingsResponse)
    async def editor_mappings() -> EditorMappingsResponse:
        rows = await EditorMapping.all().order_by("source_editor").values(
            "source_editor", "target_editor"
        )
        return EditorMappingsResponse(mappings=[EditorMappingItem(**row) for row in rows])

    @router.get("/api/editor-options", response_model=MappingOptionsResponse)
    async def editor_options() -> MappingOptionsResponse:
        rows = await load_editor_options()
        return MappingOptionsResponse(options=[MappingOptionItem(**row) for row in rows])

    @router.post("/api/editor-mappings", response_model=EditorMappingsResponse)
    async def upsert_editor_mapping(
        payload: EditorMappingUpsertRequest,
    ) -> EditorMappingsResponse:
        source_editor = payload.source_editor.strip()
        target_editor = payload.target_editor.strip()
        if not source_editor or not target_editor:
            raise HTTPException(
                status_code=400, detail="source_editor and target_editor are required"
            )
        if source_editor == target_editor:
            raise HTTPException(status_code=400, detail="source_editor and target_editor must differ")

        editor_names = {item["name"] for item in await load_editor_options()}
        if source_editor not in editor_names or target_editor not in editor_names:
            raise HTTPException(status_code=400, detail="editor mapping must use existing editor names")

        existing = await EditorMapping.get_or_none(source_editor=source_editor)
        if existing is None:
            await EditorMapping.create(
                id=sha256(source_editor.encode("utf-8")).hexdigest(),
                source_editor=source_editor,
                target_editor=target_editor,
            )
        else:
            await EditorMapping.filter(id=existing.id).update(target_editor=target_editor)

        return await editor_mappings()

    @router.delete("/api/editor-mappings/{source_editor}", response_model=EditorMappingsResponse)
    async def delete_editor_mapping(source_editor: str) -> EditorMappingsResponse:
        deleted = await EditorMapping.filter(source_editor=source_editor).delete()
        if not deleted:
            raise HTTPException(status_code=404, detail="editor mapping not found")
        return await editor_mappings()

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
