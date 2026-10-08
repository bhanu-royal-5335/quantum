import React, { useState, useRef, useEffect } from 'react';
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCcw,
  Radio,
  Satellite,
  Layers,
  ShieldCheck,
  Sparkles,
  BookmarkCheck,
  Sliders,
  Binary,
  TrendingDown,
  Cpu,
  BrainCircuit,
  FileSpreadsheet,
  KeyRound
} from 'lucide-react';

export type NqmSubDashboard =
  | 'orbit'
  | 'experiment'
  | 'params'
  | 'protocol'
  | 'calculator'
  | 'optimization'
  | 'aiprediction'
  | 'results'
  | 'crypto';

interface Props {
  className?: string;
  activeTab?: NqmSubDashboard;
  onSelectTab?: (tab: NqmSubDashboard) => void;
}

export const SUB_DASHBOARDS: { id: NqmSubDashboard; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'orbit', label: 'Mission Overview', icon: Satellite },
  { id: 'experiment', label: 'Scenario Presets', icon: BookmarkCheck },
  { id: 'params', label: 'Parameter Analysis', icon: Sliders },
  { id: 'protocol', label: 'BB84 / E91', icon: Binary },
  { id: 'calculator', label: 'Direct vs Relay Loss', icon: TrendingDown },
  { id: 'optimization', label: 'Optimization', icon: Cpu },
  { id: 'aiprediction', label: 'AI Diagnostics', icon: BrainCircuit },
  { id: 'results', label: 'Results', icon: FileSpreadsheet },
  { id: 'crypto', label: 'Encryption Sandbox', icon: KeyRound }
];

export const NqmSimulatorContainer: React.FC<Props> = ({
  className = '',
  activeTab = 'orbit',
  onSelectTab
}) => {
  const [currentTab, setCurrentTab] = useState<NqmSubDashboard>(activeTab);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (activeTab && activeTab !== currentTab) {
      setCurrentTab(activeTab);
      switchIframeTab(activeTab);
    }
  }, [activeTab]);

  const switchIframeTab = (tab: NqmSubDashboard) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SWITCH_TAB', tab }, '*');
    }
  };

  const handleTabClick = (tab: NqmSubDashboard) => {
    setCurrentTab(tab);
    switchIframeTab(tab);
    if (onSelectTab) onSelectTab(tab);
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = `/simulator/index.html?tab=${currentTab}&t=${Date.now()}`;
    }
  };

  const handleOpenExternal = () => {
    window.open(`/simulator/index.html?tab=${currentTab}`, '_blank', 'noopener,noreferrer');
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div
      className={`flex flex-col transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#030612] p-2 sm:p-4'
          : `w-full ${className}`
      }`}
    >
      {/* Simulation Header & Quick Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/95 backdrop-blur border border-slate-800 px-4 py-3 rounded-xl mb-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm shrink-0">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                NQM SATELLITE &amp; HAP RELAY QKD MISSION CONTROL
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                NASA &amp; CelesTrak Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              National Quantum Mission • Ground A → LEO Satellite → Stratospheric HAP Relay → Ground B
            </p>
          </div>
        </div>

        {/* Action Buttons & Status Indicators */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="hidden xl:flex items-center gap-2 mr-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-950 border border-slate-800 text-slate-300">
              <Satellite className="w-3 h-3 text-cyan-400" />
              LEO 500 km
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-950 border border-slate-800 text-purple-400">
              <Layers className="w-3 h-3 text-purple-400" />
              HAP 20 km
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-950 border border-slate-800 text-emerald-400">
              <ShieldCheck className="w-3 h-3" />
              BB84 / E91
            </span>
          </div>

          <button
            onClick={handleReload}
            title="Reload Simulation Engine"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Simulation View'}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Exit Full</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>

          <button
            onClick={handleOpenExternal}
            title="Open in Dedicated Browser Window"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/50 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Tab</span>
          </button>
        </div>
      </div>

      {/* Sub-Dashboard Navigation Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none">
        {SUB_DASHBOARDS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Embedded High-Fidelity NQM Simulator Viewport */}
      <div
        className={`w-full overflow-hidden rounded-xl border border-slate-800 shadow-2xl bg-[#030612] ${
          isFullscreen ? 'flex-1 h-[calc(100vh-130px)]' : 'h-[860px] min-h-[700px]'
        }`}
      >
        <iframe
          ref={iframeRef}
          src={`/simulator/index.html?tab=${currentTab}`}
          title="NQM Satellite & Stratospheric HAP Relay QKD Simulator"
          className="w-full h-full border-0 rounded-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
        />
      </div>
    </div>
  );
};
