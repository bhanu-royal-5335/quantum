"""
Pydantic Schemas for Quantum Communication Simulation & Verification
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ChannelParameters(BaseModel):
    # Satellite node
    satellite_altitude: float = Field(500.0, ge=100.0, le=2000.0, description="Satellite altitude in km")
    satellite_position: str = Field("LEO Orbit (500 km, 97.4° inclination)", description="Satellite orbital position description")
    wavelength: float = Field(1550.0, ge=500.0, le=2000.0, description="Laser wavelength in nm")
    transmitter_aperture: float = Field(0.25, ge=0.05, le=2.0, description="Transmitter optical aperture diameter in meters")
    beam_divergence: float = Field(10.0, ge=1.0, le=100.0, description="Full beam divergence angle in microradians (μrad)")
    mean_photon_number: float = Field(0.6, ge=0.05, le=2.0, description="Mean photon number per pulse (μ)")
    repetition_rate: float = Field(10_000_000.0, ge=100_000.0, le=1_000_000_000.0, description="Laser repetition rate in Hz")

    # Relay / HAP node
    has_relay: bool = Field(True, description="Whether Relay/HAP node is active or direct LEO->Ground")
    relay_altitude: float = Field(20.0, ge=0.0, le=100.0, description="HAP altitude in km (stratosphere)")
    relay_efficiency: float = Field(0.85, ge=0.0, le=1.0, description="Relay internal optical throughput efficiency (0-1)")
    relay_aperture: float = Field(0.35, ge=0.0, le=2.0, description="Relay optical aperture diameter in meters")
    
    # Ground Receiver (Bob)
    receiver_aperture: float = Field(0.60, ge=0.1, le=3.0, description="Ground receiver telescope aperture in meters")
    detector_efficiency: float = Field(0.80, ge=0.05, le=1.0, description="Single-photon detector quantum efficiency (0-1)")
    dark_count_rate: float = Field(1e-6, ge=1e-8, le=1e-2, description="Detector dark count probability per gate")
    background_noise: float = Field(1e-6, ge=1e-8, le=1e-2, description="Ambient optical background noise probability per gate")
    optical_error_rate: float = Field(0.015, ge=0.001, le=0.15, description="Intrinsic optical misalignment error rate (e_opt)")
    fec_efficiency: float = Field(1.16, ge=1.0, le=2.0, description="Error correction inefficiency factor (f_EC)")

    # Atmospheric & Environmental Conditions
    visibility: float = Field(20.0, ge=0.5, le=50.0, description="Atmospheric visibility in km")
    atmospheric_condition: str = Field("clear", description="clear | haze | moderate_fog | dense_fog | custom")
    turbulence_level: str = Field("moderate", description="low | moderate | strong | custom")
    cn2_ground: float = Field(1e-14, ge=1e-17, le=1e-12, description="Refractive index structure parameter Cn2 at ground (m^-2/3)")
    pointing_level: str = Field("low", description="low | moderate | high | custom")
    pointing_error: float = Field(3.0, ge=0.1, le=50.0, description="Transmitter pointing jitter 1-sigma in microradians (μrad)")
    
    # Geometry / Path Distances
    link1_distance: Optional[float] = Field(None, description="Space-to-relay distance in km (auto-computed if None)")
    link2_distance: Optional[float] = Field(None, description="Relay-to-ground distance in km (auto-computed if None)")
    total_link_distance: Optional[float] = Field(None, description="Total link distance in km")

    # Simulation settings
    num_bits: int = Field(10000, ge=1000, le=100000, description="Number of transmitted raw quantum bits")
    monte_carlo_iterations: int = Field(1000, ge=50, le=10000, description="Monte Carlo sample iterations")


class ScenarioCreate(BaseModel):
    name: str = Field(..., description="Scenario identifier name")
    description: Optional[str] = Field("", description="Detailed scenario description")
    parameters: ChannelParameters


class ScenarioResponse(BaseModel):
    id: str
    name: str
    description: str
    parameters: ChannelParameters
    created_at: str
    is_default: bool = False


class BitTrace(BaseModel):
    index: int
    alice_bit: int
    alice_basis: str  # 'Z' or 'X'
    bob_basis: str    # 'Z' or 'X'
    bob_bit: Optional[int]
    detected: bool
    basis_matched: bool
    is_error: bool


class MonteCarloStats(BaseModel):
    iterations: int
    mean_qber: float
    std_qber: float
    ci_95_lower: float
    ci_95_upper: float
    min_qber: float
    max_qber: float
    mean_secret_key_rate: float
    std_secret_key_rate: float
    min_secret_key_rate: float
    max_secret_key_rate: float
    mean_channel_loss_db: float
    std_channel_loss_db: float
    histogram_qber: List[Dict[str, Any]]
    confidence_interval_percent: float = 95.0


class SimulationResult(BaseModel):
    id: str
    scenario_id: Optional[str] = None
    scenario_name: str
    timestamp: str
    parameters: ChannelParameters
    
    # Key Performance Indicators
    qber: float
    channel_loss_db: float
    secret_key_rate: float
    detection_rate: float
    sifted_key_length: int
    total_detected_photons: int
    error_bits: int
    secure_key_length: int
    is_secure: bool
    security_status_message: str

    # Link Budget Breakdown
    link1_loss_db: float
    link2_loss_db: float
    geometric_loss_db: float
    atmospheric_loss_db: float
    pointing_loss_db: float
    relay_loss_db: float
    detector_loss_db: float
    total_transmittance: float

    # Atmospheric & Turbulence Metrics
    effective_cn2: float
    rytov_variance: float
    scintillation_index: float
    pointing_jitter_urad: float
    beam_waist_receiver_m: float

    # Monte Carlo Statistical Analysis
    monte_carlo: MonteCarloStats

    # BB84 Quantum Bit Sequence Sample (first 25-50 bits)
    bit_samples: List[BitTrace]

    # Precomputed Curves for Graphs
    loss_vs_distance_curve: List[Dict[str, float]]
    qber_vs_turbulence_curve: List[Dict[str, Any]]
    qber_vs_pointing_curve: List[Dict[str, float]]
    key_rate_vs_conditions_curve: List[Dict[str, Any]]
    qber_vs_loss_curve: List[Dict[str, Any]] = Field(default_factory=list)

    # Quantum simulation & validation comparison
    reference_qber: Optional[float] = None
    qber_difference: Optional[float] = None
    quantum_simulation_stats: Optional[Dict[str, Any]] = None


class QberComparison(BaseModel):
    simulated_qber: float
    reference_qber: float
    absolute_difference: float
    relative_difference_percent: float
    is_within_tolerance: bool
    status: str


class QuantumSimulationRequest(BaseModel):
    num_bits: int = Field(10000, ge=1000, le=100000, description="Total raw quantum bits prepared by Alice")
    channel_loss_db: float = Field(20.0, ge=0.0, le=80.0, description="Total link channel attenuation in dB")
    mean_photon_number: float = Field(0.6, ge=0.05, le=2.0, description="Mean photon number per pulse (mu)")
    detector_efficiency: float = Field(0.80, ge=0.05, le=1.0, description="Single-photon detector quantum efficiency (eta_det)")
    dark_count_rate: float = Field(1e-6, ge=1e-8, le=1e-2, description="Detector dark count probability per gate")
    background_noise: float = Field(1e-6, ge=1e-8, le=1e-2, description="Ambient optical background noise probability")
    optical_error_rate: float = Field(0.015, ge=0.001, le=0.15, description="Optical misalignment error rate (e_opt)")
    repetition_rate: float = Field(10_000_000.0, ge=100_000.0, le=1_000_000_000.0, description="Laser repetition rate in Hz")
    fec_efficiency: float = Field(1.16, ge=1.0, le=2.0, description="Error correction inefficiency factor (f_EC)")
    scintillation_index: Optional[float] = Field(0.05, ge=0.0, le=2.0, description="Atmospheric scintillation index")
    pointing_jitter_urad: Optional[float] = Field(3.0, ge=0.0, le=30.0, description="Pointing jitter in microradians")
    sample_trace_count: int = Field(35, ge=10, le=100, description="Number of bit traces returned for visualization")
    reference_qber: Optional[float] = Field(None, description="Optional dataset or reference QBER to validate against")


class QuantumSimulationResponse(BaseModel):
    id: str
    timestamp: str
    num_bits: int
    photons_transmitted: int
    photons_detected: int
    detection_rate: float
    raw_key_length: int
    basis_matched_count: int
    sifted_key_length: int
    sifting_ratio: float
    error_bits: int
    simulated_qber: float
    analytical_qber: float
    qber_std_error: float
    reference_qber: Optional[float] = None
    qber_difference: Optional[float] = None
    secret_key_rate: float
    secure_key_length: int
    is_secure: bool
    security_status_message: str
    channel_loss_db: float
    snr_db: float
    bit_samples: List[BitTrace]
    qber_vs_loss_curve: List[Dict[str, Any]] = Field(default_factory=list)
    qber_comparison: Optional[QberComparison] = None


class ScenarioComparisonResponse(BaseModel):
    scenarios: List[SimulationResult]
    comparison_table: List[Dict[str, Any]]


class ReportRequest(BaseModel):
    simulation_id: str
    include_raw_parameters: bool = True
    include_monte_carlo: bool = True
    include_charts: bool = True


# =====================================================================
# REALISTIC DEMONSTRATION SCHEMAS (CelesTrak + Skyfield + Weather Data)
# =====================================================================

class GroundStationConfig(BaseModel):
    name: str = Field("Optical Ground Station (Bob)", description="Name of ground station")
    latitude: float = Field(28.6139, ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(77.2090, ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    elevation_m: float = Field(216.0, ge=0.0, le=8848.0, description="Altitude above sea level in meters")
    min_elevation_deg: float = Field(10.0, ge=0.0, le=80.0, description="Minimum line-of-sight elevation mask angle")


class SatelliteInfo(BaseModel):
    id: str
    name: str
    norad_id: int
    line1: str
    line2: str
    epoch: str
    source: str
    is_live: bool
    description: str
    altitude_km: float


class SatellitePosition(BaseModel):
    timestamp: str
    satellite_name: str
    latitude: float
    longitude: float
    altitude_km: float
    azimuth_deg: float
    elevation_deg: float
    range_km: float
    line_of_sight: bool
    min_elevation_deg: float
    status_message: str


class LinkGeometry(BaseModel):
    has_relay: bool
    elevation_deg: float
    azimuth_deg: float
    airmass_factor: float
    direct_range_km: float
    link1_distance_km: float
    link2_distance_km: float
    total_distance_km: float
    relay_altitude_km: float
    line_of_sight: bool
    min_elevation_deg: float
    link_status: str


class WeatherData(BaseModel):
    visibility_km: float
    cloud_cover_percent: float
    humidity_percent: float
    temperature_c: float
    precipitation_mm: float
    wind_speed_kmh: float
    condition: str
    source: str
    is_live: bool
    cloud_loss_db: float = 0.0
    rain_loss_db: float = 0.0
    humidity_loss_db: float = 0.0
    total_weather_loss_db: float = 0.0


class PassTrajectoryPoint(BaseModel):
    step_index: int
    time_offset_min: float
    timestamp: str
    elevation_deg: float
    azimuth_deg: float
    range_km: float
    channel_loss_db: float
    qber_percent: float
    secret_key_rate: float
    line_of_sight: bool


class RealisticSimulationRequest(BaseModel):
    satellite_id: str = "micius"
    ground_station: GroundStationConfig = Field(default_factory=GroundStationConfig)
    parameters: Optional[ChannelParameters] = None
    use_live_weather: bool = True
    use_live_tle: bool = True


class RealisticSimulationResult(BaseModel):
    id: str
    timestamp: str
    satellite: SatelliteInfo
    position: SatellitePosition
    geometry: LinkGeometry
    weather: WeatherData
    ground_station: GroundStationConfig
    simulation_result: SimulationResult
    pass_trajectory: List[PassTrajectoryPoint]
    loss_vs_elevation_curve: List[Dict[str, float]]
    is_realistic_mode: bool = True

