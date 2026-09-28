"""
Secret Key Rate and Information Reconciliation Module
======================================================
Computes asymptotic secure key rate using the GLLP / Shor-Preskill formula:
    R_secure = R_sifted * max(0, 1 - f_EC * H_2(QBER) - H_2(QBER))

Security Condition:
    QBER < 11.0% (BB84 unconditional security threshold)
"""

import math
from typing import Dict, Any


def binary_entropy(p: float) -> float:
    """
    Computes Shannon binary entropy H_2(p).
    """
    if p <= 0.0 or p >= 1.0:
        return 0.0
    p = min(0.999999, max(1e-12, p))
    return - (p * math.log2(p) + (1.0 - p) * math.log2(1.0 - p))


def calculate_secure_key_rate(
    qber: float,
    sifted_key_length: int,
    repetition_rate_hz: float = 1e7,
    p_click: float = 0.05,
    fec_efficiency: float = 1.16
) -> Dict[str, Any]:
    """
    Calculates secure key rate and distilled secret key length.

    Parameters:
        qber: Quantum bit error rate (0.0 to 1.0).
        sifted_key_length: Number of sifted bits.
        repetition_rate_hz: Source laser repetition rate in Hz.
        p_click: Detector click probability per pulse.
        fec_efficiency: Error correction code inefficiency factor (f_EC, typically 1.10 - 1.20).

    Returns:
        dict with secret_key_rate_bps, discrete_secure_bits, is_secure, and security_status.
    """
    # BB84 theoretical security limit is 11.0%
    if qber >= 0.11 or sifted_key_length == 0:
        return {
            "secret_key_rate_bps": 0.0,
            "discrete_secure_bits": 0,
            "is_secure": False,
            "secure_fraction": 0.0,
            "security_status_message": (
                f"Insecure: QBER ({qber*100.0:.2f}%) exceeds the 11.0% BB84 threshold. "
                f"Information leaked to eavesdropper prevents secret key distillation."
            )
        }

    h2 = binary_entropy(qber)
    leak_ec = fec_efficiency * h2
    leak_pa = h2  # Privacy amplification bound against coherent attacks

    fraction = 1.0 - leak_ec - leak_pa

    if fraction <= 0.0:
        return {
            "secret_key_rate_bps": 0.0,
            "discrete_secure_bits": 0,
            "is_secure": False,
            "secure_fraction": 0.0,
            "security_status_message": "Information reconciliation leakage exceeds key entropy."
        }

    # Asymptotic key rate: R_sifted = 0.5 * f_rep * p_click
    r_sifted = 0.5 * repetition_rate_hz * p_click
    r_sec = r_sifted * fraction
    discrete_bits = int(max(0, math.floor(sifted_key_length * fraction)))

    return {
        "secret_key_rate_bps": round(r_sec, 2),
        "discrete_secure_bits": discrete_bits,
        "is_secure": True,
        "secure_fraction": round(fraction, 4),
        "security_status_message": (
            f"Secure: QBER ({qber*100.0:.2f}%) allows successful key extraction "
            f"with {discrete_bits:,} secret bits distilled."
        )
    }
