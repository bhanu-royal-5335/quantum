"""
FastAPI Simulation Router
=========================
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional

import uuid
from datetime import datetime, timezone
from ..models.schemas import (
    ChannelParameters,
    SimulationResult,
    MonteCarloStats,
    RealisticSimulationRequest,
    RealisticSimulationResult,
    QuantumSimulationRequest,
    QuantumSimulationResponse,
    QberComparison
)
from ..simulation.channel import run_full_quantum_simulation
from ..simulation.realistic_channel import run_realistic_quantum_simulation
from ..simulation.monte_carlo import run_monte_carlo_simulation
from ..simulation.bb84 import simulate_bb84_protocol
from ..simulation.noise import calculate_detection_probabilities
from ..simulation.secret_key import calculate_secure_key_rate
from ..simulation.qber import generate_qber_vs_loss_curve
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


@router.post("/quantum", response_model=QuantumSimulationResponse)
def run_quantum_bb84_simulation(payload: QuantumSimulationRequest):
    """
    Executes a discrete BB84 quantum key distribution simulation:
    - 2D state-vector preparation (|0>, |1>, |+>, |->)
    - FSO channel attenuation and detector noise
    - Bob measurement via Born's rule
    - Public basis sifting
    - Error estimation (Simulated QBER)
    - Asymptotic secret-key rate
    - Comparison with Reference / Dataset QBER (if provided)
    """
    try:
        t_channel = 10.0 ** (-max(0.0, payload.channel_loss_db) / 10.0)
        
        # 1. Analytical detection probabilities
        det_probs = calculate_detection_probabilities(
            total_channel_transmittance=t_channel,
            mean_photon_number=payload.mean_photon_number,
            detector_efficiency=payload.detector_efficiency,
            dark_count_rate=payload.dark_count_rate,
            background_noise=payload.background_noise,
            optical_error_rate=payload.optical_error_rate
        )

        # 2. Discrete stochastic BB84 quantum simulation
        bb84_res = simulate_bb84_protocol(
            num_bits=payload.num_bits,
            p_click=det_probs["p_click"],
            p_signal=det_probs["p_signal"],
            p_noise=det_probs["p_noise"],
            optical_error_rate=payload.optical_error_rate,
            channel_loss_db=payload.channel_loss_db,
            mean_photon_number=payload.mean_photon_number,
            detector_efficiency=payload.detector_efficiency,
            dark_count_rate=payload.dark_count_rate,
            background_noise=payload.background_noise,
            sample_trace_count=payload.sample_trace_count
        )

        sim_qber = bb84_res["simulated_qber"]
        ana_qber = det_probs["qber"]

        # 3. Secret-Key Rate and Information Reconciliation
        skr_res = calculate_secure_key_rate(
            qber=sim_qber,
            sifted_key_length=bb84_res["sifted_key_length"],
            repetition_rate_hz=payload.repetition_rate,
            p_click=det_probs["p_click"],
            fec_efficiency=payload.fec_efficiency
        )

        # 4. Generate Loss vs QBER curve (Simulated vs Analytical)
        loss_curve = generate_qber_vs_loss_curve(
            mean_photon_number=payload.mean_photon_number,
            detector_efficiency=payload.detector_efficiency,
            dark_count_rate=payload.dark_count_rate,
            background_noise=payload.background_noise,
            optical_error_rate=payload.optical_error_rate,
            repetition_rate_hz=payload.repetition_rate,
            fec_efficiency=payload.fec_efficiency,
            num_simulation_pulses=min(5000, max(2000, payload.num_bits // 2))
        )

        # 5. Dataset / Reference QBER Comparison (if provided)
        qber_comp = None
        qber_diff = None
        if payload.reference_qber is not None:
            ref_q = payload.reference_qber
            abs_diff = abs(sim_qber - ref_q)
            qber_diff = abs_diff
            rel_diff = (abs_diff / max(1e-6, ref_q)) * 100.0
            is_tol = abs_diff <= 0.02
            if abs_diff < 0.008:
                status_str = "EXCELLENT_MATCH"
            elif abs_diff <= 0.02:
                status_str = "ACCEPTABLE_MATCH"
            else:
                status_str = "DIVERGENT"

            qber_comp = QberComparison(
                simulated_qber=round(sim_qber, 5),
                reference_qber=round(ref_q, 5),
                absolute_difference=round(abs_diff, 5),
                relative_difference_percent=round(rel_diff, 2),
                is_within_tolerance=is_tol,
                status=status_str
            )

        sim_id = str(uuid.uuid4())
        timestamp_str = datetime.now(timezone.utc).isoformat()

        return QuantumSimulationResponse(
            id=sim_id,
            timestamp=timestamp_str,
            num_bits=payload.num_bits,
            photons_transmitted=payload.num_bits,
            photons_detected=bb84_res["total_detected"],
            detection_rate=round(bb84_res["detection_rate"] * 100.0, 2),
            raw_key_length=bb84_res["total_detected"],
            basis_matched_count=bb84_res["basis_matched_count"],
            sifted_key_length=bb84_res["sifted_key_length"],
            sifting_ratio=round(bb84_res["sifted_fraction"] * 100.0, 2),
            error_bits=bb84_res["error_bits"],
            simulated_qber=round(sim_qber, 5),
            analytical_qber=round(ana_qber, 5),
            qber_std_error=round(bb84_res.get("qber_std_err", 0.0), 5),
            reference_qber=payload.reference_qber,
            qber_difference=round(qber_diff, 5) if qber_diff is not None else None,
            secret_key_rate=round(skr_res["secret_key_rate_bps"], 2),
            secure_key_length=skr_res["discrete_secure_bits"],
            is_secure=skr_res["is_secure"],
            security_status_message=skr_res["security_status_message"],
            channel_loss_db=round(payload.channel_loss_db, 2),
            snr_db=round(det_probs["snr_db"], 2),
            bit_samples=bb84_res["bit_samples"],
            qber_vs_loss_curve=loss_curve,
            qber_comparison=qber_comp
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Quantum simulation failed: {str(e)}"
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

