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

export const LossVsElevationChart: React.FC<Props> = ({ data }) => {
  // Filter for valid optical passes (loss < 100 dB) and sort by elevation
  const sortedData = [...data]
    .filter((pt) => pt.is_visible && pt.channel_loss_db < 100)
    .sort((a, b) => a.elevation_deg - b.elevation_deg);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            CHART 3: Channel Loss vs Elevation
          </h3>
          <p className="text-xs text-slate-500">
            Total optical channel attenuation as a function of elevation angle (airmass effect)
          </p>
        </div>
      </div>

      <div className="h-64 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sortedData} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="elevation_deg"
              unit="°"
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Elevation Angle (°)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              unit=" dB"
              domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Channel Loss (dB)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              formatter={(value: any) => [`${Number(value).toFixed(2)} dB`, 'Total Channel Loss']}
              labelFormatter={(label) => `Elevation: ${Number(label).toFixed(1)}°`}
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
            <Line
              type="monotone"
              dataKey="channel_loss_db"
              name="Channel Loss (dB)"
              stroke="#0d9488"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
        <b>Trend:</b> Lower elevation angles incur longer atmospheric slant paths (higher airmass $M(\theta) \approx 1/\sin\theta$), dramatically magnifying aerosol scattering and beam attenuation.
      </div>
    </div>
  );
};
