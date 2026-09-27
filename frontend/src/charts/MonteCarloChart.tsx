import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { MonteCarloStats } from '../types/quantum';

interface Props {
  stats: MonteCarloStats;
}

export const MonteCarloChart: React.FC<Props> = ({ stats }) => {
  const meanPercent = stats.mean_qber * 100.0;
  const ciLower = stats.ci_95_lower * 100.0;
  const ciUpper = stats.ci_95_upper * 100.0;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            GRAPH 5: Monte-Carlo QBER Statistical Distribution
          </h3>
          <p className="text-xs text-slate-500">
            {stats.iterations.toLocaleString()} iterations with simultaneous turbulence fading and pointing jitter
          </p>
        </div>

        <div className="text-right text-xs">
          <span className="font-semibold text-slate-800">Mean: {meanPercent.toFixed(2)}%</span>
          <span className="text-slate-400 mx-1">|</span>
          <span className="text-cyan-700 font-medium">95% CI: [{ciLower.toFixed(2)}% - {ciUpper.toFixed(2)}%]</span>
        </div>
      </div>

      <div className="h-64 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.histogram_qber} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="bin_center_percent"
              unit="%"
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Instantaneous QBER (%)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              unit=""
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Frequency Count', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(value: any, name: any, item: any) => [
                `${value} runs (${(item.payload.relative_frequency * 100).toFixed(1)}%)`,
                'Frequency'
              ]}
              labelFormatter={(label) => `QBER Bin: ~${Number(label).toFixed(2)}%`}
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
            
            {/* Reference Line for Mean */}
            <ReferenceLine
              x={Number(meanPercent.toFixed(2))}
              stroke="#0284c7"
              strokeWidth={2}
              label={{ value: `Mean (${meanPercent.toFixed(2)}%)`, fill: '#0284c7', fontSize: 10, position: 'top' }}
            />

            {/* Reference Line for 95% Upper CI */}
            <ReferenceLine
              x={Number(ciUpper.toFixed(2))}
              stroke="#6366f1"
              strokeDasharray="3 3"
              label={{ value: `95% CI Upper`, fill: '#6366f1', fontSize: 9, position: 'top' }}
            />

            <Bar
              dataKey="count"
              name="Monte Carlo Distribution"
              fill="#38bdf8"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between">
        <span><b>Uncertainty Bounds:</b> Std Dev σ = {(stats.std_qber * 100).toFixed(3)}% | Range: [{(stats.min_qber * 100).toFixed(2)}% - {(stats.max_qber * 100).toFixed(2)}%]</span>
        <span className="text-emerald-700 font-medium">Confidence: 95.0%</span>
      </div>
    </div>
  );
};
