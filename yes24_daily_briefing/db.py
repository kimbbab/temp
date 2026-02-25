from __future__ import annotations

import sqlite3
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime

def connect(path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            collected_at TEXT NOT NULL,
            category_key TEXT NOT NULL,
            category_name TEXT NOT NULL,
            list_type TEXT NOT NULL,
            source_url TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS items (
            snapshot_id INTEGER NOT NULL,
            rank INTEGER NOT NULL,
            goods_id TEXT NOT NULL,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            author TEXT,
            publisher TEXT,
            pub_date TEXT,
            sales_index INTEGER,
            rating REAL,
            review_count INTEGER,
            PRIMARY KEY(snapshot_id, rank),
            FOREIGN KEY(snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_snapshots_lookup
        ON snapshots(category_key, list_type, collected_at);

        CREATE INDEX IF NOT EXISTS idx_items_goods
        ON items(goods_id);
        """
    )
    conn.commit()

def insert_snapshot(conn: sqlite3.Connection, *, collected_at: str, category_key: str, category_name: str, list_type: str, source_url: str) -> int:
    cur = conn.execute(
        "INSERT INTO snapshots(collected_at, category_key, category_name, list_type, source_url) VALUES (?,?,?,?,?)",
        (collected_at, category_key, category_name, list_type, source_url),
    )
    conn.commit()
    return int(cur.lastrowid)

def insert_items(conn: sqlite3.Connection, snapshot_id: int, items: List[Dict[str, Any]]) -> None:
    conn.executemany(
        """
        INSERT INTO items(snapshot_id, rank, goods_id, title, url, author, publisher, pub_date, sales_index, rating, review_count)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """,
        [
            (
                snapshot_id,
                it.get("rank"),
                it.get("goods_id"),
                it.get("title"),
                it.get("url"),
                it.get("author"),
                it.get("publisher"),
                it.get("pub_date"),
                it.get("sales_index"),
                it.get("rating"),
                it.get("review_count"),
            )
            for it in items
        ],
    )
    conn.commit()

def get_latest_snapshot_before(conn: sqlite3.Connection, *, category_key: str, list_type: str, collected_at: str) -> Optional[Tuple[int, str]]:
    """Return (snapshot_id, collected_at) of the latest snapshot strictly before collected_at."""
    cur = conn.execute(
        """
        SELECT id, collected_at FROM snapshots
        WHERE category_key=? AND list_type=? AND collected_at < ?
        ORDER BY collected_at DESC
        LIMIT 1
        """,
        (category_key, list_type, collected_at),
    )
    row = cur.fetchone()
    if not row:
        return None
    return int(row[0]), str(row[1])

def get_items_by_snapshot(conn: sqlite3.Connection, snapshot_id: int) -> List[Dict[str, Any]]:
    cur = conn.execute(
        """
        SELECT rank, goods_id, title, url, author, publisher, pub_date, sales_index, rating, review_count
        FROM items WHERE snapshot_id=?
        ORDER BY rank ASC
        """,
        (snapshot_id,),
    )
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]
