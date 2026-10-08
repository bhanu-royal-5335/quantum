import React, { useState } from 'react';
import {
  Play,
  Sparkles,
  Satellite,
  Cloud,
  Radio,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sun,
  CloudRain,
  CloudSun,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Check,
  ArrowRight,
  Info,
  RotateCcw,
  MapPin
} from 'lucide-react';
import {
  ChannelParameters,
  SimulationResult,
  RecentSimulation,
  RealisticSimulationResult,
  GroundStationConfig,
  PRESET_GROUND_STATIONS
} from '../types/quantum';
import { SimpleArchitectureFlow } from '../components/SimpleArchitectureFlow';
import { PageId } from '../components/Sidebar';

interface Props {
  parameters: ChannelParameters;
  onChangeParameters: (params: ChannelParameters) => void;
  currentResult: SimulationResult | null;
  recentSimulations: RecentSimulation[];
  isSimulating: boolean;
  onNavigate: (page: PageId) => void;
  onRunSimulation: () => void;
  onRunDemo: () => void;
  // Research mode props preserved
  appMode?: 'simple' | 'research';
  simulationMode?: 'standard' | 'realistic';
  onModeChange?: (mode: 'standard' | 'realistic') => void;
  selectedNoradId?: number;
  onSelectSatellite?: (id: number) => void;
  groundStation?: GroundStationConfig;
  onChangeGroundStation?: (gs: GroundStationConfig) => void;
  realisticResult?: RealisticSimulationResult | null;
}

export type ScenarioSelection = 'satellite_hap' | 'satellite' | 'ground';

