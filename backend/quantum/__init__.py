"""
Quantum Simulation Laboratory Package
"""

from .bb84 import run_bb84_simulation
from .eve import apply_intercept_resend_attack
from .channel import calculate_fso_link_budget, transmit_through_quantum_channel, SATELLITE_CATALOG, TURBULENCE_PRESETS
from .measurement import measure_qubits_batch
from .sifting import perform_basis_sifting
from .qber import calculate_qber
from .secret_key import calculate_secure_key_rate, binary_entropy
from .experiments import (
    sweep_qber_vs_eavesdropping,
    sweep_qber_vs_distance,
    sweep_qber_vs_simulation_size,
    sweep_skr_vs_qber,
    generate_experiment_charts
)

__all__ = [
    "run_bb84_simulation",
    "apply_intercept_resend_attack",
    "calculate_fso_link_budget",
    "transmit_through_quantum_channel",
    "SATELLITE_CATALOG",
    "TURBULENCE_PRESETS",
    "measure_qubits_batch",
    "perform_basis_sifting",
    "calculate_qber",
    "calculate_secure_key_rate",
    "binary_entropy",
    "sweep_qber_vs_eavesdropping",
    "sweep_qber_vs_distance",
    "sweep_qber_vs_simulation_size",
    "sweep_skr_vs_qber",
    "generate_experiment_charts"
]
