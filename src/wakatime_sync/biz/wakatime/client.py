from __future__ import annotations

import base64
from dataclasses import dataclass
from typing import Any, cast

import httpx


@dataclass
class WakaTimeClient:
    api_key: str
    base_url: str

    def _auth_header(self) -> str:
        token = base64.b64encode(self.api_key.encode("utf-8")).decode("ascii")
        return f"Basic {token}"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": self._auth_header(),
            "Accept": "application/json",
            "User-Agent": "wakatime-sync/1.0",
        }

    async def _get(self, path: str, params: dict[str, str | int]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(
                f"{self.base_url}{path}", params=params, headers=self._headers()
            )
            resp.raise_for_status()
            return cast(dict[str, Any], resp.json())

    async def get_heartbeats(self, date_str: str, page: int = 1) -> dict[str, Any]:
        return await self._get("/users/current/heartbeats", {"date": date_str, "page": page})

    async def get_user_agents(self, page: int = 1) -> dict[str, Any]:
        return await self._get("/users/current/user_agents", {"page": page})
