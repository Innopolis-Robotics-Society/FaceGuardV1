"""Local SQLite database for offline buffering"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from contextlib import contextmanager

from agent.core.config import Config
from agent.core.logging import get_logger


logger = get_logger(__name__)


class Database:
    """SQLite database manager for offline event buffering"""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or Config.DATABASE_FILE
        self._init_database()

    def _init_database(self):
        """Initialize database tables"""
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # Events table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    device_id TEXT,
                    person_id TEXT,
                    event_type TEXT NOT NULL,
                    confidence REAL,
                    door_opened INTEGER DEFAULT 0,
                    photo_path TEXT,
                    video_path TEXT,
                    created_at TEXT NOT NULL,
                    synced INTEGER DEFAULT 0,
                    synced_at TEXT
                )
            """)

            # Telemetry table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS telemetry (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    device_id TEXT,
                    cpu_usage REAL,
                    cpu_temperature REAL,
                    ram_usage REAL,
                    disk_usage REAL,
                    uptime INTEGER,
                    camera_fps REAL,
                    network_status TEXT,
                    created_at TEXT NOT NULL,
                    synced INTEGER DEFAULT 0,
                    synced_at TEXT
                )
            """)

            # Commands table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS commands (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    command_id TEXT UNIQUE,
                    command_type TEXT NOT NULL,
                    parameters TEXT,
                    status TEXT DEFAULT 'pending',
                    result TEXT,
                    error_message TEXT,
                    created_at TEXT NOT NULL,
                    executed_at TEXT,
                    completed_at TEXT
                )
            """)

            conn.commit()
            logger.info(f"Database initialized at {self.db_path}")

    @contextmanager
    def _get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    # Events methods
    def add_event(self, event_data: Dict[str, Any]) -> int:
        """Add event to database"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO events (
                    device_id, person_id, event_type, confidence,
                    door_opened, photo_path, video_path, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event_data.get("device_id"),
                event_data.get("person_id"),
                event_data["event_type"],
                event_data.get("confidence"),
                int(event_data.get("door_opened", False)),
                event_data.get("photo_path"),
                event_data.get("video_path"),
                event_data.get("created_at", datetime.utcnow().isoformat())
            ))
            conn.commit()
            return cursor.lastrowid

    def get_unsynced_events(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get unsynced events"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM events WHERE synced = 0 ORDER BY created_at LIMIT ?
            """, (limit,))
            return [dict(row) for row in cursor.fetchall()]

    def mark_events_synced(self, event_ids: List[int]):
        """Mark events as synced"""
        if not event_ids:
            return
        with self._get_connection() as conn:
            cursor = conn.cursor()
            placeholders = ",".join("?" * len(event_ids))
            cursor.execute(f"""
                UPDATE events SET synced = 1, synced_at = ? WHERE id IN ({placeholders})
            """, [datetime.utcnow().isoformat()] + event_ids)
            conn.commit()

    # Telemetry methods
    def add_telemetry(self, telemetry_data: Dict[str, Any]) -> int:
        """Add telemetry record"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO telemetry (
                    device_id, cpu_usage, cpu_temperature, ram_usage,
                    disk_usage, uptime, camera_fps, network_status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                telemetry_data.get("device_id"),
                telemetry_data.get("cpu_usage"),
                telemetry_data.get("cpu_temperature"),
                telemetry_data.get("ram_usage"),
                telemetry_data.get("disk_usage"),
                telemetry_data.get("uptime"),
                telemetry_data.get("camera_fps"),
                telemetry_data.get("network_status"),
                telemetry_data.get("created_at", datetime.utcnow().isoformat())
            ))
            conn.commit()
            return cursor.lastrowid

    def get_unsynced_telemetry(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get unsynced telemetry"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM telemetry WHERE synced = 0 ORDER BY created_at LIMIT ?
            """, (limit,))
            return [dict(row) for row in cursor.fetchall()]

    def mark_telemetry_synced(self, telemetry_ids: List[int]):
        """Mark telemetry as synced"""
        if not telemetry_ids:
            return
        with self._get_connection() as conn:
            cursor = conn.cursor()
            placeholders = ",".join("?" * len(telemetry_ids))
            cursor.execute(f"""
                UPDATE telemetry SET synced = 1, synced_at = ? WHERE id IN ({placeholders})
            """, [datetime.utcnow().isoformat()] + telemetry_ids)
            conn.commit()

    # Commands methods
    def add_command(self, command_data: Dict[str, Any]) -> int:
        """Add command to database"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO commands (
                    command_id, command_type, parameters, status, created_at
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                command_data["command_id"],
                command_data["command_type"],
                json.dumps(command_data.get("parameters", {})),
                command_data.get("status", "pending"),
                command_data.get("created_at", datetime.utcnow().isoformat())
            ))
            conn.commit()
            return cursor.lastrowid

    def update_command_status(self, command_id: str, status: str,
                            result: Optional[Dict] = None,
                            error: Optional[str] = None):
        """Update command status"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            now = datetime.utcnow().isoformat()

            update_fields = ["status = ?"]
            params = [status]

            if status == "running":
                update_fields.append("executed_at = ?")
                params.append(now)

            if status in ("completed", "failed"):
                update_fields.append("completed_at = ?")
                params.append(now)

            if result:
                update_fields.append("result = ?")
                params.append(json.dumps(result))

            if error:
                update_fields.append("error_message = ?")
                params.append(error)

            params.append(command_id)

            cursor.execute(f"""
                UPDATE commands SET {', '.join(update_fields)} WHERE command_id = ?
            """, params)
            conn.commit()

    def get_pending_commands(self) -> List[Dict[str, Any]]:
        """Get pending commands"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM commands WHERE status = 'pending' ORDER BY created_at
            """)
            commands = []
            for row in cursor.fetchall():
                cmd = dict(row)
                if cmd.get("parameters"):
                    cmd["parameters"] = json.loads(cmd["parameters"])
                commands.append(cmd)
            return commands

    def cleanup_old_records(self, days: int = 30):
        """Cleanup old synced records"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cutoff_date = datetime.utcnow().replace(day=1).isoformat()

            cursor.execute("""
                DELETE FROM events WHERE synced = 1 AND synced_at < ?
            """, (cutoff_date,))

            cursor.execute("""
                DELETE FROM telemetry WHERE synced = 1 AND synced_at < ?
            """, (cutoff_date,))

            cursor.execute("""
                DELETE FROM commands WHERE status IN ('completed', 'failed')
                AND completed_at < ?
            """, (cutoff_date,))

            conn.commit()
            logger.info(f"Cleaned up old records older than {days} days")
