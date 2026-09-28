"""
Eve Eavesdropping Simulation Module
===================================
Implements quantum eavesdropping attacks on the BB84 protocol.

Supports:
- Intercept-Resend Attack:
    1. Eve intercepts transmitted photon with probability P_eve.
    2. Eve independently chooses a random measurement basis B_Eve in {Z, X}.
    3. Eve performs projective measurement on the state vector following Born's rule.
    4. Eve prepares and re-transmits a fresh quantum replacement state |b_Eve> in basis B_Eve to Bob.
    5. Non-intercepted pulses (1 - P_eve) pass undisturbed through the channel.

Physical theoretical consequence:
- When Eve intercepts, half the time she picks the wrong basis.
- When Alice & Bob share matching bases, but Eve picked the wrong basis,
  Bob has a 50% chance of measuring a bit error.
- Therefore, Eve introduces an expected error rate of:
    QBER_Eve = 0.25 * P_eve
  At P_eve = 100%, QBER = 25% (in addition to intrinsic channel noise).
"""

import math
import numpy as np
from typing import Dict, Any, Tuple


# Canonical State Vectors
STATE_0 = np.array([1.0, 0.0], dtype=np.float64)
STATE_1 = np.array([0.0, 1.0], dtype=np.float64)
STATE_PLUS = np.array([1.0 / math.sqrt(2.0), 1.0 / math.sqrt(2.0)], dtype=np.float64)
STATE_MINUS = np.array([1.0 / math.sqrt(2.0), -1.0 / math.sqrt(2.0)], dtype=np.float64)


def apply_intercept_resend_attack(
    states: np.ndarray,
    alice_bases: np.ndarray,
    alice_bits: np.ndarray,
    eavesdropping_probability: float = 0.25
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Executes a vectorized Intercept-Resend attack on an ensemble of transmitted qubits.

    Parameters:
        states: (N, 2) array of Alice's transmitted state vectors.
        alice_bases: (N,) array of Alice's preparation bases (0: Z, 1: X).
        alice_bits: (N,) array of Alice's bits (0 or 1).
        eavesdropping_probability: Fraction of pulses Eve attempts to intercept (0.0 to 1.0).

    Returns:
        transmitted_states: (N, 2) array of states leaving Eve towards Bob.
        intercepted_mask: (N,) bool array indicating pulses intercepted by Eve.
        eve_bases: (N,) int8 array of bases chosen by Eve (-1 if not intercepted).
        eve_bits: (N,) int8 array of bits measured by Eve (-1 if not intercepted).
    """
    n = len(states)
    p_eve = min(1.0, max(0.0, float(eavesdropping_probability)))

    if p_eve <= 0.0:
        # Eve is inactive; states pass through unchanged
        intercepted_mask = np.zeros(n, dtype=bool)
        eve_bases = np.full(n, -1, dtype=np.int8)
        eve_bits = np.full(n, -1, dtype=np.int8)
        return states.copy(), intercepted_mask, eve_bases, eve_bits

    # 1. Stochastic interception decision for each pulse
    rand_interception = np.random.rand(n)
    intercepted_mask = rand_interception < p_eve

    intercepted_indices = np.where(intercepted_mask)[0]
    num_intercepted = len(intercepted_indices)

    transmitted_states = states.copy()
    eve_bases = np.full(n, -1, dtype=np.int8)
    eve_bits = np.full(n, -1, dtype=np.int8)

    if num_intercepted == 0:
        return transmitted_states, intercepted_mask, eve_bases, eve_bits

    # 2. Eve randomly chooses measurement basis for each intercepted pulse: 0 = Z, 1 = X
    eve_chosen_bases = np.random.randint(0, 2, size=num_intercepted, dtype=np.int8)
    eve_bases[intercepted_indices] = eve_chosen_bases

    inter_states = states[intercepted_indices]

    # 3. Projective measurement by Eve following Born's rule
    # P(0) probability array
    p0_arr = np.zeros(num_intercepted, dtype=np.float64)

    # Z basis measurement (eve_basis == 0): P(0) = |psi_0|^2
    mask_z = (eve_chosen_bases == 0)
    if np.any(mask_z):
        p0_arr[mask_z] = inter_states[mask_z, 0] ** 2

    # X basis measurement (eve_basis == 1): P(0) = 0.5 * (psi_0 + psi_1)^2
    mask_x = (eve_chosen_bases == 1)
    if np.any(mask_x):
        p0_arr[mask_x] = 0.5 * ((inter_states[mask_x, 0] + inter_states[mask_x, 1]) ** 2)

    p0_arr = np.clip(p0_arr, 0.0, 1.0)

    # Sample Eve's measured outcome
    rand_meas = np.random.rand(num_intercepted)
    measured_eve_bits = np.where(rand_meas < p0_arr, 0, 1).astype(np.int8)
    eve_bits[intercepted_indices] = measured_eve_bits

    # 4. Eve prepares fresh replacement states in her chosen basis
    # and forwards them to Bob
    replacement_states = np.zeros((num_intercepted, 2), dtype=np.float64)

    inv_sqrt2 = 1.0 / math.sqrt(2.0)
    rep_z0 = (eve_chosen_bases == 0) & (measured_eve_bits == 0)
    rep_z1 = (eve_chosen_bases == 0) & (measured_eve_bits == 1)
    rep_x0 = (eve_chosen_bases == 1) & (measured_eve_bits == 0)
    rep_x1 = (eve_chosen_bases == 1) & (measured_eve_bits == 1)

    replacement_states[rep_z0, 0] = 1.0
    replacement_states[rep_z1, 1] = 1.0

    replacement_states[rep_x0, 0] = inv_sqrt2
    replacement_states[rep_x0, 1] = inv_sqrt2

    replacement_states[rep_x1, 0] = inv_sqrt2
    replacement_states[rep_x1, 1] = -inv_sqrt2

    transmitted_states[intercepted_indices] = replacement_states

    return transmitted_states, intercepted_mask, eve_bases, eve_bits
