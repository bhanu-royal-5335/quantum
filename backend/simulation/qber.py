"""
Quantum Bit Error Rate (QBER) Analysis and Parameter Sweep Engine
================================================================
Implements:
1. Analytical vs Simulated QBER computation using discrete BB84 protocol
2. Error decomposition (Optical misalignment vs Dark count & Background noise)
3. Parametric curve generation for:
   - Channel Loss vs Distance
   - QBER vs Channel Loss (Simulated vs Analytical)
   - QBER vs Turbulence
   - QBER vs Pointing Error
   - Secret-Key Rate vs Channel Conditions
"""

import math
import numpy as np
from typing import Dict, Any, List, Optional
from .atmosphere import calculate_dual_link_atmosphere, calculate_integrated_atmospheric_transmittance, calculate_geometric_coupling
from .turbulence import calculate_downlink_rytov_variance, calculate_scintillation_index, TURBULENCE_PRESETS
from .pointing_error import calculate_pointing_parameters, POINTING_PRESETS
from .noise import calculate_detection_probabilities
from .secret_key import calculate_secure_key_rate


def calculate_qber_from_sifted_keys(sifted_alice: np.ndarray, sifted_bob: np.ndarray) -> Dict[str, Any]:
    """
    Computes QBER and statistical uncertainty from Alice and Bob's sifted keys.
    """
    sifted_len = len(sifted_alice)
    if sifted_len == 0:
        return {
            "sifted_length": 0,
            "error_bits": 0,
            "qber": 0.50,
            "std_error": 0.0,
            "confidence_interval_95": (0.0, 1.0)
        }
    
    error_mask = (sifted_alice != sifted_bob)
    error_bits = int(np.sum(error_mask))
    qber = float(error_bits / sifted_len)
    std_err = math.sqrt(qber * (1.0 - qber) / sifted_len) if sifted_len > 1 else 0.0
    ci_lower = max(0.0, qber - 1.96 * std_err)
    ci_upper = min(1.0, qber + 1.96 * std_err)
    
    return {
        "sifted_length": sifted_len,
        "error_bits": error_bits,
        "qber": qber,
        "std_error": std_err,
        "confidence_interval_95": (ci_lower, ci_upper)
    }


def generate_loss_vs_distance_curve(
    satellite_altitude_km: float,
    has_relay: bool,
    relay_altitude_km: float,
    relay_efficiency: float,
    relay_aperture_m: float,
    tx_aperture_m: float,
    rx_aperture_m: float,
    beam_divergence_urad: float,
    wavelength_nm: float,
    visibility_km: float
) -> List[Dict[str, float]]:
    """
    Sweeps total distance from 300 km to 1500 km to generate Channel Loss vs Distance curve.
    """
    distances_km = np.linspace(300.0, 1500.0, 25)
    curve = []
    
    for d in distances_km:
        d_val = float(d)
        if has_relay:
            link1_d = max(10.0, d_val - relay_altitude_km)
            link2_d = relay_altitude_km * 1.15
            res = calculate_dual_link_atmosphere(
                satellite_altitude_km=d_val,
                has_relay=True,
                relay_altitude_km=relay_altitude_km,
                relay_efficiency=relay_efficiency,
                relay_aperture_m=relay_aperture_m,
                tx_aperture_m=tx_aperture_m,
                rx_aperture_m=rx_aperture_m,
                beam_divergence_urad=beam_divergence_urad,
                wavelength_nm=wavelength_nm,
                visibility_km=visibility_km,
                custom_link1_km=link1_d,
                custom_link2_km=link2_d
            )
        else:
            res = calculate_dual_link_atmosphere(
                satellite_altitude_km=d_val,
                has_relay=False,
                relay_altitude_km=0.0,
                relay_efficiency=1.0,
                relay_aperture_m=0.0,
                tx_aperture_m=tx_aperture_m,
                rx_aperture_m=rx_aperture_m,
                beam_divergence_urad=beam_divergence_urad,
                wavelength_nm=wavelength_nm,
                visibility_km=visibility_km,
                custom_link1_km=d_val
            )
        curve.append({
            "distance_km": round(d_val, 1),
            "channel_loss_db": round(res["total_loss_db"], 2),
            "atmospheric_loss_db": round(res["atmospheric_loss_db"], 2),
            "geometric_loss_db": round(res["geometric_loss_db"], 2)
        })
    return curve


