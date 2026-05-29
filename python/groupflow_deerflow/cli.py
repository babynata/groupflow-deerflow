from __future__ import annotations

import argparse
import sys

from .ingest import ingest_run_events


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m groupflow_deerflow")
    subparsers = parser.add_subparsers(dest="command", required=True)

    ingest = subparsers.add_parser("ingest", help="Ingest a DeerFlow RunEventStore JSONL file.")
    ingest.add_argument("--run", required=True, help="Path to DeerFlow .deer-flow/threads/{thread_id}/runs/{run_id}.jsonl")
    ingest.add_argument("--out", required=True, help="Output directory for GroupFlow JSON state files.")

    args = parser.parse_args(argv)
    if args.command == "ingest":
        summary = ingest_run_events(args.run, args.out)
        print(f"GroupFlow sidecar wrote {summary['outputDir']}")
        print(f"records={summary['recordCount']} timeline={summary['timelineCount']} files={summary['fileCount']} artifacts={summary['artifactCount']}")
        return 0

    parser.print_help(sys.stderr)
    return 2
