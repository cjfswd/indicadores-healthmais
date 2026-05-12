import os
import json
from datetime import datetime, timezone
import jwt
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from core.database import get_db, JSONEncoder

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET = os.getenv("JWT_SECRET", "coringa_secret_key")

@router.post("/google")
async def auth_google(request: Request):
    body = await request.json()
    credential = body.get("credential")
    if not credential:
        raise HTTPException(status_code=400, detail="Missing credential")
        
    try:
        idinfo = id_token.verify_oauth2_token(
            credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        
        email = idinfo['email']
        name = idinfo.get('name')
        picture = idinfo.get('picture')
        
        db = get_db()
        users_col = db.users
        user = await users_col.find_one({"email": email})
        
        if not user:
            new_user = {
                "name": name,
                "email": email,
                "avatar": picture,
                "createdAt": datetime.now(timezone.utc),
                "deletedAt": None
            }
            res = await users_col.insert_one(new_user)
            user = {**new_user, "_id": res.inserted_id}
            
        token = jwt.encode(
            {"id": str(user["_id"]), "email": user["email"]},
            JWT_SECRET,
            algorithm="HS256"
        )
        
        return JSONResponse(
            content=json.loads(json.dumps({
                "success": True,
                "token": token,
                "user": user
            }, cls=JSONEncoder))
        )
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