def generate_qber_vs_loss_curve(
    mean_photon_number: float = 0.6,
    detector_efficiency: float = 0.8,
    dark_count_rate: float = 1e-6,
    background_noise: float = 1e-6,
    optical_error_rate: float = 0.015,
    repetition_rate_hz: float = 1e7,
    fec_efficiency: float = 1.16,
    num_simulation_pulses: int = 4000
) -> List[Dict[str, Any]]:
    """
    Sweeps channel loss from 5 dB to 45 dB and computes both Simulated QBER (via BB84)
    and Analytical QBER along with Secret-Key Rate and SNR.
    """
    from .bb84 import simulate_bb84_protocol
    
    loss_levels = np.linspace(5.0, 45.0, 21)
    curve = []
    
    for loss in loss_levels:
        loss_val = float(loss)
        transmittance = 10.0 ** (-loss_val / 10.0)
        
        # Analytical detection probabilities
        det_probs = calculate_detection_probabilities(
            total_channel_transmittance=transmittance,
            mean_photon_number=mean_photon_number,
            detector_efficiency=detector_efficiency,
            dark_count_rate=dark_count_rate,
            background_noise=background_noise,
            optical_error_rate=optical_error_rate
        )
        
        # Simulated BB84 execution
        bb84_res = simulate_bb84_protocol(
            num_bits=num_simulation_pulses,
            p_click=det_probs["p_click"],
            p_signal=det_probs["p_signal"],
            p_noise=det_probs["p_noise"],
            optical_error_rate=optical_error_rate,
            channel_loss_db=loss_val,
            sample_trace_count=0
        )
        
        sim_qber = bb84_res["simulated_qber"]
        ana_qber = det_probs["qber"]
        
        # SKR under simulated QBER
        skr_res = calculate_secure_key_rate(
            qber=sim_qber,
            sifted_key_length=bb84_res["sifted_key_length"],
            repetition_rate_hz=repetition_rate_hz,
            p_click=det_probs["p_click"],
            fec_efficiency=fec_efficiency
        )
        
        curve.append({
            "channel_loss_db": round(loss_val, 1),
            "simulated_qber_percent": round(sim_qber * 100.0, 3),
            "analytical_qber_percent": round(ana_qber * 100.0, 3),
            "qber_percent": round(sim_qber * 100.0, 3),  # compatibility
            "snr_db": round(det_probs["snr_db"], 2),
            "secret_key_rate_bps": round(skr_res["secret_key_rate_bps"], 1),
            "is_secure": skr_res["is_secure"],
            "sifted_bits": bb84_res["sifted_key_length"]
        })
        
    return curve


def generate_qber_vs_turbulence_curve(
    base_transmittance: float,
    mean_photon_number: float,
    detector_efficiency: float,
    dark_count_rate: float,
    background_noise: float,
    optical_error_rate: float,
    wavelength_nm: float,
    rx_aperture_m: float,
    distance_km: float
) -> List[Dict[str, Any]]:
    """
    Sweeps Cn2 from 1e-16 to 1e-12 m^(-2/3) to plot QBER vs Turbulence.
    Includes both Simulated QBER and Analytical QBER.
    """
    from .bb84 import simulate_bb84_protocol
    
    cn2_values = np.logspace(-16, -12.5, 20)
    curve = []
    
    for cn2 in cn2_values:
        cn2_float = float(cn2)
        rytov, _ = calculate_downlink_rytov_variance(
            h_source_km=20.0,
            h_receiver_km=0.0,
            wavelength_nm=wavelength_nm,
            cn2_ground=cn2_float
        )
        scint = calculate_scintillation_index(
            rytov_var=rytov,
            rx_aperture_m=rx_aperture_m,
            distance_km=distance_km,
            wavelength_nm=wavelength_nm
        )
        
        # Scintillation fading penalty
        fading_penalty = math.exp(-0.5 * min(3.0, scint))
        eff_transmittance = base_transmittance * fading_penalty
        eff_loss_db = -10.0 * math.log10(max(1e-15, eff_transmittance))
        
        det_probs = calculate_detection_probabilities(
            total_channel_transmittance=eff_transmittance,
            mean_photon_number=mean_photon_number,
            detector_efficiency=detector_efficiency,
            dark_count_rate=dark_count_rate,
            background_noise=background_noise,
            optical_error_rate=optical_error_rate
        )
        
        bb84_res = simulate_bb84_protocol(
            num_bits=3000,
            p_click=det_probs["p_click"],
            p_signal=det_probs["p_signal"],
            p_noise=det_probs["p_noise"],
            optical_error_rate=optical_error_rate,
            channel_loss_db=eff_loss_db,
            sample_trace_count=0
        )
        
        curve.append({
            "cn2": float(f"{cn2_float:.2e}"),
            "rytov_variance": round(rytov, 4),
            "scintillation_index": round(scint, 4),
            "qber_percent": round(bb84_res["simulated_qber"] * 100.0, 3),
            "simulated_qber_percent": round(bb84_res["simulated_qber"] * 100.0, 3),
            "analytical_qber_percent": round(det_probs["qber"] * 100.0, 3),
            "snr_db": round(det_probs["snr_db"], 2)
        })
    return curve


