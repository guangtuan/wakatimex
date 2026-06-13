from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    version: str


class SyncRunResponse(BaseModel):
    dates: list[str]
    fetched: int
    inserted: int
    updated: int


class SyncStateResponse(BaseModel):
    last_sync_at: str | None


class UserAgentRefreshResponse(BaseModel):
    total_user_agents: int
    backfilled_heartbeats: int


class SyncRunStepResponse(BaseModel):
    step_key: str
    status: str
    started_at: str
    finished_at: str | None
    duration_ms: int | None
    details: dict[str, Any] | None = None
    error_message: str | None = None


class SyncHistoryItemResponse(BaseModel):
    id: str
    sync_type: str
    trigger_source: str
    status: str
    started_at: str
    finished_at: str | None
    duration_ms: int | None
    request_payload: dict[str, Any] | None = None
    summary: dict[str, Any] | None = None
    error_message: str | None = None
    steps: list[SyncRunStepResponse]


class SyncHistoryResponse(BaseModel):
    runs: list[SyncHistoryItemResponse]


class DebugDbResponse(BaseModel):
    ok: bool
    env: str
    select_1: int
    heartbeat_rows: int
    sync_state_rows: int


class DailyStatItem(BaseModel):
    date: str
    heartbeats: int
    active_minutes: int


class StatsDailyResponse(BaseModel):
    total_heartbeats: int
    total_active_minutes: int
    best_day: str | None
    days: list[DailyStatItem]


class BreakdownItem(BaseModel):
    name: str
    heartbeats: int
    active_minutes: int
    active_seconds: int


class StatsBreakdownResponse(BaseModel):
    start: str
    end: str
    by: str
    total_items: int
    items: list[BreakdownItem]


class HourlyEditorSegment(BaseModel):
    name: str
    active_minutes: int
    active_seconds: int
    start_second: int
    end_second: int


class HourlyStatItem(BaseModel):
    hour: int
    heartbeats: int
    active_minutes: int
    active_seconds: int
    segments: list[HourlyEditorSegment]


class StatsHourlyResponse(BaseModel):
    start: str
    end: str
    total_heartbeats: int
    total_active_minutes: int
    peak_hour: int | None
    hours: list[HourlyStatItem]


class AIStatsResponse(BaseModel):
    start: str
    end: str
    ai_line_changes: int
    human_line_changes: int
    total_changes: int
    ai_percentage: float


class ProjectMappingItem(BaseModel):
    source_project: str
    target_project: str


class ProjectMappingsResponse(BaseModel):
    mappings: list[ProjectMappingItem]


class ProjectMappingUpsertRequest(BaseModel):
    source_project: str
    target_project: str


class MappingOptionItem(BaseModel):
    name: str
    count: int


class MappingOptionsResponse(BaseModel):
    options: list[MappingOptionItem]


class EditorMappingItem(BaseModel):
    source_editor: str
    target_editor: str


class EditorMappingsResponse(BaseModel):
    mappings: list[EditorMappingItem]


class EditorMappingUpsertRequest(BaseModel):
    source_editor: str
    target_editor: str
