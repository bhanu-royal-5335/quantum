import React from 'react';
import {
  CloudSun,
  Eye,
  Wind,
  Target,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { ChannelParameters } from '../types/quantum';
import { PageId } from '../components/Sidebar';

interface Props {
  parameters: ChannelParameters;
  onChangeParameters: (params: ChannelParameters) => void;
  onNavigate: (page: PageId) => void;
  onRunSimulation: () => void;
}

export const ChannelPage: React.FC<Props> = ({
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

  // Visibility preset selector
  const handleVisibilityPreset = (preset: string) => {
    if (preset === 'excellent') {
      onChangeParameters({ ...parameters, visibility: 35.0, atmospheric_condition: 'clear' });
    } else if (preset === 'good') {
      onChangeParameters({ ...parameters, visibility: 20.0, atmospheric_condition: 'clear' });
    } else if (preset === 'moderate') {
      onChangeParameters({ ...parameters, visibility: 8.0, atmospheric_condition: 'haze' });
    } else if (preset === 'poor') {
      onChangeParameters({ ...parameters, visibility: 2.5, atmospheric_condition: 'moderate_fog' });
    }
  };

  // Turbulence preset selector
  const handleTurbulencePreset = (level: string) => {
    if (level === 'low') {
      onChangeParameters({ ...parameters, turbulence_level: 'low', cn2_ground: 1e-15 });
    } else if (level === 'moderate') {
      onChangeParameters({ ...parameters, turbulence_level: 'moderate', cn2_ground: 1e-14 });
    } else if (level === 'strong') {
      onChangeParameters({ ...parameters, turbulence_level: 'strong', cn2_ground: 1e-13 });
    }
  };

  // Pointing error preset selector
  const handlePointingPreset = (level: string) => {
    if (level === 'low') {
      onChangeParameters({ ...parameters, pointing_level: 'low', pointing_error: 1.5 });
    } else if (level === 'moderate') {
      onChangeParameters({ ...parameters, pointing_level: 'moderate', pointing_error: 4.0 });
    } else if (level === 'high') {
      onChangeParameters({ ...parameters, pointing_level: 'high', pointing_error: 10.0 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-cyan-600" />
            Atmospheric & Environmental Channel Conditions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure Kruse/Kim aerosol attenuation, boundary-layer turbulence (Cn²), transceiver pointing jitter, and detector noise
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunSimulation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Apply & Run Simulation</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. ATMOSPHERIC ATTENUATION (KIM / KRUSE) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Atmospheric Visibility & Extinction</h2>
              <span className="text-[10px] text-slate-500">Kim & Kruse Aerosol Scattering Model</span>
            </div>
          </div>

          {/* Visibility Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Preset Atmospheric Visibility</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'excellent', label: 'Excellent (35 km)', vis: 35.0 },
                { id: 'good', label: 'Good (20 km)', vis: 20.0 },
                { id: 'moderate', label: 'Hazy (8 km)', vis: 8.0 },
                { id: 'poor', label: 'Dense Fog (2.5 km)', vis: 2.5 }
              ].map((p) => {
                const isSelected = Math.abs(parameters.visibility - p.vis) < 0.5;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleVisibilityPreset(p.id)}
                    className={`py-2 px-2 text-center rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-800 font-bold ring-1 ring-cyan-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider for Visibility */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Custom Visibility (V)</span>
              <span className="font-mono text-cyan-700 font-bold">{parameters.visibility.toFixed(1)} km</span>
            </div>
            <input
              type="range"
              min={1.0}
              max={50.0}
              step={0.5}
              value={parameters.visibility}
              onChange={(e) => updateField('visibility', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <span className="text-[10px] text-slate-400">
              Extinction coefficient α(λ) = (3.91 / V) × (λ / 550)^(-q) dB/km
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
            <b>Physical Principle:</b> Space-to-Relay (Link 1) traverses high stratosphere with negligible aerosol extinction. Relay-to-Bob (Link 2) traverses the dense troposphere where fog and boundary layer haze dominate.
          </div>
        </div>

        {/* 2. ATMOSPHERIC TURBULENCE (RYTOV & SCINTILLATION) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Atmospheric Turbulence</h2>
              <span className="text-[10px] text-slate-500">Refractive Index Structure Parameter (Cn²)</span>
            </div>
          </div>

          {/* Turbulence Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Preset Turbulence Regime</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: 'Low (Cn²: 10⁻¹⁵)', desc: 'Calm Night' },
                { id: 'moderate', label: 'Moderate (Cn²: 10⁻¹⁴)', desc: 'Nominal' },
                { id: 'strong', label: 'Strong (Cn²: 10⁻¹³)', desc: 'Sunny Afternoon' }
              ].map((t) => {
                const isSelected = parameters.turbulence_level === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTurbulencePreset(t.id)}
                    className={`p-2.5 text-center rounded-lg text-xs border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold ring-1 ring-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-semibold">{t.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Cn2 */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Ground Cn² Structure Parameter</span>
              <span className="font-mono text-blue-700 font-bold">{parameters.cn2_ground.toExponential(1)} m⁻²/³</span>
            </div>
            <select
              value={parameters.cn2_ground}
              onChange={(e) => {
                updateField('cn2_ground', Number(e.target.value));
                updateField('turbulence_level', 'custom');
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value={1e-16}>1.0e-16 m⁻²/³ (Extremely Weak / Stratospheric)</option>
              <option value={1e-15}>1.0e-15 m⁻²/³ (Weak nighttime)</option>
              <option value={1e-14}>1.0e-14 m⁻²/³ (Moderate daytime)</option>
              <option value={5e-14}>5.0e-14 m⁻²/³ (Elevated thermal boundary)</option>
              <option value={1e-13}>1.0e-13 m⁻²/³ (Strong solar heating)</option>
              <option value={5e-13}>5.0e-13 m⁻²/³ (Severe Turbulence)</option>
            </select>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
            <b>Scintillation Effect:</b> High $C_n^2$ induces intensity fluctuations governed by log-normal distributions. Deep fades cause instantaneous signal loss, elevating noise ratio and QBER.
          </div>
        </div>

        {/* 3. POINTING ERROR & JITTER */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Transceiver Pointing Jitter</h2>
              <span className="text-[10px] text-slate-500">Farid & Hranilovic Angular Misalignment Model</span>
            </div>
          </div>

          {/* Pointing Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Preset Pointing Precision</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: 'Fine (1.5 μrad)', desc: 'Closed Loop / FSM' },
                { id: 'moderate', label: 'Nominal (4.0 μrad)', desc: 'Standard Platform' },
                { id: 'high', label: 'Coarse (10.0 μrad)', desc: 'Platform Jitter' }
              ].map((p) => {
                const isSelected = parameters.pointing_level === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePointingPreset(p.id)}
                    className={`p-2.5 text-center rounded-lg text-xs border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold ring-1 ring-amber-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-semibold">{p.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Jitter Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Pointing Jitter Standard Deviation (σ_s)</span>
              <span className="font-mono text-amber-700 font-bold">{parameters.pointing_error.toFixed(1)} μrad</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={25.0}
              step={0.5}
              value={parameters.pointing_error}
              onChange={(e) => {
                updateField('pointing_error', Number(e.target.value));
                updateField('pointing_level', 'custom');
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <span className="text-[10px] text-slate-400">
              Radial displacement follows a Rayleigh distribution: r ~ Rayleigh(L × σ_s)
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
            <b>Beam Waist Coupling:</b> Pointing offsets displace the Gaussian beam centroid relative to the receiver aperture radius, degrading coupling according to hp(r) ≈ A0 × exp(-2 r² / w_eq²).
          </div>
        </div>

        {/* 4. RECEIVER NOISE & DARK COUNTS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Background Noise & Dark Counts</h2>
              <span className="text-[10px] text-slate-500">Stochastic Photon Arrival Statistics</span>
            </div>
          </div>

          {/* Dark Count Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detector Dark Count Probability (P_dark)</label>
            <select
              value={parameters.dark_count_rate}
              onChange={(e) => updateField('dark_count_rate', Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value={1e-7}>1.0e-7 (Cryogenic Ultra-Low Noise SNSPD)</option>
              <option value={1e-6}>1.0e-6 (Standard High-Performance SNSPD)</option>
              <option value={1e-5}>1.0e-5 (InGaAs Avalanche Photodiode - APD)</option>
              <option value={1e-4}>1.0e-4 (Warm APD / High Dark Noise)</option>
            </select>
          </div>

          {/* Ambient Background Noise */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ambient Stray/Solar Noise (P_bg)</label>
            <select
              value={parameters.background_noise}
              onChange={(e) => updateField('background_noise', Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value={1e-7}>1.0e-7 (Moonless Midnight Ground Station)</option>
              <option value={1e-6}>1.0e-6 (Standard Night Sky with Narrowband Filter)</option>
              <option value={1e-5}>1.0e-5 (Twilight / Urban Light Pollution)</option>
              <option value={1e-4}>1.0e-4 (Daytime Operation with Solar Scatter)</option>
            </select>
          </div>

          {/* Error Correction Factor */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Error Correction Efficiency (f_EC)</span>
              <span className="font-mono text-cyan-700 font-bold">{parameters.fec_efficiency.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={1.05}
              max={1.4}
              step={0.01}
              value={parameters.fec_efficiency}
              onChange={(e) => updateField('fec_efficiency', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <span className="text-[10px] text-slate-400">
              Shannon limit efficiency factor for LDPC / Cascade reconciliation codes (1.10 - 1.20)
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
            <b>QBER Noise Floor:</b> Noise counts register clicks with 50% bit flip probability. As optical link loss attenuates the signal photon flux, noise clicks dominate and drive QBER toward 50%.
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
        <div className="text-xs text-slate-600">
          All channel parameters configured. Proceed to execution and real-time verification.
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('simulation')}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            Run Simulation Pipeline →
          </button>
        </div>
      </div>
    </div>
  );
};
