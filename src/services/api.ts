import {
  ChannelParameters,
  ScenarioResponse,
  SimulationResult,
  ScenarioComparisonResponse,
  RecentSimulation,
  SatelliteInfo,
  SatellitePosition,
  WeatherData,
  RealisticSimulationRequest,
  RealisticSimulationResult,
  QuantumSimulationRequest,
  QuantumSimulationResponse,
  MLStatusResponse,
  MLPredictRequest,
  MLPredictResponse,
  CelestrakLeoOverview,
  CelestrakLeoSatellite,
  QuantumLabRequest,
  QuantumLabResult,
  QuantumLabHistoryItem,
  QuantumLabLinkBudget,
  QuantumSatelliteOption
} from '../types/quantum';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== ''
    ? import.meta.env.VITE_API_BASE_URL
    : (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')
).replace(/\/$/, '');

function buildApiUrl(path: string): URL {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE_URL) {
    return new URL(`${API_BASE_URL}${cleanPath}`);
  }
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://127.0.0.1:8000';
  return new URL(cleanPath, origin);
}

export async function fetchScenarios(): Promise<ScenarioResponse[]> {
  const res = await fetch(`${API_BASE_URL}/api/scenarios`);
  if (!res.ok) {
    throw new Error(`Failed to load scenarios (${res.status})`);
  }
  return res.json();
}

export async function fetchScenario(id: string): Promise<ScenarioResponse> {
  const res = await fetch(`${API_BASE_URL}/api/scenarios/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to load scenario ${id}`);
  }
  return res.json();
}

export async function createScenario(payload: {
  name: string;
  description?: string;
  parameters: ChannelParameters;
}): Promise<ScenarioResponse> {
  const res = await fetch(`${API_BASE_URL}/api/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Failed to save custom scenario: ${await res.text()}`);
  }
  return res.json();
}

export async function runSimulation(
  parameters: ChannelParameters,
  scenarioId?: string,
  scenarioName?: string
): Promise<SimulationResult> {
  const url = buildApiUrl('/api/simulation/run');
  if (scenarioId) url.searchParams.append('scenario_id', scenarioId);
  if (scenarioName) url.searchParams.append('scenario_name', scenarioName);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parameters)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Unknown network error' }));
    throw new Error(errData.detail || 'Simulation execution failed');
  }
  return res.json();
}

export async function runQuantumSimulation(
  payload: QuantumSimulationRequest
): Promise<QuantumSimulationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/simulation/quantum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Quantum simulation network error' }));
    throw new Error(errData.detail || 'Quantum simulation execution failed');
  }
  return res.json();
}

export async function fetchSimulation(id: string): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE_URL}/api/simulation/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to retrieve simulation ${id}`);
  }
  return res.json();
}

export async function fetchRecentSimulations(limit: number = 6): Promise<RecentSimulation[]> {
  const res = await fetch(`${API_BASE_URL}/api/simulation/recent/list?limit=${limit}`);
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function compareScenarios(scenarioIds: string[]): Promise<ScenarioComparisonResponse> {
  const res = await fetch(`${API_BASE_URL}/api/scenarios/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_ids: scenarioIds })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Comparison run failed' }));
    throw new Error(errData.detail || 'Failed to compare scenarios');
  }
  return res.json();
}

export function getPdfReportUrl(simulationId: string): string {
  return `${API_BASE_URL}/api/reports/pdf/${simulationId}`;
}

export function getCsvReportUrl(simulationId: string): string {
  return `${API_BASE_URL}/api/reports/csv/${simulationId}`;
}

// ==========================================
// REALISTIC SIMULATION API FUNCTIONS
// ==========================================

export async function fetchSatelliteList(): Promise<SatelliteInfo[]> {
  const res = await fetch(`${API_BASE_URL}/api/satellite/list`);
  if (!res.ok) {
    throw new Error('Failed to fetch satellite list');
  }
  return res.json();
}

export async function fetchSatellitePosition(
  noradId: number = 41740,
  lat: number = 28.6139,
  lon: number = 77.2090,
  altM: number = 216.0
): Promise<SatellitePosition> {
  const url = buildApiUrl('/api/satellite/position');
  url.searchParams.append('norad_id', noradId.toString());
  url.searchParams.append('lat', lat.toString());
  url.searchParams.append('lon', lon.toString());
  url.searchParams.append('alt_m', altM.toString());

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Failed to retrieve satellite position');
  }
  return res.json();
}

