import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { ChannelParameters, SimulationResult } from '../types/quantum';
import { BitTraceTable } from '../components/BitTraceTable';
import { PageId } from '../components/Sidebar';

interface Props {
  parameters: ChannelParameters;
  currentResult: SimulationResult | null;
  isSimulating: boolean;
  onRunSimulation: () => Promise<void>;
  onNavigate: (page: PageId) => void;
  error: string | null;
}

const SIMULATION_STEPS = [
  'Initializing BB84 Protocol...',
  'Generating Random Bits & Conjugate Bases...',
  'Simulating FSO Optical Link (Space → Relay → Bob)...',
  'Applying Atmospheric Attenuation (Kim/Kruse Model)...',
  'Applying Boundary-Layer Turbulence (Rytov & Scintillation)...',
  'Applying Pointing Jitter & Misalignment Loss...',
  'Adding Detector Dark Counts & Background Noise...',
  'Performing Single-Photon Detection (Bernoulli Clicks)...',
  'Reconciling Bases & Calculating QBER...',
  'Estimating Asymptotic Secret-Key Rate (Error Correction & PA)...',
  'Vectorized Monte Carlo Uncertainty Verification...',
  'Simulation Complete!'
];

export const SimulationPage: React.FC<Props> = ({
  parameters,
  currentResult,
  isSimulating,
  onRunSimulation,
  onNavigate,
  error
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  useEffect(() => {
    let interval: any = null;
    if (isSimulating) {
      setCurrentStepIndex(0);
      setProgressPercent(5);
      const stepDuration = 350; // ms per stage

      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < SIMULATION_STEPS.length - 2) {
            const next = prev + 1;
            setProgressPercent(Math.min(95, Math.round(((next + 1) / SIMULATION_STEPS.length) * 100)));
            return next;
          }
          return prev;
        });
      }, stepDuration);
    } else if (currentResult) {
      setCurrentStepIndex(SIMULATION_STEPS.length - 1);
      setProgressPercent(100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, currentResult]);

  return (
    <div className="space-y-6">
      {/* Simulation Command Center Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
            BB84 Quantum Engine Execution
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-2">
            Execute Quantum Optical Simulation
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Synthesizes {parameters.num_bits.toLocaleString()} quantum bit transmissions through the configured LEO satellite,
            stratospheric relay, and ground telescope channel, followed by {parameters.monte_carlo_iterations.toLocaleString()} Monte Carlo statistical runs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>RUN SIMULATION</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Simulation could not be completed.</strong>
            <p className="mt-0.5">{error}</p>
            <p className="mt-1 text-[11px] text-rose-600">
              Please verify that the backend Python server is deployed, reachable, and link parameters are physically valid.
            </p>
          </div>
        </div>
      )}

      {/* Stepped Progress & Pipeline Indicator */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700">
            {isSimulating ? 'SIMULATION IN PROGRESS' : currentResult ? 'SIMULATION COMPLETE' : 'READY TO RUN'}
          </span>
          <span className="text-xs font-mono font-bold text-cyan-700">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stepped Process List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SIMULATION_STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex || (currentResult && !isSimulating);
            const isCurrent = idx === currentStepIndex && isSimulating;

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs flex items-center gap-2.5 transition-all ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                    : isCurrent
                      ? 'bg-cyan-50 border-cyan-400 text-cyan-900 font-semibold ring-1 ring-cyan-400 animate-pulse'
                      : 'bg-slate-50/50 border-slate-200 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <RefreshCw className="w-4 h-4 text-cyan-600 animate-spin shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center text-[10px] shrink-0 font-mono">
                    {idx + 1}
                  </span>
                )}
                <span className="truncate">{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Results Summary Callout */}
      {currentResult && (
        <div className="bg-gradient-to-r from-cyan-900 to-slate-900 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              Verified Physical Results Ready
            </span>
            <h3 className="text-lg font-bold">
              QBER: {currentResult.qber != null ? `${(currentResult.qber * 100).toFixed(2)}%` : '--'} | Secret Key: {currentResult.secret_key_rate != null ? `${Math.round(currentResult.secret_key_rate).toLocaleString()} bits/s` : '--'}
            </h3>
            <p className="text-xs text-slate-300">
              {currentResult.security_status_message}
            </p>
          </div>

          <button
            onClick={() => onNavigate('results')}
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center gap-2 shadow-md cursor-pointer transition-all shrink-0"
          >
            <span>View Detailed Charts & Results</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Live Sample Bit Trace Inspection */}
      {currentResult && currentResult.bit_samples && (
        <BitTraceTable bits={currentResult.bit_samples} maxDisplay={30} />
      )}
    </div>
  );
};
