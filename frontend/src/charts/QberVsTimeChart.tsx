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
  ReferenceLine
} from 'recharts';
import { PassTrajectoryPoint } from '../types/quantum';

interface Props {
  data: PassTrajectoryPoint[];
  thresholdPercent?: number;
}

export const QberVsTimeChart: React.FC<Props> = ({ data, thresholdPercent = 11.0 }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            CHART 4: QBER vs Time
          </h3>
          <p className="text-xs text-slate-500">
            Quantum Bit Error Rate evolution across satellite pass against 11% threshold
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
              unit="%"
              domain={[0, Math.min(50, Math.max(15, ...data.map(d => d.qber_percent)))]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'QBER (%)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'QBER']}
              labelFormatter={(label) => `Time Offset: ${Number(label) >= 0 ? '+' : ''}${label} min`}
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
            <ReferenceLine
              y={thresholdPercent}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: `BB84 Security Limit (${thresholdPercent}%)`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
            />
            <Line
              type="monotone"
              dataKey="qber_percent"
              name="Observed QBER"
              stroke="#9333ea"
              strokeWidth={2.5}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
        <b>Trend:</b> Near peak elevation, high signal-to-noise ratio depresses QBER below 2%. When the satellite approaches horizon, attenuation drops detected photon count, causing dark counts to inflate QBER toward 50%.
      </div>
    </div>
  );
};
