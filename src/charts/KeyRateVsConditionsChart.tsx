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
  Cell
} from 'recharts';
import { KeyRateVsConditionsPoint } from '../types/quantum';

interface Props {
  data: KeyRateVsConditionsPoint[];
}

export const KeyRateVsConditionsChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            GRAPH 4: Secret-Key Rate vs Channel Conditions
          </h3>
          <p className="text-xs text-slate-500">
            Performance comparison under Clear, Moderate, and Adverse conditions
          </p>
        </div>
      </div>

      <div className="h-64 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="condition"
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={0}
              angle={-10}
              textAnchor="end"
            />
            <YAxis
              unit=" kbps"
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Secret Key (kbps)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(value: any, name: any, item: any) => [
                `${Number(value).toFixed(2)} kbps (QBER: ${item.payload.qber_percent}%, Loss: ${item.payload.channel_loss_db}dB)`,
                'Secret-Key Rate'
              ]}
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="secret_key_rate_kbps" name="Secure Key Rate (kbps)" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.is_secure ? (index === 0 ? '#0284c7' : '#0ea5e9') : '#f43f5e'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
        <b>Information Reconciliation:</b> Adverse weather collapses key rate to 0 once error correction leakage (f_EC × H2(QBER) + H2(QBER) ≥ 1).
      </div>
    </div>
  );
};
