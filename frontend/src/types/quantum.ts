export interface ChannelParameters {
  // Satellite node
  satellite_altitude: number;
  satellite_position: string;
  wavelength: number;
  transmitter_aperture: number;
  beam_divergence: number;
  mean_photon_number: number;
  repetition_rate: number;

  // Relay / HAP node
  has_relay: boolean;
  relay_altitude: number;
  relay_efficiency: number;
  relay_aperture: number;

  // Ground Receiver (Bob)
  receiver_aperture: number;
  detector_efficiency: number;
  dark_count_rate: number;
  background_noise: number;
  optical_error_rate: number;
  fec_efficiency: number;

  // Atmospheric & Environmental Conditions
  visibility: number;
  atmospheric_condition: string;
  turbulence_level: string;
  cn2_ground: number;
  pointing_level: string;
  pointing_error: number;

  // Distances
  link1_distance?: number;
  link2_distance?: number;
  total_link_distance?: number;

  // Simulation settings
  num_bits: number;
  monte_carlo_iterations: number;
}

export interface ScenarioResponse {
  id: string;
  name: string;
  description: string;
  parameters: ChannelParameters;
  created_at: string;
  is_default: boolean;
}

export interface BitTrace {
  index: number;
  alice_bit: number;
  alice_basis: string; // 'Z' or 'X'
  bob_basis: string;   // 'Z' or 'X'
  bob_bit: number | null;
  detected: boolean;
  basis_matched: boolean;
  is_error: boolean;
}

export interface HistogramBin {
  bin_center_percent: number;
  bin_start_percent: number;
  bin_end_percent: number;
  count: number;
  relative_frequency: number;
}

export interface MonteCarloStats {
  iterations: number;
  mean_qber: number;
  std_qber: number;
  ci_95_lower: number;
  ci_95_upper: number;
  min_qber: number;
  max_qber: number;
  mean_secret_key_rate: number;
  std_secret_key_rate: number;
  min_secret_key_rate: number;
  max_secret_key_rate: number;
  mean_channel_loss_db: number;
  std_channel_loss_db: number;
  histogram_qber: HistogramBin[];
  confidence_interval_percent: number;
}

export interface LossVsDistancePoint {
  distance_km: number;
  channel_loss_db: number;
  atmospheric_loss_db: number;
  geometric_loss_db: number;
}

export interface QberVsTurbulencePoint {
  cn2: number;
  rytov_variance: number;
  scintillation_index: number;
  qber_percent: number;
  snr_db: number;
}

export interface QberVsPointingPoint {
  pointing_jitter_urad: number;
  pointing_loss_db: number;
  qber_percent: number;
  snr_db: number;
}

export interface KeyRateVsConditionsPoint {
  condition: string;
  qber_percent: number;
  channel_loss_db: number;
  secret_key_rate_kbps: number;
  is_secure: boolean;
}

export interface QberVsLossPoint {
  channel_loss_db: number;
  simulated_qber_percent: number;
  analytical_qber_percent: number;
  qber_percent: number;
  snr_db: number;
  secret_key_rate_bps: number;
  is_secure: boolean;
  sifted_bits: number;
}

export interface QberComparison {
  simulated_qber: number;
  reference_qber: number;
  absolute_difference: number;
  relative_difference_percent: number;
  is_within_tolerance: boolean;
  status: string;
}

export interface QuantumSimulationRequest {
  num_bits: number;
  channel_loss_db: number;
  mean_photon_number?: number;
  detector_efficiency?: number;
  dark_count_rate?: number;
  background_noise?: number;
  optical_error_rate?: number;
  repetition_rate?: number;
  fec_efficiency?: number;
  scintillation_index?: number;
  pointing_jitter_urad?: number;
  sample_trace_count?: number;
  reference_qber?: number;
}

export interface QuantumSimulationResponse {
  id: string;
  timestamp: string;
  num_bits: number;
  photons_transmitted: number;
  photons_detected: number;
  detection_rate: number;
  raw_key_length: number;
  basis_matched_count: number;
  sifted_key_length: number;
  sifting_ratio: number;
  error_bits: number;
  simulated_qber: number;
  analytical_qber: number;
  qber_std_error: number;
  reference_qber?: number;
  qber_difference?: number;
  secret_key_rate: number;
  secure_key_length: number;
  is_secure: boolean;
  security_status_message: string;
  channel_loss_db: number;
  snr_db: number;
  bit_samples: BitTrace[];
  qber_vs_loss_curve?: QberVsLossPoint[];
  qber_comparison?: QberComparison;
}

