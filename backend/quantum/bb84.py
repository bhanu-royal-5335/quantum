"""
BB84 Quantum Key Distribution Simulator with Eavesdropping Support
===================================================================
Coordinates:
1. Alice state preparation (|0>, |1>, |+>, |->)
2. Eve intercept-resend attack (if active)
3. FSO channel loss and physical noise coupling
4. Bob conjugate measurement and Born's rule detection
5. Basis sifting and reconciliation
6. Error estimation (Simulated QBER calculation)
7. Information reconciliation & privacy amplification (SKR)
8. Bit trace sample generation for UI visualization
"""

import math
import numpy as np
from typing import Dict, Any, List, Optional

from .eve import apply_intercept_resend_attack
from .channel import calculate_fso_link_budget, transmit_through_quantum_channel
from .measurement import measure_qubits_batch
from .sifting import perform_basis_sifting
from .qber import calculate_qber
from .secret_key import calculate_secure_key_rate


def prepare_state_vectors_batch(bases: np.ndarray, bits: np.ndarray) -> np.ndarray:
    """
    Vectorized preparation of state vectors for an array of pulses:
        Z basis (0): bit 0 -> [1, 0]^T, bit 1 -> [0, 1]^T
        X basis (1): bit 0 -> [1/sqrt(2), 1/sqrt(2)]^T, bit 1 -> [1/sqrt(2), -1/sqrt(2)]^T
    """
    n = len(bases)
    states = np.zeros((n, 2), dtype=np.float64)

    inv_sqrt2 = 1.0 / math.sqrt(2.0)
    states[(bases == 0) & (bits == 0), 0] = 1.0
    states[(bases == 0) & (bits == 1), 1] = 1.0

    states[(bases == 1) & (bits == 0), 0] = inv_sqrt2
    states[(bases == 1) & (bits == 0), 1] = inv_sqrt2

    states[(bases == 1) & (bits == 1), 0] = inv_sqrt2
    states[(bases == 1) & (bits == 1), 1] = -inv_sqrt2

    return states


