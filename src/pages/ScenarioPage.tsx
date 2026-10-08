import React, { useState } from 'react';
import {
  BookmarkCheck,
  Check,
  Plus,
  Play,
  Sliders,
  Layers,
  Wind,
  Target,
  Eye,
  Satellite
} from 'lucide-react';
import { ScenarioResponse, ChannelParameters } from '../types/quantum';
import { PageId } from '../components/Sidebar';

interface Props {
  scenarios: ScenarioResponse[];
  activeScenarioId: string;
  onSelectScenario: (scen: ScenarioResponse) => void;
  onCreateScenario: (name: string, description: string, params: ChannelParameters) => Promise<void>;
  onNavigate: (page: PageId) => void;
  onRunSimulation: () => void;
}

export const ScenarioPage: React.FC<Props> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onCreateScenario,
  onNavigate,
  onRunSimulation
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customAlt, setCustomAlt] = useState(600);
  const [customRelay, setCustomRelay] = useState(true);
  const [customTurb, setCustomTurb] = useState('moderate');
  const [customVis, setCustomVis] = useState(15.0);
  const [customJitter, setCustomJitter] = useState(3.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    setIsSubmitting(true);
    try {
      const activeScen = scenarios.find((s) => s.id === activeScenarioId);
      const baseParams: ChannelParameters = activeScen
        ? { ...activeScen.parameters }
        : {
            satellite_altitude: 500.0,
            satellite_position: 'LEO Orbit (500 km)',
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

      baseParams.satellite_altitude = customAlt;
      baseParams.has_relay = customRelay;
      baseParams.turbulence_level = customTurb;
      baseParams.visibility = customVis;
      baseParams.pointing_error = customJitter;

      await onCreateScenario(customName, customDesc, baseParams);
      setShowCreateModal(false);
      setCustomName('');
      setCustomDesc('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-cyan-600" />
            Quantum Communication Scenarios
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Select a benchmark scenario or author custom optical link and atmospheric configurations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Scenario</span>
          </button>
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scenarios.map((scen) => {
          const isSelected = scen.id === activeScenarioId;
          const p = scen.parameters;

          return (
            <div
              key={scen.id}
              className={`rounded-xl border p-5 transition-all flex flex-col justify-between relative bg-white ${
                isSelected
                  ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {isSelected && (
                <span className="absolute -top-2.5 right-4 bg-cyan-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Check className="w-3 h-3" /> ACTIVE SCENARIO
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    scen.is_default ? 'bg-slate-100 text-slate-600' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {scen.is_default ? 'Benchmark Model' : 'Custom Config'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {p.wavelength} nm
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                  {scen.name}
                </h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                  {scen.description}
                </p>

                {/* Key Spec Badges */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Satellite className="w-3.5 h-3.5 text-blue-600" /> Orbit Distance
                    </span>
                    <strong className="text-slate-800">{p.satellite_altitude} km LEO</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" /> Topology
                    </span>
                    <strong className={p.has_relay ? 'text-emerald-700' : 'text-amber-600'}>
                      {p.has_relay ? `HAP Relay (${p.relay_altitude} km)` : 'Direct Downlink'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Wind className="w-3.5 h-3.5 text-cyan-600" /> Turbulence
                    </span>
                    <strong className="capitalize text-slate-800">{p.turbulence_level}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" /> Visibility
                    </span>
                    <strong className="text-slate-800">{p.visibility} km ({p.atmospheric_condition})</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Target className="w-3.5 h-3.5 text-amber-600" /> Pointing Jitter
                    </span>
                    <strong className="text-slate-800">{p.pointing_error} μrad</strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => onSelectScenario(scen)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'
                  }`}
                >
                  {isSelected ? 'Selected Active' : 'Load Scenario'}
                </button>

                <button
                  onClick={() => {
                    onSelectScenario(scen);
                    onRunSimulation();
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1 cursor-pointer transition-colors"
                  title="Load and immediately execute this scenario"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Creating Custom Scenario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Create Custom Quantum Scenario
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Configure specialized link geometries and atmospheric parameters for storage in SQLite
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scenario Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Scenario Custom: Stratospheric Polar Link"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the research objective or simulated environmental condition..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satellite Altitude (km)</label>
                  <input
                    type="number"
                    min={200}
                    max={2000}
                    value={customAlt}
                    onChange={(e) => setCustomAlt(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Relay / HAP Active?</label>
                  <select
                    value={customRelay ? 'yes' : 'no'}
                    onChange={(e) => setCustomRelay(e.target.value === 'yes')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="yes">With Relay (HAP at 20 km)</option>
                    <option value="no">Direct Downlink (No Relay)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Turbulence</label>
                  <select
                    value={customTurb}
                    onChange={(e) => setCustomTurb(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="low">Low (1e-15)</option>
                    <option value="moderate">Moderate (1e-14)</option>
                    <option value="strong">Strong (1e-13)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Visibility (km)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={customVis}
                    onChange={(e) => setCustomVis(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jitter (μrad)</label>
                  <input
                    type="number"
                    min={0.5}
                    max={30}
                    step={0.5}
                    value={customJitter}
                    onChange={(e) => setCustomJitter(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
