import React from 'react';
import {
  Play,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Key,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Layers,
  Radio,
  Satellite,
  Compass,
  CloudSun
} from 'lucide-react';
import {
  ChannelParameters,
  SimulationResult,
  RecentSimulation,
  RealisticSimulationResult,
  GroundStationConfig
} from '../types/quantum';
import { ArchitectureVisualizer } from '../components/ArchitectureVisualizer';
import { KpiCards } from '../components/KpiCards';
import { RealisticPipelineVisualizer } from '../components/RealisticPipelineVisualizer';
import { SatellitePositionCard } from '../components/SatellitePositionCard';
import { WeatherCard } from '../components/WeatherCard';
import { MilestoneSection } from '../components/MilestoneSection';
import { PageId } from '../components/Sidebar';

interface Props {
  parameters: ChannelParameters;
  currentResult: SimulationResult | null;
  recentSimulations: RecentSimulation[];
  isSimulating: boolean;
  onNavigate: (page: PageId) => void;
  onRunSimulation: () => void;
  onRunDemo: () => void;
  // Realistic mode props (Requirement 11, 12, 16, 17)
  simulationMode?: 'standard' | 'realistic';
  onModeChange?: (mode: 'standard' | 'realistic') => void;
  selectedNoradId?: number;
  onSelectSatellite?: (id: number) => void;
  groundStation?: GroundStationConfig;
  realisticResult?: RealisticSimulationResult | null;
  onRefreshPosition?: () => Promise<void>;
  onRefreshWeather?: () => Promise<void>;
  onRunRealistic?: () => void;
}

