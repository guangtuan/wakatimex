from __future__ import annotations

from tortoise import Tortoise, fields
from tortoise.models import Model


class Heartbeat(Model):
    id = fields.CharField(max_length=64, pk=True)
    time = fields.FloatField(index=True)
    entity = fields.TextField(null=True)
    hb_type = fields.CharField(max_length=32, null=True)
    category = fields.CharField(max_length=64, null=True)
    project = fields.CharField(max_length=255, null=True, index=True)
    branch = fields.CharField(max_length=255, null=True)
    language = fields.CharField(max_length=64, null=True, index=True)
    editor = fields.CharField(max_length=64, null=True)
    machine_name_id = fields.CharField(max_length=64, null=True)
    is_write = fields.BooleanField(default=False)
    line_no = fields.IntField(null=True)
    cursorpos = fields.IntField(null=True)
    lines = fields.IntField(null=True)
    lines_in_file = fields.IntField(null=True)
    lineno = fields.IntField(null=True)
    cursorpos_line = fields.IntField(null=True)
    ai_insert = fields.IntField(null=True)
    ai_delete = fields.IntField(null=True)
    human_insert = fields.IntField(null=True)
    human_delete = fields.IntField(null=True)
    raw_data = fields.JSONField(source_field="raw")  # type: ignore[var-annotated]
    synced_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "heartbeat"


class UserAgent(Model):
    id = fields.CharField(max_length=64, pk=True)
    value = fields.TextField(null=True)
    editor = fields.CharField(max_length=128, null=True, index=True)
    version = fields.CharField(max_length=64, null=True)
    os = fields.CharField(max_length=64, null=True)
    is_browser_extension = fields.BooleanField(default=False)
    is_desktop_app = fields.BooleanField(default=False)
    raw_data = fields.JSONField(source_field="raw")  # type: ignore[var-annotated]
    synced_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "user_agent"


class SyncState(Model):
    key = fields.CharField(max_length=64, pk=True)
    value = fields.CharField(max_length=255)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "sync_state"


async def init_db(mysql_dsn: str) -> None:
    await Tortoise.init(
        db_url=mysql_dsn,
        modules={"models": ["wakatime_sync.sys.db"]},
        _enable_global_fallback=True,
    )
    await Tortoise.generate_schemas(safe=True)


async def close_db() -> None:
    await Tortoise.close_connections()
