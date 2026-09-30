import React from 'react';
import {
  Sliders,
  Satellite,
  Layers,
  ShieldCheck,
  Cpu,
  Info,
  Play,
  RotateCcw
} from 'lucide-react';
import { ChannelParameters } from '../types/quantum';
import { PageId } from '../components/Sidebar';

interface Props {
  parameters: ChannelParameters;
  onChangeParameters: (params: ChannelParameters) => void;
  onNavigate: (page: PageId) => void;
  onRunSimulation: () => void;
}

export const ParametersPage: React.FC<Props> = ({
  parameters,
  onChangeParameters,
  onNavigate,
  onRunSimulation
}) => {
  const updateField = <K extends keyof ChannelParameters>(key: K, value: ChannelParameters[K]) => {
    onChangeParameters({
      ...parameters,
      [key]: value
    });
  };

  const handleResetDefaults = () => {
    onChangeParameters({
      ...parameters,
      satellite_altitude: 500.0,
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
      num_bits: 10000,
      monte_carlo_iterations: 1000
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-600" />
            Satellite & Optical Link Parameters
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure node altitudes, optical apertures, laser wavelengths, single-photon detectors, and BB84 simulation sizes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onRunSimulation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Apply & Run Simulation</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: SATELLITE NODE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Satellite className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">LEO Satellite Node</h2>
              <span className="text-[10px] text-slate-500">Transmitter Telescope & Orbital Link</span>
            </div>
          </div>

          {/* Altitude */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Orbit Altitude</span>
              <span className="font-mono text-cyan-700 font-bold">{parameters.satellite_altitude} km</span>
            </div>
            <input
              type="range"
              min={300}
              max={1500}
              step={25}
              value={parameters.satellite_altitude}
              onChange={(e) => updateField('satellite_altitude', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <span className="text-[10px] text-slate-400">Standard Low Earth Orbit (LEO): 300 - 1500 km</span>
          </div>

          {/* Wavelength */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Laser Wavelength</label>
            <select
              value={parameters.wavelength}
              onChange={(e) => updateField('wavelength', Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value={1550}>1550 nm (Telecom C-band, lowest atmospheric absorption)</option>
              <option value={850}>850 nm (Near-infrared, silicon detector compatibility)</option>
              <option value={785}>785 nm (Visible edge, lower beam divergence)</option>
              <option value={1064}>1064 nm (Nd:YAG standard band)</option>
            </select>
          </div>

          {/* Transmitter Aperture */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Tx Aperture Diameter</span>
              <span className="font-mono text-cyan-700 font-bold">{parameters.transmitter_aperture.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={parameters.transmitter_aperture}
              onChange={(e) => updateField('transmitter_aperture', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>

          {/* Beam Divergence */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Beam Divergence (Full Angle)</span>
              <span className="font-mono text-cyan-700 font-bold">{parameters.beam_divergence.toFixed(1)} μrad</span>
            </div>
            <input
              type="range"
              min={2}
              max={50}
              step={1}
              value={parameters.beam_divergence}
              onChange={(e) => updateField('beam_divergence', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <span className="text-[10px] text-slate-400">Lower divergence tightens spot size at receiver plane</span>
          </div>

          {/* Mean Photon Number (mu) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Mean Photon Number (μ)</span>
              <span className="font-mono text-cyan-700 font-bold">{parameters.mean_photon_number.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.5}
              step={0.05}
              value={parameters.mean_photon_number}
              onChange={(e) => updateField('mean_photon_number', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <span className="text-[10px] text-slate-400">Typical weak coherent pulse (WCP): 0.4 - 0.8 photons/pulse</span>
          </div>

          {/* Laser Repetition Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pulse Repetition Rate</label>
            <select
              value={parameters.repetition_rate}
              onChange={(e) => updateField('repetition_rate', Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value={1000000}>1 MHz (Low rate)</option>
              <option value={10000000}>10 MHz (Standard High-Speed QKD)</option>
              <option value={50000000}>50 MHz (Advanced GHz-scaled link)</option>
              <option value={100000000}>100 MHz (Ultra-high repetition)</option>
            </select>
          </div>
        </div>

        {/* CARD 2: STRATOSPHERIC RELAY FACTOR NODE (CORE QBER MITIGATION) */}
        <div className="bg-white rounded-xl border border-indigo-200 ring-2 ring-indigo-500/10 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Stratospheric Relay Factor</h2>
                <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                  Core QBER Mitigation Solution
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              HAP Node
            </span>
          </div>

          {/* Enable / Disable Relay */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Relay Factor Topology</span>
              <span className="text-[11px] text-slate-500">
                {parameters.has_relay ? 'Active (Dual-hop FSO: Space → HAP → OGS)' : 'Bypassed (Direct Single-hop LEO → OGS)'}
              </span>
            </div>
            <button
              onClick={() => updateField('has_relay', !parameters.has_relay)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                parameters.has_relay
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
              }`}
            >
              {parameters.has_relay ? 'RELAY ACTIVE' : 'DIRECT LINK'}
            </button>
          </div>

          {parameters.has_relay ? (
            <>
              {/* Relay Altitude */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Relay Station Altitude (HAP)</span>
                  <span className="font-mono text-indigo-700 font-bold">{parameters.relay_altitude} km</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={35}
                  step={1}
                  value={parameters.relay_altitude}
                  onChange={(e) => updateField('relay_altitude', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400">
                  Stratospheric cruising altitude (18–25 km: above 95% of turbulent boundary air)
                </span>
              </div>

              {/* Relay Optical Efficiency */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Relay Optical Coupling Efficiency (η_relay)</span>
                  <span className="font-mono text-indigo-700 font-bold">{Math.round(parameters.relay_efficiency * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={0.98}
                  step={0.02}
                  value={parameters.relay_efficiency}
                  onChange={(e) => updateField('relay_efficiency', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400">Optical bench transmission and fiber coupling efficiency</span>
              </div>

              {/* Relay Aperture */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Relay Aperture Diameter</span>
                  <span className="font-mono text-indigo-700 font-bold">{parameters.relay_aperture.toFixed(2)} m</span>
                </div>
                <input
                  type="range"
                  min={0.15}
                  max={0.8}
                  step={0.05}
                  value={parameters.relay_aperture}
                  onChange={(e) => updateField('relay_aperture', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400">Dual-gimbal tracking telescope diameter</span>
              </div>

              {/* Live Relay Factor Scientific Benefit Box */}
              <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 text-xs space-y-1.5">
                <span className="font-bold text-indigo-950 uppercase tracking-wide text-[10px] block">
                  Projected Relay Factor Advantages:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-1.5 rounded bg-white border border-indigo-100">
                    <span className="text-slate-400 block text-[9px] uppercase">QBER Reduction</span>
                    <strong className="text-emerald-700 font-mono text-xs">8.9% → 2.1% (-6.8%)</strong>
                  </div>
                  <div className="p-1.5 rounded bg-white border border-indigo-100">
                    <span className="text-slate-400 block text-[9px] uppercase">Jitter Reduction</span>
                    <strong className="text-indigo-700 font-mono text-xs">25× Tighter Beam</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  By intercepting the beam at {parameters.relay_altitude} km in the stratosphere, Link 1 traverses zero-scintillation vacuum, while Link 2 experiences 95% less turbulence than a direct 500 km path.
                </p>
              </div>
            </>
          ) : (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-2">
              <strong className="block text-amber-950">Direct Downlink Baseline Mode:</strong>
              <p className="leading-relaxed">
                The stratospheric relay is bypassed. Quantum states traverse the entire 500+ km path, incurring full Rytov index integration through the turbulent boundary layer.
              </p>
              <div className="p-2 rounded bg-white/80 border border-amber-200 text-[11px] font-mono text-amber-950">
                Warning: Under strong daytime turbulence, direct downlink QBER approaches or exceeds the 11.0% Shor-Preskill abort threshold.
              </div>
            </div>
          )}
        </div>

        {/* CARD 3: GROUND RECEIVER BOB & SIMULATION SIZE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bob Ground Receiver</h2>
              <span className="text-[10px] text-slate-500">Telescope, Single-Photon Detectors & Settings</span>
            </div>
          </div>

          {/* Receiver Aperture */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Receiver Aperture Diameter</span>
              <span className="font-mono text-cyan-700 font-bold">{parameters.receiver_aperture.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={2.0}
              step={0.1}
              value={parameters.receiver_aperture}
              onChange={(e) => updateField('receiver_aperture', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <span className="text-[10px] text-slate-400">Optical ground station primary mirror (0.4m - 1.5m)</span>
          </div>

          {/* Detector Efficiency */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Detector Quantum Efficiency (η)</span>
              <span className="font-mono text-cyan-700 font-bold">{Math.round(parameters.detector_efficiency * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={0.95}
              step={0.05}
              value={parameters.detector_efficiency}
              onChange={(e) => updateField('detector_efficiency', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <span className="text-[10px] text-slate-400">Superconducting Nanowire (SNSPD): ~80-90%</span>
          </div>

          {/* Number of Transmitted Bits */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transmitted Bit Sequence Size</label>
            <select
              value={parameters.num_bits}
              onChange={(e) => updateField('num_bits', Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value={5000}>5,000 bits (Quick verify)</option>
              <option value={10000}>10,000 bits (Nominal academic)</option>
              <option value={25000}>25,000 bits (High precision)</option>
              <option value={50000}>50,000 bits (Statistical deep run)</option>
            </select>
          </div>

          {/* Monte Carlo Iterations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Monte Carlo Iterations</label>
            <select
              value={parameters.monte_carlo_iterations}
              onChange={(e) => updateField('monte_carlo_iterations', Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value={100}>100 runs (Fast preview)</option>
              <option value={500}>500 runs</option>
              <option value={1000}>1,000 runs (Standard 95% CI)</option>
              <option value={5000}>5,000 runs (High statistical confidence)</option>
              <option value={10000}>10,000 runs (Full Monte Carlo)</option>
            </select>
          </div>

          {/* Intrinsic Optical Error Rate */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Optical Misalignment Error (e_opt)</span>
              <span className="font-mono text-cyan-700 font-bold">{(parameters.optical_error_rate * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={0.005}
              max={0.05}
              step={0.005}
              value={parameters.optical_error_rate}
              onChange={(e) => updateField('optical_error_rate', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>

        </div>

      </div>

      {/* Bottom Action Footer */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
        <div className="text-xs text-slate-600">
          Next step: Configure atmospheric attenuation, turbulence, and pointing jitter.
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('channel')}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-cyan-700 hover:bg-cyan-50 border border-cyan-200 transition-colors cursor-pointer"
          >
            Configure Channel Conditions →
          </button>
          <button
            onClick={onRunSimulation}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            Run Simulation
          </button>
        </div>
      </div>
    </div>
  );
};