export interface SimulationResult {
  id: string;
  scenario_id?: string;
  scenario_name: string;
  timestamp: string;
  parameters: ChannelParameters;

  // Key Performance Indicators
  qber: number;
  channel_loss_db: number;
  secret_key_rate: number;
  detection_rate: number;
  sifted_key_length: number;
  total_detected_photons: number;
  error_bits: number;
  secure_key_length: number;
  is_secure: boolean;
  security_status_message: string;

  // Link Budget Breakdown
  link1_loss_db: number;
  link2_loss_db: number;
  geometric_loss_db: number;
  atmospheric_loss_db: number;
  pointing_loss_db: number;
  relay_loss_db: number;
  detector_loss_db: number;
  total_transmittance: number;

  // Turbulence & Pointing Metrics
  effective_cn2: number;
  rytov_variance: number;
  scintillation_index: number;
  pointing_jitter_urad: number;
  beam_waist_receiver_m: number;

  // Monte Carlo Statistical Analysis
  monte_carlo: MonteCarloStats;

  // BB84 Sample Bits
  bit_samples: BitTrace[];

  // Curves for Interactive Charts
  loss_vs_distance_curve: LossVsDistancePoint[];
  qber_vs_turbulence_curve: QberVsTurbulencePoint[];
  qber_vs_pointing_curve: QberVsPointingPoint[];
  key_rate_vs_conditions_curve: KeyRateVsConditionsPoint[];
  qber_vs_loss_curve?: QberVsLossPoint[];

  // Quantum simulation validation comparison
  reference_qber?: number;
  qber_difference?: number;
  quantum_simulation_stats?: Record<string, any>;

  // Dual-stage before and after relay factor comparison
  relay_comparison?: RelayComparison;
}

export interface RelayStageMetrics {
  has_relay: boolean;
  stage_name: string;
  description: string;
  total_distance_km: number;
  total_loss_db: number;
  atmospheric_loss_db: number;
  geometric_loss_db: number;
  pointing_loss_db: number;
  relay_loss_db: number;
  total_transmittance: number;
  qber: number;
  qber_percent: number;
  secret_key_rate_bps: number;
  detection_rate_percent: number;
  rytov_variance: number;
  scintillation_index: number;
  snr_db: number;
  is_secure: boolean;
  security_status: string;
  beam_waist_m: number;
}

export interface RelayComparison {
  before_relay: RelayStageMetrics;
  after_relay: RelayStageMetrics;
  loss_reduction_db: number;
  qber_reduction_percent: number;
  key_rate_gain_factor: number;
  key_rate_increase_bps: number;
  scintillation_reduction_factor: number;
  improvement_summary: string;
}

export interface ScenarioComparisonResponse {
  scenarios: SimulationResult[];
  comparison_table: Record<string, any>[];
}

export interface RecentSimulation {
  id: string;
  scenario_name: string;
  timestamp: string;
  qber: number;
  channel_loss_db: number;
  secret_key_rate: number;
  is_secure: boolean;
}

// ==========================================
// REALISTIC CELESTRAK + SKYFIELD + WEATHER TYPES
// ==========================================

export interface GroundStationConfig {
  name: string;
  latitude: number;
  longitude: number;
  altitude_m: number;
  min_elevation_deg: number;
}

export interface SatelliteInfo {
  name: string;
  norad_id: number;
  tle_line1: string;
  tle_line2: string;
  epoch: string;
  is_live: boolean;
  source: string;
}

export interface SatellitePosition {
  name: string;
  norad_id: number;
  observation_time: string;
  latitude_deg: number;
  longitude_deg: number;
  altitude_km: number;
  azimuth_deg: number;
  elevation_deg: number;
  range_km: number;
  is_visible: boolean;
  line_of_sight: string;
  is_live: boolean;
}

