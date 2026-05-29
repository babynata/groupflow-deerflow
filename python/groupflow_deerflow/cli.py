from __future__ import annotations

import argparse
import sys

from .ingest import ingest_run_events
from .server import run_server


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m groupflow_deerflow")
    subparsers = parser.add_subparsers(dest="command", required=True)

    ingest = subparsers.add_parser("ingest", help="Ingest a DeerFlow RunEventStore JSONL file.")
    ingest.add_argument("--run", required=True, help="Path to DeerFlow .deer-flow/threads/{thread_id}/runs/{run_id}.jsonl")
    ingest.add_argument("--out", required=True, help="Output directory for GroupFlow JSON state files.")

    server = subparsers.add_parser("server", help="Run the GroupFlow HTTP tool sidecar.")
    server.add_argument("--state", required=True, help="Path to GroupFlow state JSON.")
    server.add_argument("--host", default="127.0.0.1", help="Host to bind. Defaults to 127.0.0.1.")
    server.add_argument("--port", type=int, default=8765, help="Port to bind. Defaults to 8765.")

    args = parser.parse_args(argv)
    if args.command == "ingest":
        summary = ingest_run_events(args.run, args.out)
        print(f"GroupFlow sidecar wrote {summary['outputDir']}")
        print(f"records={summary['recordCount']} timeline={summary['timelineCount']} files={summary['fileCount']} artifacts={summary['artifactCount']}")
        return 0
    if args.command == "server":
        run_server(args.state, args.host, args.port)
        return 0

    parser.print_help(sys.stderr)
    return 2
