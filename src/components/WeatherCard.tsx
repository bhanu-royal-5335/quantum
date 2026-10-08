import React from 'react';
import {
  CloudSun,
  Eye,
  Cloud,
  Droplets,
  Thermometer,
  CloudRain,
  Wind,
  Activity,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { WeatherData, SimulationResult } from '../types/quantum';

interface Props {
  weather: WeatherData | null;
  simulationResult: SimulationResult | null;
  onRefreshWeather?: () => void;
  isRefreshing?: boolean;
}

export const WeatherCard: React.FC<Props> = ({
  weather,
  simulationResult,
  onRefreshWeather,
  isRefreshing
}) => {
  const w = weather;
  const sim = simulationResult;
  const isLive = w?.is_live ?? true;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-amber-500" />
              Atmospheric Weather Conditions & Optical Channel Attenuation
            </h3>
            {/* Live / Cached badge */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isLive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isLive ? 'LIVE DATA (Open-Meteo API)' : 'DEMO / CACHED DATA'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time meteorological observations feeding directly into physical aerosol scattering and optical channel loss
          </p>
        </div>

        {onRefreshWeather && (
          <button
            onClick={onRefreshWeather}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Weather</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CURRENT WEATHER Box */}
        <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <CloudSun className="w-3.5 h-3.5 text-amber-500" />
              Current Weather ({w?.location_name || 'Ground Station'})
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold uppercase">
              Condition: {w?.condition || 'Moderate'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-1">
                <Eye className="w-3 h-3 text-sky-500" />
                <span>Visibility</span>
              </div>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {w?.visibility_km != null ? `${w.visibility_km.toFixed(1)} km` : '18.0 km'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-1">
                <Cloud className="w-3 h-3 text-slate-400" />
                <span>Cloud Cover</span>
              </div>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {w?.cloud_cover_percent != null ? `${w.cloud_cover_percent.toFixed(0)} %` : '32 %'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-1">
                <Droplets className="w-3 h-3 text-blue-500" />
                <span>Humidity</span>
              </div>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {w?.humidity_percent != null ? `${w.humidity_percent.toFixed(0)} %` : '67 %'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-1">
                <Thermometer className="w-3 h-3 text-rose-500" />
                <span>Temperature</span>
              </div>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {w?.temperature_c != null ? `${w.temperature_c.toFixed(1)} °C` : '28.0 °C'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-1">
                <CloudRain className="w-3 h-3 text-indigo-500" />
                <span>Precipitation</span>
              </div>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {w?.precipitation_mm != null ? `${w.precipitation_mm.toFixed(1)} mm` : '0.0 mm'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-1">
                <Wind className="w-3 h-3 text-teal-500" />
                <span>Wind</span>
              </div>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {w?.wind_speed_kmh != null ? `${w.wind_speed_kmh.toFixed(1)} km/h` : '8.0 km/h'}
              </span>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Timestamp:</span>
            <span className="font-mono text-slate-700">
              {w ? w.timestamp : new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Section 8: CHANNEL LOSS BREAKDOWN Table */}
        <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-rose-600" />
                Channel Loss Breakdown (dB)
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Weather → Channel Loss Flow
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded border border-slate-200">
                <span className="text-slate-600">Geometric Loss</span>
                <span className="font-mono font-bold text-slate-800">
                  {sim?.geometric_loss_db != null ? `${sim.geometric_loss_db.toFixed(2)} dB` : '24.20 dB'}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded border border-slate-200">
                <span className="text-slate-600">
                  Atmospheric Loss <span className="text-[10px] text-amber-700">(Weather Extinction)</span>
                </span>
                <span className="font-mono font-bold text-amber-700">
                  {sim?.atmospheric_loss_db != null ? `${sim.atmospheric_loss_db.toFixed(2)} dB` : '3.80 dB'}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded border border-slate-200">
                <span className="text-slate-600">Pointing Loss</span>
                <span className="font-mono font-bold text-slate-800">
                  {sim?.pointing_loss_db != null ? `${sim.pointing_loss_db.toFixed(2)} dB` : '2.10 dB'}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded border border-slate-200">
                <span className="text-slate-600">Relay Internal Coupling</span>
                <span className="font-mono font-bold text-slate-800">
                  {sim?.relay_loss_db != null ? `${sim.relay_loss_db.toFixed(2)} dB` : '0.71 dB'}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded border border-slate-200">
                <span className="text-slate-600">Receiver / Detector Inefficiency</span>
                <span className="font-mono font-bold text-slate-800">
                  {sim?.detector_loss_db != null ? `${sim.detector_loss_db.toFixed(2)} dB` : '0.97 dB'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
            <span className="text-xs font-bold text-rose-900 uppercase">
              Total Channel Loss
            </span>
            <span className="text-base font-extrabold font-mono text-rose-700">
              {sim?.channel_loss_db != null ? `${sim.channel_loss_db.toFixed(2)} dB` : '31.78 dB'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
