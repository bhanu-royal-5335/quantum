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
  Radio,
  Database,
  Satellite
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'scenario'
  | 'parameters'
  | 'channel'
  | 'dataset'
  | 'simulation'
  | 'quantum-simulation'
  | 'results'
  | 'compare'
  | 'report';

interface Props {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  hasResults: boolean;
}

interface NavSection {
  title: string;
  items: {
    id: PageId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    hint?: string;
  }[];
}

export const Sidebar: React.FC<Props> = ({ activePage, onNavigate, hasResults }) => {
  const sections: NavSection[] = [
    {
      title: 'Mission Control',
      items: [
        { id: 'dashboard', label: 'Mission Overview', icon: LayoutDashboard },
        { id: 'scenario', label: 'Preset Scenarios', icon: BookmarkCheck }
      ]
    },
    {
      title: 'Optical Link Design',
      items: [
        { id: 'parameters', label: 'Orbit & Terminal Geometry', icon: Sliders },
        { id: 'channel', label: 'Atmospheric Channel', icon: CloudSun },
        { id: 'dataset', label: 'NASA Climate & Ephemeris', icon: Database, hint: 'LEO Catalog' }
      ]
    },
    {
      title: 'Quantum Simulation',
      items: [
        { id: 'simulation', label: 'Channel & Attenuation', icon: PlayCircle },
        { id: 'quantum-simulation', label: 'NQM Satellite QKD Simulator', icon: Radio, hint: 'NQM Simulator' },
        { id: 'results', label: 'QBER & Secret Key Yield', icon: BarChart3, hint: hasResults ? 'Computed' : undefined }
      ]
    },
    {
      title: 'Analysis & Reports',
      items: [
        { id: 'compare', label: 'Scenario Comparison', icon: GitCompare },
        { id: 'report', label: 'Mission Engineering Report', icon: FileText }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-sm shrink-0">
          <Satellite className="w-4 h-4 text-sky-400 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              QuantumSim
            </h1>
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-500/40 font-mono">
              NQM
            </span>
          </div>
          <span className="text-[10px] text-slate-400 tracking-wide block truncate">
            Satellite QKD Simulator
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {sec.title}
            </div>

            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left relative group cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/20 text-sky-200 font-semibold border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  {/* Left accent bar on active */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-sky-400" />
                  )}

                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.hint && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                        isActive
                          ? 'bg-sky-950 text-sky-300 border-sky-500/30'
                          : 'bg-slate-900/60 text-slate-500 border-slate-800'
                      }`}
                    >
                      {item.hint}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Mission Telemetry Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Ground Station</span>
          <span className="font-mono text-slate-300 text-[10px] truncate max-w-[125px]">Rayalaseema OGS</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Dataset Status</span>
          <span className="font-mono text-emerald-400 text-[10px]">● Connected</span>
        </div>
        <div className="pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ITU-R &amp; NQM Active
          </span>
          <span className="text-slate-500 font-mono">ITU-R P.1814</span>
        </div>
      </div>
    </aside>
  );
};
