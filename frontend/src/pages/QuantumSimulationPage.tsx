import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Satellite,
  ChevronDown,
  ChevronUp,
  Sliders,
  History,
  Eye,
  EyeOff,
  Radio,
  Info,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  QuantumLabRequest,
  QuantumLabResult,
  QuantumLabHistoryItem,
  QuantumSatelliteOption,
  QuantumLabLinkBudget
} from '../types/quantum';
import {
  runQuantumLabSimulation,
  fetchQuantumLabSatellites,
  fetchQuantumLabCalculatedLoss,
  fetchQuantumLabHistory,
  fetchQuantumLabHistoryDetail,
  runQuantumLabSweep
} from '../services/api';
import {
  QberVsEveChart,
  QberVsDistanceChart,
  QberVsBitsChart,
  SkrVsQberChart,
  EveVsSkrChart
} from '../charts/QuantumLabCharts';

interface Props {
  onNavigate?: (page: any) => void;
}

const PRESET_CONFIGS: Record<string, Partial<QuantumLabRequest>> = {
  leo_benchmark: {
    satellite: 'leo_sat',
    distance_km: 500,
    num_bits: 10000,
    eavesdropping_enabled: false,
    eavesdropping_probability: 0.0,
    channel_noise: 0.02,
    turbulence: 'moderate',
    pointing_error: 3.0,
    detector_efficiency: 0.80
  },
  ideal: {
    satellite: 'leo_sat',
    distance_km: 500,
    num_bits: 10000,
    eavesdropping_enabled: false,
    eavesdropping_probability: 0.0,
    channel_noise: 0.005,
    turbulence: 'low',
    pointing_error: 1.5,
    detector_efficiency: 0.85
  },
  normal: {
    satellite: 'micius',
    distance_km: 500,
    num_bits: 10000,
    eavesdropping_enabled: false,
    eavesdropping_probability: 0.0,
    channel_noise: 0.02,
    turbulence: 'moderate',
    pointing_error: 3.0,
    detector_efficiency: 0.80
  },
  noisy: {
    satellite: 'micius',
    distance_km: 750,
    num_bits: 10000,
    eavesdropping_enabled: false,
    eavesdropping_probability: 0.0,
    channel_noise: 0.08,
    turbulence: 'high',
    pointing_error: 6.0,
    detector_efficiency: 0.70
  },
  eve_test: {
    satellite: 'micius',
    distance_km: 500,
    num_bits: 10000,
    eavesdropping_enabled: true,
    eavesdropping_probability: 0.50,
    attack_type: 'intercept_resend',
    channel_noise: 0.02,
    turbulence: 'moderate',
    pointing_error: 3.0,
    detector_efficiency: 0.80
  },
  long_dist: {
    satellite: 'tiangong2',
    distance_km: 1200,
    num_bits: 50000,
    eavesdropping_enabled: false,
    eavesdropping_probability: 0.0,
    channel_noise: 0.02,
    turbulence: 'moderate',
    pointing_error: 3.5,
    detector_efficiency: 0.80
  },
  high_turb: {
    satellite: 'qeyssat',
    distance_km: 600,
    num_bits: 20000,
    eavesdropping_enabled: false,
    eavesdropping_probability: 0.0,
    channel_noise: 0.03,
    turbulence: 'high',
    pointing_error: 8.0,
    detector_efficiency: 0.75
  }
};

const SIMULATION_STAGES = [
  'Preparing BB84 quantum states (|0⟩, |1⟩, |+⟩, |−⟩)...',
  'Transmitting single-photon pulses through free-space...',
  'Applying atmospheric channel loss & beam spreading...',
  'Simulating Eve intercept-resend attack on quantum channel...',
  'Performing Bob conjugate basis measurements...',
  'Executing public Alice-Bob basis reconciliation (sifting)...',
  'Estimating quantum bit error rate (QBER)...',
  'Calculating Shor-Preskill asymptotic secret key rate...',
  'Quantum simulation complete!'
];

