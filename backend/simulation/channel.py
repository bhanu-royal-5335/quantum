"""
End-to-End Quantum Optical Communication Channel Engine
======================================================
Coordinates:
1. Atmospheric Attenuation & Geometric Spreading (Link 1 & Link 2)
2. Transceiver Pointing Jitter and Angular Misalignment
3. Atmospheric Turbulence & Scintillation Index
4. Receiver Detection & Background Noise
5. BB84 Discrete Quantum Sifting Simulation
6. Information Reconciliation & Asymptotic Secret Key Generation
7. Vectorized Monte Carlo Statistical Confidence Analysis
8. Parametric Performance Sweeps for Dashboard Visualizations
"""

import math
import uuid
from datetime import datetime, timezone
from typing import Dict, Any

from ..models.schemas import ChannelParameters, SimulationResult, MonteCarloStats
from .atmosphere import calculate_dual_link_atmosphere
from .turbulence import evaluate_turbulence_link
from .pointing_error import evaluate_pointing_link
from .noise import calculate_detection_probabilities
from .bb84 import simulate_bb84_protocol
from .secret_key import calculate_secure_key_rate
from .monte_carlo import run_monte_carlo_simulation
from .qber import (
    generate_loss_vs_distance_curve,
    generate_qber_vs_turbulence_curve,
    generate_qber_vs_pointing_curve,
    generate_key_rate_vs_conditions_curve,
    generate_qber_vs_loss_curve
)


