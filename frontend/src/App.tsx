import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ScenarioPage } from './pages/ScenarioPage';
import { ParametersPage } from './pages/ParametersPage';
import { ChannelPage } from './pages/ChannelPage';
import { DatasetPage } from './pages/DatasetPage';
import { SimulationPage } from './pages/SimulationPage';
import { ResultsPage } from './pages/ResultsPage';
import { ComparePage } from './pages/ComparePage';
import { ReportPage } from './pages/ReportPage';
import { QuantumSimulationPage } from './pages/QuantumSimulationPage';
import { ErrorBoundary } from './components/ErrorBoundary';

import {
  ChannelParameters,
  ScenarioResponse,
  SimulationResult,
  RecentSimulation,
  RealisticSimulationResult,
  GroundStationConfig,
  DatasetRecord
} from './types/quantum';
import {
  fetchScenarios,
  runSimulation as apiRunSimulation,
  createScenario as apiCreateScenario,
  fetchRecentSimulations,
  runRealisticSimulation,
  fetchSatellitePosition,
  fetchWeather
} from './services/api';

const DEFAULT_GROUND_STATION: GroundStationConfig = {
  name: 'Primary Optical Ground Station',
  latitude: 28.6139,
  longitude: 77.2090,
  altitude_m: 216.0,
  min_elevation_deg: 10.0
};

