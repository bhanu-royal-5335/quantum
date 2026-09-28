"""
Quantum Experiments and Parameter Sweep Engine
==============================================
Runs multi-point stochastic BB84 simulations to generate interactive curves for:
1. QBER vs Eavesdropping Probability (0% to 100%)
2. QBER vs Distance (100 km to 2000 km)
3. QBER vs Simulation Size (1k to 100k pulses - statistical convergence)
4. Secret-Key Rate vs QBER (showing 11% security threshold cutoff)
5. Eavesdropping vs Estimated Secret-Key Rate
"""

import math
import numpy as np
from typing import Dict, Any, List

from .bb84 import run_bb84_simulation
from .secret_key import calculate_secure_key_rate


def sweep_qber_vs_eavesdropping(
    base_params: Dict[str, Any],
    sweep_pulses: int = 4000
) -> List[Dict[str, Any]]:
    """
    Sweeps Eve interception probability from 0% to 100% in 11 steps.
    Each point executes an actual discrete BB84 simulation trial.
    """
    eve_levels = np.linspace(0.0, 1.0, 11)
    curve = []

    for eve_p in eve_levels:
        p_float = float(eve_p)
        res = run_bb84_simulation(
            num_bits=sweep_pulses,
            distance_km=base_params.get("distance_km", 500.0),
            satellite=base_params.get("satellite", "micius"),
            eavesdropping_enabled=(p_float > 0.0),
            eavesdropping_probability=p_float,
            channel_noise=base_params.get("channel_noise", 0.02),
            turbulence=base_params.get("turbulence", "moderate"),
            pointing_error=base_params.get("pointing_error", 5.0),
            detector_efficiency=base_params.get("detector_efficiency", 0.80),
            sample_trace_count=0
        )

        # Theoretical expected QBER = baseline_noise + 0.25 * P_eve
        theo_qber = base_params.get("channel_noise", 0.02) + 0.25 * p_float

        curve.append({
            "eavesdropping_percent": round(p_float * 100.0, 1),
            "simulated_qber_percent": res["qber_percent"],
            "theoretical_qber_percent": round(theo_qber * 100.0, 2),
            "qber_percent": res["qber_percent"],
            "secret_key_rate_bps": res["estimated_skr"],
            "is_secure": res["is_secure"],
            "eavesdropping_detected": res["eavesdropping_detected"],
            "sifted_bits": res["sifted_bits"]
        })

    return curve


def sweep_qber_vs_distance(
    base_params: Dict[str, Any],
    sweep_pulses: int = 4000
) -> List[Dict[str, Any]]:
    """
    Sweeps satellite-to-ground distance from 100 km to 2000 km in 12 steps.
    """
    distances = np.linspace(100.0, 2000.0, 12)
    curve = []

    for dist in distances:
        d_val = float(dist)
        res = run_bb84_simulation(
            num_bits=sweep_pulses,
            distance_km=d_val,
            satellite=base_params.get("satellite", "micius"),
            eavesdropping_enabled=base_params.get("eavesdropping_enabled", False),
            eavesdropping_probability=base_params.get("eavesdropping_probability", 0.25),
            channel_noise=base_params.get("channel_noise", 0.02),
            turbulence=base_params.get("turbulence", "moderate"),
            pointing_error=base_params.get("pointing_error", 5.0),
            detector_efficiency=base_params.get("detector_efficiency", 0.80),
            sample_trace_count=0
        )

        curve.append({
            "distance_km": round(d_val, 1),
            "channel_loss_db": res["channel_loss_db"],
            "simulated_qber_percent": res["qber_percent"],
            "qber_percent": res["qber_percent"],
            "secret_key_rate_bps": res["estimated_skr"],
            "detection_rate": res["detection_rate"],
            "is_secure": res["is_secure"]
        })

    return curve


def sweep_qber_vs_simulation_size(
    base_params: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Sweeps pulse counts [1000, 5000, 10000, 25000, 50000, 100000]
    to demonstrate statistical variance reduction and convergence.
    """
    sizes = [1000, 5000, 10000, 25000, 50000, 100000]
    curve = []

    for sz in sizes:
        res = run_bb84_simulation(
            num_bits=sz,
            distance_km=base_params.get("distance_km", 500.0),
            satellite=base_params.get("satellite", "micius"),
            eavesdropping_enabled=base_params.get("eavesdropping_enabled", False),
            eavesdropping_probability=base_params.get("eavesdropping_probability", 0.25),
            channel_noise=base_params.get("channel_noise", 0.02),
            turbulence=base_params.get("turbulence", "moderate"),
            pointing_error=base_params.get("pointing_error", 5.0),
            detector_efficiency=base_params.get("detector_efficiency", 0.80),
            sample_trace_count=0
        )

        curve.append({
            "num_bits": sz,
            "label": f"{sz//1000}k" if sz >= 1000 else str(sz),
            "simulated_qber_percent": res["qber_percent"],
            "qber_percent": res["qber_percent"],
            "std_error_percent": round(res["qber_std_error"] * 100.0, 3),
            "sifted_bits": res["sifted_bits"],
            "errors": res["errors"]
        })

    return curve


def sweep_skr_vs_qber(
    sifted_bits: int = 5000,
    repetition_rate_hz: float = 1e7
) -> List[Dict[str, Any]]:
    """
    Evaluates asymptotic secret-key rate as QBER increases from 0% to 15%,
    clearly showing the 11.0% cutoff boundary.
    """
    q_levels = np.linspace(0.005, 0.145, 20)
    curve = []

    for q in q_levels:
        q_val = float(q)
        res = calculate_secure_key_rate(
            qber=q_val,
            sifted_key_length=sifted_bits,
            repetition_rate_hz=repetition_rate_hz,
            p_click=0.05
        )
        curve.append({
            "qber_percent": round(q_val * 100.0, 2),
            "secret_key_rate_bps": res["secret_key_rate_bps"],
            "is_secure": res["is_secure"]
        })

    return curve


def generate_experiment_charts(base_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates all experiment sweep curves for the dashboard.
    """
    q_vs_eve = sweep_qber_vs_eavesdropping(base_params)
    q_vs_dist = sweep_qber_vs_distance(base_params)
    q_vs_size = sweep_qber_vs_simulation_size(base_params)
    skr_vs_q = sweep_skr_vs_qber()

    # Eavesdropping vs SKR derived from QBER vs Eve sweep
    eve_vs_skr = [
        {
            "eavesdropping_percent": pt["eavesdropping_percent"],
            "secret_key_rate_bps": pt["secret_key_rate_bps"],
            "is_secure": pt["is_secure"]
        }
        for pt in q_vs_eve
    ]

    return {
        "qber_vs_eavesdropping": q_vs_eve,
        "qber_vs_distance": q_vs_dist,
        "qber_vs_simulation_size": q_vs_size,
        "skr_vs_qber": skr_vs_q,
        "eavesdropping_vs_skr": eve_vs_skr
    }
