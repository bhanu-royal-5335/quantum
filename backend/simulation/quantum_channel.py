"""
Quantum Channel Physical Simulation
===================================
Models single-photon state-vector propagation through an atmospheric free-space optical (FSO)
quantum channel under loss, atmospheric turbulence, pointing jitter, and detector noise.

Implements 2-dimensional Hilbert space state-vector representation:
    |0> = [1, 0]^T
    |1> = [0, 1]^T
    |+> = [1/sqrt(2),  1/sqrt(2)]^T
    |-> = [1/sqrt(2), -1/sqrt(2)]^T
"""

import math
import numpy as np
from typing import Dict, Any, Tuple, Optional


# Canonical 2D State Vectors
STATE_0 = np.array([1.0, 0.0], dtype=np.float64)
STATE_1 = np.array([0.0, 1.0], dtype=np.float64)
STATE_PLUS = np.array([1.0 / math.sqrt(2.0), 1.0 / math.sqrt(2.0)], dtype=np.float64)
STATE_MINUS = np.array([1.0 / math.sqrt(2.0), -1.0 / math.sqrt(2.0)], dtype=np.float64)

STATE_LOOKUP = {
    (0, 0): STATE_0,      # Z basis, bit 0 -> |0>
    (0, 1): STATE_1,      # Z basis, bit 1 -> |1>
    (1, 0): STATE_PLUS,   # X basis, bit 0 -> |+>
    (1, 1): STATE_MINUS,  # X basis, bit 1 -> |->
}


def prepare_state_vector(basis: int, bit: int) -> np.ndarray:
    """
    Returns 2D state vector |ψ> for a given BB84 basis (0: Z, 1: X) and bit (0 or 1).
    """
    return STATE_LOOKUP[(basis, bit)].copy()


def prepare_state_vectors_batch(bases: np.ndarray, bits: np.ndarray) -> np.ndarray:
    """
    Vectorized preparation of state vectors for an array of pulses.
    Returns:
        states: (N, 2) array of normalized state vectors.
    """
    n = len(bases)
    states = np.zeros((n, 2), dtype=np.float64)
    
    # Z basis: bit 0 -> [1, 0], bit 1 -> [0, 1]
    mask_z0 = (bases == 0) & (bits == 0)
    mask_z1 = (bases == 0) & (bits == 1)
    # X basis: bit 0 -> [1/sqrt(2), 1/sqrt(2)], bit 1 -> [1/sqrt(2), -1/sqrt(2)]
    mask_x0 = (bases == 1) & (bits == 0)
    mask_x1 = (bases == 1) & (bits == 1)
    
    inv_sqrt2 = 1.0 / math.sqrt(2.0)
    
    states[mask_z0, 0] = 1.0
    states[mask_z1, 1] = 1.0
    
    states[mask_x0, 0] = inv_sqrt2
    states[mask_x0, 1] = inv_sqrt2
    
    states[mask_x1, 0] = inv_sqrt2
    states[mask_x1, 1] = -inv_sqrt2
    
    return states


def apply_polarization_rotation(state: np.ndarray, theta: float) -> np.ndarray:
    """
    Applies 2D rotation matrix R(theta) representing optical misalignment or polarization rotation.
    R(theta) = [[cos(theta), -sin(theta)], [sin(theta), cos(theta)]]
    """
    cos_t = math.cos(theta)
    sin_t = math.sin(theta)
    rot_matrix = np.array([[cos_t, -sin_t], [sin_t, cos_t]], dtype=np.float64)
    return rot_matrix @ state


def calculate_channel_click_probabilities(
    channel_loss_db: float,
    mean_photon_number: float = 0.6,
    detector_efficiency: float = 0.8,
    dark_count_rate: float = 1e-6,
    background_noise: float = 1e-6
) -> Dict[str, float]:
    """
    Computes signal arrival probability, noise event probability, and overall click probability.
    """
    t_channel = 10.0 ** (-max(0.0, channel_loss_db) / 10.0)
    t_channel = min(1.0, max(1e-15, t_channel))
    
    # Effective transmission to detector
    eta_total = min(1.0, max(1e-15, t_channel * detector_efficiency))
    
    # Poisson signal photon arrival: P_sig = 1 - exp(-mu * eta)
    mu_rx = mean_photon_number * eta_total
    p_signal = 1.0 - math.exp(-mu_rx)
    
    # Noise probability from dark counts and ambient background light
    p_dark = max(1e-9, min(0.5, dark_count_rate))
    p_bg = max(1e-9, min(0.5, background_noise))
    p_noise = 1.0 - (1.0 - p_dark) * (1.0 - p_bg)
    
    # Overall detection click probability
    p_click = 1.0 - (1.0 - p_signal) * (1.0 - p_noise)
    p_click = min(1.0, max(1e-9, p_click))
    
    return {
        "transmittance": t_channel,
        "eta_total": eta_total,
        "p_signal": p_signal,
        "p_noise": p_noise,
        "p_click": p_click,
        "mu_rx": mu_rx
    }