def run_full_quantum_simulation(
    params: ChannelParameters,
    scenario_id: str = None,
    scenario_name: str = "Active Simulation"
) -> SimulationResult:
    """
    Executes a complete end-to-end quantum communication simulation run.
    """
    sim_id = str(uuid.uuid4())
    timestamp_str = datetime.now(timezone.utc).isoformat()
    
    # 1. Atmospheric and Geometric Link Budget
    atm_results = calculate_dual_link_atmosphere(
        satellite_altitude_km=params.satellite_altitude,
        has_relay=params.has_relay,
        relay_altitude_km=params.relay_altitude,
        relay_efficiency=params.relay_efficiency,
        relay_aperture_m=params.relay_aperture,
        tx_aperture_m=params.transmitter_aperture,
        rx_aperture_m=params.receiver_aperture,
        beam_divergence_urad=params.beam_divergence,
        wavelength_nm=params.wavelength,
        visibility_km=params.visibility,
        custom_link1_km=params.link1_distance,
        custom_link2_km=params.link2_distance
    )
    
    # Receiver plane beam waist radius (at Bob)
    target_beam_waist = (
        atm_results["beam_waist_link2_m"] if params.has_relay else atm_results["beam_waist_link1_m"]
    )
    downlink_distance = (
        atm_results["link2_distance_km"] if params.has_relay else atm_results["link1_distance_km"]
    )

    # 2. Pointing Jitter Coupling
    pointing_results = evaluate_pointing_link(
        pointing_level=params.pointing_level,
        custom_jitter_urad=params.pointing_error,
        rx_aperture_m=params.receiver_aperture,
        beam_waist_radius_m=target_beam_waist,
        distance_km=downlink_distance
    )

    # 3. Atmospheric Turbulence & Scintillation
    turb_results = evaluate_turbulence_link(
        turbulence_level=params.turbulence_level,
        custom_cn2=params.cn2_ground,
        wavelength_nm=params.wavelength,
        has_relay=params.has_relay,
        satellite_altitude_km=params.satellite_altitude,
        relay_altitude_km=params.relay_altitude,
        rx_aperture_m=params.receiver_aperture,
        link2_distance_km=downlink_distance
    )

    # 4. Total Channel Transmittance & Loss
    t_atm_geo = atm_results["total_transmittance"]
    t_pointing = pointing_results["mean_transmittance"]
    total_channel_transmittance = max(1e-18, min(1.0, t_atm_geo * t_pointing))
    
    pointing_loss_db = pointing_results["pointing_loss_db"]
    total_channel_loss_db = atm_results["total_loss_db"] + pointing_loss_db
    detector_loss_db = -10.0 * math.log10(max(1e-4, params.detector_efficiency))

    # 5. Receiver Detection & Analytical Probabilities
    det_probs = calculate_detection_probabilities(
        total_channel_transmittance=total_channel_transmittance,
        mean_photon_number=params.mean_photon_number,
        detector_efficiency=params.detector_efficiency,
        dark_count_rate=params.dark_count_rate,
        background_noise=params.background_noise,
        optical_error_rate=params.optical_error_rate
    )

    # 6. Discrete BB84 Simulation
    bb84_res = simulate_bb84_protocol(
        num_bits=params.num_bits,
        p_click=det_probs["p_click"],
        p_signal=det_probs["p_signal"],
        p_noise=det_probs["p_noise"],
        optical_error_rate=params.optical_error_rate,
        channel_loss_db=total_channel_loss_db,
        mean_photon_number=params.mean_photon_number,
        detector_efficiency=params.detector_efficiency,
        dark_count_rate=params.dark_count_rate,
        background_noise=params.background_noise,
        sample_trace_count=35
    )

    # Use simulated QBER from quantum measurement & sifting with Bayesian shrinkage for small samples
    s_len = bb84_res["sifted_key_length"]
    if s_len >= 30:
        actual_qber = bb84_res["simulated_qber"]
    elif s_len > 0:
        actual_qber = (s_len * bb84_res["simulated_qber"] + 30 * det_probs["qber"]) / (s_len + 30)
    else:
        actual_qber = det_probs["qber"]

    # 7. Secret-Key Rate and Information Reconciliation
    skr_res = calculate_secure_key_rate(
        qber=actual_qber,
        sifted_key_length=bb84_res["sifted_key_length"],
        repetition_rate_hz=params.repetition_rate,
        p_click=det_probs["p_click"],
        fec_efficiency=params.fec_efficiency
    )

    # 8. Vectorized Monte Carlo Simulation
    mc_raw = run_monte_carlo_simulation(
        iterations=params.monte_carlo_iterations,
        base_channel_transmittance=t_atm_geo,
        scintillation_index=turb_results["scintillation_index"],
        rx_aperture_m=params.receiver_aperture,
        beam_waist_radius_m=target_beam_waist,
        distance_km=downlink_distance,
        jitter_urad=pointing_results["jitter_urad"],
        mean_photon_number=params.mean_photon_number,
        repetition_rate_hz=params.repetition_rate,
        detector_efficiency=params.detector_efficiency,
        dark_count_rate=params.dark_count_rate,
        background_noise=params.background_noise,
        optical_error_rate=params.optical_error_rate,
        fec_efficiency=params.fec_efficiency
    )
    monte_carlo_stats = MonteCarloStats(**mc_raw)

    # 9. Precomputed Curves for Interactive Graphs
    loss_vs_distance_curve = generate_loss_vs_distance_curve(
        satellite_altitude_km=params.satellite_altitude,
        has_relay=params.has_relay,
        relay_altitude_km=params.relay_altitude,
        relay_efficiency=params.relay_efficiency,
        relay_aperture_m=params.relay_aperture,
        tx_aperture_m=params.transmitter_aperture,
        rx_aperture_m=params.receiver_aperture,
        beam_divergence_urad=params.beam_divergence,
        wavelength_nm=params.wavelength,
        visibility_km=params.visibility
    )

    qber_vs_turbulence_curve = generate_qber_vs_turbulence_curve(
        base_transmittance=total_channel_transmittance,
        mean_photon_number=params.mean_photon_number,
        detector_efficiency=params.detector_efficiency,
        dark_count_rate=params.dark_count_rate,
        background_noise=params.background_noise,
        optical_error_rate=params.optical_error_rate,
        wavelength_nm=params.wavelength,
        rx_aperture_m=params.receiver_aperture,
        distance_km=downlink_distance
    )

    qber_vs_pointing_curve = generate_qber_vs_pointing_curve(
        base_transmittance=t_atm_geo,
        rx_aperture_m=params.receiver_aperture,
        beam_waist_radius_m=target_beam_waist,
        distance_km=downlink_distance,
        mean_photon_number=params.mean_photon_number,
        detector_efficiency=params.detector_efficiency,
        dark_count_rate=params.dark_count_rate,
        background_noise=params.background_noise,
        optical_error_rate=params.optical_error_rate
    )

    key_rate_vs_conditions_curve = generate_key_rate_vs_conditions_curve(
        satellite_altitude_km=params.satellite_altitude,
        has_relay=params.has_relay,
        relay_altitude_km=params.relay_altitude,
        relay_efficiency=params.relay_efficiency,
        relay_aperture_m=params.relay_aperture,
        tx_aperture_m=params.transmitter_aperture,
        rx_aperture_m=params.receiver_aperture,
        beam_divergence_urad=params.beam_divergence,
        wavelength_nm=params.wavelength,
        mean_photon_number=params.mean_photon_number,
        repetition_rate_hz=params.repetition_rate,
        detector_efficiency=params.detector_efficiency,
        dark_count_rate=params.dark_count_rate,
        background_noise=params.background_noise,
        optical_error_rate=params.optical_error_rate,
        fec_efficiency=params.fec_efficiency
    )

    qber_vs_loss_curve = generate_qber_vs_loss_curve(
        mean_photon_number=params.mean_photon_number,
        detector_efficiency=params.detector_efficiency,
        dark_count_rate=params.dark_count_rate,
        background_noise=params.background_noise,
        optical_error_rate=params.optical_error_rate,
        repetition_rate_hz=params.repetition_rate,
        fec_efficiency=params.fec_efficiency,
        num_simulation_pulses=min(5000, max(2000, params.num_bits // 2))
    )

    quantum_stats = {
        "num_bits": params.num_bits,
        "photons_transmitted": params.num_bits,
        "photons_detected": bb84_res["total_detected"],
        "detection_rate": bb84_res["detection_rate"],
        "basis_matched_count": bb84_res["basis_matched_count"],
        "sifted_key_length": bb84_res["sifted_key_length"],
        "sifting_ratio": bb84_res["sifted_fraction"],
        "error_bits": bb84_res["error_bits"],
        "simulated_qber": actual_qber,
        "analytical_qber": det_probs["qber"],
        "qber_std_error": bb84_res.get("qber_std_err", 0.0),
        "snr_db": det_probs["snr_db"]
    }

    return SimulationResult(
        id=sim_id,
        scenario_id=scenario_id,
        scenario_name=scenario_name,
        timestamp=timestamp_str,
        parameters=params,
        
        # Primary KPI cards
        qber=round(actual_qber, 5),
        channel_loss_db=round(total_channel_loss_db, 2),
        secret_key_rate=round(skr_res["secret_key_rate_bps"], 2),
        detection_rate=round(bb84_res["detection_rate"] * 100.0, 2),
        sifted_key_length=bb84_res["sifted_key_length"],
        total_detected_photons=bb84_res["total_detected"],
        error_bits=bb84_res["error_bits"],
        secure_key_length=skr_res["discrete_secure_bits"],
        is_secure=skr_res["is_secure"],
        security_status_message=skr_res["security_status_message"],

        # Optical Link Budget Breakdown
        link1_loss_db=atm_results["link1_loss_db"],
        link2_loss_db=atm_results["link2_loss_db"],
        geometric_loss_db=atm_results["geometric_loss_db"],
        atmospheric_loss_db=atm_results["atmospheric_loss_db"],
        pointing_loss_db=pointing_loss_db,
        relay_loss_db=atm_results["relay_loss_db"],
        detector_loss_db=round(detector_loss_db, 2),
        total_transmittance=total_channel_transmittance,

        # Atmospheric & Turbulence Metrics
        effective_cn2=turb_results["cn2_ground"],
        rytov_variance=turb_results["rytov_variance"],
        scintillation_index=turb_results["scintillation_index"],
        pointing_jitter_urad=pointing_results["jitter_urad"],
        beam_waist_receiver_m=round(target_beam_waist, 3),

        # Monte Carlo Results
        monte_carlo=monte_carlo_stats,

        # Bit trace samples
        bit_samples=bb84_res["bit_samples"],

        # Curves
        loss_vs_distance_curve=loss_vs_distance_curve,
        qber_vs_turbulence_curve=qber_vs_turbulence_curve,
        qber_vs_pointing_curve=qber_vs_pointing_curve,
        key_rate_vs_conditions_curve=key_rate_vs_conditions_curve,
        qber_vs_loss_curve=qber_vs_loss_curve,

        # Quantum simulation statistics
        quantum_simulation_stats=quantum_stats
    )
