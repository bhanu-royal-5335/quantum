import React from 'react';
import {
  FileText,
  FileDown,
  Download,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Activity,
  Key,
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { SimulationResult } from '../types/quantum';
import { getPdfReportUrl, getCsvReportUrl } from '../services/api';
import { PageId } from '../components/Sidebar';

interface Props {
  result: SimulationResult | null;
  onNavigate: (page: PageId) => void;
}

const REPORT_SECTIONS = [
  { num: 1, title: 'Executive Summary', desc: 'High-level synthesis of quantum optical channel viability and key findings' },
  { num: 2, title: 'Scenario Configuration', desc: 'Hardware, orbit altitude, laser wavelength, and receiver aperture parameters' },
  { num: 3, title: 'System Architecture', desc: 'Hierarchical node decomposition: Alice → LEO Satellite → HAP Relay → Bob' },
  { num: 4, title: 'Quantum Protocol (BB84)', desc: 'Conjugate polarization states, random basis preparation, and sifting logic' },
  { num: 5, title: 'Channel Parameters & Link Budget', desc: 'Individual link loss contributions and geometric beam spot expansion' },
  { num: 6, title: 'Atmospheric Attenuation Model', desc: 'Kruse/Kim aerosol extinction formula and exponential altitude air density' },
  { num: 7, title: 'Turbulence & Scintillation Model', desc: 'Modified Hufnagel-Valley Cn2 profile, Rytov variance, and aperture averaging' },
  { num: 8, title: 'Pointing Error Model', desc: 'Transmitter angular jitter, Rayleigh radial wobble, and Farid-Hranilovic coupling' },
  { num: 9, title: 'Noise & Single-Photon Detection', desc: 'Detector quantum efficiency, dark count gate noise, and background solar light' },
  { num: 10, title: 'Simulation Methodology', desc: 'Bernoulli stochastic trials, quantum state projection, and Monte Carlo engine' },
  { num: 11, title: 'QBER Results & Verification', desc: 'Measured quantum bit error rate vs 11% asymptotic security threshold' },
  { num: 12, title: 'Channel Loss & Optical Link Budget', desc: 'Decibel breakdown across atmospheric, diffraction, jitter, and detector stages' },
  { num: 13, title: 'Secret-Key Generation Rate', desc: 'Information reconciliation leakage (f_EC * H2) and privacy amplification bounds' },
  { num: 14, title: 'Monte-Carlo Statistical Analysis', desc: 'Mean QBER, standard deviation, 95% confidence interval, and variation histogram' },
  { num: 15, title: 'Scenario Comparison Analysis', desc: 'Comparative cross-scenario evaluation across distances and turbulence regimes' },
  { num: 16, title: 'Conclusions & Recommendations', desc: 'Engineering recommendations for stratospheric relay deployment and pointing stabilization' },
  { num: 17, title: 'Raw Simulation Parameters', desc: 'Complete machine-readable JSON manifest for exact scientific reproducibility' }
];

export const ReportPage: React.FC<Props> = ({ result, onNavigate }) => {
  if (!result) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-800 mb-1">No Simulation to Report</h2>
        <p className="text-xs text-slate-500 mb-5">
          Execute a simulation run first to generate the complete 17-section academic verification report.
        </p>
        <button
          onClick={() => onNavigate('simulation')}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer transition-colors"
        >
          Run Simulation Engine →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Download Buttons */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
            Formal Academic Research Report
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-2">
            Verification & Simulation Report Generator
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Generates the comprehensive 17-section PDF report with ReportLab formatting, structured tables, and CSV raw numerical export.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getCsvReportUrl(result.id)}
            download
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download CSV Dataset</span>
          </a>

          <a
            href={getPdfReportUrl(result.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Download PDF Report</span>
          </a>
        </div>
      </div>

      {/* Report Cover Page Preview Card */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase">
            Technical Research & Verification Report
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white leading-snug">
            Hierarchical Bounded Intelligence Architecture for Trustworthy Generative AI with Retrieval, Verification, and Self-Correction
          </h2>
          <div className="h-0.5 w-24 bg-cyan-500 my-2" />
          <h3 className="text-sm font-semibold text-cyan-300">
            Quantum Communication Simulation Module
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Alice (Quantum Source) → LEO Satellite → Stratospheric HAP Relay → Bob (Ground Receiver)
          </p>

          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">Active Scenario</span>
              <strong className="text-slate-200">{result.scenario_name ? result.scenario_name.split(':')[0] : 'Scenario'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Calculated QBER</span>
              <strong className={result.is_secure ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {result.qber != null ? `${(result.qber * 100).toFixed(2)}%` : '--'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Total Channel Loss</span>
              <strong className="text-slate-200">{result.channel_loss_db != null ? `${result.channel_loss_db.toFixed(1)} dB` : '--'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Secret Key Rate</span>
              <strong className="text-cyan-400 font-bold">{result.secret_key_rate != null ? `${Math.round(result.secret_key_rate).toLocaleString()} bps` : '--'}</strong>
            </div>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 17 Sections Manifest */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Complete 17-Section Report Table of Contents
            </h3>
            <p className="text-xs text-slate-500">
              Each section is formatted with academic rigorous methodology and embedded statistical metrics
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            17 Sections Compiled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {REPORT_SECTIONS.map((sec) => (
            <div
              key={sec.num}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-start gap-3"
            >
              <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center shrink-0 text-[11px] font-mono">
                {sec.num}
              </span>
              <div>
                <strong className="text-slate-800 block">{sec.title}</strong>
                <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">{sec.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Parameters Inspector (Section 17) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-cyan-600" />
          Section 17: Raw Simulation Parameters Manifest
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Exact reproducible configuration payload used for backend simulation calculations
        </p>

        <pre className="p-4 bg-slate-950 text-cyan-400 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
          {JSON.stringify(
            {
              simulation_id: result.id,
              scenario_name: result.scenario_name,
              timestamp: result.timestamp,
              parameters: result.parameters,
              key_performance_indicators: {
                qber: result.qber,
                channel_loss_db: result.channel_loss_db,
                secret_key_rate_bps: result.secret_key_rate,
                detection_rate: result.detection_rate,
                sifted_key_length: result.sifted_key_length,
                is_secure: result.is_secure
              }
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};