export interface LinkGeometry {
  satellite_name: string;
  ground_station_name: string;
  elevation_deg: number;
  azimuth_deg: number;
  satellite_to_ground_range_km: number;
  satellite_to_relay_distance_km: number;
  relay_to_bob_distance_km: number;
  airmass: number;
  line_of_sight_available: boolean;
  visibility_status: string;
  reason?: string | null;
}

export interface WeatherData {
  location_name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  visibility_km: number;
  cloud_cover_percent: number;
  humidity_percent: number;
  temperature_c: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  condition: string;
  cloud_loss_db: number;
  rain_loss_db: number;
  humidity_loss_db: number;
  total_weather_loss_db: number;
  is_live: boolean;
}

export interface PassTrajectoryPoint {
  time_offset_min: number;
  iso_time: string;
  elevation_deg: number;
  azimuth_deg: number;
  range_km: number;
  channel_loss_db: number;
  qber_percent: number;
  estimated_skr_bps: number;
  is_visible: boolean;
}

export interface RealisticSimulationRequest {
  satellite_norad_id: number;
  ground_station: GroundStationConfig;
  channel_parameters: ChannelParameters;
  use_live_tle?: boolean;
  use_live_weather?: boolean;
}

export interface RealisticSimulationResult {
  id: string;
  mode?: string;
  timestamp: string;
  satellite: SatelliteInfo;
  satellite_info: SatelliteInfo;
  position: SatellitePosition;
  geometry: LinkGeometry;
  weather: WeatherData;
  simulation: SimulationResult;
  simulation_result: SimulationResult;
  ground_station?: GroundStationConfig;
  trajectory: PassTrajectoryPoint[];
  pass_trajectory: PassTrajectoryPoint[];
  loss_vs_elevation_curve?: any[];
  is_realistic_mode?: boolean;
}



// ==========================================
// NASA POWER METEOROLOGICAL DATASET TYPES
// ==========================================

export interface DatasetMetadata {
  source: string;
  location_name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  date_range_declared: string;
  timezone: string;
  missing_value_code: number;
  total_records: number;
  filename: string;
}

export interface ColumnDefinition {
  description: string;
  units: string;
  type: string;
}

export interface DataQualityStats {
  total_rows: number;
  valid_rows: number;
  missing_values_count: number;
  missing_values_percent: number;
  duplicates_count: number;
  completeness_score: number;
}

export interface DatasetStatistics {
  temperature_c: { mean: number; min: number; max: number };
  relative_humidity_percent: { mean: number; min: number; max: number };
  surface_pressure_kpa: { mean: number; min: number; max: number };
  wind_speed_ms: { mean: number; min: number; max: number };
  precipitation_mmh: { mean: number; max: number; rainy_hours_count: number };
  derived_visibility_km: { mean: number; min: number; max: number };
}

export interface CelestrakLeoSatellite {
  id: number;
  name: string;
  epoch: string;
  inclination_deg: number;
  raan_deg: number;
  eccentricity: number;
  arg_perigee_deg: number;
  mean_anomaly_deg: number;
  mean_motion_rev_per_day: number;
  altitude_km: number;
  orbit_type: string;
  orbital_period_min: number;
  regime: string;
  zenith_loss_db: number;
}

export interface CelestrakLeoOverview {
  source: string;
  filename: string;
  total_satellites_raw: number;
  leo_satellites_count: number;
  orbit_filter: string;
  mean_altitude_km: number;
  min_altitude_km: number;
  max_altitude_km: number;
  mean_inclination_deg: number;
  mean_motion_rev_per_day: number;
  mean_orbital_period_min: number;
  regime_counts: Record<string, number>;
  key_constellations: Record<string, number>;
}

export interface DatasetOverview {
  metadata: DatasetMetadata;
  columns: Record<string, ColumnDefinition>;
  data_quality: DataQualityStats;
  statistics: DatasetStatistics;
  audit_log?: { step: string; action: string }[];
  unit_conversions?: { parameter: string; raw_unit: string; target_unit: string; formula: string }[];
  celestrak_leo?: {
    metadata: CelestrakLeoOverview;
    sample_satellites: CelestrakLeoSatellite[];
    total_leo_satellites: number;
    paired_passes_count: number;
  };
}

