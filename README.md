# wakatime-sync

Engineering-ready WakaTime sync service.

## Features

- Pull heartbeats from WakaTime and store into MySQL.
- Daily scheduled sync with APScheduler.
- REST API with JSON.
- Frontend served as `.html` routes.
- `/` redirects to `/index.html`.
- Static assets are loaded via `importlib.resources`.

## Development

```bash
uv sync
uv run task dev
```

## API

- `GET /api/health`
- `GET /api/sync/state`
- `POST /api/sync/run`

## Project Layout

- `src/wakatime_sync/main.py`
- `src/wakatime_sync/biz/*`
- `src/wakatime_sync/sys/*`
- `src/wakatime_sync/web/*`

## Environment

- `WAKATIME_API_KEY` (optional if configured in `~/.wakatime.cfg`)
- `MYSQL_DSN` (example: `mysql://user:pass@host:3306/dbname`)
- `APP_PORT` (default `9506`)
- `APP_TIMEZONE` (default `UTC`)
- `SYNC_HOUR_UTC`, `SYNC_MINUTE_UTC`
- `SYNC_LOOKBACK_DAYS`, `SYNC_PAGE_LIMIT`

Copy `.env.example` to `.env` for local dev.
