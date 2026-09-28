import React from 'react';
import {
  LayoutDashboard,
  BookmarkCheck,
  Sliders,
  CloudSun,
  PlayCircle,
  BarChart3,
  GitCompare,
  FileText,
  Atom,
  ChevronRight,
  Database,
  Zap
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'scenario'
  | 'parameters'
  | 'channel'
  | 'dataset'
  | 'simulation'
  | 'results'
  | 'compare'
  | 'report'
  | 'quantum-simulation';

interface Props {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  hasResults: boolean;
}

export const Sidebar: React.FC<Props> = ({ activePage, onNavigate, hasResults }) => {
  const navItems: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dataset', label: 'NASA POWER Dataset', icon: Database, badge: '8.7k Hrs' },
    { id: 'scenario', label: 'Scenario Selection', icon: BookmarkCheck },
    { id: 'parameters', label: 'Satellite & Link Parameters', icon: Sliders },
    { id: 'channel', label: 'Channel Conditions', icon: CloudSun },
    { id: 'simulation', label: 'Run Simulation', icon: PlayCircle },
    { id: 'results', label: 'QBER & Key Results', icon: BarChart3, badge: hasResults ? 'Ready' : undefined },
    { id: 'compare', label: 'Compare Scenarios', icon: GitCompare },
    { id: 'report', label: 'Generate Report', icon: FileText }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
          <Atom className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight leading-none">
            QuantumSim FSO
          </h1>
          <span className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase mt-1 block">
            BB84 Satellite Link
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Simulation Pipeline
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
            </button>
          );
        })}

        {/* Dedicated Quantum Simulation Section */}
        <div className="pt-3 pb-1">
          <div className="border-t border-slate-800/80 my-2" />
          <div className="px-3 py-1 text-[10px] font-semibold text-purple-400/90 uppercase tracking-wider flex items-center justify-between">
            <span>BB84 Laboratory</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          </div>
        </div>

        <button
          onClick={() => onNavigate('quantum-simulation')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
            activePage === 'quantum-simulation'
              ? 'bg-gradient-to-r from-purple-600/30 to-cyan-600/20 text-purple-300 border border-purple-500/50 shadow-md shadow-purple-900/20'
              : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <Zap className={`w-4 h-4 ${activePage === 'quantum-simulation' ? 'text-purple-400 animate-pulse' : 'text-purple-400'}`} />
            <span className="font-semibold text-slate-100">Quantum Simulation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-purple-500/25 text-purple-300 border border-purple-500/40">
              NEW
            </span>
            {activePage === 'quantum-simulation' && <ChevronRight className="w-3.5 h-3.5 text-purple-400" />}
          </div>
        </button>
      </nav>

      {/* Model & Architecture Badge */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
        <span className="block font-semibold text-slate-300 mb-0.5">Architecture:</span>
        <span className="font-mono text-cyan-400 text-[10px] block">Alice → LEO → HAP → Bob</span>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
          <span>Kim / Kruse Attenuation</span>
          <span className="text-emerald-400 font-bold">BB84 QKD</span>
        </div>
      </div>
    </aside>
  );
};
