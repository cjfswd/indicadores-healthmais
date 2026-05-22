import os
import sys
import json
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
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


@app.post("/report/generate")
async def generate_report(request: Request):
    """Generate a PDF or PPTX report with optional embedded chart images."""
    body = await request.json()
    payload_json = json.dumps(body, ensure_ascii=False)

    script = os.path.join(os.path.dirname(__file__), "core", "generate_report.py")
    python_exec = sys.executable

    process = await asyncio.create_subprocess_exec(
        python_exec, script,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate(input=payload_json.encode("utf-8"))

    if process.returncode != 0:
        error_msg = stderr.decode("utf-8", errors="replace") if stderr else "Unknown error"
        raise HTTPException(status_code=500, detail=f"Report generation failed: {error_msg}")

    try:
        result = json.loads(stdout.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid response from report generator")

    if result.get("success"):
        file_path = result["filePath"]
        fmt = result.get("format", "pdf")

        if fmt == "pptx":
            media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        else:
            media_type = "application/pdf"

        return FileResponse(
            file_path,
            filename=os.path.basename(file_path),
            media_type=media_type
        )
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Report generation failed"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
