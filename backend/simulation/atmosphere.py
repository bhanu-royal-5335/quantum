"""
Atmospheric Attenuation and Geometric Propagation Model
======================================================
Implements:
1. Kim and Kruse Visibility-based Aerosol & Fog Attenuation Models
2. Atmospheric Density Scale-Height Profile (Exponential Troposphere/Stratosphere)
3. Gaussian Beam Geometric Diffraction & Aperture Coupling Efficiency
4. Dual-Link Budget (LEO -> HAP Relay -> Ground Bob) vs Direct Downlink
"""

import math
import numpy as np
from typing import Dict, Any, Tuple


def calculate_kim_q_factor(visibility_km: float) -> float:
    """
    Kim model wavelength exponent 'q' for aerosol scattering:
    - q = 1.6          for V > 50 km (clear)
    - q = 1.3          for 6 < V <= 50 km (average clear)
    - q = 0.16*V + 0.34 for 1 < V <= 6 km (haze)
    - q = V - 0.5      for 0.5 < V <= 1 km (mist)
    - q = 0            for V <= 0.5 km (dense fog)
    """
    if visibility_km > 50.0:
        return 1.6
    elif visibility_km > 6.0:
        return 1.3
    elif visibility_km > 1.0:
        return 0.16 * visibility_km + 0.34
    elif visibility_km > 0.5:
        return visibility_km - 0.5
    else:
        return 0.0


def calculate_sea_level_attenuation_coeff(wavelength_nm: float, visibility_km: float) -> float:
    """
    Calculates sea-level atmospheric extinction coefficient alpha in dB/km using Kruse/Kim model.
    Formula: alpha = (3.91 / V) * (lambda / 550 nm)^(-q)  [dB/km]
    """
    q = calculate_kim_q_factor(visibility_km)
    # Avoid zero division
    v = max(0.1, visibility_km)
    ratio = (wavelength_nm / 550.0) ** (-q)
    alpha_db_per_km = (3.91 / v) * ratio
    return alpha_db_per_km


def calculate_integrated_atmospheric_transmittance(
    h_start_km: float,
    h_end_km: float,
    slant_distance_km: float,
    wavelength_nm: float,
    visibility_km: float,
    scale_height_km: float = 7.0
) -> Tuple[float, float]:
    """
    Integrates atmospheric attenuation along a slant path through the atmosphere.
    Atmosphere density is modeled with exponential scale height:
      rho(h) = rho_0 * exp(-h / H)
    Effective path length through normalized sea-level atmosphere:
      L_eff = (slant_distance / delta_h) * Integral_{h_low}^{h_high} exp(-h / H) dh
            = (slant_distance / delta_h) * H * [exp(-h_low / H) - exp(-h_high / H)]

    Returns:
      (transmittance in [0, 1], loss_db)
    """
    alpha_0_db_km = calculate_sea_level_attenuation_coeff(wavelength_nm, visibility_km)
    
    h_low = min(h_start_km, h_end_km)
    h_high = max(h_start_km, h_end_km)
    delta_h = max(0.001, h_high - h_low)
    
    # Zenith geometric projection factor
    sec_zeta = slant_distance_km / delta_h
    
    # Effective vertical optical depth
    # Int_h_low^h_high exp(-h / H) dh = H * (exp(-h_low / H) - exp(-h_high / H))
    integrated_scale_thickness_km = scale_height_km * (
        math.exp(-h_low / scale_height_km) - math.exp(-h_high / scale_height_km)
    )
    
    effective_path_km = sec_zeta * integrated_scale_thickness_km
    loss_db = alpha_0_db_km * effective_path_km
    # Clamp loss to reasonable upper limit to avoid floating point underflow
    loss_db = min(150.0, max(0.0, loss_db))
    transmittance = 10.0 ** (-loss_db / 10.0)
    
    return transmittance, loss_db


def calculate_geometric_coupling(
    tx_aperture_m: float,
    rx_aperture_m: float,
    beam_divergence_urad: float,
    distance_km: float,
    wavelength_nm: float
) -> Tuple[float, float, float]:
    """
    Calculates free-space geometric coupling efficiency of a Gaussian laser beam.
    Beam waist at receiver plane:
      w(L) = sqrt( (D_tx / 2)^2 + (theta_div * L / 2)^2 )
    Receiver aperture collects:
      eta_geo = 1 - exp( -2 * (D_rx / 2)^2 / w(L)^2 )

    Returns:
      (transmittance in [0, 1], loss_db, beam_waist_radius_m)
    """
    distance_m = distance_km * 1000.0
    w0 = tx_aperture_m / 2.0
    theta_rad = beam_divergence_urad * 1e-6
    
    # Diffraction + divergence spot size
    w_z = math.sqrt(w0**2 + (theta_rad * distance_m / 2.0)**2)
    rx_radius = rx_aperture_m / 2.0
    
    # Coupling fraction
    exponent = 2.0 * (rx_radius**2) / (w_z**2)
    if exponent > 10.0:
        transmittance = 1.0
    elif exponent < 1e-9:
        transmittance = exponent  # Taylor approx: 1 - exp(-x) ~ x
    else:
        transmittance = 1.0 - math.exp(-exponent)
        
    transmittance = max(1e-15, min(1.0, transmittance))
    loss_db = -10.0 * math.log10(transmittance)
    
    return transmittance, loss_db, w_z


