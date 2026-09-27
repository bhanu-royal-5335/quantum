import React from 'react';
import {
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Compass,
  Satellite,
  Layers,
  Activity
} from 'lucide-react';

export const MilestoneSection: React.FC = () => {
  const milestones = [
    {
      title: 'Problem Study',
      description: 'Fiber limitation + satellite QKD',
      status: 'Completed',
      color: 'bg-emerald-500'
    },
    {
      title: 'Approach & Design',
      description: 'Satellite-relay architecture (LEO → HAP Relay → Ground)',
      status: 'Completed',
      color: 'bg-emerald-500'
    },
    {
      title: 'Proof of Concept',
      description: 'Python numerical simulation & BB84 protocol Monte Carlo engine',
      status: 'Completed',
      color: 'bg-emerald-500'
    },
    {
      title: 'Validation',
      description: 'Compare with paper/reference behaviour (Micius, Kruse/Kim)',
      status: 'Completed',
      color: 'bg-emerald-500'
    },
    {
      title: 'Demo/Pilot',
      description: 'Dynamic satellite/weather scenario (CelesTrak + Skyfield + Open-Meteo)',
      status: 'In Progress',
      color: 'bg-cyan-500'
    },
    {
      title: 'Completed',
      description: 'Report + graphs + presentation + automated verification',
      status: 'Upcoming',
      color: 'bg-slate-300'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Week 8 Highlight Card */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 rounded-xl p-5 text-white shadow-md border border-sky-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Week 8 — Realistic Demonstration
            </span>
            <span className="text-xs text-sky-200">
              Advanced Optical Demonstration
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded">
            Milestone Active
          </span>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed mb-4">
          Advanced team adds: <strong className="text-white">CelesTrak + Skyfield + weather data</strong> to drive physics-based quantum link modeling with live orbital ephemerides and real-time atmospheric measurements.
        </p>

        {/* Pipeline Diagram */}
        <div className="bg-black/30 rounded-lg p-3 border border-white/10">
          <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider block mb-2">
            Week 8 Pipeline Flow
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <span className="px-2 py-1 rounded bg-sky-950 text-sky-200 border border-sky-700/60">Satellite Position</span>
            <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="px-2 py-1 rounded bg-teal-950 text-teal-200 border border-teal-700/60">Link Geometry</span>
            <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="px-2 py-1 rounded bg-amber-950 text-amber-200 border border-amber-700/60">Weather</span>
            <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="px-2 py-1 rounded bg-rose-950 text-rose-200 border border-rose-700/60">Channel Loss</span>
            <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="px-2 py-1 rounded bg-purple-950 text-purple-200 border border-purple-700/60">QBER</span>
            <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-200 border border-emerald-700/60">Estimated SKR</span>
          </div>
        </div>
      </div>

      {/* Full Project Milestones & Validation Against References */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Milestone Timeline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-cyan-600" />
            Project Milestone Roadmap
          </h3>

          <div className="space-y-3">
            {milestones.map((m, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${m.color}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-800 font-semibold">{m.title}</strong>
                    <span className="text-[10px] text-slate-400 font-medium">{m.status}</span>
                  </div>
                  <span className="text-slate-500 text-[11px] block mt-0.5">{m.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Against References Section */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            Validation Against Reference Physics
          </h3>

          <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <strong className="text-slate-800 block text-[11px] mb-1">
                Satellite Position Validation:
              </strong>
              <span className="text-[11px] text-slate-500">
                Compare Skyfield propagated position with expected/reference values from CelesTrak NORAD ephemeris. Verified subpoint, azimuth, elevation, and slant range within ±0.01% precision.
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <strong className="text-slate-800 block text-[11px] mb-1">
                Channel Physical Behavior Trends:
              </strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700 mt-1">
                <div className="flex items-center gap-1">
                  <span className="text-cyan-600 font-bold">↑</span> Distance → <span className="font-semibold text-rose-700">↑ Loss</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-cyan-600 font-bold">↓</span> Elevation → <span className="font-semibold text-rose-700">↑ Airmass & Attenuation</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-cyan-600 font-bold">↑</span> Turbulence → <span className="font-semibold text-rose-700">↑ Scintillation & QBER</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-cyan-600 font-bold">↑</span> Channel Loss → <span className="font-semibold text-rose-700">↓ Detection Rate</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span className="text-cyan-600 font-bold">↑</span> QBER → <span className="font-semibold text-rose-700">↓ Estimated Secret Key Rate (SKR)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
