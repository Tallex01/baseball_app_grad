#!/usr/bin/env python3
"""Create a simple SQLite database for a sports warehouse."""

from __future__ import annotations

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "sports_warehouse.db"

SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL UNIQUE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity_in_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    supplier TEXT,
    reorder_level INTEGER NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_inventory_items_updated_at
AFTER UPDATE ON inventory_items
FOR EACH ROW
BEGIN
    UPDATE inventory_items
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;
"""

SEED_ITEMS = [
    ("BKB-001", "Basketball", "Basketball", 42, 24.99, "Hoop Supply Co.", 10),
    ("BAT-001", "Baseball Bat", "Baseball", 28, 49.50, "Slugger Works", 8),
    ("HKY-001", "Hockey Mask", "Hockey", 16, 79.99, "Ice Guard Inc.", 4),
    ("SCR-001", "Soccer Ball", "Soccer", 35, 29.95, "GoalLine Goods", 10),
    ("TNS-001", "Tennis Racket", "Tennis", 19, 89.00, "CourtTech", 5),
    ("FBL-001", "Football Helmet", "Football", 12, 119.99, "Gridiron Gear", 3),
]


def create_database(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(db_path) as conn:
        conn.executescript(SCHEMA_SQL)
        conn.executemany(
            """
            INSERT OR IGNORE INTO inventory_items (
                sku,
                item_name,
                category,
                quantity_in_stock,
                unit_price,
                supplier,
                reorder_level
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            SEED_ITEMS,
        )
        conn.commit()


if __name__ == "__main__":
    create_database(DB_PATH)
    print(f"Database created at: {DB_PATH}")
