from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta, tzinfo
from typing import TypedDict
from zoneinfo import ZoneInfo

from wakatime_sync.sys.db import Heartbeat, UserAgent

# WakaTime official timeout: if gap between two consecutive heartbeats
# exceeds this value, the interval is NOT counted as coding time.
HEARTBEAT_TIMEOUT_SECONDS: int = 15 * 60  # 15 minutes


@dataclass
class Window:
    start: date
    end: date
    timezone: tzinfo = UTC

    @property
    def start_ts(self) -> float:
        return datetime.combine(self.start, time.min, self.timezone).timestamp()

    @property
    def end_exclusive_ts(self) -> float:
        return datetime.combine(self.end + timedelta(days=1), time.min, self.timezone).timestamp()


def resolve_timezone(name: str | None) -> tzinfo:
    if not name:
        return UTC
    return ZoneInfo(name)


def default_last_7_days(timezone: tzinfo = UTC) -> Window:
    end = datetime.now(timezone).date()
    start = end - timedelta(days=6)
    return Window(start=start, end=end, timezone=timezone)


def parse_window(start: str | None, end: str | None, timezone_name: str | None = None) -> Window:
    timezone = resolve_timezone(timezone_name)
    if start is None or end is None:
        return default_last_7_days(timezone)
    start_date = date.fromisoformat(start)
    end_date = date.fromisoformat(end)
    if start_date > end_date:
        raise ValueError("start must be <= end")
    return Window(start=start_date, end=end_date, timezone=timezone)


async def load_heartbeats(window: Window) -> list[Heartbeat]:
    return (
        await Heartbeat.filter(time__gte=window.start_ts, time__lt=window.end_exclusive_ts)
        .order_by("time")
        .all()
    )


async def load_user_agent_editors() -> dict[str, str]:
    rows = await UserAgent.exclude(editor=None).values("id", "editor")
    return {
        str(row["id"]): str(row["editor"]) for row in rows if row.get("id") and row.get("editor")
    }


def to_day(ts: float, timezone: tzinfo = UTC) -> str:
    return datetime.fromtimestamp(ts, timezone).date().isoformat()


def heartbeats_to_seconds(timestamps: list[float], timeout: int = HEARTBEAT_TIMEOUT_SECONDS) -> int:
    """Convert a sorted list of heartbeat timestamps to total active seconds.

    Implements the WakaTime official algorithm:
    - For each consecutive pair of heartbeats, if the gap < timeout, add the gap.
    - Otherwise the gap is discarded (user was idle / away).
    - The last heartbeat contributes 0 seconds by itself.
    """
    if not timestamps:
        return 0
    total: float = 0.0
    for i in range(len(timestamps) - 1):
        gap = timestamps[i + 1] - timestamps[i]
        if 0 < gap < timeout:
            total += gap
    return round(total)


def summarize_daily(rows: list[Heartbeat], timezone: tzinfo = UTC) -> dict[str, dict[str, int]]:
    by_day_times: dict[str, list[float]] = defaultdict(list)
    by_day_count: dict[str, int] = defaultdict(int)
    by_day_ai_insert: dict[str, int] = defaultdict(int)
    by_day_ai_delete: dict[str, int] = defaultdict(int)
    by_day_human_insert: dict[str, int] = defaultdict(int)
    by_day_human_delete: dict[str, int] = defaultdict(int)

    for hb in rows:
        day = to_day(hb.time, timezone)
        by_day_count[day] += 1
        by_day_times[day].append(hb.time)
        if hb.ai_insert:
            by_day_ai_insert[day] += hb.ai_insert
        if hb.ai_delete:
            by_day_ai_delete[day] += hb.ai_delete
        if hb.human_insert:
            by_day_human_insert[day] += hb.human_insert
        if hb.human_delete:
            by_day_human_delete[day] += hb.human_delete

    out: dict[str, dict[str, int]] = {}
    for day in sorted(by_day_count.keys()):
        # timestamps are already sorted (load_heartbeats orders by time)
        active_seconds = heartbeats_to_seconds(by_day_times[day])
        active_minutes = active_seconds // 60
        out[day] = {
            "heartbeats": by_day_count[day],
            "active_minutes": active_minutes,
            "active_seconds": active_seconds,
            "ai_insert": by_day_ai_insert[day],
            "ai_delete": by_day_ai_delete[day],
            "human_insert": by_day_human_insert[day],
            "human_delete": by_day_human_delete[day],
        }
    return out


class BreakdownRow(TypedDict):
    name: str
    heartbeats: int
    active_minutes: int
    active_seconds: int


