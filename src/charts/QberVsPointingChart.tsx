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
import { QberVsPointingPoint } from '../types/quantum';

interface Props {
  data: QberVsPointingPoint[];
}

export const QberVsPointingChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            GRAPH 3: QBER vs Pointing Jitter Error
          </h3>
          <p className="text-xs text-slate-500">
            Degradation caused by satellite platform angular vibration and misalignment
          </p>
        </div>
      </div>

      <div className="h-64 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="pointing_jitter_urad"
              unit=" μrad"
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Pointing Jitter (μrad)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              unit="%"
              domain={[0, 15]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'QBER (%)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]}
              labelFormatter={(label) => `Jitter: ${label} μrad`}
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
            <ReferenceLine y={11.0} stroke="#e11d48" strokeDasharray="3 3" label={{ value: '11% Security Limit', fill: '#e11d48', fontSize: 10, position: 'top' }} />
            <Line
              type="monotone"
              dataKey="qber_percent"
              name="QBER (%)"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
        <b>Farid-Hranilovic Coupling:</b> Beyond 5-8 μrad pointing jitter, beam decoupling rapidly penalizes signal SNR, causing noise clicks to dominate and breaking security.
      </div>
    </div>
  );
};
