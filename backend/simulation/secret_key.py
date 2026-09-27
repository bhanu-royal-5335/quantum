"""
Secret Key Rate and Information Security Theory Models
======================================================
Implements:
1. Binary Shannon Entropy Function H2(x)
2. Information Reconciliation Leakage (f_EC * H2(QBER))
3. Privacy Amplification Compression Bounds (H2(QBER))
4. Asymptotic Secret-Key Generation Rate Estimation (GLLP / BB84 bounds)
5. Security Threshold Verification (11% Asymptotic Quantum Bound)
"""

import math
from typing import Dict, Any, Tuple


def binary_entropy(p: float) -> float:
    """
    Computes binary Shannon entropy H2(p):
      H2(p) = -p * log2(p) - (1-p) * log2(1-p)
    Domain: p in [0, 0.5].
    """
    if p <= 0.0:
        return 0.0
    if p >= 0.5:
        return 1.0
    return - (p * math.log2(p) + (1.0 - p) * math.log2(1.0 - p))


def calculate_secure_key_rate(
    qber: float,
    sifted_key_length: int,
    repetition_rate_hz: float,
    p_click: float,
    fec_efficiency: float = 1.16
) -> Dict[str, Any]:
    """
    Estimates secure-key generation rate and discrete secure key length.
    Formula:
      R_secure = R_sifted * max(0, 1 - f_EC * H2(QBER) - H2(QBER))
      where R_sifted = 0.5 * R_rep * P_click
    """
    # Sifted key generation rate (pulses per second * click prob * 0.5 matching bases)
    r_sifted_bps = 0.5 * repetition_rate_hz * p_click
    
    h2 = binary_entropy(qber)
    leakage_ec = fec_efficiency * h2
    compression_pa = h2
    fraction_secure = 1.0 - leakage_ec - compression_pa
    
    is_secure = (fraction_secure > 0.0) and (qber < 0.11)
    
    if is_secure:
        secret_key_rate_bps = r_sifted_bps * fraction_secure
        discrete_secure_bits = int(sifted_key_length * fraction_secure)
        status_msg = (
            f"Quantum secure key established. QBER ({qber*100:.2f}%) is within "
            f"the asymptotic security threshold (< 11.0%)."
        )
    else:
        secret_key_rate_bps = 0.0
        discrete_secure_bits = 0
        status_msg = (
            f"No secure key generated. QBER ({qber*100:.2f}%) exceeds the "
            f"information-theoretic threshold (approx 9.8-11.0% under f_EC={fec_efficiency})."
        )
        
    return {
        "is_secure": is_secure,
        "qber": qber,
        "h2_entropy": round(h2, 4),
        "fraction_secure": max(0.0, fraction_secure),
        "r_sifted_bps": round(r_sifted_bps, 2),
        "secret_key_rate_bps": round(secret_key_rate_bps, 2),
        "discrete_secure_bits": discrete_secure_bits,
        "security_status_message": status_msg
    }