def transmit_qubits_through_channel(
    states: np.ndarray,
    channel_loss_db: float,
    mean_photon_number: float = 0.6,
    detector_efficiency: float = 0.8,
    dark_count_rate: float = 1e-6,
    background_noise: float = 1e-6,
    optical_error_rate: float = 0.015,
    scintillation_fading: Optional[np.ndarray] = None,
    pointing_coupling: Optional[np.ndarray] = None
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Simulates physical propagation of an ensemble of quantum states through the channel.
    
    Parameters:
        states: (N, 2) array of Alice's transmitted state vectors.
        channel_loss_db: Total link attenuation in dB.
        scintillation_fading: Optional array of instantaneous turbulence fading factors.
        pointing_coupling: Optional array of instantaneous pointing coupling factors.
        
    Returns:
        detected_mask: (N,) bool array indicating detector click.
        is_signal_mask: (N,) bool array indicating the click was from a signal photon.
        received_states: (N, 2) array of states arriving at Bob's detector.
    """
    n = len(states)
    probs = calculate_channel_click_probabilities(
        channel_loss_db=channel_loss_db,
        mean_photon_number=mean_photon_number,
        detector_efficiency=detector_efficiency,
        dark_count_rate=dark_count_rate,
        background_noise=background_noise
    )
    
    # If dynamic fading is provided, adjust click probability per pulse
    if scintillation_fading is not None and pointing_coupling is not None:
        inst_t = probs["transmittance"] * scintillation_fading * pointing_coupling
        inst_t = np.clip(inst_t, 1e-15, 1.0)
        inst_eta = np.clip(inst_t * detector_efficiency, 1e-15, 1.0)
        p_sig_arr = 1.0 - np.exp(-mean_photon_number * inst_eta)
        p_noise_val = probs["p_noise"]
        p_click_arr = 1.0 - (1.0 - p_sig_arr) * (1.0 - p_noise_val)
        p_click_arr = np.clip(p_click_arr, 1e-9, 1.0)
    else:
        p_sig_arr = np.full(n, probs["p_signal"])
        p_click_arr = np.full(n, probs["p_click"])
    
    # 1. Stochastic Detection event
    rand_click = np.random.rand(n)
    detected_mask = rand_click < p_click_arr
    
    # 2. Discriminate Signal click vs Noise click among detected pulses
    # P(signal | click) = p_sig / p_click
    p_sig_given_click = np.clip(p_sig_arr / np.maximum(1e-12, p_click_arr), 0.0, 1.0)
    rand_sig = np.random.rand(n)
    is_signal_mask = detected_mask & (rand_sig < p_sig_given_click)
    is_noise_mask = detected_mask & (~is_signal_mask)
    
    # 3. State transformation:
    # Optical misalignment introduces a polarization rotation angle theta = arcsin(sqrt(e_opt))
    theta_err = math.asin(min(1.0, math.sqrt(max(0.0, optical_error_rate))))
    
    cos_t = math.cos(theta_err)
    sin_t = math.sin(theta_err)
    rot = np.array([[cos_t, -sin_t], [sin_t, cos_t]], dtype=np.float64)
    
    received_states = np.zeros_like(states)
    
    # Signal pulses undergo rotation R(theta)
    if np.any(is_signal_mask):
        received_states[is_signal_mask] = (rot @ states[is_signal_mask].T).T
        
    # Noise clicks have no coherent polarization state (we mark them with NaN or unpolarized state)
    # Measurement logic will treat noise clicks as unpolarized (50/50 outcome in any basis)
    if np.any(is_noise_mask):
        received_states[is_noise_mask] = np.nan
        
    return detected_mask, is_signal_mask, received_states
