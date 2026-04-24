from __future__ import annotations

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
