from __future__ import annotations

import configparser
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="wakatime-sync", alias="APP_NAME")
    app_env: str = Field(default="dev", alias="APP_ENV")
    app_port: int = Field(default=9506, alias="APP_PORT")
    app_timezone: str = Field(default="Asia/Shanghai", alias="APP_TIMEZONE")

    mysql_dsn: str = Field(
        default="mysql://root:123456@localhost:3306/wakatime_sync", alias="MYSQL_DSN"
    )
    wakatime_api_base: str = Field(
        default="https://api.wakatime.com/api/v1", alias="WAKATIME_API_BASE"
    )
    wakatime_api_key: str = Field(default="", alias="WAKATIME_API_KEY")

    sync_times_utc: str = Field(default="2:00,8:00", alias="SYNC_TIMES_UTC")
    sync_lookback_days: int = Field(default=2, alias="SYNC_LOOKBACK_DAYS")
    sync_page_limit: int = Field(default=200, alias="SYNC_PAGE_LIMIT")

    def load_wakatime_key_from_cfg(self) -> str:
        cfg_file = Path.home() / ".wakatime.cfg"
        if not cfg_file.exists():
            return ""
        parser = configparser.ConfigParser()
        parser.read(cfg_file)
        return parser.get("settings", "api_key", fallback="").strip()

    def resolved_wakatime_api_key(self) -> str:
        if self.wakatime_api_key.strip():
            return self.wakatime_api_key.strip()
        return self.load_wakatime_key_from_cfg()
