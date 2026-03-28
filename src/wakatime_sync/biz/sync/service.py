from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from loguru import logger
from tortoise.transactions import in_transaction

from wakatime_sync.biz.wakatime.client import WakaTimeClient
from wakatime_sync.sys.db import Heartbeat, SyncState, UserAgent


@dataclass
class SyncResult:
    dates: list[str]
    fetched: int
    inserted: int
    updated: int


class SyncService:
    def __init__(
        self,
        client: WakaTimeClient,
        lookback_days: int,
        page_limit: int = 200,
        timezone_name: str = "UTC",
    ) -> None:
        self.client = client
        self.lookback_days = lookback_days
        self.page_limit = page_limit
        self.timezone = ZoneInfo(timezone_name)

    async def sync_recent(self) -> SyncResult:
        today = datetime.now(self.timezone).date()
        if today.weekday() == 0:
            last_friday = today - timedelta(days=3)
            dates = [
                (last_friday + timedelta(days=i)).isoformat()
                for i in range((today - last_friday).days + 1)
            ]
        else:
            dates = [(today - timedelta(days=i)).isoformat() for i in range(self.lookback_days)]
        return await self.sync_dates(dates)

    async def sync_range(self, start_date: str, end_date: str) -> SyncResult:
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()
        if start > end:
            start, end = end, start
        dates = []
        current = start
        while current <= end:
            dates.append(current.isoformat())
            current += timedelta(days=1)
        return await self.sync_dates(dates)

    async def sync_dates(self, dates: list[str]) -> SyncResult:
        fetched = 0
        inserted = 0
        updated = 0

        editor_by_user_agent_id: dict[str, str] = {}
        try:
            editor_by_user_agent_id = await self.refresh_user_agents(backfill_heartbeats=True)
        except Exception:
            logger.exception("failed to refresh user agents before heartbeat sync")
            editor_by_user_agent_id = await self._load_user_agent_editor_map()

        for d in dates:
            page = 1
            while page <= self.page_limit:
                payload = await self.client.get_heartbeats(d, page=page)
                items = payload.get("data", [])
                if not items:
                    break

                f, i, u = await self._upsert_heartbeats(items, editor_by_user_agent_id)
                fetched += f
                inserted += i
                updated += u

                next_page = payload.get("next_page")
                if not next_page:
                    break
                page = self._next_page_number(next_page, page)

        await self._set_last_sync(datetime.now(self.timezone))
        logger.info(
            "sync finished dates={} fetched={} inserted={} updated={}",
            dates,
            fetched,
            inserted,
            updated,
        )
        return SyncResult(dates=dates, fetched=fetched, inserted=inserted, updated=updated)

    async def refresh_user_agents(self, backfill_heartbeats: bool = False) -> dict[str, str]:
        items = await self._fetch_user_agents()
        if not items:
            return await self._load_user_agent_editor_map()

        await self._upsert_user_agents(items)
        editor_by_user_agent_id = self._build_editor_map(items)

        if backfill_heartbeats and editor_by_user_agent_id:
            backfilled = await self.backfill_missing_editors(editor_by_user_agent_id)
            logger.info(
                "user agent refresh completed count={} backfilled={}",
                len(editor_by_user_agent_id),
                backfilled,
            )
        else:
            logger.info("user agent refresh completed count={}", len(editor_by_user_agent_id))

        return editor_by_user_agent_id

    async def backfill_missing_editors(self, editor_by_user_agent_id: dict[str, str]) -> int:
        if not editor_by_user_agent_id:
            return 0

        missing_rows = await Heartbeat.filter(editor=None).all()
        missing_rows += await Heartbeat.filter(editor="").all()

        updated = 0
        async with in_transaction():
            for heartbeat in missing_rows:
                raw_data = heartbeat.raw_data if isinstance(heartbeat.raw_data, dict) else {}
                editor = self._resolve_editor(raw_data, editor_by_user_agent_id)
                if not editor:
                    continue
                await Heartbeat.filter(id=heartbeat.id).update(editor=editor)
                updated += 1

        return updated

    async def _fetch_user_agents(self) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        page = 1

        while page <= self.page_limit:
            payload = await self.client.get_user_agents(page=page)
            page_items = payload.get("data", [])
            if not page_items:
                break

            items.extend(item for item in page_items if isinstance(item, dict))

            next_page = payload.get("next_page")
            if not next_page:
                break
            page = self._next_page_number(next_page, page)

        return items

    async def _upsert_user_agents(self, items: list[dict[str, Any]]) -> None:
        async with in_transaction():
            for item in items:
                user_agent_id = str(item.get("id", "")).strip()
                if not user_agent_id:
                    continue

                editor = item.get("editor")
                values = {
                    "value": item.get("value"),
                    "editor": editor.strip()
                    if isinstance(editor, str) and editor.strip()
                    else None,
                    "version": item.get("version"),
                    "os": item.get("os"),
                    "is_browser_extension": bool(item.get("is_browser_extension") or False),
                    "is_desktop_app": bool(item.get("is_desktop_app") or False),
                    "raw_data": item,
                }

                existing = await UserAgent.get_or_none(id=user_agent_id)
                if existing is None:
                    await UserAgent.create(id=user_agent_id, **values)  # type: ignore[arg-type]
                else:
                    await UserAgent.filter(id=user_agent_id).update(**values)

    async def _load_user_agent_editor_map(self) -> dict[str, str]:
        rows = await UserAgent.exclude(editor=None).values("id", "editor")
        return {
            str(row["id"]): str(row["editor"])
            for row in rows
            if row.get("id") and row.get("editor")
        }

    async def _upsert_heartbeats(
        self,
        items: list[dict[str, Any]],
        editor_by_user_agent_id: dict[str, str],
    ) -> tuple[int, int, int]:
        fetched = len(items)
        inserted = 0
        updated = 0

        async with in_transaction():
            for hb in items:
                hb_id = str(hb.get("id", "")).strip()
                if not hb_id:
                    continue

                resolved_editor = self._resolve_editor(hb, editor_by_user_agent_id)
                values = {
                    "time": hb.get("time") or 0.0,
                    "entity": hb.get("entity"),
                    "hb_type": hb.get("type"),
                    "category": hb.get("category"),
                    "project": hb.get("project"),
                    "branch": hb.get("branch"),
                    "language": hb.get("language"),
                    "editor": resolved_editor,
                    "machine_name_id": hb.get("machine_name_id"),
                    "is_write": bool(hb.get("is_write") or False),
                    "line_no": hb.get("line_no"),
                    "cursorpos": hb.get("cursorpos"),
                    "lines": hb.get("lines"),
                    "lines_in_file": hb.get("lines_in_file"),
                    "lineno": hb.get("lineno"),
                    "cursorpos_line": hb.get("cursorpos_line"),
                    "ai_insert": hb.get("ai_line_changes"),
                    "ai_delete": 0,
                    "human_insert": hb.get("human_line_changes"),
                    "human_delete": 0,
                    "raw_data": hb,
                }

                existing = await Heartbeat.get_or_none(id=hb_id)
                if existing is None:
                    await Heartbeat.create(id=hb_id, **values)  # type: ignore[arg-type]
                    inserted += 1
                else:
                    if values["editor"] is None and existing.editor:
                        values["editor"] = existing.editor
                    await Heartbeat.filter(id=hb_id).update(**values)
                    updated += 1

        return fetched, inserted, updated

    def _build_editor_map(self, items: list[dict[str, Any]]) -> dict[str, str]:
        mapping: dict[str, str] = {}
        for item in items:
            user_agent_id = str(item.get("id", "")).strip()
            editor = item.get("editor")
            if not user_agent_id or not isinstance(editor, str) or not editor.strip():
                continue
            mapping[user_agent_id] = editor.strip()
        return mapping

    def _resolve_editor(
        self,
        heartbeat: dict[str, Any],
        editor_by_user_agent_id: dict[str, str],
    ) -> str | None:
        editor = heartbeat.get("editor")
        if isinstance(editor, str) and editor.strip():
            return editor.strip()

        user_agent_id = heartbeat.get("user_agent_id")
        if user_agent_id is None:
            return None

        mapped_editor = editor_by_user_agent_id.get(str(user_agent_id).strip())
        if mapped_editor:
            return mapped_editor
        return None

    def _next_page_number(self, next_page: Any, current_page: int) -> int:
        if isinstance(next_page, int) and next_page > current_page:
            return next_page
        if isinstance(next_page, str):
            stripped = next_page.strip()
            if stripped.isdigit():
                numeric = int(stripped)
                if numeric > current_page:
                    return numeric
        return current_page + 1

    async def _set_last_sync(self, ts: datetime) -> None:
        value = ts.isoformat()
        state = await SyncState.get_or_none(key="last_sync_at")
        if state is None:
            await SyncState.create(key="last_sync_at", value=value)
        else:
            await SyncState.filter(key="last_sync_at").update(value=value)

    async def get_last_sync(self) -> str | None:
        state = await SyncState.get_or_none(key="last_sync_at")
        if state is None:
            return None
        return state.value
