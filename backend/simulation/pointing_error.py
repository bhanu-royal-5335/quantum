"""
Optical Pointing Error and Jitter Model
=======================================
Implements:
1. Rayleigh Angular Jitter & Radial Displacement Distribution
2. Farid & Hranilovic Gaussian Beam Coupling Degradation
3. Statistical Average Transmittance under Jitter
4. Dynamic Pointing Loss Sampling for Monte Carlo Simulation
"""

import math
import numpy as np
from scipy.special import erf
from typing import Dict, Any, Tuple


POINTING_PRESETS = {
    "low": {
        "jitter_urad": 1.5,
        "description": "High-precision closed-loop tracking with Fast Steering Mirror (FSM)"
    },
    "moderate": {
        "jitter_urad": 4.0,
        "description": "Standard satellite platform tracking with moderate coarse jitter"
    },
    "high": {
        "jitter_urad": 10.0,
        "description": "High platform vibration or degraded beacon acquisition"
    }
}


def calculate_pointing_parameters(
    rx_aperture_m: float,
    beam_waist_radius_m: float,
    distance_km: float,
    jitter_urad: float
) -> Tuple[float, float, float, float]:
    """
    Computes Farid & Hranilovic equivalent beam width and zero-bore collector efficiency.
    Returns:
      (A0, w_eq_m, sigma_r_m, mean_transmittance)
    """
    a = rx_aperture_m / 2.0  # receiver aperture radius
    w_z = max(1e-4, beam_waist_radius_m)
    
    # Normalized aperture parameter v
    v = (math.sqrt(math.pi) * a) / (math.sqrt(2.0) * w_z)
    v = max(1e-6, min(10.0, v))
    
    erf_v = erf(v)
    A0 = erf_v ** 2
    
    # Equivalent beam width squared
    w_eq_sq = (w_z**2) * (math.sqrt(math.pi) * erf_v) / (2.0 * v * math.exp(-v**2))
    w_eq = math.sqrt(max(1e-8, w_eq_sq))
    
    # Radial displacement standard deviation at receiver plane
    # distance in meters * jitter in radians
    sigma_r = (distance_km * 1000.0) * (jitter_urad * 1e-6)
    sigma_r = max(1e-6, sigma_r)
    
    # Pointing parameter gamma = w_eq / (2 * sigma_r)
    gamma_p = w_eq / (2.0 * sigma_r)
    
    # Mean coupling transmittance <h_p> = A0 * (gamma^2 / (gamma^2 + 1))
    mean_transmittance = A0 * (gamma_p**2 / (gamma_p**2 + 1.0))
    mean_transmittance = max(1e-12, min(1.0, mean_transmittance))
    
    return A0, w_eq, sigma_r, mean_transmittance


def sample_pointing_coupling(
    A0: float,
    w_eq_m: float,
    sigma_r_m: float,
    n_samples: int
) -> np.ndarray:
    """
    Generates n_samples of pointing coupling factors using Rayleigh radial displacement:
      r ~ Rayleigh(scale = sigma_r)
      h_p(r) = A0 * exp( - 2 * r^2 / w_eq^2 )
    """
    # Sample radial displacement from Rayleigh distribution
    r = np.random.rayleigh(scale=sigma_r_m, size=n_samples)
    
    # Calculate coupling factor
    coupling = A0 * np.exp(-2.0 * (r**2) / (w_eq_m**2))
    return np.clip(coupling, 1e-12, 1.0)


def evaluate_pointing_link(
    pointing_level: str,
    custom_jitter_urad: float,
    rx_aperture_m: float,
    beam_waist_radius_m: float,
    distance_km: float
) -> Dict[str, Any]:
    """
    Evaluates pointing jitter link degradation.
    """
    if pointing_level in POINTING_PRESETS and pointing_level != "custom":
        jitter_urad = POINTING_PRESETS[pointing_level]["jitter_urad"]
    else:
        jitter_urad = custom_jitter_urad

    A0, w_eq, sigma_r, mean_t = calculate_pointing_parameters(
        rx_aperture_m=rx_aperture_m,
        beam_waist_radius_m=beam_waist_radius_m,
        distance_km=distance_km,
        jitter_urad=jitter_urad
    )

    pointing_loss_db = -10.0 * math.log10(max(1e-12, mean_t))

    return {
        "pointing_level": pointing_level,
        "jitter_urad": jitter_urad,
        "A0_peak_coupling": round(A0, 4),
        "equivalent_beam_width_m": round(w_eq, 3),
        "radial_jitter_sigma_m": round(sigma_r, 3),
        "pointing_loss_db": round(pointing_loss_db, 2),
        "mean_transmittance": mean_t
    }
