import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Radio,
  Eye,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sliders,
  ChevronRight,
  Info,
  ShieldAlert,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { BitTrace, QberComparison } from '../types/quantum';

interface QuantumPipelineVisualizerProps {
  bitSamples: BitTrace[];
  simulatedQber: number;
  referenceQber?: number;
  qberComparison?: QberComparison;
  channelLossDb: number;
  totalBits?: number;
  siftedBits?: number;
  errorBits?: number;
}

export const QuantumPipelineVisualizer: React.FC<QuantumPipelineVisualizerProps> = ({
  bitSamples,
  simulatedQber,
  referenceQber,
  qberComparison,
  channelLossDb,
  totalBits = 10000,
  siftedBits = 500,
  errorBits = 12
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(1200);

  const sampleCount = bitSamples && bitSamples.length > 0 ? bitSamples.length : 0;
  const currentBit = sampleCount > 0 ? bitSamples[activeStepIndex % sampleCount] : null;

  // Auto-play animation loop
  useEffect(() => {
    if (!isPlaying || sampleCount === 0) return;
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % sampleCount);
    }, speedMs);
    return () => clearInterval(interval);
  }, [isPlaying, speedMs, sampleCount]);

  if (!bitSamples || bitSamples.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-400">
        <Sparkles className="h-8 w-8 text-cyan-400 mb-2 animate-pulse" />
        <p className="text-sm font-medium">No quantum bit samples loaded.</p>
        <p className="text-xs text-slate-500">Run a simulation with sample traces to visualize the BB84 pipeline.</p>
      </div>
    );
  }

  // Determine state vector string representation for current pulse
  const getStateVector = (basis: string, bit: number) => {
    if (basis === 'Z') {
      return bit === 0
        ? { ket: '|0⟩', vec: '[1.0, 0.0]ᵀ', pol: 'Horizontal (0°)' }
        : { ket: '|1⟩', vec: '[0.0, 1.0]ᵀ', pol: 'Vertical (90°)' };
    } else {
      return bit === 0
        ? { ket: '|+⟩', vec: '[1/√2, 1/√2]ᵀ', pol: 'Diagonal +45°' }
        : { ket: '|-⟩', vec: '[1/√2, -1/√2]ᵀ', pol: 'Diagonal -45°' };
    }
  };

  const currentAliceState = currentBit ? getStateVector(currentBit.alice_basis, currentBit.alice_bit) : null;
  const currentBobState = currentBit && currentBit.bob_bit !== null && currentBit.bob_bit !== undefined
    ? getStateVector(currentBit.bob_basis, currentBit.bob_bit)
    : null;

  // Comparison metrics
  const hasRef = referenceQber !== undefined && referenceQber !== null;
  const qberDiff = hasRef ? Math.abs(simulatedQber - (referenceQber || 0)) : null;

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-6 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Zap className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-bold text-white tracking-wide">
              BB84 Quantum Key Distribution Pipeline
            </h3>
            <span className="rounded-full bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
              Discrete 2D Hilbert Space
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time pulse propagation: State Preparation → FSO Atmospheric Channel → Bob Measurement → Sifting → Simulated QBER
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveStepIndex((prev) => (prev > 0 ? prev - 1 : sampleCount - 1))}
            className="rounded-lg border border-slate-800 bg-slate-800/60 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Previous Pulse"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-md transition ${
              isPlaying
                ? 'border border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Auto Play
              </>
            )}
          </button>
          <button
            onClick={() => setActiveStepIndex((prev) => (prev + 1) % sampleCount)}
            className="rounded-lg border border-slate-800 bg-slate-800/60 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Next Pulse"
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <div className="ml-2 flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/50 rounded-lg px-2.5 py-1.5 border border-slate-800">
            <Sliders className="h-3 w-3 text-slate-400" />
            <select
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              aria-label="Simulation Animation Speed"
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value={2000} className="bg-slate-900">0.5x</option>
              <option value={1200} className="bg-slate-900">1.0x</option>
              <option value={600} className="bg-slate-900">2.0x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pulse Sequence Selector Rail */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Pulse Sequence Trace (Showing first {sampleCount} pulses)</span>
          <span className="font-mono text-cyan-400">Pulse #{currentBit ? currentBit.index : 1} of {sampleCount}</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {bitSamples.map((sample, idx) => {
            const isSelected = idx === activeStepIndex;
            let badgeBg = 'bg-slate-800/80 border-slate-700 text-slate-400';
            if (sample.detected && sample.basis_matched) {
              badgeBg = sample.is_error
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
            } else if (sample.detected) {
              badgeBg = 'bg-amber-950/40 border-amber-500/30 text-amber-300';
            } else {
              badgeBg = 'bg-slate-900/60 border-slate-800 text-slate-600 line-through';
            }

            return (
              <button
                key={sample.index}
                onClick={() => setActiveStepIndex(idx)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-9 h-11 rounded-lg border text-xs font-mono transition-all ${badgeBg} ${
                  isSelected ? 'ring-2 ring-cyan-400 scale-105 z-10' : 'hover:border-slate-500'
                }`}
              >
                <span className="text-[10px] opacity-70">#{sample.index}</span>
                <span className="font-bold">{sample.alice_bit}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5-Stage Interactive Pipeline */}
      {currentBit && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 mb-6">
          {/* STAGE 1: ALICE STATE PREP */}
          <div className="rounded-xl border border-cyan-500/30 bg-slate-900/80 p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">1. Alice (Tx)</span>
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">State Preparation</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Raw Bit:</span>
                  <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">
                    {currentBit.alice_bit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Basis:</span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    {currentBit.alice_basis} ({currentBit.alice_basis === 'Z' ? 'Rectilinear' : 'Diagonal'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantum State:</span>
                  <span className="font-mono text-cyan-400 font-bold">{currentAliceState?.ket}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Vector:</span>
              <span className="text-cyan-300">{currentAliceState?.vec}</span>
            </div>
          </div>

          {/* STAGE 2: QUANTUM CHANNEL */}
          <div className="rounded-xl border border-blue-500/30 bg-slate-900/80 p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">2. Channel</span>
                <Radio className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">FSO Atmospheric Path</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Channel Loss:</span>
                  <span className="font-mono font-bold text-amber-300">{channelLossDb.toFixed(1)} dB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Turbulence / Scint.:</span>
                  <span className="text-slate-300">Rytov Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Noise Gate:</span>
                  <span className="text-slate-300">Dark + Background</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-400">Status:</span>
              <span className={currentBit.detected ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {currentBit.detected ? 'Photon Transmitted' : 'Photon Extinguished'}
              </span>
            </div>
          </div>

          {/* STAGE 3: BOB MEASUREMENT */}
          <div className="rounded-xl border border-violet-500/30 bg-slate-900/80 p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">3. Bob (Rx)</span>
                <Eye className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Born's Rule Collapse</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bob Basis:</span>
                  <span className="font-mono text-violet-300 font-semibold">
                    {currentBit.bob_basis} ({currentBit.bob_basis === 'Z' ? 'Rectilinear' : 'Diagonal'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Click Registered:</span>
                  <span className={currentBit.detected ? 'font-bold text-emerald-400' : 'text-slate-500'}>
                    {currentBit.detected ? 'YES (Click)' : 'NO (Lost)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Measured Bit:</span>
                  <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">
                    {currentBit.bob_bit !== null && currentBit.bob_bit !== undefined ? currentBit.bob_bit : '—'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Born State:</span>
              <span className="text-violet-300">{currentBobState ? currentBobState.ket : '—'}</span>
            </div>
          </div>

          {/* STAGE 4: BASIS SIFTING */}
          <div className="rounded-xl border border-amber-500/30 bg-slate-900/80 p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">4. Sifting</span>
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Basis Reconciliation</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Alice ↔ Bob:</span>
                  <span className="font-mono">
                    {currentBit.alice_basis} ↔ {currentBit.bob_basis}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Basis Match:</span>
                  <span className={currentBit.basis_matched ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {currentBit.basis_matched ? 'MATCHED (50%)' : 'MISMATCH (Discarded)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sifted Bit Retained:</span>
                  <span className={currentBit.detected && currentBit.basis_matched ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                    {currentBit.detected && currentBit.basis_matched ? 'RETAINED' : 'DISCARDED'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-400">Key Pair:</span>
              <span className="text-amber-300">
                {currentBit.detected && currentBit.basis_matched
                  ? `Alice: ${currentBit.alice_bit} | Bob: ${currentBit.bob_bit}`
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* STAGE 5: ERROR ESTIMATION & COMPARISON */}
          <div className="rounded-xl border border-emerald-500/30 bg-slate-900/80 p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">5. Verification</span>
                {currentBit.is_error ? (
                  <XCircle className="h-4 w-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                )}
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Simulated QBER</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pulse Bit Error:</span>
                  <span className={currentBit.is_error ? 'font-bold text-rose-400' : 'font-semibold text-emerald-400'}>
                    {currentBit.is_error ? 'ERROR (Bit Flip)' : 'PARITY VALID (0 Error)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Simulated QBER:</span>
                  <span className="font-mono font-bold text-cyan-300">{(simulatedQber * 100).toFixed(3)}%</span>
                </div>
                {hasRef && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reference QBER:</span>
                    <span className="font-mono font-bold text-amber-300">{(Number(referenceQber) * 100).toFixed(3)}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-400">Threshold:</span>
              <span className={simulatedQber < 0.11 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {simulatedQber < 0.11 ? 'SECURE (< 11%)' : 'COMPROMISED (≥ 11%)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sifted Key Statistics & Reference QBER Comparison Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Raw Qubits Sent</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-white font-mono">{totalBits.toLocaleString()}</span>
            <span className="text-xs text-slate-500">pulses</span>
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Sifted Key Length</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-cyan-400 font-mono">{siftedBits.toLocaleString()}</span>
            <span className="text-xs text-slate-500">
              ({((siftedBits / Math.max(1, totalBits)) * 100).toFixed(1)}% yield)
            </span>
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Simulated QBER</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-cyan-300 font-mono">{(simulatedQber * 100).toFixed(3)}%</span>
            <span className="text-xs text-slate-500">({errorBits} bit errors)</span>
          </div>
        </div>

        {/* Validation Delta */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {hasRef ? 'Dataset Validation Delta' : 'Security Threshold Margin'}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            {hasRef ? (
              <>
                <span className={`text-lg font-bold font-mono ${qberDiff! < 0.02 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {(qberDiff! * 100).toFixed(3)}%
                </span>
                <span className="text-xs text-slate-500">|Sim - Ref|</span>
              </>
            ) : (
              <>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {((0.11 - simulatedQber) * 100).toFixed(2)}%
                </span>
                <span className="text-xs text-slate-500">margin to 11%</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
