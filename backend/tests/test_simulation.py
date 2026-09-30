"""
Comprehensive Test Suite for Quantum Communication Simulation Engine
====================================================================
Tests:
1. BB84 protocol logic, basis sifting, bit error identification
2. Kim/Kruse atmospheric attenuation calculation
3. Altitude-dependent turbulence profile and Rytov variance
4. Pointing error and equivalent beam coupling
5. Detector noise and click probability
6. Asymptotic secret key rate & security threshold check
7. Vectorized Monte Carlo statistical engine
8. End-to-end channel simulation
9. PDF and CSV report generation
"""

import math
import numpy as np

from backend.models.schemas import ChannelParameters
from backend.simulation.atmosphere import (
    calculate_kim_q_factor,
    calculate_sea_level_attenuation_coeff,
    calculate_integrated_atmospheric_transmittance,
    calculate_geometric_coupling,
    calculate_dual_link_atmosphere
)
from backend.simulation.turbulence import (
    evaluate_cn2_altitude_profile,
    calculate_downlink_rytov_variance,
    calculate_scintillation_index,
    sample_turbulence_fading
)
from backend.simulation.pointing_error import (
    calculate_pointing_parameters,
    sample_pointing_coupling
)
from backend.simulation.noise import calculate_detection_probabilities
from backend.simulation.bb84 import simulate_bb84_protocol
from backend.simulation.secret_key import binary_entropy, calculate_secure_key_rate
from backend.simulation.monte_carlo import run_monte_carlo_simulation
from backend.simulation.channel import run_full_quantum_simulation
from backend.reports.generator import generate_pdf_report, generate_csv_report


def test_kim_q_factor():
    assert calculate_kim_q_factor(60.0) == 1.6
    assert calculate_kim_q_factor(25.0) == 1.3
    assert math.isclose(calculate_kim_q_factor(4.0), 0.16 * 4.0 + 0.34, rel_tol=1e-4)
    assert math.isclose(calculate_kim_q_factor(0.8), 0.8 - 0.5, rel_tol=1e-4)
    assert calculate_kim_q_factor(0.2) == 0.0


def test_atmospheric_attenuation():
    alpha = calculate_sea_level_attenuation_coeff(1550.0, 20.0)
    assert alpha > 0.0
    # Clear visibility (20 km) at 1550nm should have low attenuation (~0.1 - 0.5 dB/km)
    assert 0.05 < alpha < 1.0

    t_atm, loss_db = calculate_integrated_atmospheric_transmittance(
        h_start_km=20.0,
        h_end_km=0.0,
        slant_distance_km=20.0,
        wavelength_nm=1550.0,
        visibility_km=20.0
    )
    assert 0.0 < t_atm <= 1.0
    assert loss_db >= 0.0


def test_geometric_coupling():
    t_geo, loss_db, w_z = calculate_geometric_coupling(
        tx_aperture_m=0.25,
        rx_aperture_m=0.60,
        beam_divergence_urad=10.0,
        distance_km=500.0,
        wavelength_nm=1550.0
    )
    assert 0.0 < t_geo <= 1.0
    assert loss_db > 0.0
    assert w_z > 0.5  # beam expands over 500 km


def test_dual_link_atmosphere():
    res_relay = calculate_dual_link_atmosphere(
        satellite_altitude_km=500.0,
        has_relay=True,
        relay_altitude_km=20.0,
        relay_efficiency=0.85,
        relay_aperture_m=0.35,
        tx_aperture_m=0.25,
        rx_aperture_m=0.60,
        beam_divergence_urad=10.0,
        wavelength_nm=1550.0,
        visibility_km=20.0
    )
    assert res_relay["has_relay"] is True
    assert res_relay["total_loss_db"] > 0.0
    assert res_relay["total_transmittance"] > 0.0

    res_direct = calculate_dual_link_atmosphere(
        satellite_altitude_km=500.0,
        has_relay=False,
        relay_altitude_km=0.0,
        relay_efficiency=1.0,
        relay_aperture_m=0.0,
        tx_aperture_m=0.25,
        rx_aperture_m=0.60,
        beam_divergence_urad=10.0,
        wavelength_nm=1550.0,
        visibility_km=20.0
    )
    assert res_direct["has_relay"] is False
    assert res_direct["total_loss_db"] > 0.0