export const QuantumSimulationPage: React.FC<Props> = () => {
  // Main Form Parameters
  const [params, setParams] = useState<QuantumLabRequest>({
    satellite: 'micius',
    distance_km: 500,
    num_bits: 10000,
    eavesdropping_enabled: false,
    eavesdropping_probability: 0.25,
    attack_type: 'intercept_resend',
    channel_noise: 0.02,
    turbulence: 'moderate',
    pointing_error: 3.0,
    detector_efficiency: 0.80,
    fec_efficiency: 1.16,
    dark_count_rate: 1e-6,
    background_noise: 1e-6,
    monte_carlo_runs: 100,
    include_charts: true,
    data_source_mode: 'manual'
  });

  const [activePreset, setActivePreset] = useState<string>('normal');
  const [satellites, setSatellites] = useState<QuantumSatelliteOption[]>([]);
  const [calculatedLoss, setCalculatedLoss] = useState<QuantumLabLinkBudget | null>(null);
  const [isCalculatingLoss, setIsCalculatingLoss] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Execution & Results State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [result, setResult] = useState<QuantumLabResult | null>(null);
  const [history, setHistory] = useState<QuantumLabHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sweep loading indicators
  const [isSweepingEve, setIsSweepingEve] = useState<boolean>(false);
  const [isSweepingDist, setIsSweepingDist] = useState<boolean>(false);
  const [isSweepingBits, setIsSweepingBits] = useState<boolean>(false);

  // 1. Initial Load: Satellites, History, and First Simulation
  useEffect(() => {
    loadSatellites();
    loadHistory();
    updateCalculatedLoss(params.distance_km, params.pointing_error, params.turbulence);
    // Automatically trigger initial simulation for immediate demonstration
    handleRunSimulation();
  }, []);

  const loadSatellites = async () => {
    try {
      const data = await fetchQuantumLabSatellites();
      setSatellites(data);
    } catch (e) {
      console.warn('Could not load satellites list:', e);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const hist = await fetchQuantumLabHistory(10);
      setHistory(hist);
    } catch (e) {
      console.warn('Could not load history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const updateCalculatedLoss = async (dist: number, pointing: number, turb: string) => {
    setIsCalculatingLoss(true);
    try {
      const budget = await fetchQuantumLabCalculatedLoss(dist, pointing, turb);
      setCalculatedLoss(budget);
    } catch (e) {
      console.warn('Failed to calculate link budget:', e);
    } finally {
      setIsCalculatingLoss(false);
    }
  };

  // Parameter Change Handlers
  const handleParamChange = (field: keyof QuantumLabRequest, value: any) => {
    setParams(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'distance_km' || field === 'pointing_error' || field === 'turbulence') {
        updateCalculatedLoss(
          field === 'distance_km' ? Number(value) : updated.distance_km,
          field === 'pointing_error' ? Number(value) : updated.pointing_error,
          field === 'turbulence' ? String(value) : updated.turbulence
        );
      }
      return updated;
    });
    setActivePreset('custom');
  };

  const applyPreset = (presetKey: string) => {
    if (presetKey === 'custom') {
      setActivePreset('custom');
      return;
    }
    const preset = PRESET_CONFIGS[presetKey];
    if (preset) {
      setParams(prev => {
        const next = { ...prev, ...preset };
        updateCalculatedLoss(next.distance_km, next.pointing_error, next.turbulence);
        return next;
      });
      setActivePreset(presetKey);
    }
  };

  const handleSatelliteSelect = (satId: string) => {
    const selected = satellites.find(s => s.id === satId);
    let newDist = params.distance_km;
    if (selected) {
      newDist = Math.max(300, Math.min(2000, Math.round(selected.altitude_km * 1.15)));
    }
    setParams(prev => ({
      ...prev,
      satellite: satId,
      distance_km: newDist
    }));
    updateCalculatedLoss(newDist, params.pointing_error, params.turbulence);
    setActivePreset('custom');
  };

  // Run Simulation Execution
  const handleRunSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setError(null);
    setCurrentStageIndex(0);

    // Progress animation ticker
    const timer = setInterval(() => {
      setCurrentStageIndex(prev => {
        if (prev < SIMULATION_STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 180);

    try {
      const simResponse = await runQuantumLabSimulation(params);
      clearInterval(timer);
      setCurrentStageIndex(SIMULATION_STAGES.length - 1);
      setResult(simResponse);
      loadHistory();
    } catch (err: any) {
      clearInterval(timer);
      setError(err?.message || 'BB84 simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Sweep Refresher Handlers
  const handleRefreshEveSweep = async () => {
    setIsSweepingEve(true);
    try {
      const sweepData = await runQuantumLabSweep('eavesdropping', params);
      setResult(prev => prev ? { ...prev, charts: { ...prev.charts, qber_vs_eve: sweepData } } : null);
    } catch (e) {
      console.warn('Sweep failed:', e);
    } finally {
      setIsSweepingEve(false);
    }
  };

  const handleRefreshDistSweep = async () => {
    setIsSweepingDist(true);
    try {
      const sweepData = await runQuantumLabSweep('distance', params);
      setResult(prev => prev ? { ...prev, charts: { ...prev.charts, qber_vs_dist: sweepData } } : null);
    } catch (e) {
      console.warn('Sweep failed:', e);
    } finally {
      setIsSweepingDist(false);
    }
  };

  const handleRefreshBitsSweep = async () => {
    setIsSweepingBits(true);
    try {
      const sweepData = await runQuantumLabSweep('bits', params);
      setResult(prev => prev ? { ...prev, charts: { ...prev.charts, qber_vs_bits: sweepData } } : null);
    } catch (e) {
      console.warn('Sweep failed:', e);
    } finally {
      setIsSweepingBits(false);
    }
  };

  const handleLoadHistoryItem = async (expId: string) => {
    try {
      const fullExp = await fetchQuantumLabHistoryDetail(expId);
      setResult(fullExp);
      setParams(prev => ({
        ...prev,
        satellite: fullExp.satellite,
        distance_km: fullExp.distance_km,
        num_bits: fullExp.bits_sent,
        eavesdropping_enabled: fullExp.eavesdropping_enabled,
        eavesdropping_probability: fullExp.eavesdropping_probability,
        channel_noise: fullExp.channel_noise
      }));
      updateCalculatedLoss(fullExp.distance_km, params.pointing_error, params.turbulence);
      setActivePreset('custom');
    } catch (e) {
      console.error('Failed to load history experiment:', e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                Laboratory Mode
              </span>
              <span className="text-xs text-purple-400 font-mono flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                BB84 Physical Monte Carlo Simulation
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              Quantum Simulation Dashboard
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Conduct high-fidelity BB84 quantum key distribution experiments. Observe how orbital distance,
              atmospheric turbulence, pointing jitter, channel noise, and eavesdropping intercept-resend attacks
              physically drive QBER and secret-key extraction.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all ${
                isSimulating
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-purple-900/40 border border-purple-400/40 hover:scale-[1.02]'
              }`}
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Simulating BB84...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Quantum Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. LIVE SIMULATION STATUS PIPELINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Live Quantum Transmission Pipeline
            </h2>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-400">Architecture:</span>
            <span className="font-mono text-cyan-400 font-semibold">
              Alice → {params.eavesdropping_enabled ? 'Eve (Intercept-Resend) → ' : ''}Channel → Bob
            </span>
          </div>
        </div>

        {/* Visual Flow Stages */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Node 1: Alice */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center relative group">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-mono font-bold text-xs mb-2">
              |ψ⟩
            </div>
            <span className="text-xs font-bold text-white">Alice</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Random Bits & Bases</span>
            <span className="text-[10px] text-blue-400 font-mono mt-1">
              {params.num_bits.toLocaleString()} states
            </span>
          </div>

          {/* Node 2: Eve (Conditional) */}
          <div className={`rounded-xl p-3 flex flex-col items-center text-center relative transition-all ${
            params.eavesdropping_enabled
              ? 'bg-rose-950/40 border border-rose-500/50 shadow-md shadow-rose-950/40 animate-pulse'
              : 'bg-slate-950/40 border border-slate-800/60 opacity-50'
          }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs mb-2 ${
              params.eavesdropping_enabled
                ? 'bg-rose-600/30 border border-rose-500 text-rose-300'
                : 'bg-slate-800 text-slate-500'
            }`}>
              {params.eavesdropping_enabled ? <Eye className="w-4 h-4 text-rose-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
            </div>
            <span className={`text-xs font-bold ${params.eavesdropping_enabled ? 'text-rose-400' : 'text-slate-500'}`}>
              Eve Intercept
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {params.eavesdropping_enabled ? `${Math.round(params.eavesdropping_probability * 100)}% Pulses` : 'Disabled'}
            </span>
            {params.eavesdropping_enabled && (
              <span className="text-[9px] text-rose-400 font-mono font-bold mt-1 bg-rose-500/20 px-1.5 py-0.5 rounded">
                Intercept-Resend
              </span>
            )}
          </div>

          {/* Node 3: Quantum Channel */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs mb-2">
              <Radio className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs font-bold text-white">FSO Channel</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Loss & Turbulence</span>
            <span className="text-[10px] text-cyan-400 font-mono mt-1">
              {calculatedLoss ? `${calculatedLoss.total_loss_db.toFixed(1)} dB` : '18.4 dB'}
            </span>
          </div>

          {/* Node 4: Bob */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs mb-2">
              Bob
            </div>
            <span className="text-xs font-bold text-white">Bob Detection</span>
            <span className="text-[10px] text-slate-400 mt-0.5">SPAD Clicks</span>
            <span className="text-[10px] text-emerald-400 font-mono mt-1">
              {result ? `${result.detections.toLocaleString()} bits` : `${Math.round(params.num_bits * 0.78).toLocaleString()} bits`}
            </span>
          </div>

          {/* Node 5: Sifting */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-mono font-bold text-xs mb-2">
              Z/X
            </div>
            <span className="text-xs font-bold text-white">Basis Sifting</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Z/X Reconciliation</span>
            <span className="text-[10px] text-indigo-400 font-mono mt-1">
              {result ? `${result.sifted_bits.toLocaleString()} bits` : `${Math.round(params.num_bits * 0.39).toLocaleString()} bits`}
            </span>
          </div>

          {/* Node 6: QBER */}
          <div className={`border rounded-xl p-3 flex flex-col items-center text-center ${
            result?.eavesdropping_detected || (result?.qber_percent ?? 0) >= 11.0
              ? 'bg-rose-950/30 border-rose-600/50 text-rose-300'
              : 'bg-slate-950/70 border-slate-800 text-slate-300'
          }`}>
            <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-mono font-bold text-xs mb-2">
              %
            </div>
            <span className="text-xs font-bold text-white">QBER Metric</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Error Rate</span>
            <span className="text-xs font-black font-mono mt-1 text-amber-400">
              {result ? `${result.qber_percent.toFixed(2)}%` : '2.43%'}
            </span>
          </div>

          {/* Node 7: Secret Key Rate */}
          <div className={`border rounded-xl p-3 flex flex-col items-center text-center ${
            result?.is_secure === false
              ? 'bg-rose-950/30 border-rose-600/50'
              : 'bg-emerald-950/30 border-emerald-500/40'
          }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs mb-2 ${
              result?.is_secure === false
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
                : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-white">Secret Key</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Extraction Yield</span>
            <span className={`text-xs font-black font-mono mt-1 ${
              result?.is_secure === false ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {result ? `${result.estimated_skr.toLocaleString()} bps` : '9,420 bps'}
            </span>
          </div>
        </div>

        {/* Live Progress Stage Ticker during simulation */}
        {isSimulating && (
          <div className="mt-4 p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
            <span className="text-xs text-purple-200 font-mono animate-pulse">
              {SIMULATION_STAGES[currentStageIndex]}
            </span>
          </div>
        )}
      </div>

      {/* 3. EXPERIMENT PRESETS & DATA SOURCE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Experiment Presets:
            </span>
            <p className="text-[11px] text-slate-500">
              Select a benchmark configuration to automatically populate parameters
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'leo_benchmark', label: 'LEO Satellite Benchmark' },
              { id: 'ideal', label: 'Ideal Channel' },
              { id: 'normal', label: 'Normal Channel' },
              { id: 'noisy', label: 'Noisy Channel' },
              { id: 'eve_test', label: 'Eavesdropping Test' },
              { id: 'long_dist', label: 'Long Distance' },
              { id: 'high_turb', label: 'High Turbulence' },
              { id: 'custom', label: 'Custom' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activePreset === p.id
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-900/30 border border-purple-400/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Source Selector (Section 31) */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Data Source Mode:</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'manual', label: 'Manual Parameters (Lab Mode)' },
              { id: 'dataset', label: 'Dataset Scenario' },
              { id: 'satellite_live', label: 'Satellite / Weather Live' }
            ].map(source => (
              <label
                key={source.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                  params.data_source_mode === source.id
                    ? 'bg-purple-600/30 text-purple-300 font-semibold border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="data_source_mode"
                  value={source.id}
                  checked={params.data_source_mode === source.id}
                  onChange={() => handleParamChange('data_source_mode', source.id)}
                  className="hidden"
                />
                <span>{source.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 4. MAIN EXPERIMENT PARAMETERS & CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Essential BB84 Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                BB84 Physical Parameters
              </h3>
            </div>
            {calculatedLoss && (
              <div className="flex items-center gap-2 bg-cyan-950/50 border border-cyan-500/40 px-3 py-1 rounded-lg">
                <span className="text-[10px] text-cyan-300 font-semibold">Total Link Loss:</span>
                <span className="text-xs font-bold text-cyan-400 font-mono">
                  {calculatedLoss.total_loss_db.toFixed(1)} dB
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Satellite Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Satellite Node (Orbit Configuration)
              </label>
              <select
                value={params.satellite}
                onChange={e => handleSatelliteSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
              >
                {satellites.length > 0 ? (
                  satellites.map(sat => (
                    <option key={sat.id} value={sat.id}>
                      {sat.name} (Altitude: {sat.altitude_km} km)
                    </option>
                  ))
                ) : (
                  <>
                    <option value="leo_sat">Standard LEO Optical Satellite - 500 km</option>
                    <option value="micius">Micius (QSS) - 500 km LEO</option>
                    <option value="iss">ISS Space Station - 420 km LEO</option>
                    <option value="tiangong">Tiangong Space Station - 390 km LEO</option>
                    <option value="starlink">Starlink Laser Constellation - 550 km LEO</option>
                    <option value="qeyssat">QEYSSat (CSA) - 600 km LEO</option>
                    <option value="nanobob">NanoBob CubeSat - 450 km LEO</option>
                    <option value="noaa20">NOAA-20 Weather - 825 km LEO</option>
                    <option value="custom">Custom User LEO Satellite</option>
                  </>
                )}
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Selecting a satellite sets default orbital geometry and distance.
              </span>
            </div>

            {/* Distance Slider + Numerical Value */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Link Distance (km)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={100}
                    max={2000}
                    step={10}
                    value={params.distance_km}
                    onChange={e => handleParamChange('distance_km', Math.max(100, Math.min(2000, Number(e.target.value))))}
                    className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-right"
                  />
                  <span className="text-xs text-slate-400">km</span>
                </div>
              </div>
              <input
                type="range"
                min={100}
                max={2000}
                step={25}
                value={params.distance_km}
                onChange={e => handleParamChange('distance_km', Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>100 km</span>
                <span>500 km</span>
                <span>1,000 km</span>
                <span>2,000 km</span>
              </div>
            </div>

            {/* Number of Bits / Qubits */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Number of Quantum Bits (Qubits)
                </label>
                <span className="text-xs font-mono font-bold text-purple-400">
                  {params.num_bits.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[1000, 5000, 10000, 50000, 100000].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handleParamChange('num_bits', cnt)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                      params.num_bits === cnt
                        ? 'bg-purple-600 text-white font-bold border border-purple-400/50'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cnt >= 1000 ? `${cnt / 1000}k` : cnt}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-500">
                Actually generates discrete BB84 random state vectors for authentic statistics.
              </span>
            </div>

            {/* Channel Noise Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Channel / Hardware Noise (Probability)
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {(params.channel_noise * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.20}
                step={0.005}
                value={params.channel_noise}
                onChange={e => handleParamChange('channel_noise', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0% (Ideal)</span>
                <span>5%</span>
                <span>10%</span>
                <span>20% (Max)</span>
              </div>
            </div>

            {/* Atmospheric Turbulence Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Atmospheric Turbulence (Scintillation)
              </label>
              <select
                value={params.turbulence}
                onChange={e => handleParamChange('turbulence', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="low">Low Turbulence (Cn² ~ 1×10⁻¹⁵ m⁻²ᐟ³)</option>
                <option value="moderate">Moderate Turbulence (Cn² ~ 5×10⁻¹⁴ m⁻²ᐟ³)</option>
                <option value="high">High Turbulence (Cn² ~ 1×10⁻¹³ m⁻²ᐟ³)</option>
                <option value="custom">Custom Boundary Layer</option>
              </select>
            </div>

            {/* Pointing Error Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Pointing Jitter Error (μrad)
                </label>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {params.pointing_error.toFixed(1)} μrad
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={20.0}
                step={0.5}
                value={params.pointing_error}
                onChange={e => handleParamChange('pointing_error', Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.5 μrad</span>
                <span>5.0 μrad</span>
                <span>10.0 μrad</span>
                <span>20.0 μrad</span>
              </div>
            </div>

            {/* Detector Quantum Efficiency */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Bob Single-Photon Detector Efficiency (η_det)
                </label>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {Math.round(params.detector_efficiency * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.50}
                max={0.95}
                step={0.05}
                value={params.detector_efficiency}
                onChange={e => handleParamChange('detector_efficiency', Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>50%</span>
                <span>75%</span>
                <span>80%</span>
                <span>95%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Eavesdropping & Intercept-Resend Panel (Section 7 & 8) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Eavesdropping Control (Eve)
                </h3>
              </div>
              {/* Eavesdropping Toggle */}
              <button
                type="button"
                onClick={() => handleParamChange('eavesdropping_enabled', !params.eavesdropping_enabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  params.eavesdropping_enabled ? 'bg-rose-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    params.eavesdropping_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {params.eavesdropping_enabled ? (
              <div className="space-y-4 p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-rose-300 mb-1">
                    Attack Strategy Model
                  </label>
                  <select
                    value={params.attack_type}
                    onChange={e => handleParamChange('attack_type', e.target.value)}
                    className="w-full bg-slate-950 border border-rose-500/40 rounded-lg px-3 py-1.5 text-xs text-rose-200 font-medium"
                  >
                    <option value="intercept_resend">Intercept-Resend Attack</option>
                  </select>
                  <p className="text-[10px] text-rose-300/80 mt-1">
                    Eve intercepts qubits, measures in a random basis, collapses the state, and forwards a fresh state.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-rose-300">
                      Interception Probability
                    </label>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {Math.round(params.eavesdropping_probability * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1.0}
                    step={0.05}
                    value={params.eavesdropping_probability}
                    onChange={e => handleParamChange('eavesdropping_probability', Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-rose-400/70 mt-1">
                    <span>0% (None)</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>100% (Full)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    {params.eavesdropping_probability === 0
                      ? 'Eve never intercepts transmitted pulses.'
                      : `Eve intercepts approximately ${Math.round(params.eavesdropping_probability * 100)}% of quantum states.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-white">Passive Quantum Link</h4>
                <p className="text-[11px] text-slate-400">
                  Eavesdropping is currently disabled. Toggle ON to simulate quantum state collapse and observe QBER increase.
                </p>
              </div>
            )}

            {/* Loss Breakdown Box */}
            {calculatedLoss && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 block border-b border-slate-800/80 pb-1">
                  Optical Link Budget Breakdown:
                </span>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Free-Space Spreading:</span>
                  <span className="font-mono text-slate-300">{calculatedLoss.geometric_loss_db.toFixed(1)} dB</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Atmospheric Extinction:</span>
                  <span className="font-mono text-slate-300">{calculatedLoss.atmospheric_loss_db.toFixed(1)} dB</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Pointing Jitter Loss:</span>
                  <span className="font-mono text-slate-300">{calculatedLoss.pointing_loss_db.toFixed(1)} dB</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Turbulence Fading:</span>
                  <span className="font-mono text-slate-300">{calculatedLoss.turbulence_fading_loss_db.toFixed(1)} dB</span>
                </div>
              </div>
            )}
          </div>

          {/* Run Button Inside Panel */}
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all ${
              isSimulating
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-purple-900/40 border border-purple-400/40 hover:scale-[1.01]'
            }`}
          >
            {isSimulating ? 'Simulating BB84 Quantum Link...' : 'RUN QUANTUM SIMULATION'}
          </button>
        </div>
      </div>

      {/* Collapsible Advanced Parameters (Section 14) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Advanced Quantum & Error Correction Parameters</span>
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Error Correction Inefficiency (f_EC)
              </label>
              <input
                type="number"
                step={0.01}
                min={1.0}
                max={2.0}
                value={params.fec_efficiency}
                onChange={e => handleParamChange('fec_efficiency', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">Standard Cascade: 1.16</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Dark Count Probability (p_dark)
              </label>
              <input
                type="text"
                value={params.dark_count_rate}
                onChange={e => handleParamChange('dark_count_rate', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">Typical SPAD: 1e-6</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Background Ambient Noise (p_bg)
              </label>
              <input
                type="text"
                value={params.background_noise}
                onChange={e => handleParamChange('background_noise', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">Night filtering: 1e-6</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Monte Carlo Sweep Runs
              </label>
              <input
                type="number"
                step={10}
                min={10}
                max={500}
                value={params.monte_carlo_runs}
                onChange={e => handleParamChange('monte_carlo_runs', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">Default: 100 runs</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. RESULTS KPI CARDS (Section 22) */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              BB84 Simulation Results (Calculated from Discrete Pulses)
            </h2>
            <div className="flex items-center gap-2">
              {result.eavesdropping_detected ? (
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Eavesdropping Detected (QBER &gt; 11%)
                </span>
              ) : (
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Channel Secure (QBER &lt; 11%)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: Qubits Sent */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                QUBITS SENT
              </span>
              <div className="text-xl font-black text-white font-mono">
                {result.bits_sent.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Transmitted pulses
              </span>
            </div>

            {/* Card 2: Detected */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                DETECTED
              </span>
              <div className="text-xl font-black text-cyan-400 font-mono">
                {result.detections.toLocaleString()}
              </div>
              <span className="text-[10px] text-cyan-500/80 mt-1 block">
                {(result.detection_rate * 100).toFixed(1)}% detection rate
              </span>
            </div>

            {/* Card 3: Sifted Key */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                SIFTED KEY
              </span>
              <div className="text-xl font-black text-indigo-400 font-mono">
                {result.sifted_bits.toLocaleString()}
              </div>
              <span className="text-[10px] text-indigo-500/80 mt-1 block">
                Matching bases (~50%)
              </span>
            </div>

            {/* Card 4: Errors */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                ERRORS
              </span>
              <div className="text-xl font-black text-rose-400 font-mono">
                {result.errors.toLocaleString()}
              </div>
              <span className="text-[10px] text-rose-500/80 mt-1 block">
                Mismatched sifted bits
              </span>
            </div>

            {/* Card 5: QBER */}
            <div className={`border rounded-xl p-4 shadow-sm ${
              result.qber_percent >= 11.0 ? 'bg-rose-950/20 border-rose-500/40' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                QBER
              </span>
              <div className={`text-xl font-black font-mono ${
                result.qber_percent >= 11.0 ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {result.qber_percent.toFixed(2)} %
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                ± {(result.qber_std_error * 100).toFixed(2)}% std error
              </span>
            </div>

            {/* Card 6: Estimated SKR */}
            <div className={`border rounded-xl p-4 shadow-sm ${
              result.is_secure ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                ESTIMATED SKR
              </span>
              <div className={`text-xl font-black font-mono ${
                result.is_secure ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {result.estimated_skr.toLocaleString()} bps
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {result.discrete_secure_bits.toLocaleString()} secret bits
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. REAL QUANTUM SAMPLE BIT TRACE TABLE */}
      {result && result.bit_samples && result.bit_samples.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Quantum Pulse Trace (First {result.bit_samples.length} Simulated BB84 States)
              </h3>
              <p className="text-[11px] text-slate-400">
                Visualizing physical single-qubit states, Eve interception, Bob basis choices, and sifted outcomes
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Alice Bit</th>
                  <th className="py-2 px-3">Alice Basis</th>
                  <th className="py-2 px-3">Eve Intercepted</th>
                  <th className="py-2 px-3">Bob Basis</th>
                  <th className="py-2 px-3">Bob Bit</th>
                  <th className="py-2 px-3">Basis Sifted</th>
                  <th className="py-2 px-3">Bit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.bit_samples.slice(0, 15).map(sample => (
                  <tr key={sample.idx} className="hover:bg-slate-800/40">
                    <td className="py-1.5 px-3 text-slate-500">{sample.idx}</td>
                    <td className="py-1.5 px-3 font-bold text-blue-400">{sample.alice_bit}</td>
                    <td className="py-1.5 px-3 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-800/40">
                        {sample.alice_basis}
                      </span>
                    </td>
                    <td className="py-1.5 px-3">
                      {sample.eve_intercepted ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-900/40 text-rose-300 border border-rose-800/40 font-bold">
                          YES ({sample.eve_basis})
                        </span>
                      ) : (
                        <span className="text-slate-600">No</span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-800/40">
                        {sample.bob_basis}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 font-bold text-slate-200">
                      {sample.bob_bit !== null ? sample.bob_bit : <span className="text-slate-600">Lost</span>}
                    </td>
                    <td className="py-1.5 px-3">
                      {sample.matched_basis ? (
                        <span className="text-emerald-400 font-bold">Matched ✓</span>
                      ) : (
                        <span className="text-slate-600">Discarded</span>
                      )}
                    </td>
                    <td className="py-1.5 px-3">
                      {sample.matched_basis ? (
                        sample.is_error ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-600/30 text-rose-400 border border-rose-500/40 font-bold">
                            ERROR ✗
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-bold">
                            CORRECT ✓
                          </span>
                        )
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. FIVE INTERACTIVE EXPERIMENT CHARTS */}
      {result && result.charts && (
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Interactive Scientific Experiment Sweep Curves
            </h3>
            <p className="text-[11px] text-slate-400">
              Parametric Monte Carlo sweeps generated from actual BB84 quantum channel executions
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: QBER vs Eavesdropping */}
            {result.charts.qber_vs_eve && (
              <QberVsEveChart
                data={result.charts.qber_vs_eve}
                onRefreshSweep={handleRefreshEveSweep}
                isLoading={isSweepingEve}
              />
            )}

            {/* Chart 2: QBER & Loss vs Distance */}
            {result.charts.qber_vs_dist && (
              <QberVsDistanceChart
                data={result.charts.qber_vs_dist}
                onRefreshSweep={handleRefreshDistSweep}
                isLoading={isSweepingDist}
              />
            )}

            {/* Chart 3: QBER vs Simulation Size */}
            {result.charts.qber_vs_bits && (
              <QberVsBitsChart
                data={result.charts.qber_vs_bits}
                onRefreshSweep={handleRefreshBitsSweep}
                isLoading={isSweepingBits}
              />
            )}

            {/* Chart 4: Secret Key Rate vs QBER (Shor-Preskill) */}
            {result.charts.skr_vs_qber && (
              <SkrVsQberChart data={result.charts.skr_vs_qber} />
            )}

            {/* Chart 5: Eavesdropping vs Estimated SKR */}
            {result.charts.eve_vs_skr && (
              <div className="lg:col-span-2">
                <EveVsSkrChart
                  data={result.charts.eve_vs_skr}
                  onRefreshSweep={handleRefreshEveSweep}
                  isLoading={isSweepingEve}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. EXPERIMENT HISTORY (Section 30) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Simulation Experiment History
            </h3>
          </div>
          <button
            onClick={loadHistory}
            disabled={isLoadingHistory}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-700/60"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Satellite</th>
                  <th className="py-2 px-3">Distance</th>
                  <th className="py-2 px-3">Qubits</th>
                  <th className="py-2 px-3">Eve Intercept</th>
                  <th className="py-2 px-3">QBER</th>
                  <th className="py-2 px-3">Secret Key Rate</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 text-white font-semibold capitalize">{item.satellite}</td>
                    <td className="py-2 px-3 text-cyan-400">{item.distance_km} km</td>
                    <td className="py-2 px-3 text-slate-300">{item.num_bits.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      {item.eavesdropping_enabled ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                          {Math.round(item.eavesdropping_probability * 100)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">OFF</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`font-bold ${item.qber_percent >= 11.0 ? 'text-rose-400' : 'text-amber-400'}`}>
                        {item.qber_percent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`font-bold ${item.is_secure ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.estimated_skr.toLocaleString()} bps
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleLoadHistoryItem(item.id)}
                        className="px-2.5 py-1 text-[11px] rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 transition-all font-semibold"
                      >
                        Load Run
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">
            No past simulation runs recorded in SQLite history yet. Run an experiment above to track results!
          </p>
        )}
      </div>

      {/* 9. SCIENTIFIC VALIDATION SECTION (Section 35) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Info className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Scientific Validation & Physical BB84 Principles
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Zero-Noise & Zero-Eve Limit</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              When no eavesdropper is present and channel noise is zero, the error rate approaches zero statistically
              as the number of qubits increases. Residual QBER arises only from dark counts and ambient background.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Intercept-Resend Attack Physics</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Eve chooses an incompatible measurement basis 50% of the time, collapsing quantum superpositions.
              This introduces a theoretical 25% error rate on intercepted pulses: QBER ≈ 0.25 × P(Eve) + QBER_channel.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Shor-Preskill Security Bound</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Secret key distillation requires error correction and privacy amplification:
              r = 1 - 2*h(QBER). If QBER exceeds the 11.0% BB84 threshold, information leakage to Eve prevents secure key generation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default QuantumSimulationPage;
