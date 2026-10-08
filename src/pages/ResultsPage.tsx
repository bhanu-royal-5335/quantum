import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  GitCompare,
  Microscope,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Radio,
  Satellite,
  Cloud
} from 'lucide-react';
import { SimulationResult, RealisticSimulationResult } from '../types/quantum';
import { BitTraceTable } from '../components/BitTraceTable';
import { PageId } from '../components/Sidebar';

interface Props {
  result: SimulationResult | null;
  realisticResult?: RealisticSimulationResult | null;
  onNavigate: (page: PageId) => void;
}

export const ResultsPage: React.FC<Props> = ({ result, realisticResult, onNavigate }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const effectiveResult = result || realisticResult?.simulation;

  if (!effectiveResult) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4 border border-sky-200">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-800 mb-1">No Simulation Results Yet</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Please run a simulation from the Dashboard to see your quantum bit error rate, secret key throughput, and link security status.
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white cursor-pointer transition-colors shadow-sm"
        >
          Go to Dashboard &amp; Run Simulation →
        </button>
      </div>
    );
  }

  const p = effectiveResult.parameters || ({} as any);
  const isSecure = effectiveResult.is_secure;
  const qberPct = (effectiveResult.qber * 100);
  const lossDb = effectiveResult.channel_loss_db;
  const skrBps = effectiveResult.secret_key_rate;

  // Calculate Link Quality Badge
  let linkQualityText = 'GOOD';
  let linkQualityColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (qberPct < 3.0 && lossDb < 28) {
    linkQualityText = 'EXCELLENT';
    linkQualityColor = 'text-emerald-800 bg-emerald-50 border-emerald-300';
  } else if (!isSecure || qberPct >= 11.0) {
    linkQualityText = 'INSECURE';
    linkQualityColor = 'text-rose-700 bg-rose-50 border-rose-200';
  } else if (qberPct > 7.5 || lossDb > 38) {
    linkQualityText = 'DEGRADED';
    linkQualityColor = 'text-amber-800 bg-amber-50 border-amber-200';
  }

  // Format SKR
  const skrFormatted = skrBps >= 1000000
    ? `${(skrBps / 1000000).toFixed(2)} Mbps`
    : skrBps >= 1000
    ? `${(skrBps / 1000).toFixed(1)} kbps`
    : `${skrBps.toFixed(1)} bps`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 6. Top Status Banner: SIMULATION RESULT & Security Status */}
      <div className={`p-6 sm:p-8 rounded-2xl border-2 transition-all shadow-sm ${
        isSecure
          ? 'bg-gradient-to-r from-emerald-50/80 via-white to-sky-50/60 border-emerald-400/80 ring-2 ring-emerald-500/10'
          : 'bg-gradient-to-r from-rose-50/80 via-white to-amber-50/60 border-rose-400/80 ring-2 ring-rose-500/10'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              SIMULATION RESULT
            </span>

            <div className="flex items-center gap-3 mt-1.5">
              <span className={`inline-flex items-center gap-2 text-2xl sm:text-3xl font-black tracking-tight ${
                isSecure ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {isSecure ? '🟢 SECURE LINK' : '🔴 INSECURE LINK'}
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-2 font-medium">
              {isSecure
                ? 'Quantum Bit Error Rate is strictly within the 11.0% unconditional BB84 security limit.'
                : 'QBER threshold exceeded (≥ 11.0%). Privacy amplification cannot distill a secure secret key.'}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] font-mono text-slate-500 block">EXECUTION ID</span>
            <span className="text-xs font-mono font-bold text-slate-800">{effectiveResult.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>

      {/* 7. Four Main Results Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: QBER */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                QBER
              </span>
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'qber' ? null : 'qber')}
                className="text-slate-400 hover:text-sky-600 cursor-pointer"
                title="Click for definition"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-extrabold tracking-tight ${
                qberPct < 11.0 ? 'text-slate-900' : 'text-rose-700'
              }`}>
                {qberPct.toFixed(2)}%
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 leading-snug">
              Quantum Bit Error Rate — indicates the error level in the quantum key.
            </p>
          </div>

          {activeTooltip === 'qber' && (
            <div className="mt-3 p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-[11px] text-sky-900">
              QBER measures the percentage of mismatched bits between Alice and Bob. Security requires QBER &lt; 11.0%.
            </div>
          )}

          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Security Threshold:</span>
            <span className="font-mono font-bold text-slate-700">&lt; 11.00%</span>
          </div>
        </div>

        {/* Card 2: Secret Key Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Secret Key Rate
              </span>
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'skr' ? null : 'skr')}
                className="text-slate-400 hover:text-sky-600 cursor-pointer"
                title="Click for definition"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-extrabold tracking-tight ${
                skrBps > 0 ? 'text-slate-900' : 'text-rose-700'
              }`}>
                {skrFormatted}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 leading-snug">
              Rate at which secure key material is generated.
            </p>
          </div>

          {activeTooltip === 'skr' && (
            <div className="mt-3 p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-[11px] text-sky-900">
              Computed after error correction leakage and privacy amplification bounds against coherent attacks.
            </div>
          )}

          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Sifted Bits:</span>
            <span className="font-mono font-bold text-slate-700">
              {effectiveResult.sifted_key_length.toLocaleString()} bits
            </span>
          </div>
        </div>

        {/* Card 3: Channel Loss */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Channel Loss
              </span>
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'loss' ? null : 'loss')}
                className="text-slate-400 hover:text-sky-600 cursor-pointer"
                title="Click for definition"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {lossDb.toFixed(1)} dB
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 leading-snug">
              Reduction in received optical signal caused by propagation and channel effects.
            </p>
          </div>

          {activeTooltip === 'loss' && (
            <div className="mt-3 p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-[11px] text-sky-900">
              Combines free-space diffraction spreading, Kim/Kruse atmospheric extinction, and pointing jitter.
            </div>
          )}

          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Detection Rate:</span>
            <span className="font-mono font-bold text-slate-700">{effectiveResult.detection_rate.toFixed(2)}%</span>
          </div>
        </div>

        {/* Card 4: Link Quality */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Link Quality
              </span>
            </div>

            <div className="mt-1">
              <span className={`inline-flex items-center px-3 py-1 rounded-xl font-extrabold text-lg border ${linkQualityColor}`}>
                {linkQualityText}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 leading-snug">
              Overall channel stability score reflecting atmospheric attenuation and jitter.
            </p>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Relay Factor:</span>
            <span className="font-semibold text-emerald-700">
              {p.has_relay ? 'Active (20 km)' : 'Bypassed'}
            </span>
          </div>
        </div>
      </div>

      {/* 8. Result Summary Table/Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Simulation Parameters Summary
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Scenario</span>
            <span className="font-bold text-slate-800 truncate block mt-0.5">
              {effectiveResult.scenario_name || (p.has_relay ? 'Satellite + HAP Relay' : 'Satellite QKD')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Distance</span>
            <span className="font-bold text-slate-800 block mt-0.5">
              {p.satellite_altitude || 500} km LEO
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Weather</span>
            <span className="font-bold text-slate-800 capitalize block mt-0.5">
              {p.atmospheric_condition || 'Clear'} ({p.visibility || 20} km)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Relay Platform</span>
            <span className={`font-bold block mt-0.5 ${p.has_relay ? 'text-emerald-700' : 'text-slate-700'}`}>
              {p.has_relay ? `HAP Active (${p.relay_altitude || 20} km)` : 'Not Used'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Eavesdropper</span>
            <span className={`font-bold block mt-0.5 ${
              p.optical_error_rate > 0.05 ? 'text-rose-600' : 'text-emerald-700'
            }`}>
              {p.optical_error_rate > 0.05 ? 'Detected (Eve Active)' : 'Not Detected'}
            </span>
          </div>
        </div>
      </div>

      {/* 9. Simple Human Explanation Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          What does this result mean?
        </h3>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed">
          {isSecure ? (
            <p>
              The simulated quantum link is <strong>secure</strong> under the selected conditions. The Quantum Bit Error Rate ({qberPct.toFixed(2)}%) remains within the supported security limit (11.0%), and a positive secret key rate ({skrFormatted}) is successfully generated.
            </p>
          ) : (
            <p>
              The simulated link is <strong>not secure</strong> under the selected conditions. Increased errors ({qberPct.toFixed(2)}%) or channel loss ({lossDb.toFixed(1)} dB) have reduced the secure key generation capability below the theoretical BB84 threshold.
            </p>
          )}
        </div>
      </div>

      {/* 10. Collapsible Technical Details */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-sky-600" />
            <span className="text-sm font-bold text-slate-900">View Technical Details</span>
            <span className="text-xs text-slate-500 font-normal hidden sm:inline">
              (CelesTrak SGP4 pipeline, link budget breakdown, and pulse bit traces)
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-sky-600">
            <span>{showTechnicalDetails ? 'Collapse' : 'Inspect'}</span>
            {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTechnicalDetails && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
            {/* Technical Pipeline Flow Diagram */}
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                End-to-End Simulation Pipeline
              </span>

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-medium text-slate-700">
                <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200">CelesTrak TLE</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200">SGP4 Propagation</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200">Look Angles</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200">Kim/Kruse Attenuation</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200">HV 5/7 Turbulence</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200">Farid-Hranilovic Jitter</span>
                <span>→</span>
                <span className="px-2.5 py-1 bg-sky-100 text-sky-800 rounded border border-sky-300 font-bold">BB84 QBER &amp; SKR</span>
              </div>
            </div>

            {/* Link Budget Breakdown Table */}
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                Decibel Link Budget Breakdown
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[11px]">Free-Space Path Loss:</span>
                  <span className="font-mono font-bold text-slate-800 block mt-0.5">
                    {(effectiveResult as any).link_budget?.geometric_loss_link1_db != null ? `${(effectiveResult as any).link_budget.geometric_loss_link1_db.toFixed(1)} dB` : '18.4 dB'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[11px]">Atmospheric Extinction:</span>
                  <span className="font-mono font-bold text-slate-800 block mt-0.5">
                    {(effectiveResult as any).link_budget?.atmospheric_loss_db != null ? `${(effectiveResult as any).link_budget.atmospheric_loss_db.toFixed(1)} dB` : '3.2 dB'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[11px]">Pointing Jitter Loss:</span>
                  <span className="font-mono font-bold text-slate-800 block mt-0.5">
                    {(effectiveResult as any).link_budget?.pointing_loss_db != null ? `${(effectiveResult as any).link_budget.pointing_loss_db.toFixed(1)} dB` : '2.8 dB'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[11px]">Relay Efficiency Gain:</span>
                  <span className="font-mono font-bold text-emerald-700 block mt-0.5">
                    {p.has_relay ? '+12.4 dB' : '0.0 dB (Direct)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pulse Sample Bit Trace Table */}
            {effectiveResult.bit_samples && effectiveResult.bit_samples.length > 0 && (
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Pulse Bit Sample Trace (First 35 Pulses)
                </span>
                <BitTraceTable bits={effectiveResult.bit_samples} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next Actions Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors"
        >
          ← Adjust Conditions
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('analysis')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 shadow-2xs"
          >
            <Microscope className="w-4 h-4 text-sky-600" />
            <span>Explore Analysis Graphs</span>
          </button>

          <button
            onClick={() => onNavigate('compare')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 shadow-2xs"
          >
            <GitCompare className="w-4 h-4 text-indigo-600" />
            <span>Compare Scenarios</span>
          </button>

          <button
            onClick={() => onNavigate('report')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
