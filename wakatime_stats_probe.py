#!/usr/bin/env python3
"""Probe WakaTime stats/goals endpoints using api key from ~/.wakatime.cfg."""

from __future__ import annotations

import base64
import configparser
import json
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE_URL = "https://api.wakatime.com/api/v1"


def load_api_key(config_path: Path) -> str:
    parser = configparser.ConfigParser()
    if not config_path.exists():
        raise FileNotFoundError(f"Config not found: {config_path}")
    parser.read(config_path)
    api_key = parser.get("settings", "api_key", fallback="").strip()
    if not api_key:
        raise ValueError("api_key missing in [settings] section")
    return api_key


def auth_header_from_api_key(api_key: str) -> str:
    token = base64.b64encode(api_key.encode("utf-8")).decode("ascii")
    return f"Basic {token}"


def fetch_json(
    path: str, auth_header: str, query: dict[str, str] | None = None
) -> tuple[int, Any]:
    url = f"{BASE_URL}{path}"
    if query:
        url = f"{url}?{urlencode(query)}"

    req = Request(
        url,
        headers={
            "Authorization": auth_header,
            "Accept": "application/json",
            "User-Agent": "wakatime-stats-probe/1.0",
        },
        method="GET",
    )

    try:
        with urlopen(req, timeout=15) as resp:
            status = resp.status
            body = resp.read().decode("utf-8", errors="replace")
            return status, json.loads(body)
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            parsed = {"error": body}
        return exc.code, parsed
    except URLError as exc:
        return 0, {"error": str(exc)}


def summarize_stats(range_name: str, payload: dict[str, Any]) -> dict[str, Any]:
    data = payload.get("data", {}) if isinstance(payload, dict) else {}
    best_day = data.get("best_day")
    summary = {
        "range": range_name,
        "total_seconds": data.get("total_seconds"),
        "human_readable_total": data.get("human_readable_total") or data.get("text"),
        "best_day": best_day,
        "languages_count": len(data.get("languages", []) or []),
        "editors_count": len(data.get("editors", []) or []),
        "projects_count": len(data.get("projects", []) or []),
        "operating_systems_count": len(data.get("operating_systems", []) or []),
        "machines_count": len(data.get("machines", []) or []),
        "is_up_to_date": data.get("is_up_to_date"),
        "percent_calculated": data.get("percent_calculated"),
    }
    return summary


def summarize_goals(payload: dict[str, Any]) -> dict[str, Any]:
    data = payload.get("data", []) if isinstance(payload, dict) else []
    goals = data if isinstance(data, list) else []
    return {
        "goals_count": len(goals),
        "enabled_goals": sum(
            1 for g in goals if isinstance(g, dict) and g.get("is_enabled")
        ),
        "sample": [
            {
                "id": g.get("id"),
                "title": g.get("custom_title") or g.get("title"),
                "status": g.get("status"),
                "delta": g.get("delta"),
                "seconds": g.get("seconds"),
            }
            for g in goals[:3]
            if isinstance(g, dict)
        ],
    }


def main() -> int:
    config_path = Path.home() / ".wakatime.cfg"
    try:
        api_key = load_api_key(config_path)
    except Exception as exc:
        print(f"Failed to load api key: {exc}")
        return 1

    auth_header = auth_header_from_api_key(api_key)

    # Tries common stats ranges representing day/week/month/year style windows.
    ranges = ["last_7_days", "last_30_days", "last_6_months", "last_year"]
    results: dict[str, Any] = {"stats": [], "goals": None}

    for range_name in ranges:
        status, payload = fetch_json(f"/users/current/stats/{range_name}", auth_header)
        entry: dict[str, Any] = {"range": range_name, "http_status": status}
        if status == 200:
            entry["summary"] = summarize_stats(
                range_name, payload if isinstance(payload, dict) else {}
            )
        else:
            entry["error"] = payload
        results["stats"].append(entry)

    status, payload = fetch_json("/users/current/goals", auth_header)
    goals_entry: dict[str, Any] = {"http_status": status}
    if status == 200:
        goals_entry["summary"] = summarize_goals(
            payload if isinstance(payload, dict) else {}
        )
    else:
        goals_entry["error"] = payload
    results["goals"] = goals_entry

    print(json.dumps(results, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
