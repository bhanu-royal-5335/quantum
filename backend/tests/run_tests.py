"""
Direct Test Runner
"""
import sys
import traceback

from backend.tests.test_simulation import (
    test_kim_q_factor,
    test_atmospheric_attenuation,
    test_geometric_coupling,
    test_dual_link_atmosphere,
    test_turbulence_model,
    test_pointing_error_model,
    test_bb84_simulation,
    test_binary_entropy_and_secret_key,
    test_monte_carlo,
    test_full_channel_simulation_and_reports,
    test_quantum_state_vectors_and_born_rule,
    test_quantum_noiseless_channel,
    test_quantum_known_error_rate,
    test_quantum_high_loss_and_noise_dominance,
    test_quantum_api_simulation_and_comparison,
    test_nasa_dataset_realistic_simulation
)

tests = [
    test_kim_q_factor,
    test_atmospheric_attenuation,
    test_geometric_coupling,
    test_dual_link_atmosphere,
    test_turbulence_model,
    test_pointing_error_model,
    test_bb84_simulation,
    test_binary_entropy_and_secret_key,
    test_monte_carlo,
    test_full_channel_simulation_and_reports,
    test_quantum_state_vectors_and_born_rule,
    test_quantum_noiseless_channel,
    test_quantum_known_error_rate,
    test_quantum_high_loss_and_noise_dominance,
    test_quantum_api_simulation_and_comparison,
    test_nasa_dataset_realistic_simulation
]

passed = 0
failed = 0

print("=" * 60)
print("RUNNING QUANTUM SIMULATION TEST SUITE")
print("=" * 60)

for t in tests:
    test_name = t.__name__
    try:
        t()
        print(f"  [PASS] {test_name}")
        passed += 1
    except Exception as e:
        print(f"  [FAIL] {test_name}: {e}")
        traceback.print_exc()
        failed += 1

print("=" * 60)
print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
print("=" * 60)

if failed > 0:
    sys.exit(1)
else:
    sys.exit(0)
