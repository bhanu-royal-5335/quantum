"""
Main FastAPI Application for Quantum Communication Simulation & Verification
===========================================================================
"""

import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.database import init_db
from .api.simulation import router as simulation_router
from .api.scenarios import router as scenarios_router
from .api.reports import router as reports_router
from .api.satellite import router as satellite_router
from .api.weather import router as weather_router
from .api.dataset import router as dataset_router
from .api.quantum_simulation import router as quantum_simulation_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed default scenarios
    init_db()
    yield


app = FastAPI(
    title="Hierarchical Quantum Communication Simulation & Verification API",
    description="Simulates Alice (Quantum Source) -> LEO Satellite -> Relay/HAP -> Bob (Ground Receiver) BB84 QKD FSO links.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(simulation_router)
app.include_router(scenarios_router)
app.include_router(reports_router)
app.include_router(satellite_router)
app.include_router(weather_router)
app.include_router(dataset_router)
app.include_router(quantum_simulation_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Quantum Communication Simulation API",
        "version": "1.0.0"
    }


# Static frontend hosting for unified deployments (Docker / all-in-one on Render)
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

if os.path.isdir(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="static-assets")


@app.get("/")
def read_root():
    index_file = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    return {
        "service": "Hierarchical Quantum Optical Communication Simulation & Verification API",
        "status": "healthy",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }


if os.path.isdir(DIST_DIR):
    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        target_path = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.isfile(target_path):
            return FileResponse(target_path)
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Resource not found"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
