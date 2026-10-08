import React from 'react';
import { ShieldCheck, ShieldAlert, Activity, Wifi, Key, CheckCircle, Percent } from 'lucide-react';
import { SimulationResult } from '../types/quantum';

interface KpiCardsProps {
  result?: SimulationResult | null;
  isLoading?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ result, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 animate-pulse">
            <div className="h-3 w-16 bg-slate-200 rounded mb-2"></div>
            <div className="h-6 w-24 bg-slate-300 rounded mb-2"></div>
            <div className="h-2 w-20 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const isSecure = result?.is_secure ?? null;
  const qber = result?.qber != null ? result.qber * 100 : null;
  const loss = result?.channel_loss_db != null ? result.channel_loss_db : null;
  const skr = result?.secret_key_rate != null ? result.secret_key_rate : null;
  const detRate = result?.detection_rate != null ? result.detection_rate : null;
  const sifted = result?.sifted_key_length != null ? result.sifted_key_length : null;
  const ciLower = result?.monte_carlo?.ci_95_lower != null ? (result.monte_carlo.ci_95_lower * 100).toFixed(2) : null;
  const ciUpper = result?.monte_carlo?.ci_95_upper != null ? (result.monte_carlo.ci_95_upper * 100).toFixed(2) : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      
      {/* 1. QBER */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-cyan-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">QBER</span>
          {result && (
            <span title={result.security_status_message || undefined}>
              {isSecure ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              )}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={`text-2xl font-bold tracking-tight ${
            qber === null 
              ? 'text-slate-400' 
              : qber < 5.0 
                ? 'text-emerald-700' 
                : qber < 11.0 
                  ? 'text-amber-600' 
                  : 'text-rose-600'
          }`}>
            {qber !== null ? `${qber.toFixed(2)}%` : '--'}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>Threshold: &lt; 11.0%</span>
          {qber !== null && (
            <span className={`font-medium ${isSecure ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isSecure ? 'Secure' : 'Insecure'}
            </span>
          )}
        </div>
      </div>

      {/* 2. Channel Loss */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-cyan-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Channel Loss</span>
          <Activity className="w-4 h-4 text-blue-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {loss !== null ? `${loss.toFixed(1)}` : '--'}
          </span>
          <span className="text-xs text-slate-500 font-medium">dB</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 truncate" title="Atmospheric + Geometric + Pointing">
          {result?.atmospheric_loss_db != null && result?.geometric_loss_db != null 
            ? `Atm: ${result.atmospheric_loss_db.toFixed(1)}dB | Geo: ${result.geometric_loss_db.toFixed(1)}dB` 
            : 'Full optical link'}
        </p>
      </div>

      {/* 3. Secret-Key Rate */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-cyan-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Secret-Key Rate</span>
          <Key className="w-4 h-4 text-cyan-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-cyan-700">
            {skr !== null ? Math.round(skr).toLocaleString() : '--'}
          </span>
          <span className="text-xs text-slate-500 font-medium">bits/s</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {result?.secure_key_length != null ? `${result.secure_key_length.toLocaleString()} secure bits` : 'After reconciliation & PA'}
        </p>
      </div>

      {/* 4. Single-Photon Detection Rate */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-cyan-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Detection Rate</span>
          <Wifi className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {detRate !== null ? `${detRate.toFixed(2)}%` : '--'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {result?.total_detected_photons != null ? `${result.total_detected_photons.toLocaleString()} clicks detected` : 'Receiver clicks / pulse'}
        </p>
      </div>

      {/* 5. Sifted Key Length */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-cyan-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sifted Key</span>
          <CheckCircle className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {sifted !== null ? sifted.toLocaleString() : '--'}
          </span>
          <span className="text-xs text-slate-500 font-medium">bits</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {result?.error_bits != null ? `Errors: ${result.error_bits.toLocaleString()} bits` : 'Matching bases subset'}
        </p>
      </div>

      {/* 6. Simulation Confidence */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-cyan-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">95% Confidence</span>
          <Percent className="w-4 h-4 text-purple-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-base font-bold tracking-tight text-slate-900">
            {ciLower && ciUpper ? `[${ciLower}%, ${ciUpper}%]` : '--'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {result?.monte_carlo?.iterations != null ? `${result.monte_carlo.iterations.toLocaleString()} Monte Carlo runs` : 'Variation range'}
        </p>
      </div>
    </div>
  );
};
