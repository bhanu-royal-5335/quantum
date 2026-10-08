import React from 'react';
import { Satellite, Cloud, Radio, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

interface Props {
  hasRelay: boolean;
  distanceKm: number;
  relayAltitudeKm?: number;
  isSimulating?: boolean;
  isSecure?: boolean | null;
  eavesdropperActive?: boolean;
  groundStationName?: string;
}

export const SimpleArchitectureFlow: React.FC<Props> = ({
  hasRelay,
  distanceKm,
  relayAltitudeKm = 20.0,
  isSimulating = false,
  isSecure = null,
  eavesdropperActive = false,
  groundStationName
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 overflow-hidden relative">
      {/* Subtle background grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Header bar of visualizer */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 mb-6 pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            Quantum Communication Architecture
          </span>
          <h3 className="text-sm font-semibold text-slate-900 mt-1">
            End-to-End Space-to-Ground Optical Channel
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-[11px] border ${
            hasRelay
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasRelay ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {hasRelay ? `HAP Relay Active (${relayAltitudeKm} km)` : 'Direct Downlink (No Relay)'}
          </span>

          {eavesdropperActive && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold text-[11px] bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
              ⚠️ Eve Active
            </span>
          )}
        </div>
      </div>

      {/* Architecture Node Flow */}
      <div className="relative grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
        {/* Node 1: Alice (Ground Optical Source) */}
        <div className="flex flex-col items-center text-center p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all shadow-xs relative">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-2 shadow-xs">
            <Radio className="w-6 h-6 text-sky-600" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Sender</span>
          <span className="text-xs font-bold text-slate-900">ALICE</span>
          <span className="text-[11px] text-slate-600 mt-0.5">Ground Station</span>
          <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded mt-1.5 border border-sky-200">
            BB84 | 1550 nm
          </span>
        </div>

        {/* Link 1 Line / Arrow */}
        <div className="hidden sm:flex flex-col items-center justify-center relative">
          <div className="w-full h-0.5 bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-500 relative">
            {/* Animated Photon Pulse */}
            <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-sm border border-white ${isSimulating ? 'animate-ping' : ''}`} style={{ left: '50%' }} />
          </div>
          <span className="text-[10px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 mt-2 shadow-2xs whitespace-nowrap">
            Uplink (Vacuum)
          </span>
        </div>

        {/* Node 2: LEO Satellite */}
        <div className="flex flex-col items-center text-center p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all shadow-xs relative">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 shadow-xs">
            <Satellite className="w-6 h-6 text-indigo-600" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Space Node</span>
          <span className="text-xs font-bold text-slate-900">LEO SATELLITE</span>
          <span className="text-[11px] text-slate-600 mt-0.5">Orbit: {distanceKm} km</span>
          <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mt-1.5 border border-indigo-200">
            SGP4 Tracking
          </span>
        </div>

        {/* Link 2 to Relay or Bob */}
        <div className="hidden sm:flex flex-col items-center justify-center relative">
          <div className={`w-full h-0.5 relative ${hasRelay ? 'bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400' : 'bg-gradient-to-r from-indigo-400 to-slate-400 stroke-dasharray'}`}>
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-400 shadow-sm border border-white" style={{ left: '50%' }} />
          </div>
          <span className="text-[10px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 mt-2 shadow-2xs whitespace-nowrap">
            {hasRelay ? 'Stratosphere Link' : 'Direct Downlink'}
          </span>
        </div>

        {/* Node 3: HAP Relay (Conditional styling if active) */}
        {hasRelay ? (
          <div className="flex flex-col items-center text-center p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-300 transition-all shadow-xs relative ring-2 ring-emerald-500/10">
            <div className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-bold uppercase tracking-wider shadow-2xs">
              Stratospheric Relay
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 shadow-xs mt-1">
              <Cloud className="w-6 h-6 text-emerald-700" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Relay Node</span>
            <span className="text-xs font-bold text-slate-900">HAP PLATFORM</span>
            <span className="text-[11px] text-slate-600 mt-0.5">Altitude: {relayAltitudeKm} km</span>
            <span className="text-[10px] font-mono text-emerald-800 bg-white px-1.5 py-0.5 rounded mt-1.5 border border-emerald-300">
              Loss Savings: ~12 dB
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center p-3.5 rounded-xl bg-slate-100/60 border border-dashed border-slate-300 transition-all opacity-60">
            <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center mb-2">
              <Cloud className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Relay Node</span>
            <span className="text-xs font-bold text-slate-500">HAP BYPASSED</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Direct to Ground</span>
            <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded mt-1.5 border border-slate-200">
              Boundary Layer Loss
            </span>
          </div>
        )}

        {/* Link 3 to Bob */}
        <div className="hidden sm:flex flex-col items-center justify-center relative">
          <div className="w-full h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 relative">
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-sky-400 shadow-sm border border-white" style={{ left: '50%' }} />
          </div>
          <span className="text-[10px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 mt-2 shadow-2xs whitespace-nowrap">
            Slant Downlink
          </span>
        </div>

        {/* Node 4: Bob (Ground Station Receiver) */}
        <div className="flex flex-col items-center text-center p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all shadow-xs relative">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-2 shadow-xs">
            <ShieldCheck className="w-6 h-6 text-sky-600" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Receiver</span>
          <span className="text-xs font-bold text-slate-900">BOB</span>
          <span className="text-[11px] text-slate-600 mt-0.5 truncate max-w-[140px]" title={groundStationName || 'Optical Ground Station'}>
            {groundStationName ? groundStationName.replace(' Quantum Communication Station', ' (Amaravati)') : 'Optical Ground Station'}
          </span>
          <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded mt-1.5 border border-sky-200">
            SPAD Detectors (80%)
          </span>
        </div>
      </div>
    </div>
  );
};
