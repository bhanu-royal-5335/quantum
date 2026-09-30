"""
Realistic Demonstration Channel Orchestration Engine
===================================================
Coordinates the full realistic demonstration pipeline:
CelesTrak TLE -> Skyfield Propagation -> Satellite Position -> Link Geometry ->
Weather Data -> Atmospheric Channel -> Relay Model -> BB84 QBER -> Estimated SKR
"""

import math
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List

from ..models.schemas import (
    ChannelParameters,
    GroundStationConfig,
    SatelliteInfo,
    SatellitePosition,
    LinkGeometry,
    WeatherData,
    PassTrajectoryPoint,
    RealisticSimulationResult,
    SimulationResult
)
from ..satellite.celestrak import fetch_satellite_tle
from ..satellite.skyfield_propagation import (
    propagate_satellite,
    compute_satellite_pass_trajectory,
    find_satellite_overpass_culmination
)
from ..satellite.geometry import calculate_hierarchical_link_geometry, calculate_atmospheric_airmass
from ..weather.weather_service import fetch_weather_data, calculate_weather_optical_loss
from .channel import run_full_quantum_simulation
from .atmosphere import calculate_dual_link_atmosphere
from .pointing_error import calculate_pointing_parameters
from .noise import calculate_detection_probabilities
from .bb84 import simulate_bb84_protocol
from .secret_key import calculate_secure_key_rate