def calculate_dual_link_atmosphere(
    satellite_altitude_km: float,
    has_relay: bool,
    relay_altitude_km: float,
    relay_efficiency: float,
    relay_aperture_m: float,
    tx_aperture_m: float,
    rx_aperture_m: float,
    beam_divergence_urad: float,
    wavelength_nm: float,
    visibility_km: float,
    custom_link1_km: float = None,
    custom_link2_km: float = None
) -> Dict[str, Any]:
    """
    Computes complete dual-link or direct link atmospheric and geometric budget.
    """
    if has_relay:
        h_sat = satellite_altitude_km
        h_relay = relay_altitude_km
        
        # Link 1: Satellite -> Relay (mostly exo-atmospheric vacuum / upper stratosphere)
        d_link1_km = custom_link1_km if custom_link1_km is not None else (h_sat - h_relay)
        d_link1_km = max(10.0, d_link1_km)
        
        # Space to Relay atmospheric attenuation
        t_atm1, loss_atm1_db = calculate_integrated_atmospheric_transmittance(
            h_start_km=h_sat,
            h_end_km=h_relay,
            slant_distance_km=d_link1_km,
            wavelength_nm=wavelength_nm,
            visibility_km=visibility_km
        )
        
        # Space to Relay geometric coupling (Satellite Tx -> Relay Rx)
        t_geo1, loss_geo1_db, w_z1 = calculate_geometric_coupling(
            tx_aperture_m=tx_aperture_m,
            rx_aperture_m=relay_aperture_m,
            beam_divergence_urad=beam_divergence_urad,
            distance_km=d_link1_km,
            wavelength_nm=wavelength_nm
        )
        
        loss_link1_db = loss_atm1_db + loss_geo1_db
        t_link1 = t_atm1 * t_geo1

        # Link 2: Relay -> Ground (passes through troposphere)
        d_link2_km = custom_link2_km if custom_link2_km is not None else (h_relay * 1.15) # slight slant
        d_link2_km = max(5.0, d_link2_km)
        
        t_atm2, loss_atm2_db = calculate_integrated_atmospheric_transmittance(
            h_start_km=h_relay,
            h_end_km=0.0,
            slant_distance_km=d_link2_km,
            wavelength_nm=wavelength_nm,
            visibility_km=visibility_km
        )
        
        t_geo2, loss_geo2_db, w_z2 = calculate_geometric_coupling(
            tx_aperture_m=relay_aperture_m,
            rx_aperture_m=rx_aperture_m,
            beam_divergence_urad=beam_divergence_urad,
            distance_km=d_link2_km,
            wavelength_nm=wavelength_nm
        )
        
        loss_relay_db = -10.0 * math.log10(max(1e-4, relay_efficiency))
        loss_link2_db = loss_atm2_db + loss_geo2_db + loss_relay_db
        t_link2 = t_atm2 * t_geo2 * relay_efficiency

        total_transmittance = t_link1 * t_link2
        total_loss_db = loss_link1_db + loss_link2_db
        
        return {
            "has_relay": True,
            "link1_distance_km": round(d_link1_km, 2),
            "link2_distance_km": round(d_link2_km, 2),
            "total_distance_km": round(d_link1_km + d_link2_km, 2),
            "link1_loss_db": round(loss_link1_db, 2),
            "link2_loss_db": round(loss_link2_db, 2),
            "atmospheric_loss_db": round(loss_atm1_db + loss_atm2_db, 2),
            "geometric_loss_db": round(loss_geo1_db + loss_geo2_db, 2),
            "relay_loss_db": round(loss_relay_db, 2),
            "total_loss_db": round(total_loss_db, 2),
            "total_transmittance": total_transmittance,
            "beam_waist_link1_m": round(w_z1, 3),
            "beam_waist_link2_m": round(w_z2, 3)
        }
    else:
        # Direct Downlink (Satellite -> Ground Bob)
        d_direct_km = custom_link1_km if custom_link1_km is not None else (satellite_altitude_km * 1.15)
        d_direct_km = max(50.0, d_direct_km)
        
        t_atm, loss_atm_db = calculate_integrated_atmospheric_transmittance(
            h_start_km=satellite_altitude_km,
            h_end_km=0.0,
            slant_distance_km=d_direct_km,
            wavelength_nm=wavelength_nm,
            visibility_km=visibility_km
        )
        
        t_geo, loss_geo_db, w_z = calculate_geometric_coupling(
            tx_aperture_m=tx_aperture_m,
            rx_aperture_m=rx_aperture_m,
            beam_divergence_urad=beam_divergence_urad,
            distance_km=d_direct_km,
            wavelength_nm=wavelength_nm
        )
        
        total_transmittance = t_atm * t_geo
        total_loss_db = loss_atm_db + loss_geo_db
        
        return {
            "has_relay": False,
            "link1_distance_km": round(d_direct_km, 2),
            "link2_distance_km": 0.0,
            "total_distance_km": round(d_direct_km, 2),
            "link1_loss_db": round(total_loss_db, 2),
            "link2_loss_db": 0.0,
            "atmospheric_loss_db": round(loss_atm_db, 2),
            "geometric_loss_db": round(loss_geo_db, 2),
            "relay_loss_db": 0.0,
            "total_loss_db": round(total_loss_db, 2),
            "total_transmittance": total_transmittance,
            "beam_waist_link1_m": round(w_z, 3),
            "beam_waist_link2_m": 0.0
        }
