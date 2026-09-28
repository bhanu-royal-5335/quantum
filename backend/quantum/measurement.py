"""
Quantum Measurement Module (Bob Receiver)
=========================================
Implements Bob's projective measurement process using Born's rule:
    Z basis: P_0 = |0><0|, P_1 = |1><1|
    X basis: P_+ = |+><+|, P_- = |-><-|

Born's Rule:
    P(outcome = 0 | Z, |psi>) = |<0|psi>|^2 = |psi_0|^2
    P(outcome = 1 | Z, |psi>) = |<1|psi>|^2 = |psi_1|^2
    P(outcome = 0 | X, |psi>) = |<+|psi>|^2 = 1/2 |psi_0 + psi_1|^2
    P(outcome = 1 | X, |psi>) = |<-|psi>|^2 = 1/2 |psi_0 - psi_1|^2

Noise events (dark counts / ambient photons) register with equal 50/50 probability.
"""

import math
import numpy as np


def measure_qubits_batch(
    received_states: np.ndarray,
    bob_bases: np.ndarray,
    detected_mask: np.ndarray,
    is_signal_mask: np.ndarray
) -> np.ndarray:
    """
    Vectorized execution of Bob's quantum measurement on detected pulses.

    Parameters:
        received_states: (N, 2) array of incoming quantum state vectors.
        bob_bases: (N,) array of Bob's measurement bases (0: Z, 1: X).
        detected_mask: (N,) bool array indicating pulses with detector clicks.
        is_signal_mask: (N,) bool array indicating signal photon vs noise click.

    Returns:
        bob_bits: (N,) int8 array with measured bits (0 or 1) for detected pulses, and -1 for undetected.
    """
    n = len(bob_bases)
    bob_bits = np.full(n, -1, dtype=np.int8)

    # 1. Pure noise clicks (dark counts / ambient noise): 50/50 random outcome
    is_noise_click = detected_mask & (~is_signal_mask)
    noise_indices = np.where(is_noise_click)[0]
    if len(noise_indices) > 0:
        bob_bits[noise_indices] = np.random.randint(0, 2, size=len(noise_indices), dtype=np.int8)

    # 2. Signal clicks: project onto Bob's chosen basis
    signal_indices = np.where(is_signal_mask)[0]
    if len(signal_indices) == 0:
        return bob_bits

    sig_states = received_states[signal_indices]
    sig_bases = bob_bases[signal_indices]

    p0_arr = np.zeros(len(signal_indices), dtype=np.float64)

    # Z basis (bob_basis == 0): P(0) = |psi_0|^2
    mask_z = (sig_bases == 0)
    if np.any(mask_z):
        p0_arr[mask_z] = sig_states[mask_z, 0] ** 2

    # X basis (bob_basis == 1): P(0) = 0.5 * (psi_0 + psi_1)^2
    mask_x = (sig_bases == 1)
    if np.any(mask_x):
        p0_arr[mask_x] = 0.5 * ((sig_states[mask_x, 0] + sig_states[mask_x, 1]) ** 2)

    p0_arr = np.clip(p0_arr, 0.0, 1.0)

    rand_meas = np.random.rand(len(signal_indices))
    measured_bits = np.where(rand_meas < p0_arr, 0, 1).astype(np.int8)
    bob_bits[signal_indices] = measured_bits

    return bob_bits
