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
    try:
        body = await request.json()
        payload_json = json.dumps(body, ensure_ascii=False)

        script = os.path.join(os.path.dirname(__file__), "core", "generate_report.py")
        python_exec = sys.executable

        import subprocess

        def run_report():
            return subprocess.run(
                [python_exec, script],
                input=payload_json,
                capture_output=True,
                text=True,
                encoding="utf-8",
            )

        proc = await asyncio.to_thread(run_report)

        if proc.returncode != 0:
            error_msg = proc.stderr or "Unknown error"
            print(f"[REPORT ERROR] subprocess failed: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Report generation failed: {error_msg}")

        try:
            result = json.loads(proc.stdout)
        except json.JSONDecodeError:
            raw = proc.stdout[:500]
            print(f"[REPORT ERROR] invalid JSON from subprocess: {raw}")
            raise HTTPException(status_code=500, detail=f"Invalid response from report generator: {raw}")

        if result.get("success"):
            file_path = os.path.abspath(result["filePath"])
            fmt = result.get("format", "pdf")

            if not os.path.exists(file_path):
                print(f"[REPORT ERROR] file not found: {file_path}")
                raise HTTPException(status_code=500, detail=f"Generated file not found: {file_path}")

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
            detail = result.get("error", "Report generation failed")
            print(f"[REPORT ERROR] generator returned error: {detail}")
            raise HTTPException(status_code=500, detail=detail)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[REPORT ERROR] unhandled: {tb}")
        raise HTTPException(status_code=500, detail=f"Unhandled error: {type(e).__name__}: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