def summarize_breakdown(
    rows: list[Heartbeat],
    key: str,
    limit: int,
    user_agent_editors: dict[str, str] | None = None,
) -> list[BreakdownRow]:
    by_key_times: dict[str, list[float]] = defaultdict(list)
    by_key_count: dict[str, int] = defaultdict(int)

    for hb in rows:
        name = _breakdown_name(hb, key, user_agent_editors)
        by_key_count[name] += 1
        by_key_times[name].append(hb.time)

    data: list[BreakdownRow] = []
    for name in by_key_count:
        # Each dimension's heartbeats are sorted because the parent query is ordered by time
        active_seconds = heartbeats_to_seconds(sorted(by_key_times[name]))
        active_minutes = active_seconds // 60
        data.append(
            {
                "name": name,
                "heartbeats": by_key_count[name],
                "active_minutes": active_minutes,
                "active_seconds": active_seconds,
            }
        )
    data.sort(key=lambda x: (x["active_seconds"], x["heartbeats"]), reverse=True)
    return data[:limit]


class HourlyRow(TypedDict):
    hour: int
    heartbeats: int
    active_minutes: int
    active_seconds: int
    segments: list[HourlySegment]


class HourlySegment(TypedDict):
    name: str
    active_minutes: int
    active_seconds: int
    start_second: int
    end_second: int


def _append_hourly_segment(
    segments: list[HourlySegment], name: str, start_second: int, end_second: int
) -> None:
    seconds = end_second - start_second
    if seconds <= 0:
        return

    if (
        segments
        and segments[-1]["name"] == name
        and segments[-1]["end_second"] == start_second
    ):
        total_seconds = segments[-1]["active_seconds"] + seconds
        segments[-1]["active_seconds"] = total_seconds
        segments[-1]["active_minutes"] = total_seconds // 60
        segments[-1]["end_second"] = end_second
        return

    segments.append(
        {
            "name": name,
            "active_minutes": seconds // 60,
            "active_seconds": seconds,
            "start_second": start_second,
            "end_second": end_second,
        }
    )


def summarize_hourly(
    rows: list[Heartbeat],
    timezone: tzinfo = UTC,
    user_agent_editors: dict[str, str] | None = None,
) -> list[HourlyRow]:
    by_hour_count: dict[int, int] = defaultdict(int)
    by_hour_seconds: dict[int, int] = defaultdict(int)
    by_hour_segments: dict[int, list[HourlySegment]] = defaultdict(list)

    for hb in rows:
        hour = datetime.fromtimestamp(hb.time, timezone).hour
        by_hour_count[hour] += 1

    for index in range(len(rows) - 1):
        current = rows[index]
        nxt = rows[index + 1]
        gap = nxt.time - current.time
        if gap <= 0 or gap >= HEARTBEAT_TIMEOUT_SECONDS:
            continue

        cursor = datetime.fromtimestamp(current.time, timezone)
        end_dt = datetime.fromtimestamp(nxt.time, timezone)
        editor_name = _breakdown_name(current, "editor", user_agent_editors)

        while cursor < end_dt:
            hour_start = cursor.replace(minute=0, second=0, microsecond=0)
            next_hour = hour_start + timedelta(hours=1)
            chunk_end = min(end_dt, next_hour)
            chunk_start_second = max(0, min(3600, round((cursor - hour_start).total_seconds())))
            chunk_end_second = max(
                chunk_start_second,
                min(3600, round((chunk_end - hour_start).total_seconds())),
            )
            chunk_seconds = chunk_end_second - chunk_start_second
            if chunk_seconds > 0:
                by_hour_seconds[cursor.hour] += chunk_seconds
                _append_hourly_segment(
                    by_hour_segments[cursor.hour],
                    editor_name,
                    chunk_start_second,
                    chunk_end_second,
                )
            cursor = chunk_end

    return [
        {
            "hour": hour,
            "heartbeats": by_hour_count[hour],
            "active_minutes": by_hour_seconds[hour] // 60,
            "active_seconds": by_hour_seconds[hour],
            "segments": by_hour_segments[hour],
        }
        for hour in range(24)
    ]


def _breakdown_name(
    hb: Heartbeat,
    key: str,
    user_agent_editors: dict[str, str] | None,
) -> str:
    if key != "editor":
        value = getattr(hb, key)
        return str(value) if value else "Unknown"

    if hb.editor:
        return hb.editor

    raw_data = hb.raw_data if isinstance(hb.raw_data, dict) else {}
    user_agent_id = raw_data.get("user_agent_id") if isinstance(raw_data, dict) else None
    if user_agent_id and user_agent_editors:
        mapped_editor = user_agent_editors.get(str(user_agent_id))
        if mapped_editor:
            return mapped_editor

    return "Unknown"


@dataclass
class AIStats:
    ai_line_changes: int
    human_line_changes: int

    @property
    def total_changes(self) -> int:
        return self.ai_line_changes + self.human_line_changes

    @property
    def ai_percentage(self) -> float:
        total = self.total_changes
        return (self.ai_line_changes / total * 100) if total > 0 else 0.0


def summarize_ai_stats(rows: list[Heartbeat]) -> AIStats:
    ai_line_changes = 0
    human_line_changes = 0

    for hb in rows:
        if hb.ai_insert:
            ai_line_changes += hb.ai_insert
        if hb.human_insert:
            human_line_changes += hb.human_insert

    return AIStats(
        ai_line_changes=ai_line_changes,
        human_line_changes=human_line_changes,
    )
