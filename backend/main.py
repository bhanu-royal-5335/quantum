"""
Main FastAPI Application for Quantum Communication Simulation & Verification
===========================================================================
"""

from fastapi import FastAPI
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
