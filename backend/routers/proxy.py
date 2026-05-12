import json
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from core.database import (
    get_db, JSONEncoder,
    append_event, EVENT_STORE_COLLECTION, get_stream_events
)

router = APIRouter(prefix="/db", tags=["proxy"])


@router.post("/execute")
async def db_execute(request: Request):
    meta_header = request.headers.get('x-db-meta')
    if not meta_header:
        raise HTTPException(status_code=400, detail="Missing x-db-meta header")

    try:
        metadata = json.loads(meta_header)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON in x-db-meta header")

    action = metadata.get("action")
    collection_name = metadata.get("collection")
    if not action or not collection_name:
        raise HTTPException(status_code=400, detail="Missing action or collection")

    db = get_db()
    col = db[collection_name]
    start_time = datetime.now()

    # Lê dados pesados do body
    body = await request.json() if request.headers.get('content-type', '').startswith('application/json') else {}
    body_data = body.get("data", {})

    result = None
    total = 0

    try:
        # ─── READ operations: lêem direto do snapshot (collection original) ───
        if action == "find":
            query = metadata.get("query", {})
            skip = metadata.get("skip", 0)
            limit = metadata.get("limit", 1000)
            sort_options = metadata.get("sort")

            if "deletedAt" not in query and collection_name != EVENT_STORE_COLLECTION:
                query["deletedAt"] = None

            total = await col.count_documents(query)
            cursor = col.find(query)

            if sort_options:
                cursor = cursor.sort(sort_options)
            else:
                cursor = cursor.sort("_id", -1)

            cursor = cursor.skip(skip).limit(limit)
            result = await cursor.to_list(length=limit)

        elif action == "aggregate":
            pipeline = metadata.get("pipeline", [])
            cursor = col.aggregate(pipeline)
            result = await cursor.to_list(length=1000)

        elif action == "findOne":
            doc_id = metadata.get("id")
            query = metadata.get("query", {})
            if doc_id:
                query["_id"] = ObjectId(doc_id)
            doc = await col.find_one(query)
            result = doc

        # ─── WRITE operations: append event → materializa snapshot ───────────

        elif action == "insert":
            data = body_data if body_data else metadata.get("data", {})

            # Gera um novo ObjectId para o stream
            new_id = ObjectId()
            stream_id = str(new_id)

            snapshot = await append_event(
                stream_type=collection_name,
                stream_id=stream_id,
                event_type="CREATE",
                data=data,
                actor=data.pop("updatedBy", "") or metadata.get("actor", "")
            )
            result = snapshot

        elif action == "update":
            doc_id = metadata.get("id")
            update_data = body_data if body_data else metadata.get("data", {})

            # Preserva dados binários de arquivos existentes no snapshot
            existing_doc = await col.find_one({"_id": ObjectId(doc_id)})
            if existing_doc:
                # Arquivo raiz do documento
                if "file" in update_data and isinstance(update_data["file"], dict):
                    if "data" not in update_data["file"] and isinstance(existing_doc.get("file"), dict):
                        update_data["file"]["data"] = existing_doc["file"].get("data", "")
                # Arquivos dentro de eventos embedded
                if "events" in update_data and isinstance(update_data["events"], list):
                    existing_events = {str(e.get("_id")): e for e in (existing_doc.get("events") or [])}
                    for evt in update_data["events"]:
                        evt_file = evt.get("file")
                        if isinstance(evt_file, dict) and "data" not in evt_file:
                            old_evt = existing_events.get(str(evt.get("_id")))
                            if old_evt and isinstance(old_evt.get("file"), dict):
                                evt["file"]["data"] = old_evt["file"].get("data", "")

            snapshot = await append_event(
                stream_type=collection_name,
                stream_id=doc_id,
                event_type="UPDATE",
                data=update_data,
                actor=update_data.pop("updatedBy", "") or metadata.get("actor", "")
            )
            result = snapshot

        elif action == "delete":
            doc_id = metadata.get("id")

            # Verifica se já está deletado
            existing = await col.find_one({"_id": ObjectId(doc_id), "deletedAt": None})
            if not existing:
                result = None
            else:
                snapshot = await append_event(
                    stream_type=collection_name,
                    stream_id=doc_id,
                    event_type="SOFT_DELETE",
                    data={"deletedAt": datetime.now(timezone.utc).isoformat()},
                    actor=metadata.get("actor", "")
                )
                result = snapshot

        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        response_data = {
            "success": True,
            "result": result,
            "duration": f"{duration_ms}ms"
        }
        if action == "find":
            response_data["total"] = total

        return JSONResponse(
            content=json.loads(json.dumps(response_data, cls=JSONEncoder))
        )
    except Exception as e:
        print(f"DB Error: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@router.get("/drop-db")
async def drop_db_route():
    db = get_db()
    await db.operators.drop()
    await db.indicators.drop()
    await db.patients.drop()
    await db[EVENT_STORE_COLLECTION].drop()
    return {"status": "ok"}



@router.get("/file/{collection}/{doc_id}/{file_index}")
async def download_file(collection: str, doc_id: str, file_index: int, event_id: str | None = None):
    """Decodifica o base64 armazenado e faz download do arquivo."""
    import base64
    from fastapi.responses import Response

    db = get_db()
    col = db[collection]

    doc = await col.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Se event_id fornecido, busca arquivo dentro do evento embedded
    if event_id:
        events = doc.get("events", [])
        event = next((e for e in events if str(e.get("_id")) == event_id), None)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        file_data = event.get("file")
    else:
        file_data = doc.get("file")

    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")

    # Arquivo está armazenado como base64 string
    content = base64.b64decode(file_data.get("data", ""))

    return Response(
        content=content,
        media_type=file_data.get("type", "application/octet-stream"),
        headers={
            "Content-Disposition": f'attachment; filename="{file_data.get("name", "file")}"'
        }
    )


# ─── Event Store: Endpoints de consulta ──────────────────────────

@router.get("/events/{stream_type}/{stream_id}")
async def get_entity_events(stream_type: str, stream_id: str):
    """Retorna o histórico completo de eventos de uma entidade."""
    events = await get_stream_events(stream_type, stream_id)
    return JSONResponse(
        content=json.loads(json.dumps({
            "success": True,
            "result": events,
            "total": len(events)
        }, cls=JSONEncoder))
    )
