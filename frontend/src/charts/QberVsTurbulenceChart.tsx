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
import { QberVsTurbulencePoint } from '../types/quantum';

interface Props {
  data: QberVsTurbulencePoint[];
}

export const QberVsTurbulenceChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            GRAPH 2: QBER vs Atmospheric Turbulence (Cn²)
          </h3>
          <p className="text-xs text-slate-500">
            Scintillation and fading effects across weak to strong turbulence regimes
          </p>
        </div>
      </div>

      <div className="h-64 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="cn2"
              tickFormatter={(v) => `${Number(v).toExponential(0)}`}
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Turbulence Cn² (m⁻²/³)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              unit="%"
              domain={[0, 15]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'QBER (%)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]}
              labelFormatter={(label) => `Cn²: ${Number(label).toExponential(2)} m⁻²/³`}
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
            <ReferenceLine y={11.0} stroke="#e11d48" strokeDasharray="3 3" label={{ value: '11% Security Threshold', fill: '#e11d48', fontSize: 10, position: 'top' }} />
            <Line
              type="monotone"
              dataKey="qber_percent"
              name="QBER (%)"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
        <b>Threshold:</b> QBER remains low under weak turbulence (Cn² &lt; 10⁻¹⁴), then surges toward the 11% security limit as deep scintillation fades elevate background noise ratio.
      </div>
    </div>
  );
};
