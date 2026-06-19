import os
import json
from datetime import datetime, timezone
from bson import ObjectId
import jwt
from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import JSONResponse
from core.database import (
    get_db, JSONEncoder,
    append_event, EVENT_STORE_COLLECTION, get_stream_events
)

router = APIRouter(prefix="/db", tags=["proxy"])


# ── Indicadores que disparam inativação automática ──
_INACTIVATION_RULES = [
    # (prefixo do indicador, prefixo do subindicador ou None, motivo)
    ("04", None, "obito"),
    ("01", "1.1", "alta"),
]


def _inactivation_reason(event: dict) -> str | None:
    """Retorna o motivo de inativação se o evento deve inativar o paciente, ou None."""
    ind_name = (event.get("indicator") or {}).get("name", "")
    sub_name = (event.get("subindicator") or {}).get("name", "")
    for ind_prefix, sub_prefix, reason in _INACTIVATION_RULES:
        if not ind_name.startswith(ind_prefix):
            continue
        if sub_prefix is None or sub_name.startswith(sub_prefix):
            return reason
    return None


def _extract_actor(request: Request, data: dict, metadata: dict) -> str:
    """Extrai o email do actor com fallback em cadeia:
    1. JWT do header Authorization (fonte confiável)
    2. Campo 'updatedBy' do data (fallback frontend)
    3. Campo 'actor' do metadata (fallback explícito)
    """
    # 1. Tenta decodificar JWT
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            secret = os.getenv("JWT_SECRET", "coringa_secret_key")
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            email = payload.get("email", "")
            if email:
                return email
        except (jwt.InvalidTokenError, Exception):
            pass  # fallback para as próximas opções

    # 2. Fallback: frontend envia no body
    frontend_email = data.pop("updatedBy", "") if isinstance(data, dict) else ""
    if frontend_email:
        return frontend_email

    # 3. Fallback: metadata explícito
    return metadata.get("actor", "")


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
            actor = _extract_actor(request, data, metadata)

            # ─── Prevenção de duplicatas ───
            if collection_name in ("patients", "operators"):
                name = data.get("name", "").strip()
                if name:
                    dup_query = {"name": name, "deletedAt": None}
                    if collection_name == "patients":
                        op_id = ""
                        if isinstance(data.get("operator"), dict):
                            op_id = data["operator"].get("_id", "")
                        if op_id:
                            dup_query["operator._id"] = op_id
                    existing = await col.find_one(dup_query)
                    if existing:
                        raise HTTPException(
                            status_code=409,
                            detail=f"Já existe um registro ativo com o nome '{name}'"
                        )

            # Gera um novo ObjectId para o stream
            new_id = ObjectId()
            stream_id = str(new_id)

            snapshot = await append_event(
                stream_type=collection_name,
                stream_id=stream_id,
                event_type="CREATE",
                data=data,
                actor=actor
            )
            result = snapshot

            # ─── REAL PUSH HOOK ───
            if collection_name == "notifications":
                from routers.notifications import send_push_notification
                import asyncio
                asyncio.create_task(send_push_notification(
                    title=data.get("title", "Healthmais"),
                    message=data.get("message", ""),
                    link=data.get("link", "/")
                ))


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

            actor = _extract_actor(request, update_data, metadata)

            snapshot = await append_event(
                stream_type=collection_name,
                stream_id=doc_id,
                event_type="UPDATE",
                data=update_data,
                actor=actor
            )
            result = snapshot

            # ── Auto-inativação em Alta ou Óbito ──
            if collection_name == "patients" and "events" in update_data:
                existing_ids = {
                    str(e.get("_id"))
                    for e in (existing_doc.get("events") or [])
                } if existing_doc else set()

                for evt in update_data.get("events", []):
                    if str(evt.get("_id", "")) in existing_ids:
                        continue  # evento já existia, ignora
                    reason = _inactivation_reason(evt)
                    if reason:
                        still_active = await col.find_one({"_id": ObjectId(doc_id), "deletedAt": None})
                        if still_active:
                            await append_event(
                                stream_type=collection_name,
                                stream_id=doc_id,
                                event_type="SOFT_DELETE",
                                data={
                                    "deletedAt": datetime.now(timezone.utc).isoformat(),
                                    "inactivationReason": reason,
                                },
                                actor=actor,
                            )
                        break

        elif action == "delete":
            doc_id = metadata.get("id")

            # Verifica se já está deletado
            existing = await col.find_one({"_id": ObjectId(doc_id), "deletedAt": None})
            if not existing:
                result = None
            else:
                actor = _extract_actor(request, {}, metadata)

                snapshot = await append_event(
                    stream_type=collection_name,
                    stream_id=doc_id,
                    event_type="SOFT_DELETE",
                    data={"deletedAt": datetime.now(timezone.utc).isoformat()},
                    actor=actor
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
    except HTTPException:
        raise
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


@router.get("/patients/deleted")
async def get_deleted_patients():
    """Retorna pacientes inativados (soft-deleted) com o motivo da inativação."""
    db = get_db()
    col = db["patients"]

    cursor = col.find({"deletedAt": {"$ne": None}}).sort("deletedAt", -1)
    docs = await cursor.to_list(length=1000)

    result = []
    for doc in docs:
        events = await get_stream_events("patients", str(doc["_id"]))
        delete_event = next(
            (e for e in reversed(events) if e.get("eventType") == "SOFT_DELETE"),
            None,
        )
        reason = (delete_event or {}).get("data", {}).get("inactivationReason")
        result.append({
            **doc,
            "deletedAt": doc.get("deletedAt"),
            "inactivationReason": reason,
            "deletedBy": (delete_event or {}).get("actor"),
        })

    return JSONResponse(
        content=json.loads(json.dumps({
            "success": True,
            "result": result,
            "total": len(result),
        }, cls=JSONEncoder))
    )


@router.get("/analytics/hospitalization-rate")
async def get_hospitalization_rate(
    start: str = Query(None, description="Data inicial (YYYY-MM-DD)"),
    end: str = Query(None, description="Data final (YYYY-MM-DD)"),
):
    """
    Calcula a taxa de internação hospitalar:
    (eventos do indicador 03 no período / pacientes em AD ou ID no período) × 100
    """
    db = get_db()
    col = db["patients"]

    start_dt = datetime.fromisoformat(start + "T00:00:00") if start else None
    end_dt = datetime.fromisoformat(end + "T23:59:59") if end else None

    patients = await col.find({"deletedAt": None}).to_list(length=10000)
    inactivated = await col.find({"deletedAt": {"$ne": None}}).to_list(length=10000)
    all_patients = patients + inactivated

    hosp_events = 0
    ad_id_patients: set[str] = set()

    for p in all_patients:
        p_events = p.get("events") or []

        for evt in p_events:
            occ = evt.get("occurrenceDate")
            if occ:
                try:
                    d = datetime.fromisoformat(occ.replace("Z", "+00:00")).replace(tzinfo=None)
                except Exception:
                    d = None
                if d:
                    if start_dt and d < start_dt:
                        continue
                    if end_dt and d > end_dt:
                        continue
            ind_name = (evt.get("indicator") or {}).get("name", "")
            if ind_name.startswith("03"):
                hosp_events += 1

        # Último evento do indicador 06 para determinar modalidade atual
        ind06 = [
            e for e in p_events
            if (e.get("indicator") or {}).get("name", "").startswith("06")
        ]
        if start_dt or end_dt:
            ind06 = [
                e for e in ind06
                if _date_in_range(e.get("occurrenceDate"), start_dt, end_dt)
            ]
        if ind06:
            ind06.sort(key=lambda e: e.get("occurrenceDate", ""))
            sub = (ind06[-1].get("subindicator") or {}).get("name", "")
            if "AD" in sub or "ID" in sub:
                ad_id_patients.add(str(p["_id"]))

    ad_id_total = len(ad_id_patients)
    rate = round((hosp_events / ad_id_total) * 100, 2) if ad_id_total > 0 else None

    return JSONResponse(content={
        "success": True,
        "result": {
            "hospitalizationEvents": hosp_events,
            "adIdPatients": ad_id_total,
            "rate": rate,
            "period": {"start": start, "end": end},
        },
    })


def _date_in_range(occ: str | None, start_dt, end_dt) -> bool:
    if not occ:
        return True
    try:
        d = datetime.fromisoformat(occ.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return True
    if start_dt and d < start_dt:
        return False
    if end_dt and d > end_dt:
        return False
    return True
