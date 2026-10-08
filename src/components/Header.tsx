import React from 'react';
import { Play, Sparkles, RefreshCw, Satellite, Radio, CheckCircle2 } from 'lucide-react';
import { PageId } from './Sidebar';

interface Props {
  activeScenarioName: string;
  isSimulating: boolean;
  onRunDemo: () => void;
  onNavigate: (page: PageId) => void;
  isBackendConnected: boolean;
  qber?: number;
  channelLoss?: number;
  hasRelay?: boolean;
  relayAltitude?: number;
  appMode?: 'simple' | 'research';
  onToggleMode?: (mode: 'simple' | 'research') => void;
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
  hasRelay = true,
  relayAltitude = 20.0,
  appMode = 'simple',
  onToggleMode,
  simulationMode = 'realistic',
  onModeChange
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 gap-4">
      {/* Left Column: Active Mission Breadcrumb & Live Telemetry */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0 text-xs">
          <span className="text-slate-400 font-medium shrink-0">Mission</span>
          <span className="text-slate-300 font-light">/</span>
          <span
            className="font-semibold text-slate-800 truncate cursor-pointer hover:text-sky-600 transition-colors"
            title={activeScenarioName}
            onClick={() => onNavigate('dashboard')}
          >
            {activeScenarioName}
          </span>
        </div>

        {/* Stratospheric Relay Factor Status Badge */}
        <div
          onClick={() => onNavigate('compare')}
          title="Stratospheric Optical Relay Factor - Click to inspect or configure"
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-all ${
            hasRelay
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${hasRelay ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="font-semibold text-[11px]">
            {hasRelay ? `Relay Factor: Active (${relayAltitude} km)` : 'Direct Downlink'}
          </span>
        </div>

        {qber != null && channelLoss != null && (
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs shrink-0">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
              QBER <strong className={qber < 0.11 ? 'text-emerald-700 ml-1' : 'text-rose-700 ml-1'}>{(qber * 100).toFixed(2)}%</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
              Loss <strong className="text-slate-900 ml-1">{channelLoss.toFixed(1)} dB</strong>
            </span>
          </div>
        )}
      </div>

      {/* Right Column: Controls & Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Simple vs Research Mode Switcher */}
        {onToggleMode && (
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs shrink-0">
            <button
              onClick={() => onToggleMode('simple')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                appMode === 'simple'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${appMode === 'simple' ? 'bg-sky-600' : 'bg-slate-400'}`} />
              <span>Simple</span>
            </button>
            <button
              onClick={() => onToggleMode('research')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                appMode === 'research'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${appMode === 'research' ? 'bg-white' : 'bg-slate-400'}`} />
              <span>Research</span>
            </button>
          </div>
        )}

        {/* Backend health status */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 shrink-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isBackendConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="hidden sm:inline text-[11px] font-medium text-slate-600">
            {isBackendConnected ? 'Online' : 'Connecting...'}
          </span>
        </div>

        {/* Demo Mode Button */}
        <button
          onClick={onRunDemo}
          disabled={isSimulating}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs disabled:opacity-50 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          title="Load baseline configuration and run instant demonstration"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Demo</span>
        </button>

        {/* Primary Action Button */}
        <button
          onClick={() => onNavigate('simulation')}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer shrink-0 whitespace-nowrap"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>Run Sim</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