export interface DatasetRecord {
  id: number;
  timestamp: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  temperature_c: number;
  dew_point_c: number;
  relative_humidity_percent: number;
  surface_pressure_kpa: number;
  wind_speed_ms: number;
  wind_direction_deg: number;
  precipitation_mmh: number;
  derived_visibility_km: number;
  derived_cloud_cover_percent: number;
  derived_cn2_ground: number;
  weather_condition: string;
  is_valid: boolean;
  simulated_channel_loss_db: number;
  simulated_atmospheric_loss_db: number;
  simulated_qber_percent: number;
  simulated_skr_bps: number;
  is_secure: boolean;
  source_weather: string;
  source_channel: string;
  source_qber: string;
  source_skr: string;
}

export interface DatasetRecordsResponse {
  total_records: number;
  total_matching: number;
  offset: number;
  limit: number;
  records: DatasetRecord[];
}

export interface ValidationCurvePoint {
  humidity_bin: string;
  sample_count: number;
  avg_visibility_km: number;
  dataset_loss_db: number;
  baseline_loss_db: number;
  loss_difference_db: number;
  dataset_qber_percent: number;
  baseline_qber_percent: number;
  qber_difference_percent: number;
  dataset_skr_bps: number;
  baseline_skr_bps: number;
}

export interface ValidationGraphPoint {
  x_label: string;
  dataset_qber?: number;
  simulated_qber?: number;
  difference_percent?: number;
  dataset_loss_db?: number;
  simulated_loss_db?: number;
  difference_db?: number;
  dataset_skr_bps?: number;
  simulated_skr_bps?: number;
  difference_bps?: number;
  source_dataset?: string;
  source_model?: string;
}

export interface HistogramEntry {
  bin: string;
  count: number;
  relative_freq: number;
}

export interface DatasetValidationMetrics {
  sample_size: number;
  metrics: {
    // Loss
    loss_mae_db: number;
    loss_rmse_db: number;
    loss_mape_percent: number;
    loss_r2: number;
    loss_mean_diff_db: number;
    loss_rel_error_percent: number;
    // QBER
    qber_mae_percent: number;
    qber_rmse_percent: number;
    qber_mape_percent: number;
    qber_r2: number;
    qber_mean_diff_percent: number;
    qber_rel_error_percent: number;
    // SKR
    skr_mae_bps: number;
    skr_rmse_bps: number;
    skr_mape_percent: number;
    skr_r2: number;
    skr_mean_diff_bps: number;
    skr_rel_error_percent: number;
  };
  validation_curve: ValidationCurvePoint[];
  graph1_qber_comparison: ValidationGraphPoint[];
  graph2_channel_loss_comparison: ValidationGraphPoint[];
  graph3_skr_comparison: ValidationGraphPoint[];
  graph4_error_distribution_qber: HistogramEntry[];
  graph4_error_distribution_loss: HistogramEntry[];
  interpretation: string;
}

export interface DatasetMappingStage {
  stage: number;
  title: string;
  source: string;
  fields: string[];
  description: string;
}

export interface DatasetSourcePriority {
  tier: number;
  source: string;
  badge_color: string;
  description: string;
}

export interface DatasetMapping {
  architecture: DatasetMappingStage[];
  source_priorities: DatasetSourcePriority[];
}

export interface MonthlyAnalytics {
  month_num: number;
  month_name: string;
  sample_count: number;
  seasonal_regime: string;
  avg_temperature_c: number;
  avg_humidity_percent: number;
  total_precipitation_mm: number;
  rainy_hours_count: number;
  avg_visibility_km: number;
  avg_channel_loss_db: number;
  avg_atmospheric_loss_db: number;
  avg_qber_percent: number;
  avg_skr_bps: number;
  link_availability_percent: number;
}

export interface DiurnalAnalytics {
  hour: number;
  hour_label: string;
  period: string;
  avg_temperature_c: number;
  avg_humidity_percent: number;
  avg_wind_speed_ms: number;
  avg_visibility_km: number;
  avg_cn2_ground: number;
  avg_channel_loss_db: number;
  avg_qber_percent: number;
  avg_skr_bps: number;
  link_availability_percent: number;
}

