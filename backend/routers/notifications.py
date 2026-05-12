import os
import json
from fastapi import APIRouter, HTTPException, Request
from pywebpush import webpush, WebPushException
from core.database import get_db

router = APIRouter(prefix="/push", tags=["push"])

VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_CLAIMS = {"sub": os.getenv("VAPID_CLAIMS_EMAIL", "mailto:admin@healthmaiscuidados.com")}

@router.get("/vapid-public-key")
async def get_vapid_key():
    return {"publicKey": VAPID_PUBLIC_KEY}

@router.post("/subscribe")
async def subscribe(request: Request):
    """Salva a inscrição de push do navegador no banco de dados."""
    subscription = await request.json()
    db = get_db()
    # Evita duplicatas baseada no endpoint
    await db.subscriptions.update_one(
        {"endpoint": subscription["endpoint"]},
        {"$set": subscription},
        upsert=True
    )
    return {"status": "success"}

async def send_push_notification(title: str, message: str, link: str = "/"):
    """Envia uma notificação push para todos os inscritos."""
    db = get_db()
    subscriptions = await db.subscriptions.find().to_list(length=1000)
    
    payload = json.dumps({
        "title": title,
        "body": message,
        "url": link
    })

    for sub in subscriptions:
        try:
            webpush(
                subscription_info=sub,
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
        except WebPushException as ex:
            print(f"Erro ao enviar push: {ex}")
            # Se a inscrição expirou (404 ou 410), remove do banco
            if ex.response is not None and ex.response.status_code in [404, 410]:
                await db.subscriptions.delete_one({"_id": sub["_id"]})
