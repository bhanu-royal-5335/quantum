"""
BB84 Quantum Key Distribution Protocol Simulator
================================================
Simulates:
1. Quantum state preparation (Alice random bits and conjugate bases {Z, X})
2. Polarized single-photon state generation (|0>, |1>, |+>, |->)
3. FSO channel propagation and stochastic detection
4. Bob conjugate measurement bases and detection clicks
5. Basis reconciliation (sifting)
6. Error estimation (QBER calculation)
7. Information reconciliation and privacy amplification security bounds
"""

import numpy as np
from typing import Dict, Any, List, Tuple
from ..models.schemas import BitTrace


def simulate_bb84_protocol(
    num_bits: int,
    p_click: float,
    p_signal: float,
    p_noise: float,
    optical_error_rate: float,
    sample_trace_count: int = 30
) -> Dict[str, Any]:
    """
    Executes discrete stochastic BB84 protocol simulation over num_bits pulses.
    """
    np.random.seed()  # Ensure high entropy randomness
    
    # 1. Alice generates random bits: 0 or 1
    alice_bits = np.random.randint(0, 2, size=num_bits, dtype=np.int8)
    
    # 2. Alice chooses random preparation bases: 0 = 'Z' (Rectilinear), 1 = 'X' (Diagonal)
    alice_bases = np.random.randint(0, 2, size=num_bits, dtype=np.int8)
    
    # 3. Bob chooses random measurement bases: 0 = 'Z', 1 = 'X'
    bob_bases = np.random.randint(0, 2, size=num_bits, dtype=np.int8)
    
    # 4. Detection events (Bernoulli trials with p_click)
    # Generate random uniform floats to determine clicks
    rand_click = np.random.rand(num_bits)
    detected_mask = rand_click < p_click
    
    # Among detected pulses, determine whether it was signal or noise
    # Conditional probability P(signal | click) = p_signal / p_click
    p_sig_given_click = min(1.0, max(0.0, p_signal / max(1e-12, p_click)))
    is_signal_click = (np.random.rand(num_bits) < p_sig_given_click) & detected_mask
    is_noise_click = detected_mask & (~is_signal_click)
    
    # 5. Bob measurement results
    bob_bits = np.full(num_bits, -1, dtype=np.int8)
    
    # A. Noise clicks: purely random bit
    noise_indices = np.where(is_noise_click)[0]
    if len(noise_indices) > 0:
        bob_bits[noise_indices] = np.random.randint(0, 2, size=len(noise_indices), dtype=np.int8)
        
    # B. Signal clicks
    signal_indices = np.where(is_signal_click)[0]
    if len(signal_indices) > 0:
        # Check matching bases
        matching_bases_signal = (alice_bases[signal_indices] == bob_bases[signal_indices])
        
        # When bases match: Bob receives Alice's bit, subject to optical misalignment error e_opt
        matched_sig_indices = signal_indices[matching_bases_signal]
        if len(matched_sig_indices) > 0:
            rand_err = np.random.rand(len(matched_sig_indices))
            err_mask = rand_err < optical_error_rate
            # If error, flip bit; else keep Alice bit
            bob_bits[matched_sig_indices] = np.where(
                err_mask,
                1 - alice_bits[matched_sig_indices],
                alice_bits[matched_sig_indices]
            )
            
        # When bases differ: Quantum superposition yields 50/50 measurement outcome
        mismatched_sig_indices = signal_indices[~matching_bases_signal]
        if len(mismatched_sig_indices) > 0:
            bob_bits[mismatched_sig_indices] = np.random.randint(0, 2, size=len(mismatched_sig_indices), dtype=np.int8)

    # 6. Sifting: Bases match AND photon was detected
    basis_matched_mask = (alice_bases == bob_bases)
    sifted_mask = detected_mask & basis_matched_mask
    
    total_detected = int(np.sum(detected_mask))
    sifted_key_length = int(np.sum(sifted_mask))
    
    # 7. Error Calculation
    if sifted_key_length > 0:
        sifted_alice = alice_bits[sifted_mask]
        sifted_bob = bob_bits[sifted_mask]
        error_mask = (sifted_alice != sifted_bob)
        error_bits = int(np.sum(error_mask))
        simulated_qber = float(error_bits / sifted_key_length)
    else:
        error_bits = 0
        simulated_qber = 0.5  # Channel completely extinguished

    # Generate detailed BitTrace samples for UI visualization
    bit_samples: List[BitTrace] = []
    sample_limit = min(sample_trace_count, num_bits)
    basis_map = {0: "Z", 1: "X"}
    
    for i in range(sample_limit):
        det = bool(detected_mask[i])
        b_match = bool(basis_matched_mask[i])
        b_bit = int(bob_bits[i]) if det else None
        is_err = bool(sifted_mask[i] and (alice_bits[i] != bob_bits[i]))
        
        bit_samples.append(
            BitTrace(
                index=i + 1,
                alice_bit=int(alice_bits[i]),
                alice_basis=basis_map[int(alice_bases[i])],
                bob_basis=basis_map[int(bob_bases[i])],
                bob_bit=b_bit,
                detected=det,
                basis_matched=b_match,
                is_error=is_err
            )
        )

    return {
        "num_bits": num_bits,
        "total_detected": total_detected,
        "detection_rate": float(total_detected / num_bits),
        "sifted_key_length": sifted_key_length,
        "sifted_fraction": float(sifted_key_length / num_bits),
        "error_bits": error_bits,
        "simulated_qber": simulated_qber,
        "bit_samples": bit_samples
    }
