from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from .runtime import call_tool, list_tools, load_state, save_state


def run_server(state_path: str | Path, host: str = "127.0.0.1", port: int = 8765) -> None:
    server = make_server(state_path, host, port)
    print(f"GroupFlow sidecar server running at http://{host}:{server.server_port}", flush=True)
    print(f"State file: {state_path}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


def make_server(state_path: str | Path, host: str = "127.0.0.1", port: int = 8765) -> ThreadingHTTPServer:
    state_file = Path(state_path)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, format: str, *args: Any) -> None:
            return

        def do_GET(self) -> None:
            path = urlparse(self.path).path
            if path == "/health":
                return self.send_json({"ok": True})
            if path == "/tools":
                return self.send_json({"tools": list_tools()})
            if path == "/state":
                return self.send_json(load_state(state_file))
            return self.send_json({"ok": False, "error": "Not found"}, status=404)

        def do_POST(self) -> None:
            path = urlparse(self.path).path
            if not path.startswith("/tools/"):
                return self.send_json({"ok": False, "error": "Not found"}, status=404)
            tool_name = path.removeprefix("/tools/")
            try:
                payload = self.read_json()
                state = load_state(state_file)
                result = call_tool(state, tool_name, payload)
                save_state(state_file, state)
                return self.send_json({"tool": tool_name, "ok": True, "result": result})
            except KeyError as error:
                return self.send_json({"tool": tool_name, "ok": False, "error": str(error)}, status=404)
            except ValueError as error:
                return self.send_json({"tool": tool_name, "ok": False, "error": str(error)}, status=400)
            except Exception as error:
                return self.send_json({"tool": tool_name, "ok": False, "error": str(error)}, status=500)

        def read_json(self) -> dict[str, Any]:
            length = int(self.headers.get("Content-Length") or 0)
            if length == 0:
                return {}
            raw = self.rfile.read(length).decode("utf-8")
            data = json.loads(raw)
            if not isinstance(data, dict):
                raise ValueError("Request body must be a JSON object.")
            return data

        def send_json(self, payload: Any, status: int = 200) -> None:
            body = json.dumps(payload, indent=2, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    return ThreadingHTTPServer((host, port), Handler)
