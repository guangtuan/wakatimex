from __future__ import annotations

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger

from wakatime_sync.biz.sync.service import SyncService


def parse_sync_times(times_str: str) -> list[tuple[int, int]]:
    result = []
    for part in times_str.split(","):
        part = part.strip()
        if ":" not in part:
            continue
        try:
            hour, minute = part.split(":")
            result.append((int(hour.strip()), int(minute.strip())))
        except ValueError:
            continue
    return result


def build_scheduler(sync_service: SyncService, times_str: str) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")

    async def run_job() -> None:
        logger.info("scheduled sync start")
        await sync_service.sync_recent()

    for hour, minute in parse_sync_times(times_str):
        scheduler.add_job(
            run_job, "cron", id=f"daily_heartbeat_sync_{hour}_{minute}", hour=hour, minute=minute
        )

    return scheduler
