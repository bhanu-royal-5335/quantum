import React from 'react';
import { Play, Sparkles, CheckCircle2, RefreshCw, Satellite, Radio } from 'lucide-react';
import { PageId } from './Sidebar';

interface Props {
  activeScenarioName: string;
  isSimulating: boolean;
  onRunDemo: () => void;
  onNavigate: (page: PageId) => void;
  isBackendConnected: boolean;
  qber?: number;
  channelLoss?: number;
  simulationMode?: 'standard' | 'realistic';
  onModeChange?: (mode: 'standard' | 'realistic') => void;
}

export const Header: React.FC<Props> = ({
  activeScenarioName,
  isSimulating,
  onRunDemo,
  onNavigate,
  isBackendConnected,
  qber,
  channelLoss,
  simulationMode = 'realistic',
  onModeChange
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 gap-3">
      {/* Left Column: Active Scenario & Quick Telemetry */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
            Active Scenario
          </span>
          <h2 className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2 truncate" title={activeScenarioName}>
            {activeScenarioName}
          </h2>
        </div>

        {qber != null && channelLoss != null && (
          <div className="hidden 2xl:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs shrink-0">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] whitespace-nowrap">
              QBER: <strong className={qber < 0.11 ? 'text-emerald-700' : 'text-rose-700'}>{(qber * 100).toFixed(2)}%</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] whitespace-nowrap">
              Loss: <strong>{channelLoss.toFixed(1)} dB</strong>
            </span>
          </div>
        )}
      </div>

      {/* Right Column: Controls & Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Simulation Mode Toggle (Requirement 11) */}
        {onModeChange && (
          <div className="hidden md:flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs shrink-0">
            <button
              onClick={() => onModeChange('standard')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                simulationMode === 'standard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Standard</span>
            </button>
            <button
              onClick={() => onModeChange('realistic')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                simulationMode === 'realistic'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>Realistic</span>
            </button>
          </div>
        )}

        {/* Backend health status indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 shrink-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isBackendConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
          <span className="hidden lg:inline whitespace-nowrap">
            {isBackendConnected ? 'API Connected' : 'Connecting...'}
          </span>
        </div>

        {/* Demo Mode Button */}
        <button
          onClick={onRunDemo}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          title="Load realistic baseline parameters and immediately run full end-to-end simulation"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Run Demo</span>
        </button>

        {/* Quick Navigate to Run Simulation */}
        <button
          onClick={() => onNavigate('simulation')}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer shrink-0 whitespace-nowrap"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>Run Simulation</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
