"""
Quantum Measurement Module (Bob Receiver)
=========================================
Implements Bob's measurement process using projective operators and Born's rule:
    Z basis: P_0 = |0><0|, P_1 = |1><1|
    X basis: P_+ = |+><+|, P_- = |-><-|

Born's Rule:
    P(outcome = 0 | Z, |ψ>) = |<0|ψ>|^2 = |ψ_0|^2
    P(outcome = 1 | Z, |ψ>) = |<1|ψ>|^2 = |ψ_1|^2
    P(outcome = 0 | X, |ψ>) = |<+|ψ>|^2 = 1/2 |ψ_0 + ψ_1|^2
    P(outcome = 1 | X, |ψ>) = |<-|ψ>|^2 = 1/2 |ψ_0 - ψ_1|^2

For detector noise events (dark counts / background photons), the outcome is purely
stochastic with equal 50/50 probability regardless of basis.
"""

import math
import numpy as np
from typing import Tuple, Optional


# Projection Operators
P_0 = np.array([[1.0, 0.0], [0.0, 0.0]], dtype=np.float64)
P_1 = np.array([[0.0, 0.0], [0.0, 1.0]], dtype=np.float64)
P_PLUS = 0.5 * np.array([[1.0, 1.0], [1.0, 1.0]], dtype=np.float64)
P_MINUS = 0.5 * np.array([[1.0, -1.0], [-1.0, 1.0]], dtype=np.float64)


def measure_single_qubit(state: np.ndarray, bob_basis: int, is_signal: bool = True) -> int:
    """
    Simulates projective quantum measurement on a single state vector |ψ>.
    
    Parameters:
        state: 2D state vector [ψ_0, ψ_1]^T
        bob_basis: 0 for Z basis, 1 for X basis
        is_signal: True if click is a signal photon, False if noise click
        
    Returns:
        bit: 0 or 1
    """
    if not is_signal or np.isnan(state[0]):
        # Unpolarized noise click yields maximum uncertainty
        return int(np.random.randint(0, 2))
    
    if bob_basis == 0:
        # Z basis: project onto |0> and |1>
        # P(0) = |<0|ψ>|^2 = ψ_0^2
        p0 = float(state[0] ** 2)
    else:
        # X basis: project onto |+> and |->
        # P(0) = |<+|ψ>|^2 = 0.5 * (ψ_0 + ψ_1)^2
        p0 = float(0.5 * ((state[0] + state[1]) ** 2))
        
    p0 = min(1.0, max(0.0, p0))
    rand_val = np.random.rand()
    return 0 if rand_val < p0 else 1


def measure_qubits_batch(
    received_states: np.ndarray,
    bob_bases: np.ndarray,
    detected_mask: np.ndarray,
    is_signal_mask: np.ndarray
) -> np.ndarray:
    """
    Vectorized execution of Bob's quantum measurement on all detected pulses using Born's rule.
    
    Parameters:
        received_states: (N, 2) array of incoming quantum state vectors.
        bob_bases: (N,) array of Bob's chosen measurement bases (0: Z, 1: X).
        detected_mask: (N,) bool array indicating pulses that triggered detector clicks.
        is_signal_mask: (N,) bool array indicating detection originated from a signal photon.
        
    Returns:
        bob_bits: (N,) int8 array with measured bits (0 or 1) for detected pulses, and -1 for lost pulses.
    """
    n = len(bob_bases)
    bob_bits = np.full(n, -1, dtype=np.int8)
    
    # 1. Noise clicks: generate purely random 0 or 1 bits
    is_noise_click = detected_mask & (~is_signal_mask)
    noise_indices = np.where(is_noise_click)[0]
    if len(noise_indices) > 0:
        bob_bits[noise_indices] = np.random.randint(0, 2, size=len(noise_indices), dtype=np.int8)
        
    # 2. Signal clicks: evaluate Born's rule probabilities
    signal_indices = np.where(is_signal_mask)[0]
    if len(signal_indices) == 0:
        return bob_bits
        
    sig_states = received_states[signal_indices]
    sig_bases = bob_bases[signal_indices]
    
    # Probability of outcome 0 under Born's rule
    p0_arr = np.zeros(len(signal_indices), dtype=np.float64)
    
    # Z basis subset (bob_basis == 0): P(0) = |ψ_0|^2
    mask_z = (sig_bases == 0)
    if np.any(mask_z):
        p0_arr[mask_z] = sig_states[mask_z, 0] ** 2
        
    # X basis subset (bob_basis == 1): P(0) = 0.5 * (ψ_0 + ψ_1)^2
    mask_x = (sig_bases == 1)
    if np.any(mask_x):
        p0_arr[mask_x] = 0.5 * ((sig_states[mask_x, 0] + sig_states[mask_x, 1]) ** 2)
        
    p0_arr = np.clip(p0_arr, 0.0, 1.0)
    
    rand_meas = np.random.rand(len(signal_indices))
    measured_bits = np.where(rand_meas < p0_arr, 0, 1).astype(np.int8)
    bob_bits[signal_indices] = measured_bits
    
    return bob_bits