def generate_qber_vs_pointing_curve(
    base_transmittance: float,
    rx_aperture_m: float,
    beam_waist_radius_m: float,
    distance_km: float,
    mean_photon_number: float,
    detector_efficiency: float,
    dark_count_rate: float,
    background_noise: float,
    optical_error_rate: float
) -> List[Dict[str, float]]:
    """
    Sweeps pointing jitter from 0.5 to 20.0 microradians.
    Includes both Simulated QBER and Analytical QBER.
    """
    from .bb84 import simulate_bb84_protocol
    
    jitters = np.linspace(0.5, 20.0, 25)
    curve = []
    
    for j in jitters:
        j_val = float(j)
        A0, w_eq, sigma_r, mean_t = calculate_pointing_parameters(
            rx_aperture_m=rx_aperture_m,
            beam_waist_radius_m=beam_waist_radius_m,
            distance_km=distance_km,
            jitter_urad=j_val
        )
        
        eff_t = base_transmittance * mean_t
        eff_loss_db = -10.0 * math.log10(max(1e-15, eff_t))
        
        det_probs = calculate_detection_probabilities(
            total_channel_transmittance=eff_t,
            mean_photon_number=mean_photon_number,
            detector_efficiency=detector_efficiency,
            dark_count_rate=dark_count_rate,
            background_noise=background_noise,
            optical_error_rate=optical_error_rate
        )
        
        bb84_res = simulate_bb84_protocol(
            num_bits=3000,
            p_click=det_probs["p_click"],
            p_signal=det_probs["p_signal"],
            p_noise=det_probs["p_noise"],
            optical_error_rate=optical_error_rate,
            channel_loss_db=eff_loss_db,
            sample_trace_count=0
        )
        
        curve.append({
            "pointing_jitter_urad": round(j_val, 2),
            "pointing_loss_db": round(-10.0 * math.log10(max(1e-12, mean_t)), 2),
            "qber_percent": round(bb84_res["simulated_qber"] * 100.0, 3),
            "simulated_qber_percent": round(bb84_res["simulated_qber"] * 100.0, 3),
            "analytical_qber_percent": round(det_probs["qber"] * 100.0, 3),
            "snr_db": round(det_probs["snr_db"], 2)
        })
    return curve


def generate_key_rate_vs_conditions_curve(
    satellite_altitude_km: float,
    has_relay: bool,
    relay_altitude_km: float,
    relay_efficiency: float,
    relay_aperture_m: float,
    tx_aperture_m: float,
    rx_aperture_m: float,
    beam_divergence_urad: float,
    wavelength_nm: float,
    mean_photon_number: float,
    repetition_rate_hz: float,
    detector_efficiency: float,
    dark_count_rate: float,
    background_noise: float,
    optical_error_rate: float,
    fec_efficiency: float
) -> List[Dict[str, Any]]:
    """
    Evaluates secret key rate under Clear, Moderate, and Adverse conditions.
    """
    conditions = [
        {"name": "Clear (Optimum)", "visibility_km": 30.0, "cn2": 1e-15, "jitter_urad": 1.5, "bg_noise": 5e-7},
        {"name": "Moderate (Nominal)", "visibility_km": 15.0, "cn2": 1e-14, "jitter_urad": 3.5, "bg_noise": 1e-6},
        {"name": "Hazy / Strong Turb.", "visibility_km": 6.0, "cn2": 5e-14, "jitter_urad": 6.0, "bg_noise": 3e-6},
        {"name": "Adverse Fog / High Jitter", "visibility_km": 2.0, "cn2": 1e-13, "jitter_urad": 12.0, "bg_noise": 1e-5}
    ]
    
    results = []
    for cond in conditions:
        atm = calculate_dual_link_atmosphere(
            satellite_altitude_km=satellite_altitude_km,
            has_relay=has_relay,
            relay_altitude_km=relay_altitude_km,
            relay_efficiency=relay_efficiency,
            relay_aperture_m=relay_aperture_m,
            tx_aperture_m=tx_aperture_m,
            rx_aperture_m=rx_aperture_m,
            beam_divergence_urad=beam_divergence_urad,
            wavelength_nm=wavelength_nm,
            visibility_km=cond["visibility_km"]
        )
        
        bw = atm["beam_waist_link2_m"] if has_relay else atm["beam_waist_link1_m"]
        _, _, _, mean_pe = calculate_pointing_parameters(
            rx_aperture_m=rx_aperture_m,
            beam_waist_radius_m=bw,
            distance_km=atm["link2_distance_km"] if has_relay else atm["link1_distance_km"],
            jitter_urad=cond["jitter_urad"]
        )
        
        total_t = atm["total_transmittance"] * mean_pe
        det = calculate_detection_probabilities(
            total_channel_transmittance=total_t,
            mean_photon_number=mean_photon_number,
            detector_efficiency=detector_efficiency,
            dark_count_rate=dark_count_rate,
            background_noise=cond["bg_noise"],
            optical_error_rate=optical_error_rate
        )
        
        skr = calculate_secure_key_rate(
            qber=det["qber"],
            sifted_key_length=int(10000 * 0.5 * det["p_click"]),
            repetition_rate_hz=repetition_rate_hz,
            p_click=det["p_click"],
            fec_efficiency=fec_efficiency
        )
        
        results.append({
            "condition": cond["name"],
            "qber_percent": round(det["qber"] * 100.0, 2),
            "channel_loss_db": round(atm["total_loss_db"] - 10.0 * math.log10(mean_pe), 2),
            "secret_key_rate_kbps": round(skr["secret_key_rate_bps"] / 1000.0, 2),
            "is_secure": skr["is_secure"]
        })
    return results
