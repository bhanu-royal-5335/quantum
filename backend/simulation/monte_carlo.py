"""
Monte Carlo Simulation and Statistical Confidence Engine
========================================================
Implements:
1. Multi-iteration Stochastic Channel Realizations (100 - 10,000 iterations)
2. Simultaneous Sampling of Turbulence (Log-Normal) and Pointing Jitter (Rayleigh)
3. Vectorized Instantaneous Link Evaluations using NumPy
4. Mean, Standard Deviation, Empirical 95% Confidence Intervals (CI)
5. Distribution Histogram Generation for Frontend Visualization
"""

import math
import numpy as np
from typing import Dict, Any, List
from .turbulence import sample_turbulence_fading
from .pointing_error import calculate_pointing_parameters, sample_pointing_coupling
from .noise import calculate_detection_probabilities
from .secret_key import calculate_secure_key_rate, binary_entropy


def run_monte_carlo_simulation(
    iterations: int,
    base_channel_transmittance: float,
    scintillation_index: float,
    rx_aperture_m: float,
    beam_waist_radius_m: float,
    distance_km: float,
    jitter_urad: float,
    mean_photon_number: float,
    repetition_rate_hz: float,
    detector_efficiency: float,
    dark_count_rate: float,
    background_noise: float,
    optical_error_rate: float,
    fec_efficiency: float = 1.16
) -> Dict[str, Any]:
    """
    Executes vectorized Monte Carlo simulation to evaluate quantum channel uncertainty.
    """
    n_iter = int(max(50, min(10000, iterations)))
    
    # 1. Pointing parameters
    A0, w_eq, sigma_r, _ = calculate_pointing_parameters(
        rx_aperture_m=rx_aperture_m,
        beam_waist_radius_m=beam_waist_radius_m,
        distance_km=distance_km,
        jitter_urad=jitter_urad
    )
    
    # 2. Vectorized random sampling:
    # Turbulence log-normal fading factor I (mean 1.0)
    turb_fading = sample_turbulence_fading(scintillation_index, n_iter)
    
    # Pointing coupling factor h_p (Rayleigh misalignment)
    pointing_coupling = sample_pointing_coupling(A0, w_eq, sigma_r, n_iter)
    
    # Combined instantaneous channel transmittance
    instantaneous_transmittance = base_channel_transmittance * turb_fading * pointing_coupling
    instantaneous_transmittance = np.clip(instantaneous_transmittance, 1e-18, 1.0)
    
    # 3. Vectorized detection probabilities
    # Signal photon arrival probability
    eta_overall = np.clip(detector_efficiency * instantaneous_transmittance, 1e-18, 1.0)
    mu_rx = mean_photon_number * eta_overall
    p_sig = 1.0 - np.exp(-mu_rx)
    
    # Noise probability
    p_dark = max(1e-9, min(0.5, dark_count_rate))
    p_bg = max(1e-9, min(0.5, background_noise))
    p_noise = 1.0 - (1.0 - p_dark) * (1.0 - p_bg)
    
    # Total click probability
    p_click = 1.0 - (1.0 - p_sig) * (1.0 - p_noise)
    p_click = np.clip(p_click, 1e-9, 1.0)
    
    # Error probability
    p_err = (optical_error_rate * p_sig) + (0.5 * p_noise)
    
    # Instantaneous QBER array
    qber_arr = np.clip(p_err / p_click, 0.0, 0.5)
    
    # Instantaneous Channel Loss in dB
    loss_db_arr = -10.0 * np.log10(np.clip(instantaneous_transmittance, 1e-18, 1.0))
    
    # Instantaneous Secret Key Rate
    r_sifted = 0.5 * repetition_rate_hz * p_click
    
    # Vectorized binary entropy
    q_safe = np.clip(qber_arr, 1e-12, 0.4999)
    h2_arr = - (q_safe * np.log2(q_safe) + (1.0 - q_safe) * np.log2(1.0 - q_safe))
    sec_fraction = 1.0 - (fec_efficiency * h2_arr) - h2_arr
    sec_fraction = np.where((qber_arr < 0.11) & (sec_fraction > 0.0), sec_fraction, 0.0)
    skr_arr = r_sifted * sec_fraction
    
    # 4. Statistical Summary Metrics
    mean_qber = float(np.mean(qber_arr))
    std_qber = float(np.std(qber_arr))
    
    # 95% Confidence Interval (empirical 2.5th and 97.5th percentiles)
    ci_lower = float(np.percentile(qber_arr, 2.5))
    ci_upper = float(np.percentile(qber_arr, 97.5))
    min_qber = float(np.min(qber_arr))
    max_qber = float(np.max(qber_arr))
    
    mean_skr = float(np.mean(skr_arr))
    std_skr = float(np.std(skr_arr))
    min_skr = float(np.min(skr_arr))
    max_skr = float(np.max(skr_arr))
    
    mean_loss_db = float(np.mean(loss_db_arr))
    std_loss_db = float(np.std(loss_db_arr))
    
    # 5. Histogram for UI visualization (15 bins)
    hist, bin_edges = np.histogram(qber_arr * 100.0, bins=16)
    histogram_qber: List[Dict[str, Any]] = []
    for i in range(len(hist)):
        bin_center = (bin_edges[i] + bin_edges[i+1]) / 2.0
        histogram_qber.append({
            "bin_center_percent": round(float(bin_center), 3),
            "bin_start_percent": round(float(bin_edges[i]), 3),
            "bin_end_percent": round(float(bin_edges[i+1]), 3),
            "count": int(hist[i]),
            "relative_frequency": round(float(hist[i] / n_iter), 4)
        })
        
    return {
        "iterations": n_iter,
        "mean_qber": round(mean_qber, 6),
        "std_qber": round(std_qber, 6),
        "ci_95_lower": round(ci_lower, 6),
        "ci_95_upper": round(ci_upper, 6),
        "min_qber": round(min_qber, 6),
        "max_qber": round(max_qber, 6),
        "mean_secret_key_rate": round(mean_skr, 2),
        "std_secret_key_rate": round(std_skr, 2),
        "min_secret_key_rate": round(min_skr, 2),
        "max_secret_key_rate": round(max_skr, 2),
        "mean_channel_loss_db": round(mean_loss_db, 2),
        "std_channel_loss_db": round(std_loss_db, 2),
        "histogram_qber": histogram_qber,
        "confidence_interval_percent": 95.0
    }
