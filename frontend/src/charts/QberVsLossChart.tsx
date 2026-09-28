import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { QberVsLossPoint } from '../types/quantum';

interface QberVsLossChartProps {
  data: QberVsLossPoint[];
}

export const QberVsLossChart: React.FC<QberVsLossChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-slate-500">
        No QBER vs Channel Loss data available
      </div>
    );
  }

  const formattedData = data.map((d) => ({
    loss: d.channel_loss_db,
    simulatedQber: d.simulated_qber_percent,
    analyticalQber: d.analytical_qber_percent,
    keyRate: d.secret_key_rate_bps,
    siftedBits: d.sifted_bits,
    isSecure: d.is_secure
  }));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            Quantum Bit Error Rate (QBER) vs Channel Loss
          </h3>
          <p className="text-xs text-slate-400">
            Simulated BB84 discrete measurement error vs Analytical theoretical prediction & 11% BB84 threshold
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded border border-cyan-500/30 bg-cyan-950/40 px-2 py-0.5 text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            BB84 Simulated
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-950/40 px-2 py-0.5 text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Analytical Model
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-950/40 px-2 py-0.5 text-rose-300">
            Threshold: 11%
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey="loss"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              label={{
                value: 'Channel Attenuation (dB)',
                position: 'insideBottom',
                offset: -12,
                fill: '#94a3b8',
                fontSize: 11
              }}
            />
            <YAxis
              yAxisId="qber"
              stroke="#22d3ee"
              fontSize={11}
              domain={[0, 50]}
              tickFormatter={(v) => `${v}%`}
              label={{
                value: 'QBER (%)',
                angle: -90,
                position: 'insideLeft',
                fill: '#22d3ee',
                fontSize: 11,
                offset: 2
              }}
            />
            <YAxis
              yAxisId="skr"
              orientation="right"
              stroke="#a855f7"
              fontSize={11}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              label={{
                value: 'SKR (bps)',
                angle: 90,
                position: 'insideRight',
                fill: '#a855f7',
                fontSize: 11,
                offset: 2
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
              formatter={(value: any, name: string) => {
                if (name === 'simulatedQber') return [`${Number(value).toFixed(3)}%`, 'BB84 Simulated QBER'];
                if (name === 'analyticalQber') return [`${Number(value).toFixed(3)}%`, 'Analytical QBER'];
                if (name === 'keyRate') return [`${Number(value).toLocaleString()} bps`, 'Secret Key Rate'];
                return [value, name];
              }}
              labelFormatter={(label) => `Channel Loss: ${label} dB`}
            />
            <Legend
              verticalAlign="top"
              height={32}
              formatter={(value) => {
                if (value === 'simulatedQber') return <span className="text-xs text-cyan-300">Simulated QBER</span>;
                if (value === 'analyticalQber') return <span className="text-xs text-amber-300">Analytical QBER</span>;
                if (value === 'keyRate') return <span className="text-xs text-purple-300">Secret Key Rate</span>;
                return <span className="text-xs text-slate-400">{value}</span>;
              }}
            />
            {/* BB84 11% Theoretical Security Cutoff */}
            <ReferenceLine
              yAxisId="qber"
              y={11}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: '11% Security Threshold',
                position: 'top',
                fill: '#f87171',
                fontSize: 10
              }}
            />

            {/* Secret key rate on right axis */}
            <Line
              yAxisId="skr"
              type="monotone"
              dataKey="keyRate"
              stroke="#c084fc"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={false}
              name="keyRate"
            />

            {/* Analytical theoretical QBER */}
            <Line
              yAxisId="qber"
              type="monotone"
              dataKey="analyticalQber"
              stroke="#fbbf24"
              strokeWidth={1.8}
              strokeDasharray="4 4"
              dot={false}
              name="analyticalQber"
            />

            {/* Simulated discrete QBER from quantum measurement */}
            <Line
              yAxisId="qber"
              type="monotone"
              dataKey="simulatedQber"
              stroke="#22d3ee"
              strokeWidth={2.4}
              dot={{ r: 3, fill: '#22d3ee', stroke: '#0891b2', strokeWidth: 1 }}
              activeDot={{ r: 5, fill: '#67e8f9', stroke: '#06b6d4', strokeWidth: 2 }}
              name="simulatedQber"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2">
        <span>Channel regime: Free Space Optics (FSO) Weak Coherent Pulses</span>
        <span>Asymptotic Shor-Preskill Security Bound (11.0%)</span>
      </div>
    </div>
  );
};
