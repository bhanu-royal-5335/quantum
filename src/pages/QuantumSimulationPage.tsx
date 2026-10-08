import React, { useState } from 'react';
import {
  Satellite,
  Radio,
  Sparkles,
  Layers,
  Database,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Maximize2
} from 'lucide-react';
import { PageId } from '../components/Sidebar';
import { NqmSimulatorContainer } from '../components/NqmSimulatorContainer';
import { NqmLiveVisualizer } from '../components/NqmLiveVisualizer';

interface Props {
  onNavigate?: (page: PageId) => void;
}

export const QuantumSimulationPage: React.FC<Props> = ({ onNavigate }) => {
  const [viewMode, setViewMode] = useState<'console' | 'live3d'>('console');

  return (
    <div className="space-y-6">
      {/* NQM Mission Control Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-950 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-md">
              <Radio className="w-6 h-6 text-sky-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  NQM Satellite &amp; HAP Relay QKD Mission Control
                </h1>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  3-Hop Relay Engine Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                National Quantum Mission · Ground Station A → LEO Satellite → Stratospheric HAP Relay (20 km) → Ground Station B
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live 3D vs Console Switcher */}
            <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
              <button
                onClick={() => setViewMode('console')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'console'
                    ? 'bg-sky-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Simulator Console &amp; Sub-Dashboards
              </button>
              <button
                onClick={() => setViewMode('live3d')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'live3d'
                    ? 'bg-sky-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live 3D Earth Orbit Stream
              </button>
            </div>

            {/* Dataset Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>NASA &amp; CELESTRAK CONNECTED</span>
            </div>
          </div>
        </div>

        {/* System Architecture Micro-Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Ground Station A</div>
              <div className="font-medium text-slate-200 truncate">Rayalaseema OGS (14°N, 78°E)</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">LEO Satellite Orbit</div>
              <div className="font-medium text-slate-200">500 km Altitude (SGP4)</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Stratospheric HAP</div>
              <div className="font-medium text-slate-200">20 km Relay Refocusing</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Atmospheric Channel</div>
              <div className="font-medium text-emerald-300">NASA POWER Live Met Data</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main View: NQM Simulator Container with its 9 Sub-Dashboards or Live 3D Stream */}
      {viewMode === 'console' ? (
        <NqmSimulatorContainer />
      ) : (
        <div className="space-y-4">
          <NqmLiveVisualizer className="shadow-lg" />
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Viewing Native 60 FPS Canvas Photon Propagation (Alice LEO → HAP Relay → Bob OGS)</span>
            </div>
            <button
              onClick={() => setViewMode('console')}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
            >
              Back to Full Sub-Dashboards Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantumSimulationPage;
