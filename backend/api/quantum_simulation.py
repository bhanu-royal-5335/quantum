"""
FastAPI Quantum Simulation Laboratory Router
============================================
Handles requests for the dedicated interactive Quantum Simulation dashboard:
- POST /api/quantum-simulation/run
- POST /api/quantum-simulation/sweep
- GET  /api/quantum-simulation/history
- GET  /api/quantum-simulation/history/{exp_id}
- GET  /api/quantum-simulation/satellites
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..quantum.bb84 import run_bb84_simulation
from ..quantum.experiments import generate_experiment_charts, sweep_qber_vs_eavesdropping, sweep_qber_vs_distance, sweep_qber_vs_simulation_size, sweep_skr_vs_qber
from ..quantum.channel import SATELLITE_CATALOG, calculate_fso_link_budget
from ..database import (
    save_quantum_experiment_result,
    get_quantum_experiment_history,
    get_quantum_experiment_result
)

router = APIRouter(prefix="/api/quantum-simulation", tags=["Quantum Simulation Laboratory"])


class QuantumLabRunRequest(BaseModel):
    satellite: str = Field("micius", description="Satellite identifier or name")
    distance_km: float = Field(500.0, ge=50.0, le=3000.0, description="Satellite to Ground link distance in km")
    num_bits: int = Field(10000, ge=100, le=200000, description="Number of quantum pulses/qubits transmitted")
    eavesdropping_enabled: bool = Field(False, description="Whether Eve intercepts pulses")
    eavesdropping_probability: float = Field(0.25, ge=0.0, le=1.0, description="Interception probability (0.0 to 1.0)")
    attack_type: str = Field("intercept_resend", description="Attack strategy: intercept_resend")
    channel_noise: float = Field(0.02, ge=0.0, le=0.30, description="Quantum channel / hardware noise probability")
    turbulence: str = Field("moderate", description="Turbulence level: low | moderate | high | custom")
    pointing_error: float = Field(5.0, ge=0.0, le=30.0, description="Pointing jitter in microradians (urad)")
    detector_efficiency: float = Field(0.80, ge=0.05, le=1.0, description="Bob detector quantum efficiency (0.05 to 1.0)")
    fec_efficiency: float = Field(1.16, ge=1.0, le=2.0, description="Error correction inefficiency factor (f_EC)")
    dark_count_rate: float = Field(1e-6, ge=1e-8, le=1e-2, description="Detector dark count probability")
    background_noise: float = Field(1e-6, ge=1e-8, le=1e-2, description="Background ambient noise probability")
    monte_carlo_runs: int = Field(100, ge=10, le=5000, description="Number of Monte Carlo verification runs")
    include_charts: bool = Field(True, description="Whether to include precomputed sweep curves")
    data_source_mode: str = Field("manual", description="manual | dataset | satellite_live")


class SweepRequest(BaseModel):
    sweep_type: str = Field(..., description="eavesdropping | distance | bits | skr")
    base_parameters: QuantumLabRunRequest


@router.get("/satellites")
def get_satellites():
    """
    Returns list of available satellites for link distance configuration.
    """
    return [
        {
            "id": k,
            "name": v["name"],
            "altitude_km": v["altitude_km"],
            "norad_id": v["norad_id"]
        }
        for k, v in SATELLITE_CATALOG.items()
    ]


@router.get("/calculate-loss")
def get_calculated_loss(
    distance_km: float = 500.0,
    pointing_error: float = 5.0,
    turbulence: str = "moderate"
):
    """
    Real-time endpoint returning calculated channel loss in dB based on slider adjustments.
    """
    budget = calculate_fso_link_budget(
        distance_km=distance_km,
        pointing_jitter_urad=pointing_error,
        turbulence_level=turbulence
    )
    return budget


@router.post("/run")
def run_quantum_simulation_experiment(payload: QuantumLabRunRequest):
    """
    Executes an actual BB84 quantum simulation experiment and returns
    detected bits, sifted bits, errors, QBER, SKR, and interactive sweep curves.
    """
    try:
        # Run discrete BB84 protocol
        sim_result = run_bb84_simulation(
            num_bits=payload.num_bits,
            distance_km=payload.distance_km,
            satellite=payload.satellite,
            eavesdropping_enabled=payload.eavesdropping_enabled,
            eavesdropping_probability=payload.eavesdropping_probability,
            attack_type=payload.attack_type,
            channel_noise=payload.channel_noise,
            turbulence=payload.turbulence,
            pointing_error=payload.pointing_error,
            detector_efficiency=payload.detector_efficiency,
            fec_efficiency=payload.fec_efficiency,
            sample_trace_count=40
        )

        exp_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        # Build response payload
        charts_data = {}
        if payload.include_charts:
            base_dict = payload.model_dump()
            charts_data = generate_experiment_charts(base_dict)

        response_data = {
            "id": exp_id,
            "timestamp": timestamp,
            "satellite": payload.satellite,
            "distance_km": payload.distance_km,
            "bits_sent": sim_result["bits_sent"],
            "detections": sim_result["detections"],
            "detection_rate": sim_result["detection_rate"],
            "sifted_bits": sim_result["sifted_bits"],
            "sifting_ratio": sim_result["sifting_ratio"],
            "errors": sim_result["errors"],
            "qber": sim_result["qber"],
            "qber_percent": sim_result["qber_percent"],
            "qber_std_error": sim_result["qber_std_error"],
            "estimated_skr": sim_result["estimated_skr"],
            "discrete_secure_bits": sim_result["discrete_secure_bits"],
            "is_secure": sim_result["is_secure"],
            "security_status_message": sim_result["security_status_message"],
            "eavesdropping_detected": sim_result["eavesdropping_detected"],
            "eavesdropping_enabled": payload.eavesdropping_enabled,
            "eavesdropping_probability": payload.eavesdropping_probability,
            "channel_noise": payload.channel_noise,
            "channel_loss_db": sim_result["channel_loss_db"],
            "link_budget": sim_result["link_budget"],
            "bit_samples": sim_result["bit_samples"],
            "charts": charts_data,
            "data_source_mode": payload.data_source_mode
        }

        # Save to SQLite history
        save_quantum_experiment_result(response_data)

        return response_data

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Quantum simulation experiment failed: {str(e)}")


@router.post("/sweep")
def run_sweep(payload: SweepRequest):
    """
    Executes on-demand parameter sweeps for individual charts.
    """
    base = payload.base_parameters.model_dump()
    st = payload.sweep_type.lower()

    if st == "eavesdropping":
        return sweep_qber_vs_eavesdropping(base)
    elif st == "distance":
        return sweep_qber_vs_distance(base)
    elif st == "bits":
        return sweep_qber_vs_simulation_size(base)
    elif st == "skr":
        return sweep_skr_vs_qber()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown sweep type: {st}")


@router.get("/history")
def get_history(limit: int = 15):
    """
    Returns list of past quantum simulation experiment runs.
    """
    return get_quantum_experiment_history(limit=limit)


@router.get("/history/{exp_id}")
def get_history_detail(exp_id: str):
    """
    Retrieves complete parameters, results, and charts of a past experiment run.
    """
    res = get_quantum_experiment_result(exp_id)
    if not res:
        raise HTTPException(status_code=404, detail="Experiment run not found")
    return res
