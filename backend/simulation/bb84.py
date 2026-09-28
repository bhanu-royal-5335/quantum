"""
BB84 Quantum Key Distribution Protocol Simulator
================================================
Simulates:
1. Quantum state preparation in 2D Hilbert space (|0>, |1>, |+>, |->)
2. Alice random bit and basis generation ({Z, X})
3. Physical FSO channel propagation, loss, and detector noise coupling
4. Bob conjugate measurement bases and projective Born's rule detection
5. Classical basis sifting and reconciliation
6. Error estimation (Simulated QBER calculation)
7. Quantum bit trace sample generation for UI visualization
"""

import math
import numpy as np
from typing import Dict, Any, List, Optional
from ..models.schemas import BitTrace
from .quantum_channel import (
    prepare_state_vectors_batch,
    transmit_qubits_through_channel,
    calculate_channel_click_probabilities
)
from .quantum_measurement import measure_qubits_batch
from .basis_sifting import perform_basis_sifting


def simulate_bb84_protocol(
    num_bits: int,
    p_click: Optional[float] = None,
    p_signal: Optional[float] = None,
    p_noise: Optional[float] = None,
    optical_error_rate: float = 0.015,
    sample_trace_count: int = 35,
    channel_loss_db: Optional[float] = None,
    mean_photon_number: float = 0.6,
    detector_efficiency: float = 0.80,
    dark_count_rate: float = 1e-6,
    background_noise: float = 1e-6,
    scintillation_fading: Optional[np.ndarray] = None,
    pointing_coupling: Optional[np.ndarray] = None,
    error_estimation_fraction: float = 1.0  # 1.0 for testing all sifted bits or fraction for protocol
) -> Dict[str, Any]:
    """
    Executes discrete stochastic BB84 protocol simulation over num_bits pulses
    using 2D Hilbert space state vectors and Born's rule quantum measurements.
    """
    np.random.seed()  # High entropy random seed
    
    # 1. Alice generates random bits: 0 or 1
    alice_bits = np.random.randint(0, 2, size=num_bits, dtype=np.int8)
    
    # 2. Alice chooses random preparation bases: 0 = 'Z' (Rectilinear), 1 = 'X' (Diagonal)
    alice_bases = np.random.randint(0, 2, size=num_bits, dtype=np.int8)
    
    # 3. Bob chooses random measurement bases: 0 = 'Z', 1 = 'X'
    bob_bases = np.random.randint(0, 2, size=num_bits, dtype=np.int8)
    
    # 4. State vector preparation in 2D Hilbert space:
    #    Z basis: |0> = [1, 0]^T, |1> = [0, 1]^T
    #    X basis: |+> = 1/sqrt(2)[1, 1]^T, |-> = 1/sqrt(2)[1, -1]^T
    alice_states = prepare_state_vectors_batch(alice_bases, alice_bits)
    
    # 5. Channel propagation and detection
    if channel_loss_db is not None:
        loss_db = channel_loss_db
    elif p_click is not None and p_signal is not None:
        # Convert p_signal back to equivalent loss for physical consistency
        eta_prod = -math.log(max(1e-12, 1.0 - min(0.99999, p_signal))) / max(1e-6, mean_photon_number)
        t_channel = min(1.0, max(1e-15, eta_prod / max(1e-6, detector_efficiency)))
        loss_db = -10.0 * math.log10(t_channel)
    else:
        loss_db = 20.0
        
    detected_mask, is_signal_mask, received_states = transmit_qubits_through_channel(
        states=alice_states,
        channel_loss_db=loss_db,
        mean_photon_number=mean_photon_number,
        detector_efficiency=detector_efficiency,
        dark_count_rate=dark_count_rate if p_noise is None else p_noise,
        background_noise=background_noise,
        optical_error_rate=optical_error_rate,
        scintillation_fading=scintillation_fading,
        pointing_coupling=pointing_coupling
    )
    
    # Override click probabilities if explicit p_click/p_signal were supplied
    if p_click is not None and channel_loss_db is None:
        rand_c = np.random.rand(num_bits)
        detected_mask = rand_c < p_click
        p_sig_given_click = min(1.0, max(0.0, (p_signal or 0.0) / max(1e-12, p_click)))
        is_signal_mask = detected_mask & (np.random.rand(num_bits) < p_sig_given_click)
        # Update received states rotation for signal pulses
        theta_err = math.asin(min(1.0, math.sqrt(max(0.0, optical_error_rate))))
        cos_t = math.cos(theta_err)
        sin_t = math.sin(theta_err)
        rot = np.array([[cos_t, -sin_t], [sin_t, cos_t]], dtype=np.float64)
        received_states = np.zeros_like(alice_states)
        if np.any(is_signal_mask):
            received_states[is_signal_mask] = (rot @ alice_states[is_signal_mask].T).T
    
    # 6. Bob measurement via Born's rule
    bob_bits = measure_qubits_batch(
        received_states=received_states,
        bob_bases=bob_bases,
        detected_mask=detected_mask,
        is_signal_mask=is_signal_mask
    )
    
    # 7. Public Basis Sifting
    sifting_res = perform_basis_sifting(
        alice_bits=alice_bits,
        alice_bases=alice_bases,
        bob_bases=bob_bases,
        bob_bits=bob_bits,
        detected_mask=detected_mask
    )
    
    sifted_key_length = sifting_res["sifted_key_length"]
    total_detected = sifting_res["total_detected"]
    sifted_mask = sifting_res["sifted_mask"]
    sifted_alice = sifting_res["sifted_alice"]
    sifted_bob = sifting_res["sifted_bob"]
    basis_matched_mask = sifting_res["basis_matched_mask"]
    
    # 8. Error Estimation & QBER Calculation
    if sifted_key_length > 0:
        error_mask = (sifted_alice != sifted_bob)
        error_bits = int(np.sum(error_mask))
        simulated_qber = float(error_bits / sifted_key_length)
    else:
        error_bits = 0
        simulated_qber = 0.50  # Channel completely extinguished / no photons detected
        
    # Standard statistical error of QBER estimate
    if sifted_key_length > 1:
        qber_std_err = math.sqrt(simulated_qber * (1.0 - simulated_qber) / sifted_key_length)
    else:
        qber_std_err = 0.0

    # 9. Generate detailed BitTrace samples for UI visualizer
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
        "detection_rate": float(total_detected / num_bits) if num_bits > 0 else 0.0,
        "sifted_key_length": sifted_key_length,
        "sifted_fraction": float(sifted_key_length / num_bits) if num_bits > 0 else 0.0,
        "error_bits": error_bits,
        "simulated_qber": simulated_qber,
        "qber_std_err": qber_std_err,
        "bit_samples": bit_samples,
        "basis_matched_count": sifting_res["basis_matched_count"],
        "channel_loss_db": loss_db
    }
