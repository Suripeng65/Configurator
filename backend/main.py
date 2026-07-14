import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Query
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

    # ── UI Templates ──────────────────────────────────────────
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
            attributes  TEXT,
            ds_id       TEXT,
            site_code   TEXT,
            container_id TEXT
        )
    """)
    # Add columns that may be missing in older DBs
    for col, typedef in [("ds_id", "TEXT"), ("site_code", "TEXT"), ("container_id", "TEXT")]:
        try:
            conn.execute(f"ALTER TABLE templates ADD COLUMN {col} {typedef}")
        except Exception:
            pass

    # ── Datasets ──────────────────────────────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS datasets (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            ds_id        TEXT NOT NULL UNIQUE,
            name         TEXT NOT NULL,
            container_id TEXT,
            site_code    TEXT,
            description  TEXT
        )
    """)

    # ── Column Templates ──────────────────────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS column_templates (
            id                   INTEGER PRIMARY KEY AUTOINCREMENT,
            ds_id                TEXT NOT NULL,
            column_name          TEXT NOT NULL,
            column_display_name  TEXT,
            format               TEXT,
            visibility           INTEGER DEFAULT 1
        )
    """)

    conn.commit()

    # Seed templates from file if empty
    count = conn.execute("SELECT COUNT(*) FROM templates").fetchone()[0]
    if count == 0 and os.path.exists(SEED_PATH):
        with open(SEED_PATH, "r") as f:
            sample = json.load(f)
        now = datetime.now(timezone.utc).isoformat()
        conn.execute("""
            INSERT INTO templates
                (uuid, name, description, layout, created_by, modified_by, created, modified, attributes, ds_id, site_code, container_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            "FDA_CLAIMS_2",
            "US",
            "CONT_001",
        ))
        conn.commit()

    # Seed sample datasets if empty
    if conn.execute("SELECT COUNT(*) FROM datasets").fetchone()[0] == 0:
        now = datetime.now(timezone.utc).isoformat()
        sample_datasets = [
            ("FDA_CLAIMS_2", "FDA Claims 2", "CONT_001", "US", "FDA claims dataset v2"),
            ("LND_SURVEY",   "LND Survey",   "CONT_002", "EU", "Land survey data"),
        ]
        conn.executemany(
            "INSERT INTO datasets (ds_id, name, container_id, site_code, description) VALUES (?,?,?,?,?)",
            sample_datasets,
        )
        # Seed some column templates
        sample_cols = [
            ("FDA_CLAIMS_2", "claimId",      "Claim ID",      "string",  1),
            ("FDA_CLAIMS_2", "patientAge",   "Patient Age",   "integer", 1),
            ("FDA_CLAIMS_2", "diagnosis",    "Diagnosis",     "string",  1),
            ("FDA_CLAIMS_2", "claimAmount",  "Claim Amount",  "currency",1),
            ("LND_SURVEY",   "parcelId",     "Parcel ID",     "string",  1),
            ("LND_SURVEY",   "area",         "Area (sqm)",    "number",  1),
        ]
        conn.executemany(
            "INSERT INTO column_templates (ds_id, column_name, column_display_name, format, visibility) VALUES (?,?,?,?,?)",
            sample_cols,
        )
        conn.commit()

    conn.close()


init_db()


# ─────────────────────────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────────────────────────

class TemplateIn(BaseModel):
    name: str
    description: Optional[str] = None
    layout: Any
    created_by: Optional[str] = None
    modified_by: Optional[str] = None
    attributes: Optional[Any] = None
    ds_id: Optional[str] = None
    site_code: Optional[str] = None
    container_id: Optional[str] = None


class DatasetIn(BaseModel):
    ds_id: str
    name: str
    container_id: Optional[str] = None
    site_code: Optional[str] = None
    description: Optional[str] = None


class ColumnTemplateIn(BaseModel):
    column_name: str
    column_display_name: Optional[str] = None
    format: Optional[str] = None
    visibility: Optional[bool] = True


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

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
        "dsId": row["ds_id"],
        "siteCode": row["site_code"],
        "containerId": row["container_id"],
    }


