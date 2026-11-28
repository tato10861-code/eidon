#!/usr/bin/env python3
"""
Eidon training data pipeline.

Fetches conversations from Neon, formats them as OpenAI-compatible
fine-tuning JSONL, and writes a ready-to-upload dataset.

Usage:
    python scripts/prepare_training.py --out dataset.jsonl
    python scripts/prepare_training.py --out dataset.jsonl --min-turns 3 --employee ava
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Generator

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    sys.exit("psycopg2 is required: pip install psycopg2-binary")


@dataclass
class Turn:
    role: str  # "user" | "assistant" | "system"
    content: str


@dataclass
class Conversation:
    id: str
    employee_id: str
    turns: list[Turn]
    created_at: datetime


def connect(database_url: str):
    return psycopg2.connect(database_url, cursor_factory=psycopg2.extras.RealDictCursor)


def fetch_conversations(
    conn,
    employee_id: str | None = None,
    limit: int = 10_000,
) -> Generator[Conversation, None, None]:
    """Stream conversations with their messages from Neon."""
    employee_filter = "AND e.id = %(employee_id)s" if employee_id else ""
    query = f"""
        SELECT
            c.id              AS conv_id,
            c.employee_id,
            c.created_at,
            m.role,
            m.content,
            m.created_at      AS msg_at
        FROM conversations c
        JOIN employees e ON e.id = c.employee_id
        JOIN messages   m ON m.conversation_id = c.id
        WHERE c.id IN (
            SELECT id FROM conversations
            {employee_filter}
            ORDER BY created_at DESC
            LIMIT %(limit)s
        )
        {employee_filter}
        ORDER BY c.created_at DESC, m.created_at ASC
    """
    with conn.cursor() as cur:
        cur.execute(query, {"employee_id": employee_id, "limit": limit})
        rows = cur.fetchall()

    # Group by conversation
    conv_map: dict[str, Conversation] = {}
    for row in rows:
        cid = row["conv_id"]
        if cid not in conv_map:
            conv_map[cid] = Conversation(
                id=cid,
                employee_id=row["employee_id"],
                turns=[],
                created_at=row["created_at"],
            )
        conv_map[cid].turns.append(Turn(role=row["role"], content=row["content"]))

    yield from conv_map.values()


def to_fine_tune_sample(conv: Conversation, system_prompt: str) -> dict:
    """Convert a conversation to OpenAI fine-tuning JSONL format."""
    messages = [{"role": "system", "content": system_prompt}]
    for turn in conv.turns:
        if turn.role in ("user", "assistant"):
            messages.append({"role": turn.role, "content": turn.content})
    return {"messages": messages}


def main() -> None:
    parser = argparse.ArgumentParser(description="Eidon training data pipeline")
    parser.add_argument("--out", default="dataset.jsonl", help="Output JSONL file")
    parser.add_argument("--employee", default=None, help="Filter by employee ID")
    parser.add_argument("--min-turns", type=int, default=2, help="Minimum turns per conversation")
    parser.add_argument("--limit", type=int, default=10_000, help="Max conversations to fetch")
    parser.add_argument(
        "--system",
        default="You are a helpful AI employee. Be professional, accurate, and concise.",
        help="System prompt to prepend to every sample",
    )
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        sys.exit("DATABASE_URL environment variable is required")

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Connecting to Neon…")
    conn = connect(database_url)

    written = skipped = 0
    with out_path.open("w", encoding="utf-8") as fh:
        for conv in fetch_conversations(conn, employee_id=args.employee, limit=args.limit):
            if len(conv.turns) < args.min_turns:
                skipped += 1
                continue
            sample = to_fine_tune_sample(conv, args.system)
            fh.write(json.dumps(sample, ensure_ascii=False) + "\n")
            written += 1

    conn.close()
    print(f"Done. {written} samples written to {out_path} ({skipped} skipped — too short).")
    print(f"Upload with: openai api fine_tuning.jobs.create -t {out_path} -m gpt-4o-mini")


if __name__ == "__main__":
    main()