def run_bb84_simulation(
    num_bits: int = 10000,
    distance_km: float = 500.0,
    satellite: str = "micius",
    eavesdropping_enabled: bool = False,
    eavesdropping_probability: float = 0.25,
    attack_type: str = "intercept_resend",
    channel_noise: float = 0.02,
    turbulence: str = "moderate",
    pointing_error: float = 5.0,
    detector_efficiency: float = 0.80,
    fec_efficiency: float = 1.16,
    repetition_rate_hz: float = 1e7,
    sample_trace_count: int = 40
) -> Dict[str, Any]:
    """
    Executes complete BB84 simulation trial over num_bits raw quantum pulses.
    """
    np.random.seed()
    n_bits = max(100, int(num_bits))

    # 1. Physical channel link budget
    link_budget = calculate_fso_link_budget(
        distance_km=distance_km,
        pointing_jitter_urad=pointing_error,
        turbulence_level=turbulence
    )
    total_loss_db = link_budget["total_loss_db"]

    # 2. Alice generates random bits & conjugate bases
    alice_bits = np.random.randint(0, 2, size=n_bits, dtype=np.int8)
    alice_bases = np.random.randint(0, 2, size=n_bits, dtype=np.int8)

    # Prepare quantum state vectors in 2D Hilbert space
    alice_states = prepare_state_vectors_batch(alice_bases, alice_bits)

    # 3. Eavesdropping simulation (Eve Intercept-Resend)
    if eavesdropping_enabled and eavesdropping_probability > 0.0:
        channel_input_states, intercepted_mask, eve_bases, eve_bits = apply_intercept_resend_attack(
            states=alice_states,
            alice_bases=alice_bases,
            alice_bits=alice_bits,
            eavesdropping_probability=eavesdropping_probability
        )
    else:
        channel_input_states = alice_states
        intercepted_mask = np.zeros(n_bits, dtype=bool)
        eve_bases = np.full(n_bits, -1, dtype=np.int8)
        eve_bits = np.full(n_bits, -1, dtype=np.int8)

    # 4. Propagation through FSO channel
    detected_mask, is_signal_mask, received_states = transmit_through_quantum_channel(
        states=channel_input_states,
        total_loss_db=total_loss_db,
        channel_noise=channel_noise,
        detector_efficiency=detector_efficiency
    )

    # 5. Bob randomly chooses measurement bases
    bob_bases = np.random.randint(0, 2, size=n_bits, dtype=np.int8)

    # Bob measurement via Born's rule
    bob_bits = measure_qubits_batch(
        received_states=received_states,
        bob_bases=bob_bases,
        detected_mask=detected_mask,
        is_signal_mask=is_signal_mask
    )

    # 6. Public Basis Sifting
    sifting_res = perform_basis_sifting(
        alice_bits=alice_bits,
        alice_bases=alice_bases,
        bob_bases=bob_bases,
        bob_bits=bob_bits,
        detected_mask=detected_mask
    )

    # 7. QBER & Error Estimation
    baseline_noise = channel_noise  # intrinsic hardware/channel noise without Eve
    qber_res = calculate_qber(
        sifted_alice=sifting_res["sifted_alice"],
        sifted_bob=sifting_res["sifted_bob"],
        baseline_noise_qber=baseline_noise,
        security_threshold=0.11
    )

    # 8. Secret Key Rate
    skr_res = calculate_secure_key_rate(
        qber=qber_res["qber"],
        sifted_key_length=sifting_res["sifted_key_length"],
        repetition_rate_hz=repetition_rate_hz,
        p_click=sifting_res["detection_rate"],
        fec_efficiency=fec_efficiency
    )

    # 9. Detailed bit sample trace records for UI visualizer
    sample_limit = min(sample_trace_count, n_bits)
    basis_names = {0: "Z", 1: "X"}
    bit_samples: List[Dict[str, Any]] = []

    for i in range(sample_limit):
        is_det = bool(detected_mask[i])
        b_match = bool(sifting_res["basis_matched_mask"][i])
        b_bit = int(bob_bits[i]) if is_det else None
        is_err = bool(sifting_res["sifted_mask"][i] and (alice_bits[i] != bob_bits[i]))

        bit_samples.append({
            "index": i + 1,
            "alice_bit": int(alice_bits[i]),
            "alice_basis": basis_names[int(alice_bases[i])],
            "bob_basis": basis_names[int(bob_bases[i])],
            "bob_bit": b_bit,
            "detected": is_det,
            "basis_matched": b_match,
            "is_error": is_err,
            "intercepted": bool(intercepted_mask[i]),
            "eve_basis": basis_names[int(eve_bases[i])] if intercepted_mask[i] else None,
            "eve_bit": int(eve_bits[i]) if intercepted_mask[i] else None
        })

    return {
        "num_bits": n_bits,
        "bits_sent": n_bits,
        "total_detected": sifting_res["total_detected"],
        "detections": sifting_res["total_detected"],
        "detection_rate": round(sifting_res["detection_rate"] * 100.0, 2),
        "sifted_bits": sifting_res["sifted_key_length"],
        "sifted_key_length": sifting_res["sifted_key_length"],
        "sifting_ratio": round(sifting_res["sifted_fraction"] * 100.0, 2),
        "errors": qber_res["error_bits"],
        "error_bits": qber_res["error_bits"],
        "qber": qber_res["qber"],
        "qber_percent": qber_res["qber_percent"],
        "qber_std_error": qber_res["qber_std_error"],
        "estimated_skr": skr_res["secret_key_rate_bps"],
        "discrete_secure_bits": skr_res["discrete_secure_bits"],
        "is_secure": skr_res["is_secure"],
        "security_status_message": skr_res["security_status_message"],
        "eavesdropping_detected": qber_res["eavesdropping_detected"],
        "eavesdropping_enabled": eavesdropping_enabled,
        "eavesdropping_probability": eavesdropping_probability,
        "attack_type": attack_type,
        "channel_loss_db": total_loss_db,
        "link_budget": link_budget,
        "bit_samples": bit_samples
    }