const DEFAULT_PARAMETERS: ChannelParameters = {
  satellite_altitude: 500.0,
  satellite_position: 'LEO Orbit (500 km, 97.4° inclination)',
  wavelength: 1550.0,
  transmitter_aperture: 0.25,
  beam_divergence: 10.0,
  mean_photon_number: 0.6,
  repetition_rate: 10000000.0,
  has_relay: true,
  relay_altitude: 20.0,
  relay_efficiency: 0.85,
  relay_aperture: 0.35,
  receiver_aperture: 0.60,
  detector_efficiency: 0.80,
  dark_count_rate: 1e-6,
  background_noise: 1e-6,
  optical_error_rate: 0.015,
  fec_efficiency: 1.16,
  visibility: 20.0,
  atmospheric_condition: 'clear',
  turbulence_level: 'moderate',
  cn2_ground: 1e-14,
  pointing_level: 'low',
  pointing_error: 2.5,
  num_bits: 10000,
  monte_carlo_iterations: 1000
};

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [simulationMode, setSimulationMode] = useState<'standard' | 'realistic'>('realistic');
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scenario-a');
  const [activeScenarioName, setActiveScenarioName] = useState<string>('Scenario A: Baseline LEO → HAP Relay → Ground');
  const [parameters, setParameters] = useState<ChannelParameters>(DEFAULT_PARAMETERS);
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);
  const [recentSimulations, setRecentSimulations] = useState<RecentSimulation[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Realistic Demonstration State (Requirements 3, 4, 5, 6, 7, 8, 9, 10, 11)
  const [selectedNoradId, setSelectedNoradId] = useState<number>(41740); // Micius default
  const [groundStation, setGroundStation] = useState<GroundStationConfig>(DEFAULT_GROUND_STATION);
  const [realisticResult, setRealisticResult] = useState<RealisticSimulationResult | null>(null);

  // Initial load
  useEffect(() => {
    loadScenariosAndRecent();
    loadInitialRealisticData();
  }, []);

  const loadScenariosAndRecent = async () => {
    try {
      const scenList = await fetchScenarios();
      setScenarios(scenList);
      if (scenList.length > 0) {
        const first = scenList[0];
        setActiveScenarioId(first.id);
        setActiveScenarioName(first.name);
        setParameters({ ...first.parameters });
      }
      const recents = await fetchRecentSimulations(6);
      setRecentSimulations(recents);
      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Backend connection error:', err);
      setIsBackendConnected(false);
    }
  };

  const loadInitialRealisticData = async () => {
    try {
      const realistic = await runRealisticSimulation({
        satellite_norad_id: 41740,
        ground_station: DEFAULT_GROUND_STATION,
        channel_parameters: DEFAULT_PARAMETERS,
        use_live_tle: true,
        use_live_weather: true
      });
      setRealisticResult(realistic);
      if (!currentResult) {
        setCurrentResult(realistic.simulation);
      }
    } catch (err) {
      console.warn('Initial realistic data fetch fallback:', err);
    }
  };

  const handleSelectScenario = (scen: ScenarioResponse) => {
    setActiveScenarioId(scen.id);
    setActiveScenarioName(scen.name);
    setParameters({ ...scen.parameters });
  };

  const handleCreateScenario = async (name: string, description: string, params: ChannelParameters) => {
    const created = await apiCreateScenario({ name, description, parameters: params });
    await loadScenariosAndRecent();
    handleSelectScenario(created);
  };

  const executeSimulation = async () => {
    setIsSimulating(true);
    setError(null);
    try {
      if (simulationMode === 'realistic') {
        const res = await runRealisticSimulation({
          satellite_norad_id: selectedNoradId,
          ground_station: groundStation,
          channel_parameters: parameters,
          use_live_tle: true,
          use_live_weather: true
        });
        setRealisticResult(res);
        setCurrentResult(res.simulation);
        const satName = res?.satellite_info?.name || 'LEO Satellite';
        const wCond = res?.weather?.condition || 'Clear';
        const wVis = res?.weather?.visibility_km != null ? `${res.weather.visibility_km.toFixed(1)} km` : '20.0 km';
        setActiveScenarioName(`Realistic: ${satName} (${wCond}, ${wVis})`);
      } else {
        const res = await apiRunSimulation(parameters, activeScenarioId, activeScenarioName);
        setCurrentResult(res);
      }
      setIsBackendConnected(true);
      const recents = await fetchRecentSimulations(6);
      setRecentSimulations(recents);
    } catch (err: any) {
      console.error('Simulation error:', err);
      setError(err.message || 'Simulation execution failed');
      setIsBackendConnected(false);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRefreshPosition = async () => {
    try {
      const pos = await fetchSatellitePosition(
        selectedNoradId,
        groundStation.latitude,
        groundStation.longitude,
        groundStation.altitude_m
      );
      if (realisticResult) {
        setRealisticResult({
          ...realisticResult,
          position: pos
        });
      }
    } catch (err) {
      console.warn('Position refresh error:', err);
    }
  };

  const handleRefreshWeather = async () => {
    try {
      const w = await fetchWeather(
        groundStation.latitude,
        groundStation.longitude,
        groundStation.name
      );
      if (realisticResult) {
        setRealisticResult({
          ...realisticResult,
          weather: w
        });
      }
    } catch (err) {
      console.warn('Weather refresh error:', err);
    }
  };

  const handleRunDemo = async () => {
    const demoParams: ChannelParameters = {
      ...DEFAULT_PARAMETERS,
      satellite_altitude: 500.0,
      wavelength: 1550.0,
      turbulence_level: 'moderate',
      cn2_ground: 1e-14,
      visibility: 20.0,
      pointing_level: 'low',
      pointing_error: 2.5,
      detector_efficiency: 0.80,
      num_bits: 10000,
      monte_carlo_iterations: 1000,
      has_relay: true,
      relay_altitude: 20.0
    };

    setParameters(demoParams);
    setActiveScenarioName('Demo Scenario: Baseline LEO → HAP Relay → Ground');
    setActivePage('simulation');

    setIsSimulating(true);
    setError(null);
    try {
      const res = await apiRunSimulation(demoParams, 'demo-scenario', 'Demo Scenario: Baseline LEO → HAP Relay → Ground');
      setCurrentResult(res);
      setIsBackendConnected(true);
      const recents = await fetchRecentSimulations(6);
      setRecentSimulations(recents);
    } catch (err: any) {
      setError(err.message || 'Demo simulation failed');
      setIsBackendConnected(false);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyDatasetCondition = (record: DatasetRecord) => {
    setParameters((prev) => ({
      ...prev,
      visibility: record.derived_visibility_km,
      cn2_ground: record.derived_cn2_ground,
      atmospheric_condition: record.weather_condition.toLowerCase().includes('rain')
        ? 'moderate_fog'
        : record.weather_condition.toLowerCase().includes('fog')
        ? 'moderate_fog'
        : record.weather_condition.toLowerCase().includes('haze')
        ? 'haze'
        : 'clear'
    }));
    setGroundStation({
      name: 'NASA POWER Ground Station (Rayalaseema 14°N, 78°E)',
      latitude: 14.0,
      longitude: 78.0,
      altitude_m: 604.05,
      min_elevation_deg: 10.0
    });
  };

  const handleDatasetSimulated = (result: RealisticSimulationResult) => {
    setRealisticResult(result);
    setCurrentResult(result.simulation);
    setActiveScenarioName(`Dataset Observation: ${result.weather.location_name}`);
    const recentItem: RecentSimulation = {
      id: result.simulation.id,
      scenario_name: `Dataset: ${result.weather.location_name}`,
      timestamp: new Date().toLocaleTimeString(),
      qber: result.simulation.qber,
      channel_loss_db: result.simulation.channel_loss_db,
      secret_key_rate: result.simulation.secret_key_rate,
      is_secure: result.simulation.is_secure
    };
    setRecentSimulations((prev) => [recentItem, ...prev.slice(0, 5)]);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100/70">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        hasResults={currentResult !== null || realisticResult !== null}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          activeScenarioName={activeScenarioName}
          isSimulating={isSimulating}
          onRunDemo={handleRunDemo}
          onNavigate={setActivePage}
          isBackendConnected={isBackendConnected}
          qber={currentResult?.qber}
          channelLoss={currentResult?.channel_loss_db}
          hasRelay={parameters.has_relay}
          relayAltitude={parameters.relay_altitude}
          simulationMode={simulationMode}
          onModeChange={setSimulationMode}
        />

        {/* Dynamic Page Router */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary onReset={() => setActivePage('dashboard')}>
              {activePage === 'dashboard' && (
                <DashboardPage
                  parameters={parameters}
                  currentResult={currentResult}
                  recentSimulations={recentSimulations}
                  isSimulating={isSimulating}
                  onNavigate={setActivePage}
                  onRunSimulation={() => {
                    setActivePage('simulation');
                    executeSimulation();
                  }}
                  onRunDemo={handleRunDemo}
                  simulationMode={simulationMode}
                  onModeChange={setSimulationMode}
                  selectedNoradId={selectedNoradId}
                  onSelectSatellite={(id) => setSelectedNoradId(id)}
                  groundStation={groundStation}
                  realisticResult={realisticResult}
                  onRefreshPosition={handleRefreshPosition}
                  onRefreshWeather={handleRefreshWeather}
                  onRunRealistic={() => {
                    setActivePage('simulation');
                    executeSimulation();
                  }}
                />
              )}

              {activePage === 'dataset' && (
                <DatasetPage
                  onNavigate={setActivePage}
                  onApplyDatasetCondition={handleApplyDatasetCondition}
                  onDatasetSimulated={handleDatasetSimulated}
                />
              )}

              {activePage === 'scenario' && (
                <ScenarioPage
                  scenarios={scenarios}
                  activeScenarioId={activeScenarioId}
                  onSelectScenario={handleSelectScenario}
                  onCreateScenario={handleCreateScenario}
                  onNavigate={setActivePage}
                  onRunSimulation={() => {
                    setActivePage('simulation');
                    executeSimulation();
                  }}
                />
              )}

              {activePage === 'parameters' && (
                <ParametersPage
                  parameters={parameters}
                  onChangeParameters={setParameters}
                  onNavigate={setActivePage}
                  onRunSimulation={() => {
                    setActivePage('simulation');
                    executeSimulation();
                  }}
                />
              )}

              {activePage === 'channel' && (
                <ChannelPage
                  parameters={parameters}
                  onChangeParameters={setParameters}
                  onNavigate={setActivePage}
                  onRunSimulation={() => {
                    setActivePage('simulation');
                    executeSimulation();
                  }}
                />
              )}

              {activePage === 'simulation' && (
                <SimulationPage
                  parameters={parameters}
                  onChangeParameters={setParameters}
                  currentResult={currentResult}
                  isSimulating={isSimulating}
                  onRunSimulation={executeSimulation}
                  onNavigate={setActivePage}
                  error={error}
                />
              )}

              {activePage === 'results' && (
                <ResultsPage
                  result={currentResult}
                  realisticResult={realisticResult}
                  onNavigate={setActivePage}
                />
              )}

              {activePage === 'compare' && (
                <ComparePage
                  scenarios={scenarios}
                  onNavigate={setActivePage}
                  realisticResult={realisticResult}
                />
              )}

              {activePage === 'report' && (
                <ReportPage
                  result={currentResult}
                  onNavigate={setActivePage}
                />
              )}

              {activePage === 'quantum-simulation' && (
                <QuantumSimulationPage
                  onNavigate={setActivePage}
                />
              )}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
