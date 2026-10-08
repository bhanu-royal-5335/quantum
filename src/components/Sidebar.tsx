import React from 'react';
import {
  Home,
  Rocket,
  BarChart3,
  Microscope,
  GitCompare,
  FileText,
  Settings,
  Satellite,
  Database,
  Radio,
  Sliders,
  BookmarkCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'simulation'
  | 'results'
  | 'analysis'
  | 'compare'
  | 'report'
  | 'settings'
  | 'dataset'
  | 'quantum-simulation'
  | 'parameters'
  | 'channel'
  | 'scenario';

interface Props {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  hasResults: boolean;
  appMode?: 'simple' | 'research';
  onToggleMode?: (mode: 'simple' | 'research') => void;
}

export const Sidebar: React.FC<Props> = ({
  activePage,
  onNavigate,
  hasResults,
  appMode = 'simple',
  onToggleMode
}) => {
  // Primary 7 Navigation Items as requested
  const primaryNavItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: Home, hint: 'Start' },
    { id: 'simulation' as PageId, label: 'Simulation', icon: Rocket, hint: 'Run' },
    { id: 'results' as PageId, label: 'Results', icon: BarChart3, hint: hasResults ? 'Ready' : undefined },
    { id: 'analysis' as PageId, label: 'Analysis', icon: Microscope, hint: 'Graphs' },
    { id: 'compare' as PageId, label: 'Compare', icon: GitCompare, hint: 'Relay' },
    { id: 'report' as PageId, label: 'Reports', icon: FileText, hint: 'PDF/CSV' },
    { id: 'settings' as PageId, label: 'Settings', icon: Settings }
  ];

  // Research Mode extra tools
  const researchItems = [
    { id: 'parameters' as PageId, label: 'Detailed Optical Bench', icon: Sliders },
    { id: 'dataset' as PageId, label: 'NASA MERRA-2 & LEO Ephemeris', icon: Database },
    { id: 'quantum-simulation' as PageId, label: 'NQM Live 3D Canvas Studio', icon: Radio },
    { id: 'scenario' as PageId, label: 'Full Scenario Presets (A-F)', icon: BookmarkCheck }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-sm shrink-0">
            <Satellite className="w-5 h-5 text-sky-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                QuantumSim
              </h1>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-500/40 font-mono">
                QKD
              </span>
            </div>
            <span className="text-[11px] text-slate-400 tracking-wide block truncate">
              Satellite QKD Simulator
            </span>
          </div>
        </div>
      </div>

      {/* Mode Switcher Pill */}
      {onToggleMode && (
        <div className="px-3 pt-3">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => onToggleMode('simple')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                appMode === 'simple'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Simple</span>
            </button>
            <button
              onClick={() => onToggleMode('research')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                appMode === 'research'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Microscope className="w-3 h-3" />
              <span>Research</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {appMode === 'simple' ? 'Main Workflow' : 'Standard Workflow'}
        </div>

        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left relative cursor-pointer ${
                isActive
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.hint && (
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                    isActive
                      ? 'bg-sky-700/80 text-sky-100'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.hint}
                </span>
              )}
            </button>
          );
        })}

        {/* Research Mode Expansion */}
        {appMode === 'research' && (
          <div className="pt-3 mt-3 border-t border-slate-800 space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
              <span>Deep Research Tools</span>
              <span className="text-[9px] bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-500/30 text-indigo-300">
                ACTIVE
              </span>
            </div>

            {researchItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Simplified Telemetry Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400">
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500">Architecture</span>
          <span className="font-medium text-slate-300">Ground → LEO → HAP</span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500">Engine Status</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            BB84 Online
          </span>
        </div>
      </div>
    </aside>
  );
};