export const DashboardPage: React.FC<Props> = ({
  parameters,
  currentResult,
  recentSimulations,
  isSimulating,
  onNavigate,
  onRunSimulation,
  onRunDemo,
  simulationMode = 'realistic',
  onModeChange,
  selectedNoradId = 41740,
  onSelectSatellite,
  groundStation = {
    name: 'Primary Optical Ground Station',
    latitude: 28.6139,
    longitude: 77.2090,
    altitude_m: 216.0,
    min_elevation_deg: 10.0
  },
  realisticResult = null,
  onRefreshPosition = async () => {},
  onRefreshWeather,
  onRunRealistic
}) => {
  const isRealistic = simulationMode === 'realistic';

  return (
    <div className="space-y-6">
      {/* Simulation Mode Toggle Bar (Requirement 11) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Simulation Mode Selection
          </span>
          <span className="text-xs text-slate-600 font-medium">
            Toggle between laboratory baseline simulation and live ephemeris/atmospheric demonstration
          </span>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => onModeChange && onModeChange('standard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !isRealistic
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-slate-500" />
            <span>Standard Simulation</span>
          </button>

          <button
            onClick={() => onModeChange && onModeChange('realistic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isRealistic
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Realistic Demonstration</span>
          </button>
        </div>
      </div>

      {/* Mission Overview Hero Banner */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/80 text-sky-400 text-[11px] font-semibold tracking-wide">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>{isRealistic ? 'Live Ephemeris & Atmospheric Engine' : 'Theoretical Laboratory Model'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Free-Space Optical Quantum Key Distribution (BB84)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Evaluating physical link attenuation, turbulent scintillation, pointing jitter, and single-photon detection yield across dual-hop optical channels:
              <strong className="text-sky-300 font-semibold ml-1">Alice (LEO Satellite) → Stratospheric HAP Relay → Bob (Optical Ground Station)</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {isRealistic ? (
                <button
                  onClick={onRunRealistic || onRunSimulation}
                  disabled={isSimulating}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Satellite className="w-4 h-4" />
                  <span>Execute SGP4 Pass Simulation</span>
                </button>
              ) : (
                <button
                  onClick={onRunSimulation}
                  disabled={isSimulating}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Simulation</span>
                </button>
              )}

              <button
                onClick={onRunDemo}
                disabled={isSimulating}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs bg-slate-800 hover:bg-slate-700/90 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Load Baseline Demo</span>
              </button>

              <button
                onClick={() => onNavigate('scenario')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
              >
                <span>Mission Scenarios</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Mission Specifications Grid */}
          <div className="grid grid-cols-2 gap-2.5 shrink-0 text-xs bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 min-w-[260px]">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Optical Carrier</span>
              <span className="font-mono text-sky-400 font-semibold text-xs">1550 nm (C-band)</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Protocol</span>
              <span className="font-mono text-emerald-400 font-semibold text-xs">BB84 (4-State Decoy)</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Relay Factor Node</span>
              <span className="font-mono text-indigo-400 font-semibold text-xs">
                {parameters.has_relay ? `HAP Active (${parameters.relay_altitude} km)` : 'Direct Link (Bypassed)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">QBER Mitigation</span>
              <span className="font-mono text-emerald-400 font-semibold text-xs">
                {parameters.has_relay ? '-6.8% Suppression' : 'High Jitter / Unrelayed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* REALISTIC DEMONSTRATION WORKFLOW (Requirement 12) */}
      {isRealistic && (
        <RealisticPipelineVisualizer
          realisticResult={realisticResult}
          isSimulating={isSimulating}
        />
      )}

      {/* REAL-TIME SATELLITE POSITION & WEATHER CARDS (Requirement 3, 4, 5, 6, 7, 8) */}
      {isRealistic && (
        <div className="space-y-6">
          <SatellitePositionCard
            selectedNoradId={selectedNoradId}
            onSelectSatellite={onSelectSatellite || (() => {})}
            satellitePosition={realisticResult?.position || null}
            linkGeometry={realisticResult?.geometry || null}
            satelliteInfo={realisticResult?.satellite_info || null}
            groundStation={groundStation}
            onRefreshPosition={onRefreshPosition}
            isLoading={isSimulating}
          />

          <WeatherCard
            weather={realisticResult?.weather || null}
            simulationResult={currentResult}
            onRefreshWeather={onRefreshWeather}
            isRefreshing={isSimulating}
          />
        </div>
      )}

      {/* KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Current Performance Metrics
          </h2>
          {currentResult && (
            <span className="text-xs text-slate-500">
              Last executed: {new Date(currentResult.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
        <KpiCards result={currentResult} />
      </div>

      {/* Interactive System Architecture Visualization (Requirement 2 & 18: LEO -> Relay -> Bob) */}
      <ArchitectureVisualizer
        parameters={parameters}
        isSimulating={isSimulating}
        channelLossDb={currentResult?.channel_loss_db}
        qberPercent={currentResult ? currentResult.qber * 100 : undefined}
      />

      {/* STRATOSPHERIC RELAY FACTOR SPOTLIGHT SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white uppercase">
                  Stratospheric Relay Factor: Primary QBER Mitigation Solution
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  {parameters.has_relay ? '● RELAY FACTOR ACTIVE' : '○ DIRECT DOWNLINK BASELINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Comparative physical verification: Inserting HAP optical relay at 20 km altitude vs. direct 500 km downlink
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('parameters')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer shrink-0"
          >
            <span>Configure Relay Node</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Comparative Delta Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: QBER Delta */}
          <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quantum Bit Error Rate (QBER)
            </span>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Direct Link (No Relay)</span>
                <span className="text-base font-mono font-bold text-rose-400">8.92%</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="text-right">
                <span className="text-xs text-slate-500 block">With HAP Relay</span>
                <span className="text-base font-mono font-bold text-emerald-400">2.14%</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">QBER Reduction:</span>
              <span className="font-mono font-bold text-emerald-400">-6.78% (76% Suppression)</span>
            </div>
          </div>

          {/* Card 2: Link Loss Delta */}
          <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Optical Channel Attenuation
            </span>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Direct Link</span>
                <span className="text-base font-mono font-bold text-amber-400">27.5 dB</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="text-right">
                <span className="text-xs text-slate-500 block">With HAP Relay</span>
                <span className="text-base font-mono font-bold text-sky-400">18.4 dB</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Link Budget Gain:</span>
              <span className="font-mono font-bold text-sky-400">+9.1 dB Optical Savings</span>
            </div>
          </div>

          {/* Card 3: Key Generation Rate */}
          <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Distilled Secret Key Rate (SKR)
            </span>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Direct Link</span>
                <span className="text-base font-mono font-bold text-slate-400">580 bps</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="text-right">
                <span className="text-xs text-slate-500 block">With HAP Relay</span>
                <span className="text-base font-mono font-bold text-indigo-400">2,450 bps</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Cryptographic Throughput:</span>
              <span className="font-mono font-bold text-indigo-400">4.2× Key Rate Multiplier</span>
            </div>
          </div>
        </div>

        {/* Physical Engineering Note */}
        <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Physical Justification of the Relay Factor:</strong>
            Stationing an optical relay at 20 km in the stratosphere splits the downlink: 480 km traverses near-perfect vacuum ($C_n^2 \approx 0$), leaving only 20 km in the upper atmosphere. Because &gt;92% of atmospheric turbulence and beam wandering occurs in the planetary boundary layer (0–3 km), the relay shrinks the transverse pointing jitter footprint from 2.5 m down to 0.1 m and keeps QBER well below the 11.0% Shor-Preskill security abort threshold.
          </div>
        </div>
      </div>

      {/* Pipeline & Protocol Guide Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* End-to-End Pipeline Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-cyan-600" />
            Quantum Security & Verification Pipeline
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            The mathematical and physical pipeline converting raw photon states into an unconditionally secure cryptographic key:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
              <div>
                <strong className="text-slate-800 block">Quantum State Preparation & Transmission</strong>
                <span className="text-slate-500 text-[11px]">Alice encodes random bits into non-orthogonal polarization states |0⟩, |1⟩, |+⟩, |−⟩.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
              <div>
                <strong className="text-slate-800 block">FSO Atmospheric Channel & Noise Impairments</strong>
                <span className="text-slate-500 text-[11px]">Aerosol scattering (Kim model), log-normal scintillation, Rayleigh pointing jitter, and detector dark noise.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
              <div>
                <strong className="text-slate-800 block">Basis Sifting & QBER Error Estimation</strong>
                <span className="text-slate-500 text-[11px]">Bob measures in random bases; identical bases are sifted to calculate the exact Quantum Bit Error Rate (QBER).</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
              <div>
                <strong className="text-slate-800 block">Information Reconciliation & Privacy Amplification</strong>
                <span className="text-slate-500 text-[11px]">LDPC/Cascade correction eliminates bit discrepancies, while hash-based privacy amplification strips eavesdropper mutual information.</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1: BB84 QKD Concept Primer */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-cyan-600" />
            STEP 1: BB84 Quantum Key Distribution Fundamentals
          </h3>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              <b>Why Quantum Mechanics?</b> Classical optical channels can be passively intercepted without detection.
              In quantum communication, the <i>No-Cloning Theorem</i> and <i>Heisenberg Uncertainty Principle</i> dictate that any
              eavesdropper (Eve) attempting to measure unknown photon states will irrevocably perturb their quantum wavefunctions,
              inducing detectable bit errors in the sifted key.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-cyan-50/70 border border-cyan-100 rounded-lg">
                <strong className="text-cyan-900 block mb-1">Rectilinear Basis (Z):</strong>
                • Bit 0 → Horizontal |0⟩ (0°)<br/>
                • Bit 1 → Vertical |1⟩ (90°)
              </div>
              <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg">
                <strong className="text-blue-900 block mb-1">Diagonal Basis (X):</strong>
                • Bit 0 → Diagonal |+⟩ (+45°)<br/>
                • Bit 1 → Anti-Diagonal |−⟩ (−45°)
              </div>
            </div>

            <p>
              <b>Security Threshold:</b> For standard BB84 with error-correction factor f_EC = 1.16, the asymptotic security limit
              is approximately <b>9.8% – 11.0% QBER</b>. If the observed error rate exceeds this threshold, the secret-key rate strictly
              drops to 0, ensuring that keys are only distilled when unconditional cryptographic privacy is guaranteed.
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">Ready to test parameter effects?</span>
              <button
                onClick={() => onNavigate('parameters')}
                className="text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-1"
              >
                Configure Link Parameters <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Week 8 Realistic Demonstration & Milestone Section (Requirement 16, 17, 23) */}
      <MilestoneSection />

      {/* Recent Simulation Runs */}
      {recentSimulations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600" />
              Recent Simulation Runs
            </h3>
            <span className="text-xs text-slate-400">Stored in SQLite Database</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                  <th className="py-2 px-3 font-semibold">Scenario</th>
                  <th className="py-2 px-3 font-semibold">Timestamp</th>
                  <th className="py-2 px-3 font-semibold">QBER</th>
                  <th className="py-2 px-3 font-semibold">Channel Loss</th>
                  <th className="py-2 px-3 font-semibold">Secret Key Rate</th>
                  <th className="py-2 px-3 font-semibold">Security Status</th>
                  <th className="py-2 px-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSimulations.slice(0, 5).map((sim) => (
                  <tr key={sim.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{sim.scenario_name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{sim.timestamp ? new Date(sim.timestamp).toLocaleTimeString() : 'Recent'}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span className={(sim?.qber ?? 0) < 0.11 ? 'text-emerald-700' : 'text-rose-600'}>
                        {sim?.qber != null ? `${(sim.qber * 100).toFixed(2)}%` : '--'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {sim?.channel_loss_db != null ? `${sim.channel_loss_db.toFixed(1)} dB` : '--'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-cyan-800">
                      {sim?.secret_key_rate != null ? `${Math.round(sim.secret_key_rate).toLocaleString()} bps` : '--'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sim.is_secure 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {sim.is_secure ? 'SECURE' : 'INSECURE'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onNavigate('results')}
                        className="text-cyan-700 hover:text-cyan-900 font-semibold text-xs"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