export async function fetchWeather(
  lat: number = 28.6139,
  lon: number = 77.2090,
  locationName: string = 'Primary Optical Ground Station'
): Promise<WeatherData> {
  const url = buildApiUrl('/api/weather');
  url.searchParams.append('lat', lat.toString());
  url.searchParams.append('lon', lon.toString());
  url.searchParams.append('location_name', locationName);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Failed to retrieve weather data');
  }
  return res.json();
}

function normalizeRealisticResult(data: any): RealisticSimulationResult {
  return {
    ...data,
    satellite: data.satellite || data.satellite_info,
    satellite_info: data.satellite_info || data.satellite,
    simulation: data.simulation || data.simulation_result,
    simulation_result: data.simulation_result || data.simulation,
    trajectory: data.trajectory || data.pass_trajectory || [],
    pass_trajectory: data.pass_trajectory || data.trajectory || []
  };
}

export async function runRealisticSimulation(
  payload: RealisticSimulationRequest
): Promise<RealisticSimulationResult> {
  const res = await fetch(`${API_BASE_URL}/api/simulation/realistic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Unknown network error' }));
    throw new Error(errData.detail || 'Realistic simulation execution failed');
  }
  const data = await res.json();
  return normalizeRealisticResult(data);
}

// ==========================================
// NASA POWER DATASET API FUNCTIONS
// ==========================================

import {
  DatasetOverview,
  DatasetRecord,
  DatasetRecordsResponse,
  DatasetValidationMetrics,
  DatasetAnalyticsResponse,
  DatasetSimulateRequest
} from '../types/quantum';

export async function fetchDatasetOverview(): Promise<DatasetOverview> {
  const res = await fetch(`${API_BASE_URL}/api/dataset/overview`);
  if (!res.ok) {
    throw new Error('Failed to load dataset overview');
  }
  return res.json();
}

export async function fetchDatasetRecords(params?: {
  month?: number;
  min_humidity?: number;
  max_humidity?: number;
  min_visibility?: number;
  max_visibility?: number;
  weather_condition?: string;
  has_rain?: boolean;
  limit?: number;
  offset?: number;
}): Promise<DatasetRecordsResponse> {
  const url = buildApiUrl('/api/dataset/records');
  if (params?.month) url.searchParams.append('month', params.month.toString());
  if (params?.min_humidity !== undefined) url.searchParams.append('min_humidity', params.min_humidity.toString());
  if (params?.max_humidity !== undefined) url.searchParams.append('max_humidity', params.max_humidity.toString());
  if (params?.min_visibility !== undefined) url.searchParams.append('min_visibility', params.min_visibility.toString());
  if (params?.max_visibility !== undefined) url.searchParams.append('max_visibility', params.max_visibility.toString());
  if (params?.weather_condition) url.searchParams.append('weather_condition', params.weather_condition);
  if (params?.has_rain !== undefined) url.searchParams.append('has_rain', params.has_rain.toString());
  if (params?.limit) url.searchParams.append('limit', params.limit.toString());
  if (params?.offset) url.searchParams.append('offset', params.offset.toString());

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Failed to load dataset records');
  }
  return res.json();
}

export async function fetchDatasetRecord(id: number): Promise<DatasetRecord> {
  const res = await fetch(`${API_BASE_URL}/api/dataset/record/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to load dataset record #${id}`);
  }
  return res.json();
}

export async function fetchDatasetValidation(): Promise<DatasetValidationMetrics> {
  const res = await fetch(`${API_BASE_URL}/api/dataset/validation`);
  if (!res.ok) {
    throw new Error('Failed to load dataset validation metrics');
  }
  return res.json();
}

export async function fetchDatasetAnalytics(): Promise<DatasetAnalyticsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/dataset/analytics`);
  if (!res.ok) {
    throw new Error('Failed to load dataset analytics');
  }
  return res.json();
}

export async function simulateFromDatasetRecord(
  payload: DatasetSimulateRequest
): Promise<RealisticSimulationResult> {
  const res = await fetch(`${API_BASE_URL}/api/dataset/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Simulation error' }));
    throw new Error(errData.detail || 'Failed to simulate with dataset record');
  }
  const data = await res.json();
  return normalizeRealisticResult(data);
}

export async function fetchDatasetMapping(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/dataset/mapping`);
  if (!res.ok) {
    throw new Error('Failed to load dataset mapping');
  }
  return res.json();
}

export async function fetchJoinedPass(recordId: number, noradId: number = 41740): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/dataset/joined-pass?record_id=${recordId}&satellite_norad_id=${noradId}`);
  if (!res.ok) {
    throw new Error('Failed to load joined pass data');
  }
  return res.json();
}

