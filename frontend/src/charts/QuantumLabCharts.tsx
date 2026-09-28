import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { ShieldAlert, Zap, RefreshCw } from 'lucide-react';

interface ChartProps {
  data: any[];
  onRefreshSweep?: () => void;
  isLoading?: boolean;
}

// ----------------------------------------------------------------------------
// 1. QBER vs Eavesdropping Probability
// ----------------------------------------------------------------------------
export const QberVsEveChart: React.FC<ChartProps> = ({ data, onRefreshSweep, isLoading }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              QBER vs Eavesdropping Probability
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Intercept-Resend disturbance: Theoretical asymptotic baseline is 25% at 100% interception
          </p>
        </div>
        {onRefreshSweep && (
          <button
            onClick={onRefreshSweep}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-all border border-slate-700/60 disabled:opacity-50"
            title="Re-run BB84 Monte Carlo sweep"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sweep</span>
          </button>
        )}
      </div>

      <div className="h-60 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="eve_percent"
              unit="%"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'Eve Interception (%)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }}
            />
            <YAxis
              unit="%"
              domain={[0, 35]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'QBER (%)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 10, fill: '#64748b' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
              formatter={(val: any, name: any) => [
                name === 'QBER' ? `${Number(val).toFixed(2)}%` : val,
                name
              ]}
              labelFormatter={(lbl) => `Eve Interception: ${lbl}%`}
            />
            <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '10px' }} />
            <ReferenceLine y={11.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'BB84 Limit (11%)', fill: '#ef4444', fontSize: 10, position: 'top' }} />
            <Line
              type="monotone"
              dataKey="qber_percent"
              name="QBER"
              stroke="#f43f5e"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#f43f5e' }}
              activeDot={{ r: 5, fill: '#fda4af' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 2. QBER & Transmission Loss vs Distance
// ----------------------------------------------------------------------------
export const QberVsDistanceChart: React.FC<ChartProps> = ({ data, onRefreshSweep, isLoading }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Channel Loss & QBER vs Distance
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Geometric spreading + atmospheric extinction across orbital distances (100–2,000 km)
          </p>
        </div>
        {onRefreshSweep && (
          <button
            onClick={onRefreshSweep}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-all border border-slate-700/60 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sweep</span>
          </button>
        )}
      </div>

      <div className="h-60 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="distance_km"
              unit=" km"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }}
            />
            <YAxis
              yAxisId="left"
              unit=" dB"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'Loss (dB)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 10, fill: '#38bdf8' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              unit="%"
              domain={[0, 15]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'QBER (%)', angle: 90, position: 'insideRight', offset: 15, fontSize: 10, fill: '#f43f5e' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
              formatter={(val: any, name: any) => [
                name === 'Channel Loss' ? `${Number(val).toFixed(1)} dB` : `${Number(val).toFixed(2)}%`,
                name
              ]}
              labelFormatter={(lbl) => `Distance: ${lbl} km`}
            />
            <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '10px' }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="loss_db"
              name="Channel Loss"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              dot={{ r: 2 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="qber_percent"
              name="Simulated QBER"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 3. QBER vs Simulation Size (Statistical Convergence)
// ----------------------------------------------------------------------------
export const QberVsBitsChart: React.FC<ChartProps> = ({ data, onRefreshSweep, isLoading }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              QBER vs Simulation Size (Convergence)
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            BB84 statistical error bars tighten as pulse sample size scales from 1,000 to 100,000 qubits
          </p>
        </div>
        {onRefreshSweep && (
          <button
            onClick={onRefreshSweep}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-all border border-slate-700/60 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Sweep</span>
          </button>
        )}
      </div>

      <div className="h-60 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="bits_label"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'Number of Qubits Sent', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }}
            />
            <YAxis
              unit="%"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'QBER (%)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 10, fill: '#64748b' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
              formatter={(val: any, name: any) => [
                name === 'QBER' ? `${Number(val).toFixed(2)}%` : val,
                name
              ]}
              labelFormatter={(lbl) => `Sample Size: ${lbl}`}
            />
            <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '10px' }} />
            <Bar dataKey="qber_percent" name="QBER" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 4. Secret Key Rate Fraction vs QBER (Shor-Preskill)
// ----------------------------------------------------------------------------
export const SkrVsQberChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Secret Key Rate vs QBER (Shor-Preskill)
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Asymptotic extraction fraction: r = 1 - 2*h(QBER). Drops to zero at QBER = 11.0%
          </p>
        </div>
      </div>

      <div className="h-60 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
            <defs>
              <linearGradient id="skrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="qber_percent"
              unit="%"
              domain={[0, 15]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'QBER (%)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }}
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'SKR Fraction (r)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 10, fill: '#10b981' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
              formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}% yield`, 'Secret Yield']}
              labelFormatter={(lbl) => `QBER: ${lbl}%`}
            />
            <ReferenceLine x={11.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Cutoff 11.0%', fill: '#ef4444', fontSize: 10, position: 'top' }} />
            <Area
              type="monotone"
              dataKey="theoretical_skr_fraction"
              name="Secret Yield"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#skrGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 5. Eavesdropping vs Estimated SKR (Security Collapse)
// ----------------------------------------------------------------------------
export const EveVsSkrChart: React.FC<ChartProps> = ({ data, onRefreshSweep, isLoading }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Eavesdropping Probability vs Secret Key Rate
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Physical channel capacity collapse: Key generation halts when Eve exceeds tolerable threshold
          </p>
        </div>
        {onRefreshSweep && (
          <button
            onClick={onRefreshSweep}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-all border border-slate-700/60 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Sweep</span>
          </button>
        )}
      </div>

      <div className="h-60 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
            <defs>
              <linearGradient id="eveSkrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="eve_percent"
              unit="%"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'Eve Interception (%)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }}
            />
            <YAxis
              unit=" bps"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'SKR (bps)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 10, fill: '#c084fc' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
              formatter={(val: any) => [`${Number(val).toLocaleString()} bps`, 'Secret Key Rate']}
              labelFormatter={(lbl) => `Eve Interception: ${lbl}%`}
            />
            <Area
              type="monotone"
              dataKey="skr_bps"
              name="Secret Key Rate"
              stroke="#a855f7"
              strokeWidth={2.5}
              fill="url(#eveSkrGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
