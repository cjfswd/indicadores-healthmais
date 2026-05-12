import os
import json
import urllib.request
from datetime import datetime, timezone
import jwt
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from core.database import get_db, JSONEncoder

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google")
async def auth_google(request: Request):
    body = await request.json()
    access_token = body.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing access_token")

    jwt_secret = os.getenv("JWT_SECRET", "coringa_secret_key")

    try:
        # Busca info do usuário direto da Google API usando o access_token
        req = urllib.request.Request(
            f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={access_token}"
        )
        with urllib.request.urlopen(req) as resp:
            userinfo = json.loads(resp.read().decode())

        email = userinfo.get("email")
        name = userinfo.get("name")
        picture = userinfo.get("picture")

        if not email:
            raise HTTPException(status_code=400, detail="Token sem email")

        db = get_db()
        users_col = db.users
        user = await users_col.find_one({"email": email})

        if not user:
            new_user = {
                "name": name,
                "email": email,
                "avatar": picture,
                "createdAt": datetime.now(timezone.utc),
                "deletedAt": None,
            }
            res = await users_col.insert_one(new_user)
            user = {**new_user, "_id": res.inserted_id}

        token = jwt.encode(
            {"id": str(user["_id"]), "email": user["email"]},
            jwt_secret,
            algorithm="HS256",
        )

        return JSONResponse(
            content=json.loads(
                json.dumps(
                    {"success": True, "token": token, "user": user}, cls=JSONEncoder
                )
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH ERROR] {type(e).__name__}: {e}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
