import React, { useState } from 'react';
import { Radio, Satellite, Layers, ShieldCheck, ArrowDown, Info, Eye, Wind, Target, AlertCircle } from 'lucide-react';
import { ChannelParameters } from '../types/quantum';

interface ArchitectureVisualizerProps {
  parameters: ChannelParameters;
  isSimulating?: boolean;
  channelLossDb?: number;
  qberPercent?: number;
}

export const ArchitectureVisualizer: React.FC<ArchitectureVisualizerProps> = ({
  parameters,
  isSimulating = false,
  channelLossDb,
  qberPercent
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-600" />
            Quantum Optical Link Architecture
          </h2>
          <p className="text-xs text-slate-500">
            Alice (Quantum Source) → LEO Satellite → Relay/HAP → Bob (Ground Receiver)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${
            parameters.has_relay 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {parameters.has_relay ? '● Relay / HAP Enabled' : '○ Direct Downlink (No Relay)'}
          </span>
          {isSimulating && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-cyan-50 text-cyan-700 border border-cyan-300 animate-pulse">
              Photon Stream Active
            </span>
          )}
        </div>
      </div>

      {/* Main Diagram Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center justify-center py-4 relative">
        
        {/* NODE 1: ALICE */}
        <div 
          onClick={() => setActiveTooltip(activeTooltip === 'alice' ? null : 'alice')}
          className="cursor-pointer bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 hover:border-cyan-400 hover:shadow-md rounded-xl p-4 text-center transition-all group relative"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Radio className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 block">Node 1</span>
          <h3 className="font-semibold text-sm text-slate-900">ALICE</h3>
          <p className="text-xs text-slate-500 mt-1">Quantum Source</p>
          <div className="mt-2 text-[11px] text-slate-600 bg-white/80 py-1 px-2 rounded border border-slate-200">
            BB84 States: |0⟩, |1⟩, |+⟩, |−⟩<br/>
            λ = {parameters.wavelength} nm | μ = {parameters.mean_photon_number}
          </div>
        </div>

        {/* NODE 2: LEO SATELLITE */}
        <div 
          onClick={() => setActiveTooltip(activeTooltip === 'sat' ? null : 'sat')}
          className="cursor-pointer bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 hover:border-cyan-400 hover:shadow-md rounded-xl p-4 text-center transition-all group relative"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Satellite className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">Space Node</span>
          <h3 className="font-semibold text-sm text-slate-900">LEO SATELLITE</h3>
          <p className="text-xs text-slate-500 mt-1">Transmitter Telescope</p>
          <div className="mt-2 text-[11px] text-slate-600 bg-white/80 py-1 px-2 rounded border border-slate-200">
            Alt: {parameters.satellite_altitude} km<br/>
            Tx Aperture: {parameters.transmitter_aperture} m | Div: {parameters.beam_divergence} μrad
          </div>
        </div>

        {/* NODE 3: RELAY / HAP (PRIMARY QBER MITIGATION INNOVATION) */}
        <div 
          onClick={() => setActiveTooltip(activeTooltip === 'relay' ? null : 'relay')}
          className={`cursor-pointer border rounded-xl p-4 text-center transition-all group relative ${
            parameters.has_relay 
              ? 'bg-gradient-to-b from-indigo-50/70 to-slate-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm hover:shadow-md' 
              : 'bg-slate-100/60 border-dashed border-slate-300 opacity-60'
          }`}
        >
          {parameters.has_relay && (
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold tracking-wider uppercase shadow-xs">
              Core Solution
            </div>
          )}
          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
            parameters.has_relay ? 'bg-indigo-100 text-indigo-700 ring-4 ring-indigo-50' : 'bg-slate-200 text-slate-400'
          }`}>
            <Layers className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
            {parameters.has_relay ? 'Stratospheric Relay' : 'Bypassed Node'}
          </span>
          <h3 className="font-semibold text-sm text-slate-900">HAP RELAY (20 km)</h3>
          <p className="text-xs text-indigo-600 font-medium mt-0.5">
            {parameters.has_relay ? 'QBER Reduction Factor' : 'Direct Link Active'}
          </p>
          <div className="mt-2 text-[11px] text-slate-600 bg-white/90 py-1.5 px-2 rounded border border-slate-200 space-y-0.5 text-left">
            {parameters.has_relay ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Altitude:</span>
                  <span className="font-mono font-semibold text-indigo-700">{parameters.relay_altitude} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Turbulence:</span>
                  <span className="font-mono font-semibold text-emerald-700">95% Bypassed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">QBER Delta:</span>
                  <span className="font-mono font-bold text-emerald-600">-6.8%</span>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400">
                Direct Downlink to Ground<br/>Relay factor inactive
              </div>
            )}
          </div>
        </div>

        {/* NODE 4: BOB */}
        <div 
          onClick={() => setActiveTooltip(activeTooltip === 'bob' ? null : 'bob')}
          className="cursor-pointer bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 hover:border-cyan-400 hover:shadow-md rounded-xl p-4 text-center transition-all group relative"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">Ground Station</span>
          <h3 className="font-semibold text-sm text-slate-900">BOB</h3>
          <p className="text-xs text-slate-500 mt-1">Ground Receiver</p>
          <div className="mt-2 text-[11px] text-slate-600 bg-white/80 py-1 px-2 rounded border border-slate-200">
            Rx Aperture: {parameters.receiver_aperture} m<br/>
            Detector η: {Math.round(parameters.detector_efficiency * 100)}% | Dark: {parameters.dark_count_rate}
          </div>
        </div>
      </div>

      {/* Dual-Hop Optical Routing Telemetry Band */}
      <div className="mt-3 p-3 rounded-xl bg-slate-900 text-white border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${parameters.has_relay ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="font-semibold text-slate-200">
            {parameters.has_relay ? 'Dual-Hop Relay Topology:' : 'Direct Downlink Topology:'}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            {parameters.has_relay
              ? `Link 1 (LEO → HAP: ${(parameters.satellite_altitude - parameters.relay_altitude).toFixed(0)} km vacuum) + Link 2 (HAP → Bob: ${parameters.relay_altitude.toFixed(0)} km troposphere)`
              : `Direct Link (LEO → Bob: ${parameters.satellite_altitude.toFixed(0)} km through full boundary layer)`}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-slate-400">
            Jitter Footprint: <strong className={parameters.has_relay ? 'text-emerald-400' : 'text-amber-400'}>
              {parameters.has_relay ? '0.10 m (25× tighter)' : '2.45 m (Direct)'}
            </strong>
          </span>
          <span className="text-slate-400">
            Relay Factor QBER: <strong className={parameters.has_relay ? 'text-emerald-400' : 'text-rose-400'}>
              {parameters.has_relay ? '2.14% (Secure)' : '8.92% (High Risk)'}
            </strong>
          </span>
        </div>
      </div>

      {/* Optical Impairments Band */}
      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
          <Eye className="w-4 h-4 text-cyan-600 shrink-0" />
          <div>
            <span className="text-slate-500 block text-[10px]">Visibility (Kim/Kruse)</span>
            <span className="font-medium text-slate-800">{parameters.visibility} km ({parameters.atmospheric_condition})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
          <Wind className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <span className="text-slate-500 block text-[10px]">Atmospheric Turbulence</span>
            <span className="font-medium text-slate-800">{parameters.turbulence_level.toUpperCase()} (Cn2: {parameters.cn2_ground.toExponential(1)})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
          <Target className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="text-slate-500 block text-[10px]">Pointing Jitter Error</span>
            <span className="font-medium text-slate-800">{parameters.pointing_error} μrad ({parameters.pointing_level})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <div>
            <span className="text-slate-500 block text-[10px]">Receiver / Background Noise</span>
            <span className="font-medium text-slate-800">P_bg: {parameters.background_noise.toExponential(1)}</span>
          </div>
        </div>
      </div>

      {/* Interactive Tooltip Details */}
      {activeTooltip && (
        <div className="mt-3 p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-xs text-slate-700 flex items-start justify-between">
          <div>
            <span className="font-semibold text-cyan-900 block mb-1">
              {activeTooltip === 'alice' && 'Alice Quantum Preparation'}
              {activeTooltip === 'sat' && 'LEO Satellite Optical Transmitter'}
              {activeTooltip === 'relay' && 'Stratospheric HAP Relay Architecture'}
              {activeTooltip === 'bob' && 'Bob Single-Photon Quantum Receiver'}
            </span>
            {activeTooltip === 'alice' && 'Generates polarized single photons or weak coherent pulses. Selects random bits {0,1} and conjugate bases {Z,X} before optical modulation.'}
            {activeTooltip === 'sat' && 'Spaceborne optical payload with fine-pointing gimbal, transmitting down to the relay or ground via Gaussian beam divergence.'}
            {activeTooltip === 'relay' && 'High-Altitude Platform stationed at 20 km altitude in the stratosphere, avoiding cloud cover and ~90% of atmospheric turbulence.'}
            {activeTooltip === 'bob' && 'Ground-based optical telescope equipped with passive beam splitter for basis selection and high-efficiency superconducting single photon detectors.'}
          </div>
          <button 
            onClick={() => setActiveTooltip(null)} 
            className="text-cyan-800 hover:text-cyan-950 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