export async function fetchCelestrakLeoOverview(): Promise<{
  metadata: CelestrakLeoOverview;
  sample_satellites: CelestrakLeoSatellite[];
  total_leo_satellites: number;
  paired_passes_count: number;
}> {
  const res = await fetch(`${API_BASE_URL}/api/dataset/celestrak-leo/overview`);
  if (!res.ok) {
    throw new Error('Failed to load CelesTrak LEO dataset overview');
  }
  return res.json();
}

export async function fetchCelestrakLeoSatellites(params?: {
  search?: string;
  regime?: string;
  min_alt?: number;
  max_alt?: number;
  limit?: number;
  offset?: number;
}): Promise<{ total_leo_satellites: number; total_matching: number; limit: number; offset: number; satellites: CelestrakLeoSatellite[] }> {
  const q = new URLSearchParams();
  if (params?.search) q.append('search', params.search);
  if (params?.regime && params.regime !== 'All') q.append('regime', params.regime);
  if (params?.min_alt !== undefined) q.append('min_alt', params.min_alt.toString());
  if (params?.max_alt !== undefined) q.append('max_alt', params.max_alt.toString());
  if (params?.limit) q.append('limit', params.limit.toString());
  if (params?.offset !== undefined) q.append('offset', params.offset.toString());

  const res = await fetch(`${API_BASE_URL}/api/dataset/celestrak-leo/satellites?${q.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch CelesTrak LEO satellites');
  }
  return res.json();
}

export function getDatasetCsvExportUrl(): string {
  return `${API_BASE_URL}/api/dataset/export/csv`;
}

export async function fetchMLStatus(): Promise<MLStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/dataset/ml/status`);
  if (!res.ok) {
    throw new Error('Failed to load ML model status');
  }
  return res.json();
}

export async function trainMLModels(): Promise<MLStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/dataset/ml/train`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error('Failed to trigger ML model training');
  }
  return res.json();
}

export async function predictWithML(payload: MLPredictRequest): Promise<MLPredictResponse> {
  const res = await fetch(`${API_BASE_URL}/api/dataset/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Failed to execute ML inference');
  }
  return res.json();
}

// ============================================================================
// QUANTUM SIMULATION LABORATORY APIS
// ============================================================================

export async function runQuantumLabSimulation(payload: QuantumLabRequest): Promise<QuantumLabResult> {
  const res = await fetch(`${API_BASE_URL}/api/quantum-simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Quantum simulation error' }));
    throw new Error(errData.detail || `Quantum simulation failed (${res.status})`);
  }
  return res.json();
}

export async function fetchQuantumLabSatellites(): Promise<QuantumSatelliteOption[]> {
  const res = await fetch(`${API_BASE_URL}/api/quantum-simulation/satellites`);
  if (!res.ok) {
    throw new Error('Failed to load satellites list');
  }
  return res.json();
}

export async function fetchQuantumLabCalculatedLoss(
  distance_km: number,
  pointing_error: number,
  turbulence: string,
  has_relay: boolean = true,
  relay_altitude_km: number = 20.0,
  relay_efficiency: number = 0.85,
  relay_aperture_m: number = 0.35
): Promise<QuantumLabLinkBudget> {
  const url = `${API_BASE_URL}/api/quantum-simulation/calculate-loss?distance_km=${distance_km}&pointing_error=${pointing_error}&turbulence=${encodeURIComponent(turbulence)}&has_relay=${has_relay}&relay_altitude_km=${relay_altitude_km}&relay_efficiency=${relay_efficiency}&relay_aperture_m=${relay_aperture_m}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to calculate channel loss');
  }
  return res.json();
}

export async function fetchQuantumLabHistory(limit: number = 15): Promise<QuantumLabHistoryItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/quantum-simulation/history?limit=${limit}`);
  if (!res.ok) {
    throw new Error('Failed to load experiment history');
  }
  return res.json();
}

export async function fetchQuantumLabHistoryDetail(exp_id: string): Promise<QuantumLabResult> {
  const res = await fetch(`${API_BASE_URL}/api/quantum-simulation/history/${encodeURIComponent(exp_id)}`);
  if (!res.ok) {
    throw new Error('Failed to load experiment detail');
  }
  return res.json();
}

export async function runQuantumLabSweep(sweep_type: string, base_parameters: QuantumLabRequest): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/quantum-simulation/sweep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sweep_type, base_parameters })
  });
  if (!res.ok) {
    throw new Error('Failed to run parameter sweep');
  }
  return res.json();
}





