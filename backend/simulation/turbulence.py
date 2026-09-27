"""
Atmospheric Turbulence and Optical Scintillation Model
=====================================================
Implements:
1. Altitude-dependent Refractive Index Structure Profile Cn2(h) (Hufnagel-Valley variant)
2. Spherical-wave Rytov Variance integration for Downlink Optical Paths
3. Andrews/Phillips Scintillation Index with Receiver Aperture Averaging
4. Log-normal Optical Irradiance Fading Distribution for Monte Carlo sampling
"""

import math
import numpy as np
from typing import Dict, Any, Tuple


TURBULENCE_PRESETS = {
    "low": {
        "cn2_ground": 1e-15,
        "description": "Favorable nighttime conditions, calm boundary layer"
    },
    "moderate": {
        "cn2_ground": 1e-14,
        "description": "Standard atmospheric conditions, moderate thermal gradients"
    },
    "strong": {
        "cn2_ground": 1e-13,
        "description": "Adverse sunny daytime or high thermal turbulence"
    }
}


def evaluate_cn2_altitude_profile(h_meters: float, cn2_ground: float) -> float:
    """
    Evaluates modified Hufnagel-Valley (HV) Cn2 profile at altitude h (meters).
    Formula:
      Cn2(h) = 0.00594 * (v/27)^2 * (1e-5 * h)^10 * exp(-h/1000)
             + 2.7e-16 * exp(-h/1500)
             + cn2_ground * exp(-h/100)
    where v is rms wind speed (default 21 m/s).
    """
    v = 21.0  # standard high altitude wind speed
    term1 = 0.00594 * (v / 27.0)**2 * (1e-5 * h_meters)**10 * math.exp(-h_meters / 1000.0) if h_meters < 30000 else 0.0
    term2 = 2.7e-16 * math.exp(-h_meters / 1500.0)
    term3 = cn2_ground * math.exp(-h_meters / 100.0)
    
    return term1 + term2 + term3


def calculate_downlink_rytov_variance(
    h_source_km: float,
    h_receiver_km: float,
    wavelength_nm: float,
    cn2_ground: float,
    zenith_angle_deg: float = 0.0
) -> Tuple[float, float]:
    """
    Calculates spherical-wave Rytov variance for downlink path from space/HAP to ground.
    Rytov variance sigma_R^2:
      sigma_R^2 = 2.25 * k^(7/6) * (sec zeta)^(11/6) * Integral_0^H Cn2(h) * (1 - h/H)^(5/6) * h^(5/6) dh
    where k = 2 * pi / lambda.
    """
    k = 2.0 * math.pi / (wavelength_nm * 1e-9)
    zeta_rad = math.radians(zenith_angle_deg)
    sec_zeta = 1.0 / max(0.05, math.cos(zeta_rad))
    
    h_top_m = h_source_km * 1000.0
    h_bot_m = h_receiver_km * 1000.0
    delta_h_m = max(100.0, h_top_m - h_bot_m)
    
    # Numerical integration with Simpson/trapezoidal quadrature
    num_steps = 150
    h_vals = np.linspace(h_bot_m, min(h_top_m, 25000.0), num_steps)
    dh = (h_vals[-1] - h_vals[0]) / (num_steps - 1)
    
    integral_val = 0.0
    for h in h_vals:
        cn2_h = evaluate_cn2_altitude_profile(h, cn2_ground)
        # Normalized propagation distance parameter (for downlink, receiver is at ground h=0)
        norm_h = max(0.0, min(1.0, (h - h_bot_m) / delta_h_m))
        weight = (1.0 - norm_h)**(5.0 / 6.0) * (norm_h)**(5.0 / 6.0) if norm_h > 0 else 0.0
        integral_val += cn2_h * weight * dh
        
    rytov_var = 2.25 * (k**(7.0 / 6.0)) * (sec_zeta**(11.0 / 6.0)) * integral_val
    rytov_var = max(1e-6, min(20.0, rytov_var))
    
    effective_cn2 = cn2_ground
    return rytov_var, effective_cn2


