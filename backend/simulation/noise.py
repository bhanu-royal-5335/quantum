"""
Receiver Detection and Noise Models
==================================
Implements:
1. Single-Photon Detector Quantum Efficiency (eta_det)
2. Thermal Dark Count Rate & Detection Gate Noise
3. Ambient Background Solar/Stray Light Optical Noise
4. Poissonian Photon Statistics (Weak Coherent Pulses)
5. Signal-to-Noise Ratio (SNR) and Click Probability
"""

import math
from typing import Dict, Any, Tuple


def calculate_detection_probabilities(
    total_channel_transmittance: float,
    mean_photon_number: float,
    detector_efficiency: float,
    dark_count_rate: float,
    background_noise: float,
    optical_error_rate: float
) -> Dict[str, float]:
    """
    Computes physical detection probabilities per transmitted pulse:
    - eta_overall = detector_efficiency * total_channel_transmittance
    - Signal click probability: P_sig = 1 - exp(-mu * eta_overall)
    - Noise click probability: P_noise = P_dark + P_bg
    - Total click probability: P_click = 1 - (1 - P_sig) * (1 - P_noise)
    - Error probability: P_err = e_opt * P_sig + 0.5 * P_noise
    - Analytical QBER = P_err / P_click
    """
    eta_overall = max(1e-18, min(1.0, detector_efficiency * total_channel_transmittance))
    mu = max(0.01, mean_photon_number)
    
    # Poisson probability of detecting at least one photon from signal pulse
    mu_rx = mu * eta_overall
    if mu_rx < 1e-7:
        p_sig = mu_rx
    else:
        p_sig = 1.0 - math.exp(-mu_rx)
        
    p_dark = max(1e-9, min(0.5, dark_count_rate))
    p_bg = max(1e-9, min(0.5, background_noise))
    
    # Joint noise click probability
    p_noise = 1.0 - (1.0 - p_dark) * (1.0 - p_bg)
    
    # Total detection click probability per gate
    p_click = 1.0 - (1.0 - p_sig) * (1.0 - p_noise)
    p_click = max(1e-9, min(1.0, p_click))
    
    # Error event probability
    e_opt = optical_error_rate
    p_err = (e_opt * p_sig) + (0.5 * p_noise)
    
    # Expected QBER
    qber = p_err / p_click
    qber = max(0.0, min(0.5, qber))
    
    snr = p_sig / max(1e-12, p_noise)
    snr_db = 10.0 * math.log10(max(1e-6, snr))

    return {
        "overall_efficiency": eta_overall,
        "p_signal": p_sig,
        "p_noise": p_noise,
        "p_click": p_click,
        "p_error": p_err,
        "qber": qber,
        "snr": snr,
        "snr_db": snr_db
    }
