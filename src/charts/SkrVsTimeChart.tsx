import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { PassTrajectoryPoint } from '../types/quantum';

interface Props {
  data: PassTrajectoryPoint[];
}

export const SkrVsTimeChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            CHART 5: Estimated Secret Key Rate (SKR) vs Time
          </h3>
          <p className="text-xs text-slate-500">
            Distilled secure key generation rate across the satellite pass window
          </p>
        </div>
      </div>

      <div className="h-64 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="time_offset_min"
              unit=" min"
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Time from Peak Pass (minutes)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              unit=" bps"
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Secret Key Rate (bps)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(value: any) => [`${Math.round(Number(value)).toLocaleString()} bps`, 'Secret Key Rate']}
              labelFormatter={(label) => `Time Offset: ${Number(label) >= 0 ? '+' : ''}${label} min`}
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
            <Line
              type="monotone"
              dataKey="estimated_skr_bps"
              name="Estimated Secret Key Rate"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
        <b>Trend:</b> SKR is highest during high elevation geometry where channel loss is minimized, and drops strictly to 0 bps whenever QBER exceeds 11% or line-of-sight is eclipsed.
      </div>
    </div>
  );
};
