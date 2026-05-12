import os
import sys
import subprocess
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from dotenv import load_dotenv

from core.database import init_db, close_db
from core.seeder import seed_database
from routers import auth, proxy

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

dist_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if "--build-frontend" in sys.argv or not os.path.isdir(dist_path):
    frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
    print("📦 Building frontend automatically...")
    try:
        subprocess.run("pnpm install", cwd=frontend_dir, check=True, shell=True)
        subprocess.run("pnpm run build", cwd=frontend_dir, check=True, shell=True)
        print("[OK] Frontend build complete!")
    except Exception as e:
        print(f"[ERROR] Failed to build frontend: {e}")

if os.path.isdir(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
    
    @app.exception_handler(StarletteHTTPException)
    async def _catch_all(request, exc):
        if exc.status_code == 404:
            return JSONResponse(status_code=404, content={"message": "Not Found"})

    @app.get("/{full_path:path}")
    async def serve_vue_app(full_path: str):
        index_file = os.path.join(dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"message": "Not Found"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
