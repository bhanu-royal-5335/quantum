import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sparkles,
  Microscope,
  MapPin,
  Sliders,
  Database,
  Radio,
  BookmarkCheck,
  RotateCcw,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { ChannelParameters, GroundStationConfig, PRESET_GROUND_STATIONS } from '../types/quantum';
import { PageId } from '../components/Sidebar';

interface Props {
  appMode: 'simple' | 'research';
  onToggleMode: (mode: 'simple' | 'research') => void;
  parameters: ChannelParameters;
  onChangeParameters: (params: ChannelParameters) => void;
  groundStation: GroundStationConfig;
  onChangeGroundStation: (gs: GroundStationConfig) => void;
  onNavigate: (page: PageId) => void;
}

export const SettingsPage: React.FC<Props> = ({
  appMode,
  onToggleMode,
  parameters,
  onChangeParameters,
  groundStation,
  onChangeGroundStation,
  onNavigate
}) => {
  const [stationName, setStationName] = useState(groundStation.name);
  const [lat, setLat] = useState(groundStation.latitude);
  const [lon, setLon] = useState(groundStation.longitude);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setStationName(groundStation.name);
    setLat(groundStation.latitude);
    setLon(groundStation.longitude);
  }, [groundStation]);

  const handleSaveGroundStation = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeGroundStation({
      ...groundStation,
      name: stationName,
      latitude: lat,
      longitude: lon
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    onChangeParameters({
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
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            System Preferences
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Application Settings &amp; Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure experience mode, ground receiver coordinates, and simulation defaults
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      {/* Mode Selection Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-2">
          Experience Mode
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Choose whether to display the streamlined beginner workflow or the full scientific research suite.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => onToggleMode('simple')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
              appMode === 'simple'
                ? 'border-sky-600 bg-sky-50/50 shadow-xs ring-2 ring-sky-500/10'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-sm text-slate-900">Simple Mode</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Streamlined flow: Scenario → Distance, Weather, Eavesdropper → Run → Results → Human Explanation.
            </p>
          </div>

          <div
            onClick={() => onToggleMode('research')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
              appMode === 'research'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/10'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Microscope className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">Research Mode</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exposes full orbital ephemeris, NASA MERRA-2 dataset studio, NQM live canvas, and 16-parameter optical bench.
            </p>
          </div>
        </div>
      </div>

      {/* Ground Station Configuration */}
      <form onSubmit={handleSaveGroundStation} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600" />
              Optical Ground Station (OGS) Coordinates
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Receiving station location for SGP4 elevation look angle propagation
            </p>
          </div>
        </div>

        {/* Station Presets */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Quick Station Presets:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_GROUND_STATIONS.map((preset) => {
              const isSelected = stationName === preset.name || (preset.name.includes('Amaravati') && stationName.includes('Amaravati'));
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setStationName(preset.name);
                    setLat(preset.latitude);
                    setLon(preset.longitude);
                    onChangeGroundStation({
                      ...preset,
                      min_elevation_deg: groundStation.min_elevation_deg
                    });
                    setSavedSuccess(true);
                    setTimeout(() => setSavedSuccess(false), 2000);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-500/10'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{preset.name.replace(' Quantum Communication Station', ' (Amaravati)')}</span>
                  {preset.name.includes('Amaravati') && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-300 ml-0.5">
                      New
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-600 font-semibold block mb-1">Station Identifier</label>
            <input
              type="text"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-600 font-semibold block mb-1">Latitude (°N)</label>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-600 font-semibold block mb-1">Longitude (°E)</label>
            <input
              type="number"
              step="0.0001"
              value={lon}
              onChange={(e) => setLon(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-mono"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs cursor-pointer transition-colors"
          >
            Save Ground Station
          </button>
        </div>
      </form>

      {/* Reset Defaults & Research Tools Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Reset Channel Parameters</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Restore baseline 500 km LEO, 20 km HAP relay, and 1550 nm optical parameters
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      {/* Research Mode Links if Research Mode is active */}
      {appMode === 'research' && (
        <div className="bg-indigo-50/50 rounded-2xl border border-indigo-200 p-6 space-y-3">
          <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
            Research Mode Fast Navigation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <button
              onClick={() => onNavigate('dataset')}
              className="p-3 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 text-left transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-800">NASA MERRA-2 Dataset</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate('quantum-simulation')}
              className="p-3 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 text-left transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-800">NQM Live 3D Studio</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate('parameters')}
              className="p-3 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 text-left transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-800">Full Parameter Bench</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