export interface DatasetPreset {
  name: string;
  description: string;
  record_id: number;
  timestamp: string;
  visibility_km: number;
  relative_humidity_percent: number;
  temperature_c: number;
  precipitation_mmh: number;
  expected_qber_percent: number;
  expected_loss_db: number;
  expected_skr_bps: number;
}

export interface DatasetAnalyticsResponse {
  summary: {
    total_hours: number;
    annual_qkd_availability_percent: number;
    annual_avg_qber_percent: number;
    annual_avg_loss_db: number;
    annual_avg_skr_bps: number;
    total_rainy_hours: number;
    monsoon_availability_percent: number;
    dry_season_availability_percent: number;
  };
  monthly_analytics: MonthlyAnalytics[];
  diurnal_analytics: DiurnalAnalytics[];
  extreme_events: {
    heaviest_rain: DatasetRecord;
    clearest_sky: DatasetRecord;
    densest_fog: DatasetRecord;
    highest_turbulence: DatasetRecord;
    highest_key_rate: DatasetRecord;
    worst_channel_loss: DatasetRecord;
  };
  presets: DatasetPreset[];
}

export interface DatasetSimulateRequest {
  record_id: number;
  satellite_norad_id?: number;
  use_dataset_location?: boolean;
  channel_parameters?: ChannelParameters;
}

export interface MLFeatureRanking {
  feature: string;
  label: string;
  category?: string;
  importance_loss: number;
  importance_qber: number;
  importance_composite: number;
  importance_percent: number;
}

export interface MLModelMetrics {
  channel_loss: {
    train_r2: number;
    test_r2: number;
    test_mae_db: number;
    test_rmse_db: number;
  };
  qber: {
    train_r2: number;
    test_r2: number;
    test_mae_percent: number;
    test_rmse_percent: number;
  };
  secret_key_rate: {
    train_r2: number;
    test_r2: number;
    test_mae_bps: number;
    test_rmse_bps: number;
  };
  security_classification: {
    test_accuracy_percent: number;
  };
}

export interface MLStatusResponse {
  dataset_file?: string;
  dataset_sources?: Array<{
    name: string;
    file: string;
    records: number;
    orbit_focus?: string;
  }>;
  total_samples: number;
  train_samples: number;
  test_samples: number;
  algorithm: string;
  metrics: MLModelMetrics;
  feature_ranking: MLFeatureRanking[];
  trained_at: string;
}

export interface MLPredictRequest {
  // CelesTrak LEO Satellite Orbital Features
  satellite_altitude_km?: number;
  elevation_deg?: number;
  slant_range_km?: number;
  inclination_deg?: number;
  mean_motion_rev_per_day?: number;
  satellite_name?: string;
  // NASA POWER Meteorological Features
  temperature_c: number;
  dew_point_c: number;
  relative_humidity_percent: number;
  surface_pressure_kpa: number;
  wind_speed_ms: number;
  wind_direction_deg: number;
  precipitation_mmh: number;
  hour: number;
  month: number;
  record_id?: number | null;
}

export interface MLPhysicsComparison {
  physics_channel_loss_db: number;
  physics_qber_percent: number;
  physics_skr_bps: number;
  loss_residual_db: number;
  qber_residual_percent: number;
  skr_residual_bps: number;
}

export interface MLPredictResponse {
  inputs: MLPredictRequest;
  prediction: {
    predicted_channel_loss_db: number;
    predicted_qber_percent: number;
    predicted_skr_bps: number;
    is_secure: boolean;
    model_provenance: string;
    leo_satellite_parameters?: {
      altitude_km: number;
      elevation_deg: number;
      slant_range_km: number;
      airmass_factor: number;
      inclination_deg: number;
      orbit_type: string;
    };
  };
  physics_comparison?: MLPhysicsComparison | null;
}

// ============================================================================
// QUANTUM SIMULATION LABORATORY (BB84 EXPERIMENT)
// ============================================================================