export const DashboardPage: React.FC<Props> = ({
  parameters,
  onChangeParameters,
  currentResult,
  recentSimulations,
  isSimulating,
  onNavigate,
  onRunSimulation,
  onRunDemo,
  appMode = 'simple',
  groundStation,
  onChangeGroundStation
}) => {
  // Scenario Selection: 'satellite_hap' (default/preferred), 'satellite', 'ground'
  const [selectedScenario, setSelectedScenario] = useState<ScenarioSelection>(
    parameters.has_relay ? 'satellite_hap' : (parameters.satellite_altitude < 100 ? 'ground' : 'satellite')
  );

  // Distance presets: 300, 500, 1000, or 'custom'
  const [distancePreset, setDistancePreset] = useState<'300' | '500' | '1000' | 'custom'>('500');
  const [customDistance, setCustomDistance] = useState<number>(parameters.satellite_altitude || 500);

  // Weather presets: 'clear', 'moderate', 'poor'
  const [weatherPreset, setWeatherPreset] = useState<'clear' | 'moderate' | 'poor'>(
    parameters.visibility >= 18 ? 'clear' : parameters.visibility >= 8 ? 'moderate' : 'poor'
  );

  // Eavesdropper state: 'off', 'on'
  const [eavesdropper, setEavesdropper] = useState<'off' | 'on'>(
    parameters.optical_error_rate > 0.05 ? 'on' : 'off'
  );

  // Advanced settings collapsible toggle
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Handle Scenario Choice
  const handleSelectScenario = (type: ScenarioSelection) => {
    setSelectedScenario(type);
    if (type === 'satellite_hap') {
      onChangeParameters({
        ...parameters,
        has_relay: true,
        relay_altitude: 20.0,
        relay_efficiency: 0.85,
        relay_aperture: 0.35,
        satellite_altitude: distancePreset === 'custom' ? customDistance : Number(distancePreset),
        optical_error_rate: eavesdropper === 'on' ? 0.08 : 0.015
      });
    } else if (type === 'satellite') {
      onChangeParameters({
        ...parameters,
        has_relay: false,
        relay_altitude: 0.0,
        satellite_altitude: distancePreset === 'custom' ? customDistance : Number(distancePreset),
        optical_error_rate: eavesdropper === 'on' ? 0.08 : 0.015
      });
    } else if (type === 'ground') {
      onChangeParameters({
        ...parameters,
        has_relay: false,
        relay_altitude: 0.0,
        satellite_altitude: 50.0, // horizontal distance simulation
        optical_error_rate: eavesdropper === 'on' ? 0.08 : 0.015
      });
    }
  };

  // Handle Distance Preset Choice
  const handleDistanceChange = (preset: '300' | '500' | '1000' | 'custom', customVal?: number) => {
    setDistancePreset(preset);
    const dist = preset === 'custom' ? (customVal !== undefined ? customVal : customDistance) : Number(preset);
    if (preset === 'custom' && customVal !== undefined) {
      setCustomDistance(customVal);
    }
    onChangeParameters({
      ...parameters,
      satellite_altitude: dist
    });
  };

  // Handle Weather Choice
  const handleWeatherChange = (weather: 'clear' | 'moderate' | 'poor') => {
    setWeatherPreset(weather);
    if (weather === 'clear') {
      onChangeParameters({
        ...parameters,
        visibility: 20.0,
        atmospheric_condition: 'clear',
        turbulence_level: 'low',
        cn2_ground: 1e-15
      });
    } else if (weather === 'moderate') {
      onChangeParameters({
        ...parameters,
        visibility: 10.0,
        atmospheric_condition: 'clear',
        turbulence_level: 'moderate',
        cn2_ground: 1e-14
      });
    } else if (weather === 'poor') {
      onChangeParameters({
        ...parameters,
        visibility: 3.0,
        atmospheric_condition: 'haze',
        turbulence_level: 'strong',
        cn2_ground: 1e-13
      });
    }
  };

  // Handle Eavesdropper Choice
  const handleEavesdropperChange = (status: 'off' | 'on') => {
    setEavesdropper(status);
    onChangeParameters({
      ...parameters,
      optical_error_rate: status === 'on' ? 0.08 : 0.015
    });
  };

  // Update specific advanced field
  const updateAdvancedField = <K extends keyof ChannelParameters>(key: K, value: ChannelParameters[K]) => {
    onChangeParameters({
      ...parameters,
      [key]: value
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 md:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>National Quantum Mission Prototype</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Satellite-Assisted Quantum Key Distribution
          </h1>

          <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
            Simulate secure quantum communication using LEO satellites and HAP-assisted optical links under realistic conditions.
          </p>
        </div>
      </div>

      {/* 2. Simple Visual Communication Architecture */}
      <SimpleArchitectureFlow
        hasRelay={parameters.has_relay}
        distanceKm={parameters.satellite_altitude}
        relayAltitudeKm={parameters.relay_altitude}
        isSimulating={isSimulating}
        eavesdropperActive={eavesdropper === 'on'}
        groundStationName={groundStation?.name}
      />

      {/* 3. Choose a Simulation (3 Scenario Cards) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Choose a Simulation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select the communication architecture you want to evaluate:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Option 1: Satellite + HAP Relay (Preferred Default) */}
          <div
            onClick={() => handleSelectScenario('satellite_hap')}
            className={`cursor-pointer rounded-xl p-4.5 border-2 transition-all relative flex flex-col justify-between ${
              selectedScenario === 'satellite_hap'
                ? 'border-sky-600 bg-sky-50/50 shadow-sm ring-2 ring-sky-500/10'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Recommended
              </span>
            </div>

            <div>
              <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
                <div className="flex items-center gap-0.5">
                  <Satellite className="w-4 h-4 text-sky-700" />
                  <Cloud className="w-3.5 h-3.5 text-sky-500" />
                </div>
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Satellite + HAP Relay
              </h3>
              <p className="text-xs font-medium text-sky-700 mt-1">
                Ground → LEO Satellite → HAP → Ground
              </p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Interposes a 20 km stratospheric relay to bypass &gt;95% of turbulent boundary-layer loss.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-emerald-700">Highest Key Rate</span>
              {selectedScenario === 'satellite_hap' && (
                <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>

          {/* Option 2: Direct Satellite QKD */}
          <div
            onClick={() => handleSelectScenario('satellite')}
            className={`cursor-pointer rounded-xl p-4.5 border-2 transition-all relative flex flex-col justify-between ${
              selectedScenario === 'satellite'
                ? 'border-sky-600 bg-sky-50/50 shadow-sm ring-2 ring-sky-500/10'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                <Satellite className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Satellite QKD
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-1">
                Ground → LEO Satellite → Ground
              </p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Direct space-to-ground downlink without stratospheric assistance; subject to full atmospheric jitter.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-slate-600">Standard Orbit</span>
              {selectedScenario === 'satellite' && (
                <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>

          {/* Option 3: Ground QKD */}
          <div
            onClick={() => handleSelectScenario('ground')}
            className={`cursor-pointer rounded-xl p-4.5 border-2 transition-all relative flex flex-col justify-between ${
              selectedScenario === 'ground'
                ? 'border-sky-600 bg-sky-50/50 shadow-sm ring-2 ring-sky-500/10'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                <Radio className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Ground QKD
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-1">
                Ground → Terrestrial / Fibre → Ground
              </p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Terrestrial link through ground fog and heavy boundary layer turbulence without space segment.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-slate-600">Short Range</span>
              {selectedScenario === 'ground' && (
                <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Basic Conditions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Basic Conditions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Control 1: Distance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Distance</label>
              <span className="text-xs font-mono text-sky-700 font-bold">
                {parameters.satellite_altitude} km
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
              {(['300', '500', '1000', 'custom'] as const).map((dist) => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => handleDistanceChange(dist)}
                  className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer capitalize ${
                    distancePreset === dist
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dist === 'custom' ? 'Custom' : `${dist} km`}
                </button>
              ))}
            </div>

            {distancePreset === 'custom' && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="range"
                  min="200"
                  max="1500"
                  step="50"
                  value={customDistance}
                  onChange={(e) => handleDistanceChange('custom', Number(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <input
                  type="number"
                  min="100"
                  max="2000"
                  value={customDistance}
                  onChange={(e) => handleDistanceChange('custom', Number(e.target.value))}
                  className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono text-right"
                />
              </div>
            )}
          </div>

          {/* Control 2: Weather */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Weather Condition</label>
              <span className="text-xs text-slate-500 capitalize">{weatherPreset}</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleWeatherChange('clear')}
                className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  weatherPreset === 'clear'
                    ? 'bg-white text-emerald-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={() => handleWeatherChange('moderate')}
                className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  weatherPreset === 'moderate'
                    ? 'bg-white text-sky-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CloudSun className="w-3.5 h-3.5 text-sky-500" />
                <span>Moderate</span>
              </button>

              <button
                type="button"
                onClick={() => handleWeatherChange('poor')}
                className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  weatherPreset === 'poor'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5 text-indigo-500" />
                <span>Poor</span>
              </button>
            </div>
          </div>

          {/* Control 3: Eavesdropper */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Eavesdropper (Eve)</label>
              <span className={`text-xs font-bold ${eavesdropper === 'on' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {eavesdropper === 'on' ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleEavesdropperChange('off')}
                className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  eavesdropper === 'off'
                    ? 'bg-white text-emerald-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>OFF (Secure)</span>
              </button>

              <button
                type="button"
                onClick={() => handleEavesdropperChange('on')}
                className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  eavesdropper === 'on'
                    ? 'bg-white text-rose-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>ON (Attack)</span>
              </button>
            </div>
          </div>

          {/* Control 4: Ground Station */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Local Station (Bob)
              </label>
              <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                {groundStation?.latitude?.toFixed(1)}°N, {groundStation?.longitude?.toFixed(1)}°E
              </span>
            </div>

            <div className="p-1 bg-slate-100 rounded-xl border border-slate-200">
              <select
                value={groundStation?.name || PRESET_GROUND_STATIONS[0].name}
                onChange={(e) => {
                  const sel = PRESET_GROUND_STATIONS.find((p) => p.name === e.target.value);
                  if (sel && onChangeGroundStation) {
                    onChangeGroundStation(sel);
                  }
                }}
                className="w-full py-1.5 px-2 bg-white rounded-lg text-xs font-semibold text-slate-800 shadow-xs border-0 outline-none cursor-pointer"
              >
                {PRESET_GROUND_STATIONS.map((gs) => (
                  <option key={gs.name} value={gs.name}>
                    {gs.name.replace(' Quantum Communication Station', ' (Amaravati)')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Collapsible Advanced Settings */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-sky-600" />
            <span className="text-sm font-bold text-slate-900">Advanced Settings</span>
            <span className="text-xs text-slate-500 font-normal hidden sm:inline">
              (Optical wavelength, pointing jitter, detector efficiency, Monte Carlo)
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-sky-600">
            <span>{showAdvanced ? 'Hide' : 'Configure'}</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showAdvanced && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Optical Hardware */}
              <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Optical Bench &amp; Lasers
                </h4>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Wavelength (λ)</span>
                    <span className="font-mono font-bold text-slate-800">{parameters.wavelength} nm</span>
                  </div>
                  <input
                    type="range"
                    min="700"
                    max="1600"
                    step="10"
                    value={parameters.wavelength}
                    onChange={(e) => updateAdvancedField('wavelength', Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Transmitter Aperture (D_tx)</span>
                    <span className="font-mono font-bold text-slate-800">{parameters.transmitter_aperture} m</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="1.00"
                    step="0.05"
                    value={parameters.transmitter_aperture}
                    onChange={(e) => updateAdvancedField('transmitter_aperture', Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Receiver Aperture (D_rx)</span>
                    <span className="font-mono font-bold text-slate-800">{parameters.receiver_aperture} m</span>
                  </div>
                  <input
                    type="range"
                    min="0.20"
                    max="2.00"
                    step="0.05"
                    value={parameters.receiver_aperture}
                    onChange={(e) => updateAdvancedField('receiver_aperture', Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Column 2: Platform Jitter & Atmosphere */}
              <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Pointing Jitter &amp; Turbulence
                </h4>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Pointing Jitter (σ_s)</span>
                    <span className="font-mono font-bold text-slate-800">{parameters.pointing_error} μrad</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="15.0"
                    step="0.5"
                    value={parameters.pointing_error}
                    onChange={(e) => updateAdvancedField('pointing_error', Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Ground Turbulence (Cn²)</span>
                    <span className="font-mono font-bold text-slate-800">{parameters.cn2_ground.toExponential(1)} m⁻²/³</span>
                  </div>
                  <input
                    type="range"
                    min="-16"
                    max="-12"
                    step="0.5"
                    value={Math.log10(parameters.cn2_ground)}
                    onChange={(e) => updateAdvancedField('cn2_ground', Math.pow(10, Number(e.target.value)))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Stratospheric Relay Altitude</span>
                    <span className="font-mono font-bold text-slate-800">{parameters.relay_altitude} km</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="28"
                    step="1"
                    disabled={!parameters.has_relay}
                    value={parameters.relay_altitude}
                    onChange={(e) => updateAdvancedField('relay_altitude', Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Column 3: Detectors & Simulation Engine */}
              <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Detectors &amp; Monte Carlo
                </h4>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Detector Efficiency (η_det)</span>
                    <span className="font-mono font-bold text-slate-800">{(parameters.detector_efficiency * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.30"
                    max="0.95"
                    step="0.05"
                    value={parameters.detector_efficiency}
                    onChange={(e) => updateAdvancedField('detector_efficiency', Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Transmitted Pulses</span>
                    <span className="font-mono font-bold text-slate-800">{parameters.num_bits.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="1000"
                    value={parameters.num_bits}
                    onChange={(e) => updateAdvancedField('num_bits', Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Monte Carlo Iterations</span>
                    <span className="font-mono font-bold text-slate-800">{parameters.monte_carlo_iterations}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={parameters.monte_carlo_iterations}
                    onChange={(e) => updateAdvancedField('monte_carlo_iterations', Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. ONE MAIN RUN BUTTON */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="text-center sm:text-left">
          <span className="text-xs font-bold text-slate-900 block">
            Ready to simulate quantum key distribution
          </span>
          <span className="text-xs text-slate-500">
            Selected: <strong className="text-slate-800 capitalize">{selectedScenario.replace('_', ' + ')}</strong> • {parameters.satellite_altitude} km • {weatherPreset} weather • Eve {eavesdropper}
          </span>
        </div>

        <button
          type="button"
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2.5 text-base cursor-pointer tracking-wide"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>RUN SIMULATION</span>
        </button>
      </div>
    </div>
  );
};