def run_realistic_quantum_simulation(
    satellite_id: str = "micius",
    ground_station: GroundStationConfig = None,
    custom_params: ChannelParameters = None,
    use_live_weather: bool = True,
    use_live_tle: bool = True,
    custom_weather: WeatherData = None,
    use_pass_culmination: bool = True
) -> RealisticSimulationResult:
    """
    Executes the end-to-end realistic quantum communication simulation.
    """
    sim_id = str(uuid.uuid4())
    now_utc = datetime.now(timezone.utc)
    timestamp_str = now_utc.isoformat()

    if ground_station is None:
        ground_station = GroundStationConfig()

    # 1. CELESTRAK: Retrieve satellite TLE orbital data
    sat_dict = fetch_satellite_tle(satellite_id)
    sat_info = SatelliteInfo(**sat_dict)

    # 2. SKYFIELD: Propagate orbit to compute look angles and subpoint
    pos_dict = propagate_satellite(
        line1=sat_info.line1,
        line2=sat_info.line2,
        name=sat_info.name,
        ground_lat=ground_station.latitude,
        ground_lon=ground_station.longitude,
        ground_elevation_m=ground_station.elevation_m,
        observation_dt=now_utc,
        min_elevation_deg=ground_station.min_elevation_deg
    )
    # If the satellite is currently below horizon and culmination mode is enabled (default),
    # propagate at the operational overpass culmination peak so the simulation evaluates an active QKD window.
    if use_pass_culmination and not pos_dict.get("line_of_sight", False):
        pos_dict = find_satellite_overpass_culmination(
            line1=sat_info.line1,
            line2=sat_info.line2,
            name=sat_info.name,
            ground_lat=ground_station.latitude,
            ground_lon=ground_station.longitude,
            ground_elevation_m=ground_station.elevation_m,
            start_dt=now_utc,
            min_elevation_deg=ground_station.min_elevation_deg
        )
    sat_position = SatellitePosition(**pos_dict)

    # 3. BASELINE PARAMETERS: Merge with user parameters or sensible defaults
    if custom_params is not None:
        params = custom_params.model_copy()
    else:
        params = ChannelParameters()

    # Dynamic orbit altitude and position from Skyfield
    params.satellite_altitude = sat_position.altitude_km
    params.satellite_position = (
        f"{sat_info.name} (Alt: {sat_position.altitude_km:.1f} km, "
        f"Lat: {sat_position.latitude:.2f}°, Lon: {sat_position.longitude:.2f}°)"
    )

    # 4. LINK GEOMETRY: Calculate dual-hop slant ranges
    geom_dict = calculate_hierarchical_link_geometry(
        direct_range_km=sat_position.range_km,
        elevation_deg=sat_position.elevation_deg,
        azimuth_deg=sat_position.azimuth_deg,
        satellite_altitude_km=sat_position.altitude_km,
        has_relay=params.has_relay,
        relay_altitude_km=params.relay_altitude,
        min_elevation_deg=ground_station.min_elevation_deg
    )
    link_geometry = LinkGeometry(**geom_dict)

    # Feed geometric slant distances into simulation parameters
    params.link1_distance = link_geometry.link1_distance_km
    params.link2_distance = link_geometry.link2_distance_km
    params.total_link_distance = link_geometry.total_distance_km

    # 5. WEATHER DATA: Retrieve dataset custom weather, live API, or cached ground station weather
    if custom_weather is not None:
        weather_data = custom_weather
    elif use_live_weather:
        weather_dict = fetch_weather_data(lat=ground_station.latitude, lon=ground_station.longitude)
        weather_loss_dict = calculate_weather_optical_loss(weather_dict, wavelength_nm=params.wavelength)
        weather_dict.update(weather_loss_dict)
        weather_data = WeatherData(**weather_dict)
    else:
        from ..weather.weather_service import CACHED_DEMO_WEATHER
        weather_dict = dict(CACHED_DEMO_WEATHER)
        weather_loss_dict = calculate_weather_optical_loss(weather_dict, wavelength_nm=params.wavelength)
        weather_dict.update(weather_loss_dict)
        weather_data = WeatherData(**weather_dict)

    # Weather visibility directly updates optical model
    params.visibility = weather_data.visibility_km
    params.atmospheric_condition = weather_data.condition.lower()

    # 6. RUN PHYSICAL QUANTUM SIMULATION
    scenario_title = f"Realistic Pass: {sat_info.name} → {ground_station.name}"
    
    sim_result = run_full_quantum_simulation(
        params=params,
        scenario_id=f"real-{sat_info.id}",
        scenario_name=scenario_title
    )

    # Incorporate weather optical losses (cloud, rain, humidity)
    extra_weather_loss = weather_data.total_weather_loss_db
    # Atmospheric loss from run_full_quantum_simulation already integrates the slant propagation distance
    adjusted_channel_loss = (
        sim_result.geometric_loss_db +
        sim_result.atmospheric_loss_db +
        sim_result.pointing_loss_db +
        sim_result.relay_loss_db +
        extra_weather_loss
    )

    if not link_geometry.line_of_sight:
        # Optical link physically blocked by ground horizon
        sim_result.channel_loss_db = 120.0
        sim_result.qber = 0.50
        sim_result.secret_key_rate = 0.0
        sim_result.secure_key_length = 0
        sim_result.is_secure = False
        sim_result.security_status_message = (
            f"Link unavailable: Satellite elevation ({sat_position.elevation_deg:.1f}°) "
            f"is below the minimum ground telescope mask ({ground_station.min_elevation_deg:.1f}°)."
        )
    else:
        # Update simulation result with weather-adjusted loss and re-evaluate QBER and SKR
        sim_result.channel_loss_db = round(adjusted_channel_loss, 2)
        total_trans = 10.0 ** (-adjusted_channel_loss / 10.0)
        sim_result.total_transmittance = total_trans

        # Recompute detection probabilities under adjusted transmittance
        det_probs = calculate_detection_probabilities(
            total_channel_transmittance=total_trans,
            mean_photon_number=params.mean_photon_number,
            detector_efficiency=params.detector_efficiency,
            dark_count_rate=params.dark_count_rate,
            background_noise=params.background_noise,
            optical_error_rate=params.optical_error_rate
        )

        # Run discrete BB84 protocol simulation under realistic channel loss
        bb84_res = simulate_bb84_protocol(
            num_bits=params.num_bits,
            p_click=det_probs["p_click"],
            p_signal=det_probs["p_signal"],
            p_noise=det_probs["p_noise"],
            optical_error_rate=params.optical_error_rate,
            channel_loss_db=adjusted_channel_loss,
            mean_photon_number=params.mean_photon_number,
            detector_efficiency=params.detector_efficiency,
            dark_count_rate=params.dark_count_rate,
            background_noise=params.background_noise,
            sample_trace_count=35
        )
        s_len = bb84_res["sifted_key_length"]
        if s_len >= 30:
            sim_q = bb84_res["simulated_qber"]
        elif s_len > 0:
            # Bayesian shrinkage against small-sample noise fluctuation
            sim_q = (s_len * bb84_res["simulated_qber"] + 30 * det_probs["qber"]) / (s_len + 30)
        else:
            sim_q = det_probs["qber"]

        sim_result.qber = round(sim_q, 5)
        sim_result.sifted_key_length = bb84_res["sifted_key_length"]
        sim_result.total_detected_photons = bb84_res["total_detected"]
        sim_result.error_bits = bb84_res["error_bits"]
        sim_result.detection_rate = round(bb84_res["detection_rate"] * 100.0, 2)
        sim_result.bit_samples = bb84_res["bit_samples"]
        
        # Secret-key rate under realistic weather & geometry
        skr_res = calculate_secure_key_rate(
            qber=sim_result.qber,
            sifted_key_length=sim_result.sifted_key_length,
            repetition_rate_hz=params.repetition_rate,
            p_click=det_probs["p_click"],
            fec_efficiency=params.fec_efficiency
        )
        sim_result.secret_key_rate = round(skr_res["secret_key_rate_bps"], 2)
        sim_result.secure_key_length = skr_res["discrete_secure_bits"]
        sim_result.is_secure = skr_res["is_secure"]
        sim_result.security_status_message = skr_res["security_status_message"]

    # 7. SATELLITE PASS TRAJECTORY & REALISTIC TIME SERIES CHARTS
    try:
        traj_center = datetime.fromisoformat(sat_position.timestamp)
    except Exception:
        traj_center = now_utc

    raw_pass = compute_satellite_pass_trajectory(
        line1=sat_info.line1,
        line2=sat_info.line2,
        name=sat_info.name,
        ground_lat=ground_station.latitude,
        ground_lon=ground_station.longitude,
        ground_elevation_m=ground_station.elevation_m,
        min_elevation_deg=ground_station.min_elevation_deg,
        duration_minutes=16,
        num_points=25,
        center_dt=traj_center
    )

    pass_trajectory: List[PassTrajectoryPoint] = []
    loss_vs_elevation_curve: List[Dict[str, float]] = []

    for pt in raw_pass:
        el = pt["elevation_deg"]
        rng = pt["range_km"]
        los = pt["line_of_sight"]
        
        if not los:
            pt_loss = 120.0
            pt_qber = 50.0
            pt_skr = 0.0
        else:
            pt_airmass = calculate_atmospheric_airmass(el)
            A0, w_eq, sigma_r, mean_pe = calculate_pointing_parameters(
                rx_aperture_m=params.receiver_aperture,
                beam_waist_radius_m=max(0.5, rng * (params.beam_divergence * 1e-6) / 2.0),
                distance_km=rng,
                jitter_urad=params.pointing_error
            )
            pt_loss = round(20.0 + 8.0 * (pt_airmass - 1.0) + extra_weather_loss + (rng / 500.0) * 3.0, 2)
            pt_t = 10.0 ** (-pt_loss / 10.0)
            pt_det = calculate_detection_probabilities(
                total_channel_transmittance=pt_t,
                mean_photon_number=params.mean_photon_number,
                detector_efficiency=params.detector_efficiency,
                dark_count_rate=params.dark_count_rate,
                background_noise=params.background_noise,
                optical_error_rate=params.optical_error_rate
            )
            pt_qber = round(pt_det["qber"] * 100.0, 2)
            pt_skr_obj = calculate_secure_key_rate(
                qber=pt_det["qber"],
                sifted_key_length=int(10000 * 0.5 * pt_det["p_click"]),
                repetition_rate_hz=params.repetition_rate,
                p_click=pt_det["p_click"],
                fec_efficiency=params.fec_efficiency
            )
            pt_skr = round(pt_skr_obj["secret_key_rate_bps"], 1)

        pass_trajectory.append(
            PassTrajectoryPoint(
                step_index=pt["step_index"],
                time_offset_min=pt["time_offset_min"],
                timestamp=pt["timestamp"],
                elevation_deg=el,
                azimuth_deg=pt["azimuth_deg"],
                range_km=rng,
                channel_loss_db=pt_loss,
                qber_percent=pt_qber,
                secret_key_rate=pt_skr,
                line_of_sight=los
            )
        )

        if los and el > 0:
            loss_vs_elevation_curve.append({
                "elevation_deg": el,
                "channel_loss_db": pt_loss,
                "airmass": round(calculate_atmospheric_airmass(el), 2)
            })

    # Sort loss vs elevation curve ascending
    loss_vs_elevation_curve.sort(key=lambda x: x["elevation_deg"])

    return RealisticSimulationResult(
        id=sim_id,
        timestamp=timestamp_str,
        satellite=sat_info,
        position=sat_position,
        geometry=link_geometry,
        weather=weather_data,
        ground_station=ground_station,
        simulation_result=sim_result,
        pass_trajectory=pass_trajectory,
        loss_vs_elevation_curve=loss_vs_elevation_curve,
        is_realistic_mode=True
    )
