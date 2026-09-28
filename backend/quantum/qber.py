"""
Quantum Bit Error Rate (QBER) Calculation Module
================================================
Calculates error metrics and flags eavesdropping detection:
    QBER = Sifted Bit Errors / Sifted Key Length
"""

import math
import numpy as np
from typing import Dict, Any


def calculate_qber(
    sifted_alice: np.ndarray,
    sifted_bob: np.ndarray,
    baseline_noise_qber: float = 0.015,
    security_threshold: float = 0.11
) -> Dict[str, Any]:
    """
    Computes QBER from the reconciled sifted keys.

    Parameters:
        sifted_alice: Array of Alice's sifted bits.
        sifted_bob: Array of Bob's sifted bits.
        baseline_noise_qber: Expected channel noise baseline without Eve.
        security_threshold: Maximum allowable QBER for secure key generation (11.0% for BB84).

    Returns:
        dict containing error_bits, qber, std_error, and eavesdropping detection flag.
    """
    sifted_len = len(sifted_alice)

    if sifted_len == 0:
        return {
            "sifted_key_length": 0,
            "error_bits": 0,
            "qber": 0.50,
            "qber_percent": 50.0,
            "qber_std_error": 0.0,
            "is_secure": False,
            "eavesdropping_detected": True,
            "status_message": "Channel extinguished; 0 sifted bits received."
        }

    error_mask = (sifted_alice != sifted_bob)
    error_bits = int(np.sum(error_mask))
    qber = float(error_bits / sifted_len)

    std_error = math.sqrt(qber * (1.0 - qber) / sifted_len) if sifted_len > 1 else 0.0

    # Eavesdropping detection criterion:
    # 1. QBER exceeds the 11% unconditional security threshold
    # OR 2. QBER exceeds the baseline noise by more than 3 standard deviations (statistically significant Eve presence)
    eve_detected = (qber >= security_threshold) or (qber > baseline_noise_qber + max(0.015, 3.0 * std_error))

    is_secure = qber < security_threshold

    if qber >= security_threshold:
        status = f"SECURITY BREACH: QBER ({qber*100:.2f}%) exceeds the 11.0% threshold. Sifted key discarded."
    elif eve_detected:
        status = f"EAVESDROPPING DETECTED: Anomalous error disturbance detected ({qber*100:.2f}% vs baseline {baseline_noise_qber*100:.2f}%)."
    else:
        status = f"SECURE CHANNEL: QBER ({qber*100:.2f}%) is within the safe asymptotic threshold."

    return {
        "sifted_key_length": sifted_len,
        "error_bits": error_bits,
        "qber": round(qber, 6),
        "qber_percent": round(qber * 100.0, 3),
        "qber_std_error": round(std_error, 6),
        "is_secure": is_secure,
        "eavesdropping_detected": eve_detected,
        "status_message": status
    }
