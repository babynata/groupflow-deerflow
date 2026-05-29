from __future__ import annotations

import json
from typing import Any
from urllib import request


class GroupFlowClient:
    def __init__(self, base_url: str = "http://127.0.0.1:8765") -> None:
        self.base_url = base_url.rstrip("/")

    def call_tool(self, name: str, payload: dict[str, Any] | None = None) -> Any:
        body = json.dumps(payload or {}).encode("utf-8")
        req = request.Request(
            f"{self.base_url}/tools/{name}",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
        if not data.get("ok"):
            raise RuntimeError(data.get("error") or f"GroupFlow tool failed: {name}")
        return data.get("result")

    def list_tools(self) -> list[dict[str, Any]]:
        with request.urlopen(f"{self.base_url}/tools", timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))["tools"]

    def get_state(self) -> dict[str, Any]:
        with request.urlopen(f"{self.base_url}/state", timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