def test_turbulence_model():
    rytov, cn2 = calculate_downlink_rytov_variance(
        h_source_km=20.0,
        h_receiver_km=0.0,
        wavelength_nm=1550.0,
        cn2_ground=1e-14
    )
    assert rytov > 0.0
    scint = calculate_scintillation_index(
        rytov_var=rytov,
        rx_aperture_m=0.60,
        distance_km=20.0,
        wavelength_nm=1550.0
    )
    assert scint > 0.0

    fading_samples = sample_turbulence_fading(scint, 500)
    assert len(fading_samples) == 500
    assert np.all(fading_samples > 0.0)


def test_pointing_error_model():
    A0, w_eq, sigma_r, mean_t = calculate_pointing_parameters(
        rx_aperture_m=0.60,
        beam_waist_radius_m=2.5,
        distance_km=25.0,
        jitter_urad=3.0
    )
    assert 0.0 < A0 <= 1.0
    assert w_eq > 0.0
    assert 0.0 < mean_t <= 1.0

    samples = sample_pointing_coupling(A0, w_eq, sigma_r, 100)
    assert len(samples) == 100
    assert np.all(samples >= 0.0) and np.all(samples <= 1.0)


def test_bb84_simulation():
    res = simulate_bb84_protocol(
        num_bits=5000,
        p_click=0.1,
        p_signal=0.09,
        p_noise=0.01,
        optical_error_rate=0.015,
        sample_trace_count=20
    )
    assert res["num_bits"] == 5000
    assert res["total_detected"] > 0
    assert res["sifted_key_length"] > 0
    # QBER should be low (~1.5% - 5%) given high SNR
    assert 0.0 <= res["simulated_qber"] < 0.15
    assert len(res["bit_samples"]) == 20


def test_binary_entropy_and_secret_key():
    assert binary_entropy(0.0) == 0.0
    assert binary_entropy(0.5) == 1.0
    assert 0.0 < binary_entropy(0.02) < 0.2

    # Under low QBER (2%), key rate must be strictly positive
    skr_good = calculate_secure_key_rate(
        qber=0.02,
        sifted_key_length=1000,
        repetition_rate_hz=1e7,
        p_click=0.05,
        fec_efficiency=1.16
    )
    assert skr_good["is_secure"] is True
    assert skr_good["secret_key_rate_bps"] > 0.0
    assert skr_good["discrete_secure_bits"] > 0

    # Under high QBER (>11%), key rate must strictly fall to 0
    skr_bad = calculate_secure_key_rate(
        qber=0.14,
        sifted_key_length=1000,
        repetition_rate_hz=1e7,
        p_click=0.05,
        fec_efficiency=1.16
    )
    assert skr_bad["is_secure"] is False
    assert skr_bad["secret_key_rate_bps"] == 0.0
    assert skr_bad["discrete_secure_bits"] == 0


def test_monte_carlo():
    mc = run_monte_carlo_simulation(
        iterations=200,
        base_channel_transmittance=1e-3,
        scintillation_index=0.05,
        rx_aperture_m=0.60,
        beam_waist_radius_m=2.5,
        distance_km=25.0,
        jitter_urad=2.5,
        mean_photon_number=0.6,
        repetition_rate_hz=1e7,
        detector_efficiency=0.8,
        dark_count_rate=1e-6,
        background_noise=1e-6,
        optical_error_rate=0.015,
        fec_efficiency=1.16
    )
    assert mc["iterations"] == 200
    assert mc["mean_qber"] > 0.0
    assert mc["ci_95_lower"] <= mc["mean_qber"] <= mc["ci_95_upper"]
    assert len(mc["histogram_qber"]) > 5


def test_full_channel_simulation_and_reports():
    params = ChannelParameters(
        satellite_altitude=500.0,
        has_relay=True,
        relay_altitude=20.0,
        num_bits=2000,
        monte_carlo_iterations=100
    )
    sim = run_full_quantum_simulation(params=params, scenario_name="Test Scenario")
    assert sim.qber >= 0.0
    assert sim.channel_loss_db > 0.0
    assert len(sim.loss_vs_distance_curve) > 0
    assert len(sim.qber_vs_turbulence_curve) > 0
    assert len(sim.qber_vs_pointing_curve) > 0
    assert len(sim.key_rate_vs_conditions_curve) > 0

    # Test PDF generation
    pdf_bytes = generate_pdf_report(sim)
    assert len(pdf_bytes) > 1000  # PDF generated with content
    assert pdf_bytes.startswith(b"%PDF")

    # Test CSV generation
    csv_str = generate_csv_report(sim)
    assert "HIERARCHICAL QUANTUM COMMUNICATION SIMULATION REPORT" in csv_str
    assert "MONTE CARLO STATISTICAL ANALYSIS" in csv_str