# ─────────────────────────────────────────────────────────────
# UI Templates
# ─────────────────────────────────────────────────────────────

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
            (uuid, name, description, layout, created_by, modified_by, created, modified, attributes, ds_id, site_code, container_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        str(uuid.uuid4()),
        template.name, template.description,
        json.dumps(template.layout),
        template.created_by, template.modified_by,
        now, now,
        json.dumps(template.attributes),
        template.ds_id, template.site_code, template.container_id,
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
        SET name=?, description=?, layout=?, modified_by=?, modified=?, attributes=?, ds_id=?, site_code=?, container_id=?
        WHERE id=?
    """, (
        template.name, template.description,
        json.dumps(template.layout),
        template.modified_by, now,
        json.dumps(template.attributes),
        template.ds_id, template.site_code, template.container_id,
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


# ─────────────────────────────────────────────────────────────
# getuiTemplates — list templates with dataset metadata
# ─────────────────────────────────────────────────────────────

@app.get("/getuiTemplates")
def get_ui_templates():
    conn = get_db()
    rows = conn.execute("""
        SELECT t.id, t.name, t.ds_id, t.site_code, t.container_id, t.modified,
               d.name AS dataset_name
        FROM templates t
        LEFT JOIN datasets d ON t.ds_id = d.ds_id
        ORDER BY t.id
    """).fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "dsId": r["ds_id"],
            "siteCode": r["site_code"],
            "containerId": r["container_id"],
            "modified": r["modified"],
            "datasetName": r["dataset_name"],
        }
        for r in rows
    ]


@app.get("/api/templates/by-dsid/{ds_id}")
def get_template_by_dsid(ds_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM templates WHERE ds_id = ?", (ds_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Template not found")
    return row_to_dict(row)


# ─────────────────────────────────────────────────────────────
# Datasets
# ─────────────────────────────────────────────────────────────

@app.get("/dataset-metadata/all")
def list_datasets():
    conn = get_db()
    rows = conn.execute("SELECT * FROM datasets ORDER BY id").fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "dsId": r["ds_id"],
            "name": r["name"],
            "containerId": r["container_id"],
            "siteCode": r["site_code"],
            "description": r["description"],
        }
        for r in rows
    ]


@app.post("/dataset-metadata", status_code=201)
def create_dataset(dataset: DatasetIn):
    conn = get_db()
    try:
        cursor = conn.execute(
            "INSERT INTO datasets (ds_id, name, container_id, site_code, description) VALUES (?,?,?,?,?)",
            (dataset.ds_id, dataset.name, dataset.container_id, dataset.site_code, dataset.description),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM datasets WHERE id = ?", (cursor.lastrowid,)).fetchone()
        conn.close()
        return {"id": row["id"], "dsId": row["ds_id"], "name": row["name"],
                "containerId": row["container_id"], "siteCode": row["site_code"],
                "description": row["description"]}
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=409, detail="Dataset with that DSID already exists")


@app.put("/dataset-metadata/{ds_id}")
def update_dataset(ds_id: str, dataset: DatasetIn):
    conn = get_db()
    result = conn.execute(
        "UPDATE datasets SET name=?, container_id=?, site_code=?, description=? WHERE ds_id=?",
        (dataset.name, dataset.container_id, dataset.site_code, dataset.description, ds_id),
    )
    conn.commit()
    if result.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Dataset not found")
    row = conn.execute("SELECT * FROM datasets WHERE ds_id = ?", (ds_id,)).fetchone()
    conn.close()
    return {"id": row["id"], "dsId": row["ds_id"], "name": row["name"],
            "containerId": row["container_id"], "siteCode": row["site_code"],
            "description": row["description"]}


@app.delete("/dataset-metadata/{ds_id}", status_code=204)
def delete_dataset(ds_id: str):
    conn = get_db()
    result = conn.execute("DELETE FROM datasets WHERE ds_id = ?", (ds_id,))
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Dataset not found")


# ─────────────────────────────────────────────────────────────
# Column Templates
# ─────────────────────────────────────────────────────────────

@app.get("/columnTemplate")
def get_column_template(dsId: str = Query(...)):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM column_templates WHERE ds_id = ? ORDER BY id", (dsId,)
    ).fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "dsId": r["ds_id"],
            "columnName": r["column_name"],
            "columnDisplayName": r["column_display_name"],
            "format": r["format"],
            "visibility": bool(r["visibility"]),
        }
        for r in rows
    ]


@app.put("/columnTemplate/{col_id}")
def update_column(col_id: int, col: ColumnTemplateIn):
    conn = get_db()
    result = conn.execute(
        "UPDATE column_templates SET column_name=?, column_display_name=?, format=?, visibility=? WHERE id=?",
        (col.column_name, col.column_display_name, col.format, 1 if col.visibility else 0, col_id),
    )
    conn.commit()
    if result.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Column not found")
    row = conn.execute("SELECT * FROM column_templates WHERE id = ?", (col_id,)).fetchone()
    conn.close()
    return {"id": row["id"], "dsId": row["ds_id"], "columnName": row["column_name"],
            "columnDisplayName": row["column_display_name"], "format": row["format"],
            "visibility": bool(row["visibility"])}


@app.post("/columnTemplate", status_code=201)
def create_column(dsId: str = Query(...), col: ColumnTemplateIn = None):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO column_templates (ds_id, column_name, column_display_name, format, visibility) VALUES (?,?,?,?,?)",
        (dsId, col.column_name, col.column_display_name, col.format, 1 if col.visibility else 0),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM column_templates WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return {"id": row["id"], "dsId": row["ds_id"], "columnName": row["column_name"],
            "columnDisplayName": row["column_display_name"], "format": row["format"],
            "visibility": bool(row["visibility"])}


@app.delete("/columnTemplate/{col_id}", status_code=204)
def delete_column(col_id: int):
    conn = get_db()
    result = conn.execute("DELETE FROM column_templates WHERE id = ?", (col_id,))
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Column not found")
