"""
FastAPI Scenarios and Comparison Router
======================================
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel

from ..models.schemas import ScenarioResponse, ScenarioCreate, SimulationResult, ScenarioComparisonResponse
from ..database import list_scenarios, get_scenario_by_id, save_scenario, save_simulation_result
from ..simulation.channel import run_full_quantum_simulation

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])


class CompareRequest(BaseModel):
    scenario_ids: List[str]


@router.get("", response_model=List[ScenarioResponse])
def get_all_scenarios():
    """
    Returns all default and user-defined quantum communication scenarios.
    """
    return list_scenarios()


@router.get("/{scenario_id}", response_model=ScenarioResponse)
def get_scenario(scenario_id: str):
    """
    Retrieves scenario details by ID.
    """
    scen = get_scenario_by_id(scenario_id)
    if not scen:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scen


@router.post("", response_model=ScenarioResponse)
def create_custom_scenario(payload: ScenarioCreate):
    """
    Saves a new user custom scenario.
    """
    return save_scenario(
        name=payload.name,
        description=payload.description or "",
        parameters=payload.parameters
    )


@router.post("/compare", response_model=ScenarioComparisonResponse)
def compare_scenarios(payload: CompareRequest):
    """
    Executes simulations across the selected scenario IDs and returns a unified comparison matrix.
    """
    if not payload.scenario_ids:
        raise HTTPException(status_code=400, detail="Please select at least one scenario to compare.")

    simulation_results: List[SimulationResult] = []
    comparison_table: List[Dict[str, Any]] = []

    for s_id in payload.scenario_ids:
        scen = get_scenario_by_id(s_id)
        if not scen:
            continue
        sim = run_full_quantum_simulation(params=scen.parameters, scenario_id=scen.id, scenario_name=scen.name)
        save_simulation_result(sim)
        simulation_results.append(sim)

        comparison_table.append({
            "id": sim.id,
            "scenario_id": scen.id,
            "scenario_name": scen.name,
            "has_relay": "HAP Relay" if scen.parameters.has_relay else "Direct Downlink",
            "distance_km": f"{scen.parameters.satellite_altitude:.0f} km",
            "wavelength_nm": f"{scen.parameters.wavelength:.0f} nm",
            "visibility_km": f"{scen.parameters.visibility:.1f} km",
            "turbulence": scen.parameters.turbulence_level.capitalize(),
            "pointing_jitter": f"{scen.parameters.pointing_error:.1f} μrad",
            "channel_loss_db": f"{sim.channel_loss_db:.2f} dB",
            "qber_percent": f"{sim.qber * 100.0:.3f} %",
            "secret_key_rate_bps": f"{sim.secret_key_rate:,.1f} bps",
            "detection_rate_percent": f"{sim.detection_rate:.2f} %",
            "sifted_key_length": f"{sim.sifted_key_length:,}",
            "secure_key_length": f"{sim.secure_key_length:,}",
            "is_secure": sim.is_secure,
            "security_status": "SECURE" if sim.is_secure else "INSECURE"
        })

    return ScenarioComparisonResponse(
        scenarios=simulation_results,
        comparison_table=comparison_table
    )