def test_quantum_state_vectors_and_born_rule():
    from backend.simulation.quantum_channel import prepare_state_vector
    from backend.simulation.quantum_measurement import measure_single_qubit
    
    s0 = prepare_state_vector(0, 0)
    s1 = prepare_state_vector(0, 1)
    sp = prepare_state_vector(1, 0)
    sm = prepare_state_vector(1, 1)
    
    assert math.isclose(np.linalg.norm(s0), 1.0)
    assert math.isclose(np.linalg.norm(s1), 1.0)
    assert math.isclose(np.linalg.norm(sp), 1.0)
    assert math.isclose(np.linalg.norm(sm), 1.0)
    
    assert math.isclose(np.dot(s0, s1), 0.0)
    assert math.isclose(np.dot(sp, sm), 0.0)
    
    for _ in range(20):
        assert measure_single_qubit(s0, bob_basis=0, is_signal=True) == 0
        assert measure_single_qubit(s1, bob_basis=0, is_signal=True) == 1


def test_quantum_noiseless_channel():
    res = simulate_bb84_protocol(
        num_bits=5000,
        channel_loss_db=2.0,
        optical_error_rate=0.0,
        dark_count_rate=1e-12,
        background_noise=1e-12
    )
    assert res["sifted_key_length"] > 0
    assert res["error_bits"] == 0
    assert res["simulated_qber"] == 0.0


def test_quantum_known_error_rate():
    res = simulate_bb84_protocol(
        num_bits=20000,
        channel_loss_db=5.0,
        optical_error_rate=0.05,
        dark_count_rate=1e-12,
        background_noise=1e-12
    )
    assert res["sifted_key_length"] > 1000
    assert 0.035 <= res["simulated_qber"] <= 0.065


def test_quantum_high_loss_and_noise_dominance():
    res = simulate_bb84_protocol(
        num_bits=10000,
        channel_loss_db=55.0,
        optical_error_rate=0.015,
        dark_count_rate=1e-3,
        background_noise=1e-3
    )
    if res["sifted_key_length"] > 0:
        assert res["simulated_qber"] > 0.20
    else:
        assert res["simulated_qber"] == 0.50


def test_quantum_api_simulation_and_comparison():
    from backend.models.schemas import QuantumSimulationRequest
    from backend.api.simulation import run_quantum_bb84_simulation
    
    req = QuantumSimulationRequest(
        num_bits=5000,
        channel_loss_db=18.0,
        mean_photon_number=0.6,
        detector_efficiency=0.8,
        optical_error_rate=0.02,
        reference_qber=0.025
    )
    resp = run_quantum_bb84_simulation(req)
    assert resp.num_bits == 5000
    assert resp.photons_detected > 0
    assert resp.sifted_key_length > 0
    assert resp.simulated_qber >= 0.0
    assert resp.qber_comparison is not None
    assert resp.qber_comparison.reference_qber == 0.025
    assert len(resp.bit_samples) > 0
    assert len(resp.qber_vs_loss_curve) > 0


def test_nasa_dataset_realistic_simulation():
    from backend.api.dataset import simulate_from_dataset_record, DatasetSimulateRequest
    
    # Test realistic pass on clear NASA dataset record (Record 1000)
    req = DatasetSimulateRequest(record_id=1000, satellite_norad_id=41740)
    res = simulate_from_dataset_record(req)
    assert res.simulation_result.channel_loss_db < 40.0
    assert res.simulation_result.qber < 0.11, f"Expected QBER < 11%, got {res.simulation_result.qber*100}%"
    assert res.simulation_result.is_secure is True
    assert res.simulation_result.secret_key_rate > 0.0
    assert res.geometry.line_of_sight is True
    assert res.position.elevation_deg >= 10.0
