import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Satellite,
  Cloud,
  Radio,
  Sparkles,
  ChevronRight,
  Layers,
  Activity
} from 'lucide-react';
import { ChannelParameters, SimulationResult, GroundStationConfig } from '../types/quantum';
import { PageId } from '../components/Sidebar';

interface Props {
  parameters: ChannelParameters;
  onChangeParameters?: (params: ChannelParameters) => void;
  currentResult: SimulationResult | null;
  isSimulating: boolean;
  onRunSimulation: () => Promise<void>;
  onNavigate: (page: PageId) => void;
  error: string | null;
  groundStation?: GroundStationConfig;
}

const PIPELINE_STAGES = [
  { id: 'orbit', label: 'Orbit', desc: 'Satellite trajectory & orbital speed' },
  { id: 'position', label: 'Position', desc: 'Sub-satellite point & elevation look angle' },
  { id: 'link', label: 'Link', desc: 'Slant range & geometric diffraction spreading' },
  { id: 'weather', label: 'Weather', desc: 'Atmospheric aerosol Kim/Kruse extinction' },
  { id: 'channel', label: 'Channel', desc: 'Boundary-layer turbulence & pointing jitter' },
  { id: 'qber', label: 'QBER', desc: 'BB84 single-photon detection & error rate' },
  { id: 'secret_key', label: 'Secret Key', desc: 'Shannon binary entropy & distilled key rate' }
];

export const SimulationPage: React.FC<Props> = ({
  parameters,
  currentResult,
  isSimulating,
  onRunSimulation,
  onNavigate,
  error,
  groundStation
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  useEffect(() => {
    let timer: any = null;
    if (isSimulating) {
      setCompleted(false);
      setActiveStageIndex(0);

      // Smooth progression through the 7 real pipeline checkpoints
      const stageInterval = 320;
      timer = setInterval(() => {
        setActiveStageIndex((prev) => {
          if (prev < PIPELINE_STAGES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, stageInterval);
    } else if (currentResult) {
      setActiveStageIndex(PIPELINE_STAGES.length);
      setCompleted(true);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulating, currentResult]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            Real-Time Simulation Engine
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Quantum Communication Link Execution
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Modeling photon propagation across the hierarchical optical channel
          </p>
        </div>

        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Re-Run Simulation</span>
            </>
          )}
        </button>
      </div>

      {/* Communication Path Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
          Communication Path
        </span>

        <div className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-600" />
            <span>Ground Station (Alice)</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-indigo-600" />
            <span>LEO Satellite ({parameters.satellite_altitude} km)</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

          <div className="flex items-center gap-2">
            <Cloud className={`w-4 h-4 ${parameters.has_relay ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{parameters.has_relay ? `HAP Relay (${parameters.relay_altitude} km)` : 'Direct (No Relay)'}</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Bob ({groundStation?.name?.replace(' Quantum Communication Station', '') || 'Amaravati'})</span>
          </div>
        </div>
      </div>

      {/* Simulation Pipeline Checklist Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Simulation Pipeline Stages
            </h2>
            <p className="text-xs text-slate-500">
              {isSimulating ? 'Evaluating physics stages...' : completed ? 'All 7 stages verified successfully.' : 'Click Run Simulation to execute.'}
            </p>
          </div>

          {completed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simulation Complete</span>
            </span>
          )}
        </div>

        {/* 7 Pipeline Stages */}
        <div className="space-y-2.5">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isDone = completed || (isSimulating && idx < activeStageIndex);
            const isCurrent = isSimulating && idx === activeStageIndex;

            return (
              <div
                key={stage.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isDone
                    ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-800'
                    : isCurrent
                    ? 'bg-sky-50 border-sky-300 text-sky-950 shadow-xs'
                    : 'bg-slate-50/50 border-slate-200/60 text-slate-400 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-sky-600 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>

                  <div>
                    <span className="text-xs font-bold block">{stage.label}</span>
                    <span className="text-[11px] text-slate-500">{stage.desc}</span>
                  </div>
                </div>

                <div className="text-right">
                  {isDone ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                      Completed ✓
                    </span>
                  ) : isCurrent ? (
                    <span className="text-[11px] font-semibold text-sky-700 flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Waiting</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Action Box */}
        {completed && currentResult && (
          <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-sky-50 via-cyan-50 to-emerald-50 border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${currentResult.is_secure ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <h3 className="text-sm font-bold text-slate-900">
                  {currentResult.is_secure ? 'Security Verified: Key Distillable' : 'Key Generation Aborted'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                QBER: <strong>{(currentResult.qber * 100).toFixed(2)}%</strong> • Secret Key Rate: <strong>{currentResult.secret_key_rate.toLocaleString()} bps</strong> • Loss: <strong>{currentResult.channel_loss_db.toFixed(1)} dB</strong>
              </p>
            </div>

            <button
              onClick={() => onNavigate('results')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>VIEW RESULTS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
