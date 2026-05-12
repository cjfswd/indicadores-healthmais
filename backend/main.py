import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from core.database import init_db, close_db
from core.seeder import seed_database
from routers import auth, proxy, notifications


load_dotenv()
PORT = int(os.getenv("PORT", 3000))

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = await init_db()
    await seed_database(db)
    yield
    await close_db()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(proxy.router)
app.include_router(notifications.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
