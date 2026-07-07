import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Configurator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "configurator.db")
SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "fda claims 2.txt")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS templates (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid        TEXT NOT NULL DEFAULT '',
            name        TEXT NOT NULL,
            description TEXT,
            layout      TEXT NOT NULL,
            created_by  TEXT,
            modified_by TEXT,
            created     TEXT,
            modified    TEXT,
            attributes  TEXT
        )
    """)
    conn.commit()

    count = conn.execute("SELECT COUNT(*) FROM templates").fetchone()[0]
    if count == 0 and os.path.exists(SEED_PATH):
        with open(SEED_PATH, "r") as f:
            sample = json.load(f)
        now = datetime.now(timezone.utc).isoformat()
        conn.execute("""
            INSERT INTO templates
                (uuid, name, description, layout, created_by, modified_by, created, modified, attributes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sample.get("uuid", str(uuid.uuid4())),
            sample.get("name", "FDA Claims 2"),
            sample.get("description"),
            json.dumps(sample.get("layout", {})),
            sample.get("createdBy"),
            sample.get("modifiedBy"),
            sample.get("created", now),
            sample.get("modified", now),
            json.dumps(sample.get("attributes")),
        ))
        conn.commit()
    conn.close()


init_db()


class TemplateIn(BaseModel):
    name: str
    description: Optional[str] = None
    layout: Any
    created_by: Optional[str] = None
    modified_by: Optional[str] = None
    attributes: Optional[Any] = None


def row_to_dict(row):
    attrs_raw = row["attributes"]
    return {
        "id": row["id"],
        "uuid": row["uuid"],
        "name": row["name"],
        "description": row["description"],
        "layout": json.loads(row["layout"]),
        "createdBy": row["created_by"],
        "modifiedBy": row["modified_by"],
        "created": row["created"],
        "modified": row["modified"],
        "attributes": json.loads(attrs_raw) if attrs_raw and attrs_raw != "null" else None,
    }


@app.get("/api/templates")
def list_templates():
    conn = get_db()
    rows = conn.execute(
        "SELECT id, name, description, modified FROM templates ORDER BY id"
    ).fetchall()
    conn.close()
    return [
        {"id": r["id"], "name": r["name"], "description": r["description"], "modified": r["modified"]}
        for r in rows
    ]


@app.get("/api/templates/{template_id}")
def get_template(template_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM templates WHERE id = ?", (template_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Template not found")
    return row_to_dict(row)


@app.post("/api/templates", status_code=201)
def create_template(template: TemplateIn):
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    cursor = conn.execute("""
        INSERT INTO templates
            (uuid, name, description, layout, created_by, modified_by, created, modified, attributes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        str(uuid.uuid4()),
        template.name,
        template.description,
        json.dumps(template.layout),
        template.created_by,
        template.modified_by,
        now, now,
        json.dumps(template.attributes),
    ))
    conn.commit()
    row = conn.execute("SELECT * FROM templates WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.put("/api/templates/{template_id}")
def update_template(template_id: int, template: TemplateIn):
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    result = conn.execute("""
        UPDATE templates
        SET name=?, description=?, layout=?, modified_by=?, modified=?, attributes=?
        WHERE id=?
    """, (
        template.name,
        template.description,
        json.dumps(template.layout),
        template.modified_by,
        now,
        json.dumps(template.attributes),
        template_id,
    ))
    conn.commit()
    if result.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Template not found")
    row = conn.execute("SELECT * FROM templates WHERE id = ?", (template_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.delete("/api/templates/{template_id}", status_code=204)
def delete_template(template_id: int):
    conn = get_db()
    result = conn.execute("DELETE FROM templates WHERE id = ?", (template_id,))
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Template not found")
