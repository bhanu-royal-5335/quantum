"""
FastAPI Simulation Router
=========================
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional

from ..models.schemas import (
    ChannelParameters,
    SimulationResult,
    MonteCarloStats,
    RealisticSimulationRequest,
    RealisticSimulationResult
)
from ..simulation.channel import run_full_quantum_simulation
from ..simulation.realistic_channel import run_realistic_quantum_simulation
from ..simulation.monte_carlo import run_monte_carlo_simulation
from ..database import (
    save_simulation_result,
    get_simulation_result,
    get_recent_simulations,
    get_scenario_by_id
)

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.post("/run", response_model=SimulationResult)
def run_simulation(params: ChannelParameters, scenario_id: Optional[str] = None, scenario_name: Optional[str] = None):
    """
    Executes a complete physical quantum simulation with the supplied channel parameters.
    """
    name = scenario_name or "Custom Simulation"
    if scenario_id:
        scen = get_scenario_by_id(scenario_id)
        if scen:
            name = scen.name

    try:
        result = run_full_quantum_simulation(params=params, scenario_id=scenario_id, scenario_name=name)
        save_simulation_result(result)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Simulation could not be completed: {str(e)}"
        )


@router.post("/realistic", response_model=RealisticSimulationResult)
def run_realistic_simulation(payload: RealisticSimulationRequest):
    """
    Executes the full realistic demonstration workflow:
    CelesTrak TLE -> Skyfield Propagation -> Satellite Position -> Link Geometry ->
    Weather Data -> Atmospheric Channel -> Relay Model -> BB84 QBER -> Estimated SKR
    """
    try:
        res = run_realistic_quantum_simulation(
            satellite_id=payload.satellite_id,
            ground_station=payload.ground_station,
            custom_params=payload.parameters,
            use_live_weather=payload.use_live_weather,
            use_live_tle=payload.use_live_tle
        )
        # Also persist the core simulation result to history
        save_simulation_result(res.simulation_result)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Realistic simulation failed: {str(e)}"
        )


@router.get("/{sim_id}", response_model=SimulationResult)
def get_simulation(sim_id: str):
    """
    Retrieves previous simulation result by ID.
    """
    res = get_simulation_result(sim_id)
    if not res:
        raise HTTPException(status_code=404, detail="Simulation run not found.")
    return res


@router.get("/recent/list")
def get_recent(limit: int = 10):
    """
    Returns recent simulation summaries.
    """
    return get_recent_simulations(limit=limit)

