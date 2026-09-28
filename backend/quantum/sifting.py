"""
Basis Sifting Module for BB84 Protocol
======================================
Simulates public basis announcement and classical key reconciliation.
"""

import numpy as np
from typing import Dict, Any


def perform_basis_sifting(
    alice_bits: np.ndarray,
    alice_bases: np.ndarray,
    bob_bases: np.ndarray,
    bob_bits: np.ndarray,
    detected_mask: np.ndarray
) -> Dict[str, Any]:
    """
    Executes basis sifting on the transmitted and received quantum sequences.

    Parameters:
        alice_bits: (N,) Alice's transmitted bit values.
        alice_bases: (N,) Alice's preparation bases (0: Z, 1: X).
        bob_bases: (N,) Bob's measurement bases (0: Z, 1: X).
        bob_bits: (N,) Bob's measured bits (-1 if undetected).
        detected_mask: (N,) bool array of detection clicks.

    Returns:
        dict containing sifted keys, indices, and sifting statistics.
    """
    num_bits = len(alice_bits)

    basis_matched_mask = (alice_bases == bob_bases)
    sifted_mask = basis_matched_mask & detected_mask
    sifted_indices = np.where(sifted_mask)[0]

    sifted_alice = alice_bits[sifted_indices]
    sifted_bob = bob_bits[sifted_indices]

    total_detected = int(np.sum(detected_mask))
    sifted_key_length = len(sifted_indices)
    sifted_fraction = float(sifted_key_length / num_bits) if num_bits > 0 else 0.0
    detection_rate = float(total_detected / num_bits) if num_bits > 0 else 0.0

    return {
        "num_bits": num_bits,
        "total_detected": total_detected,
        "detection_rate": detection_rate,
        "basis_matched_count": int(np.sum(basis_matched_mask)),
        "sifted_key_length": sifted_key_length,
        "sifted_fraction": sifted_fraction,
        "sifted_mask": sifted_mask,
        "sifted_indices": sifted_indices,
        "sifted_alice": sifted_alice,
        "sifted_bob": sifted_bob,
        "basis_matched_mask": basis_matched_mask
    }