export interface QuantumLabRequest {
  satellite: string;
  distance_km: number;
  num_bits: number;
  eavesdropping_enabled: boolean;
  eavesdropping_probability: number;
  attack_type: string;
  channel_noise: number;
  turbulence: string;
  pointing_error: number;
  detector_efficiency: number;
  fec_efficiency?: number;
  has_relay?: boolean;
  relay_altitude_km?: number;
  relay_efficiency?: number;
  relay_aperture_m?: number;
  dark_count_rate?: number;
  background_noise?: number;
  monte_carlo_runs?: number;
  include_charts?: boolean;
  data_source_mode?: string;
}

export interface QuantumLabSweepPoint {
  [key: string]: any;
}

export interface QuantumLabCharts {
  qber_vs_eve?: Array<{
    eve_prob: number;
    eve_percent: number;
    qber_percent: number;
    skr_bps: number;
    errors: number;
    sifted_bits: number;
  }>;
  qber_vs_dist?: Array<{
    distance_km: number;
    qber_percent: number;
    skr_bps: number;
    loss_db: number;
    detected_bits: number;
  }>;
  qber_vs_bits?: Array<{
    bits: number;
    bits_label: string;
    qber_percent: number;
    detected_bits: number;
    sifted_bits: number;
  }>;
  skr_vs_qber?: Array<{
    qber_percent: number;
    theoretical_skr_fraction: number;
    is_secure: boolean;
  }>;
  eve_vs_skr?: Array<{
    eve_prob: number;
    eve_percent: number;
    skr_bps: number;
    is_secure: boolean;
    qber_percent: number;
  }>;
}

export interface QuantumLabBitSample {
  idx: number;
  alice_bit: number;
  alice_basis: string;
  bob_basis: string;
  bob_bit: number | null;
  detected: boolean;
  matched_basis: boolean;
  is_error: boolean;
  eve_intercepted: boolean;
  eve_basis: string | null;
}

export interface QuantumLabLinkBudget {
  distance_km?: number;
  pointing_jitter_urad?: number;
  turbulence_level?: string;
  geometric_loss_db: number;
  atmospheric_loss_db: number;
  pointing_loss_db: number;
  turbulence_fading_loss_db?: number;
  turbulence_loss_db?: number;
  relay_loss_db?: number;
  total_loss_db: number;
  transmittance_fraction?: number;
  transmittance?: number;
  scintillation_index?: number;
  has_relay?: boolean;
  relay_altitude_km?: number;
  relay_efficiency?: number;
  relay_aperture_m?: number;
  direct_link_loss_db?: number;
  loss_savings_db?: number;
}

export interface QuantumLabRelayStats {
  has_relay: boolean;
  relay_altitude_km: number;
  relay_efficiency: number;
  relay_aperture_m: number;
  qber_with_relay_percent: number;
  qber_without_relay_percent: number;
  qber_reduction_percent: number;
  loss_savings_db: number;
  skr_gain_factor: number;
  relay_advantage_summary: string;
}

export interface QuantumLabResult {
  id: string;
  timestamp: string;
  satellite: string;
  distance_km: number;
  bits_sent: number;
  detections: number;
  detection_rate: number;
  sifted_bits: number;
  sifting_ratio: number;
  errors: number;
  qber: number;
  qber_percent: number;
  qber_std_error: number;
  estimated_skr: number;
  discrete_secure_bits: number;
  is_secure: boolean;
  security_status_message: string;
  eavesdropping_detected: boolean;
  eavesdropping_enabled: boolean;
  eavesdropping_probability: number;
  channel_noise: number;
  channel_loss_db: number;
  link_budget: QuantumLabLinkBudget;
  bit_samples: QuantumLabBitSample[];
  charts: QuantumLabCharts;
  data_source_mode: string;
  has_relay?: boolean;
  relay_stats?: QuantumLabRelayStats;
}

export interface QuantumLabHistoryItem {
  id: string;
  timestamp: string;
  satellite: string;
  distance_km: number;
  num_bits: number;
  eavesdropping_enabled: boolean;
  eavesdropping_probability: number;
  qber_percent: number;
  estimated_skr: number;
  errors: number;
  sifted_bits: number;
  is_secure: boolean;
  eavesdropping_detected: boolean;
}

export interface QuantumSatelliteOption {
  id: string;
  name: string;
  altitude_km: number;
  norad_id: number;
}



