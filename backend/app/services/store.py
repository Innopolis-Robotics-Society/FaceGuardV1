from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class LocalStore:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self._lock = threading.Lock()
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._lock, self._connect() as connection:
            connection.executescript(
                """
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS events (
                    id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    person_id TEXT,
                    person_name TEXT,
                    recognition_distance REAL,
                    photo_path TEXT,
                    details_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    synced INTEGER NOT NULL DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_events_synced ON events(synced, created_at);

                CREATE TABLE IF NOT EXISTS command_history (
                    id TEXT PRIMARY KEY,
                    command TEXT NOT NULL,
                    parameters_json TEXT NOT NULL,
                    status TEXT NOT NULL,
                    result_json TEXT,
                    error_message TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT
                );
                """
            )

    def add_event(
        self,
        event_type: str,
        *,
        person_id: str | None = None,
        person_name: str | None = None,
        recognition_distance: float | None = None,
        photo_path: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        event = {
            "id": str(uuid.uuid4()),
            "event_type": event_type,
            "person_id": person_id,
            "person_name": person_name,
            "recognition_distance": recognition_distance,
            "photo_path": photo_path,
            "details": details or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
            "synced": False,
        }
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                INSERT INTO events (
                    id, event_type, person_id, person_name, recognition_distance,
                    photo_path, details_json, created_at, synced
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
                """,
                (
                    event["id"],
                    event["event_type"],
                    event["person_id"],
                    event["person_name"],
                    event["recognition_distance"],
                    event["photo_path"],
                    json.dumps(event["details"], ensure_ascii=False),
                    event["created_at"],
                ),
            )
        return event

    def list_events(self, limit: int = 100, only_unsynced: bool = False) -> list[dict[str, Any]]:
        query = "SELECT * FROM events"
        params: list[Any] = []
        if only_unsynced:
            query += " WHERE synced = 0"
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        with self._connect() as connection:
            rows = connection.execute(query, params).fetchall()
        return [self._event_row_to_dict(row) for row in rows]

    def mark_events_synced(self, event_ids: list[str]) -> None:
        if not event_ids:
            return
        placeholders = ",".join("?" for _ in event_ids)
        with self._lock, self._connect() as connection:
            connection.execute(
                f"UPDATE events SET synced = 1 WHERE id IN ({placeholders})",
                event_ids,
            )

    def create_command(self, command: str, parameters: dict[str, Any]) -> str:
        command_id = str(uuid.uuid4())
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                INSERT INTO command_history (
                    id, command, parameters_json, status, created_at
                ) VALUES (?, ?, ?, 'running', ?)
                """,
                (
                    command_id,
                    command,
                    json.dumps(parameters, ensure_ascii=False),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
        return command_id

    def complete_command(
        self,
        command_id: str,
        *,
        result: dict[str, Any] | None = None,
        error_message: str | None = None,
    ) -> None:
        status = "failed" if error_message else "completed"
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                UPDATE command_history
                SET status = ?, result_json = ?, error_message = ?, completed_at = ?
                WHERE id = ?
                """,
                (
                    status,
                    json.dumps(result or {}, ensure_ascii=False),
                    error_message,
                    datetime.now(timezone.utc).isoformat(),
                    command_id,
                ),
            )

    @staticmethod
    def _event_row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "event_type": row["event_type"],
            "person_id": row["person_id"],
            "person_name": row["person_name"],
            "recognition_distance": row["recognition_distance"],
            "photo_path": row["photo_path"],
            "details": json.loads(row["details_json"] or "{}"),
            "created_at": row["created_at"],
            "synced": bool(row["synced"]),
        }
