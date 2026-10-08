import React, { useState } from 'react';
import {
  Microscope,
  TrendingDown,
  Activity,
  Wind,
  Target,
  BarChart2,
  FileText,
  Sliders,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SimulationResult, RealisticSimulationResult } from '../types/quantum';
import { LossVsDistanceChart } from '../charts/LossVsDistanceChart';
import { QberVsTurbulenceChart } from '../charts/QberVsTurbulenceChart';
import { QberVsPointingChart } from '../charts/QberVsPointingChart';
import { KeyRateVsConditionsChart } from '../charts/KeyRateVsConditionsChart';
import { MonteCarloChart } from '../charts/MonteCarloChart';
import { PageId } from '../components/Sidebar';

interface Props {
  result: SimulationResult | null;
  realisticResult?: RealisticSimulationResult | null;
  onNavigate: (page: PageId) => void;
}

export const AnalysisPage: React.FC<Props> = ({ result, realisticResult, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'loss' | 'turbulence' | 'pointing' | 'skr' | 'monte_carlo'>('all');

  const effectiveResult = result || realisticResult?.simulation;

  if (!effectiveResult) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-200">
          <Microscope className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-800 mb-1">No Simulation Curves Available</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Please run a simulation from the Dashboard to generate parametric sweep curves and Monte Carlo distributions.
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

  const lossCurve = effectiveResult.loss_vs_distance_curve || [];
  const turbCurve = effectiveResult.qber_vs_turbulence_curve || [];
  const pointingCurve = effectiveResult.qber_vs_pointing_curve || [];
  const condCurve = effectiveResult.key_rate_vs_conditions_curve || [];
  const mcStats = effectiveResult.monte_carlo;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            Scientific Analysis Hub
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Parametric Sensitivity &amp; Statistical Variations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deep physical modeling curves and Monte Carlo confidence intervals (95% CI)
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Charts
          </button>
          <button
            onClick={() => setActiveTab('loss')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'loss' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Loss vs Dist
          </button>
          <button
            onClick={() => setActiveTab('turbulence')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'turbulence' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Turbulence
          </button>
          <button
            onClick={() => setActiveTab('pointing')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'pointing' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pointing
          </button>
          <button
            onClick={() => setActiveTab('monte_carlo')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'monte_carlo' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monte Carlo
          </button>
        </div>
      </div>

      {/* Grid of Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Channel Loss vs Distance */}
        {(activeTab === 'all' || activeTab === 'loss') && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-sky-600" />
                Optical Channel Loss vs. Distance (300 - 1500 km)
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Compares free-space geometric diffraction loss across LEO altitudes with and without HAP relay.
              </p>
            </div>
            <LossVsDistanceChart data={lossCurve} />
          </div>
        )}

        {/* Graph 2: QBER vs Atmospheric Turbulence */}
        {(activeTab === 'all' || activeTab === 'turbulence') && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-indigo-600" />
                QBER vs. Ground Turbulence (Cn² = 10⁻¹⁶ to 10⁻¹² m⁻²/³)
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Demonstrates how scintillation fading elevates noise pulses. Notice HAP relay dampens turbulence impact.
              </p>
            </div>
            <QberVsTurbulenceChart data={turbCurve} />
          </div>
        )}

        {/* Graph 3: QBER vs Pointing Jitter */}
        {(activeTab === 'all' || activeTab === 'pointing') && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600" />
                QBER vs. Transceiver Pointing Jitter (0 - 15 μrad)
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Evaluates Farid-Hranilovic beam displacement. Higher jitter sharply reduces coupling into Bob's aperture.
              </p>
            </div>
            <QberVsPointingChart data={pointingCurve} />
          </div>
        )}

        {/* Graph 4: Secret Key Rate vs Conditions */}
        {(activeTab === 'all' || activeTab === 'skr') && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-600" />
                Secret Key Rate vs. Weather &amp; Channel Quality
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Distillable key throughput under various aerosol visibility conditions after Shannon error correction.
              </p>
            </div>
            <KeyRateVsConditionsChart data={condCurve} />
          </div>
        )}

        {/* Graph 5: Monte Carlo Distribution */}
        {(activeTab === 'all' || activeTab === 'monte_carlo') && mcStats && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 lg:col-span-2">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-purple-600" />
                  Monte Carlo QBER Statistical Distribution &amp; 95% Confidence Interval
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Vectorized stochastic realization over {mcStats.iterations.toLocaleString()} link iterations.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-600">Mean QBER: <strong>{(mcStats.mean_qber * 100).toFixed(2)}%</strong></span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">95% CI: <strong>[{(mcStats.ci_95_lower * 100).toFixed(2)}% – {(mcStats.ci_95_upper * 100).toFixed(2)}%]</strong></span>
              </div>
            </div>
            <MonteCarloChart stats={mcStats} />
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => onNavigate('results')}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors"
        >
          ← Back to Results
        </button>

        <button
          onClick={() => onNavigate('compare')}
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-sm"
        >
          <span>Compare Scenarios</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