def calculate_scintillation_index(
    rytov_var: float,
    rx_aperture_m: float,
    distance_km: float,
    wavelength_nm: float
) -> float:
    """
    Calculates scintillation index sigma_I^2 including aperture averaging reduction factor.
    Aperture parameter d = sqrt(k * D_rx^2 / (4 * L))
    Andrews/Phillips spherical wave model:
      sigma_I^2 = exp( 0.49 * sigma_R^2 / (1 + 0.18*d^2 + 0.56*sigma_R^(12/5))^(7/6)
                     + 0.51 * sigma_R^2 / (1 + 0.90*d^2 + 0.69*sigma_R^(12/5))^(5/6) ) - 1
    """
    k = 2.0 * math.pi / (wavelength_nm * 1e-9)
    distance_m = distance_km * 1000.0
    d_param = math.sqrt(max(0.0, (k * rx_aperture_m**2) / (4.0 * distance_m)))
    
    denom1 = (1.0 + 0.18 * d_param**2 + 0.56 * (rytov_var**(12.0 / 5.0)))**(7.0 / 6.0)
    denom2 = (1.0 + 0.90 * d_param**2 + 0.69 * (rytov_var**(12.0 / 5.0)))**(5.0 / 6.0)
    
    exponent = (0.49 * rytov_var / denom1) + (0.51 * rytov_var / denom2)
    scintillation_index = math.exp(min(5.0, exponent)) - 1.0
    
    return max(1e-5, min(5.0, scintillation_index))


def sample_turbulence_fading(scintillation_index: float, n_samples: int) -> np.ndarray:
    """
    Generates n_samples of normalized irradiance I under Log-Normal fading.
    Mean <I> = 1.0, Var(I) = sigma_I^2.
    Formula:
      ln(I) ~ Normal(mu = -0.5 * sigma_ln^2, sigma = sigma_ln)
      where sigma_ln^2 = ln(1 + sigma_I^2).
    """
    sigma_ln2 = math.log(1.0 + max(1e-6, scintillation_index))
    sigma_ln = math.sqrt(sigma_ln2)
    mu_ln = -0.5 * sigma_ln2
    
    # Generate log-normal samples
    log_samples = np.random.normal(mu_ln, sigma_ln, size=n_samples)
    irradiance_samples = np.exp(log_samples)
    return irradiance_samples


def evaluate_turbulence_link(
    turbulence_level: str,
    custom_cn2: float,
    wavelength_nm: float,
    has_relay: bool,
    satellite_altitude_km: float,
    relay_altitude_km: float,
    rx_aperture_m: float,
    link2_distance_km: float
) -> Dict[str, Any]:
    """
    Evaluates turbulence regime and parameters for the optical channel.
    Note: Space-to-Relay (LEO to HAP at 20km) takes place above 99% of atmospheric mass,
    experiencing essentially zero turbulence.
    Turbulence occurs dominantly in the lower troposphere (Relay-to-Ground or Direct Link).
    """
    if turbulence_level in TURBULENCE_PRESETS and turbulence_level != "custom":
        cn2_ground = TURBULENCE_PRESETS[turbulence_level]["cn2_ground"]
    else:
        cn2_ground = custom_cn2

    # If relay is present, downlink originates from relay altitude (20 km) to ground
    # If direct, downlink originates from satellite altitude (500 km) to ground
    h_source_km = relay_altitude_km if has_relay else satellite_altitude_km
    eff_distance_km = link2_distance_km if has_relay else (satellite_altitude_km * 1.15)

    rytov_var, eff_cn2 = calculate_downlink_rytov_variance(
        h_source_km=h_source_km,
        h_receiver_km=0.0,
        wavelength_nm=wavelength_nm,
        cn2_ground=cn2_ground
    )

    scint_index = calculate_scintillation_index(
        rytov_var=rytov_var,
        rx_aperture_m=rx_aperture_m,
        distance_km=eff_distance_km,
        wavelength_nm=wavelength_nm
    )

    # Classification
    if rytov_var < 0.2:
        regime = "Weak Fluctuation (Rytov < 0.2)"
    elif rytov_var < 1.0:
        regime = "Moderate Fluctuation (0.2 <= Rytov < 1.0)"
    else:
        regime = "Strong / Saturated Fluctuation (Rytov >= 1.0)"

    return {
        "turbulence_level": turbulence_level,
        "cn2_ground": cn2_ground,
        "rytov_variance": round(rytov_var, 4),
        "scintillation_index": round(scint_index, 4),
        "turbulence_regime": regime
    }
