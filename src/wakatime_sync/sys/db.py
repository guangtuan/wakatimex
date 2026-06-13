from __future__ import annotations

from tortoise import Tortoise, fields
from tortoise.fields.relational import ForeignKeyRelation, ReverseRelation
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


class SyncRun(Model):
    id = fields.CharField(max_length=36, pk=True)
    sync_type = fields.CharField(max_length=32, index=True)
    trigger_source = fields.CharField(max_length=32, index=True)
    status = fields.CharField(max_length=16, index=True)
    request_payload = fields.JSONField(null=True)  # type: ignore[var-annotated]
    summary = fields.JSONField(null=True)  # type: ignore[var-annotated]
    error_message = fields.TextField(null=True)
    started_at = fields.DatetimeField(index=True)
    finished_at = fields.DatetimeField(null=True)
    duration_ms = fields.IntField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    steps: ReverseRelation[SyncRunStep]

    class Meta:
        table = "sync_run"


class SyncRunStep(Model):
    id = fields.IntField(pk=True)
    run: ForeignKeyRelation[SyncRun] = fields.ForeignKeyField(
        "models.SyncRun", related_name="steps", on_delete=fields.CASCADE
    )
    step_order = fields.IntField()
    step_key = fields.CharField(max_length=64)
    status = fields.CharField(max_length=16, index=True)
    details = fields.JSONField(null=True)  # type: ignore[var-annotated]
    error_message = fields.TextField(null=True)
    started_at = fields.DatetimeField()
    finished_at = fields.DatetimeField(null=True)
    duration_ms = fields.IntField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "sync_run_step"
        ordering = ["step_order", "id"]


class ProjectMapping(Model):
    id = fields.CharField(max_length=64, pk=True)
    source_project = fields.CharField(max_length=255, unique=True)
    target_project = fields.CharField(max_length=255, index=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "project_mapping"


class EditorMapping(Model):
    id = fields.CharField(max_length=64, pk=True)
    source_editor = fields.CharField(max_length=255, unique=True)
    target_editor = fields.CharField(max_length=255, index=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "editor_mapping"


async def init_db(mysql_dsn: str) -> None:
    await Tortoise.init(
        db_url=mysql_dsn,
        modules={"models": ["wakatime_sync.sys.db"]},
        _enable_global_fallback=True,
    )
    await Tortoise.generate_schemas(safe=True)


async def close_db() -> None:
    await Tortoise.close_connections()
