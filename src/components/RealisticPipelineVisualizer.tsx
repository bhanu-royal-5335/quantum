import React, { useState } from 'react';
import {
  Satellite,
  Compass,
  MapPin,
  CloudSun,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Key,
  ChevronRight,
  Info,
  Layers,
  ArrowDown
} from 'lucide-react';
import { RealisticSimulationResult } from '../types/quantum';

interface Props {
  realisticResult: RealisticSimulationResult | null;
  isSimulating?: boolean;
}

interface StageInfo {
  id: string;
  name: string;
  subtext: string;
  icon: any;
  color: string;
  bgLight: string;
  borderLight: string;
}

const STAGES: StageInfo[] = [
  {
    id: 'celestrak',
    name: 'CelesTrak TLE Data',
    subtext: 'Orbital Ephemeris & Elements',
    icon: Satellite,
    color: 'text-sky-600',
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-200'
  },
  {
    id: 'skyfield',
    name: 'Skyfield Propagation',
    subtext: 'SGP4 Perturbation Mechanics',
    icon: Compass,
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200'
  },
  {
    id: 'position',
    name: 'Satellite Position',
    subtext: 'WGS84 Geodetic Subpoint & Look Angles',
    icon: MapPin,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200'
  },
  {
    id: 'geometry',
    name: 'Link Geometry',
    subtext: 'Dual-hop Range & Elevation Mask',
    icon: Layers,
    color: 'text-teal-600',
    bgLight: 'bg-teal-50',
    borderLight: 'border-teal-200'
  },
  {
    id: 'weather',
    name: 'Weather Data',
    subtext: 'Optical Visibility, Rain & Clouds',
    icon: CloudSun,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200'
  },
  {
    id: 'loss',
    name: 'Channel Loss',
    subtext: 'Atmospheric Extinction + Spreading',
    icon: Activity,
    color: 'text-rose-600',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200'
  },
  {
    id: 'qber',
    name: 'QBER',
    subtext: 'Quantum Error Probability',
    icon: ShieldAlert,
    color: 'text-purple-600',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200'
  },
  {
    id: 'skr',
    name: 'Estimated SKR',
    subtext: 'Information-Theoretic Key Rate',
    icon: Key,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200'
  }
];

export const RealisticPipelineVisualizer: React.FC<Props> = ({ realisticResult, isSimulating }) => {
  const [selectedStage, setSelectedStage] = useState<string>('geometry');

  const r = realisticResult;

  const renderStageDetail = (stageId: string) => {
    switch (stageId) {
      case 'celestrak':
        return (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Source:</span>
              <span className="font-mono text-slate-900">{r?.satellite_info?.source || 'CelesTrak (NORAD)'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Selected Satellite:</span>
              <span className="font-bold text-sky-700">{r?.satellite_info?.name || 'Micius (QUESS - NORAD 41740)'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">TLE Epoch:</span>
              <span className="font-mono text-slate-600">{r?.satellite_info?.epoch || 'Recent / Live Catalog'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Data Status:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                r?.satellite_info?.is_live ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {r?.satellite_info?.is_live ? '● LIVE CELESTRAK DATA' : '● DEMO / CACHED TLE'}
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[10px] text-slate-600 overflow-x-auto">
              <div>1: {r?.satellite_info?.tle_line1 || '1 41740U 16051A   26085.12345678 ...'}</div>
              <div>2: {r?.satellite_info?.tle_line2 || '2 41740  97.4321 142.1234 0012345 ...'}</div>
            </div>
          </div>
        );

      case 'skyfield':
        return (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Propagator Library:</span>
              <span className="font-mono text-indigo-700 font-bold">Skyfield (Python) + SGP4 v2.20</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Time Ephemeris:</span>
              <span className="font-mono text-slate-600">Built-in UT1 / UTC timescale</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Reference Ellipsoid:</span>
              <span className="font-mono text-slate-600">WGS84 Standard Earth Model</span>
            </div>
            <div className="p-2 bg-indigo-50/50 rounded border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
              Computes secular and periodic orbital perturbations (J2, J3, J4 zonal harmonics, solar-lunar gravity, atmospheric drag) to yield exact topocentric observation vectors.
            </div>
          </div>
        );

      case 'position':
        return (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-500 block text-[10px]">Subpoint Latitude</span>
                <span className="font-bold text-slate-800 font-mono">{r?.position?.latitude_deg != null ? `${r.position.latitude_deg.toFixed(4)}°` : '28.6139°'}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-500 block text-[10px]">Subpoint Longitude</span>
                <span className="font-bold text-slate-800 font-mono">{r?.position?.longitude_deg != null ? `${r.position.longitude_deg.toFixed(4)}°` : '77.2090°'}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-500 block text-[10px]">Orbital Altitude</span>
                <span className="font-bold text-slate-800 font-mono">{r?.position?.altitude_km != null ? `${r.position.altitude_km.toFixed(1)} km` : '500.0 km'}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-500 block text-[10px]">Observation Time</span>
                <span className="font-bold text-slate-800 font-mono text-[10px] truncate">{r?.position?.observation_time || 'Instantaneous'}</span>
              </div>
            </div>
          </div>
        );

      case 'geometry':
        return (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-teal-50/50 rounded border border-teal-100">
                <span className="text-teal-700 block text-[10px]">Elevation Angle</span>
                <span className="font-bold text-teal-900 font-mono text-sm">{r?.geometry?.elevation_deg != null ? `${r.geometry.elevation_deg.toFixed(1)}°` : '42.5°'}</span>
              </div>
              <div className="p-2 bg-teal-50/50 rounded border border-teal-100">
                <span className="text-teal-700 block text-[10px]">Azimuth Angle</span>
                <span className="font-bold text-teal-900 font-mono text-sm">{r?.geometry?.azimuth_deg != null ? `${r.geometry.azimuth_deg.toFixed(1)}°` : '182.4°'}</span>
              </div>
              <div className="p-2 bg-teal-50/50 rounded border border-teal-100">
                <span className="text-teal-700 block text-[10px]">Satellite → Relay Range</span>
                <span className="font-bold text-teal-900 font-mono">{r?.geometry?.satellite_to_relay_distance_km != null ? `${r.geometry.satellite_to_relay_distance_km.toFixed(1)} km` : (r?.geometry?.satellite_to_ground_range_km != null ? `${r.geometry.satellite_to_ground_range_km.toFixed(1)} km` : '680.0 km')}</span>
              </div>
              <div className="p-2 bg-teal-50/50 rounded border border-teal-100">
                <span className="text-teal-700 block text-[10px]">Relay → Bob Range</span>
                <span className="font-bold text-teal-900 font-mono">{r?.geometry?.relay_to_bob_distance_km != null ? `${r.geometry.relay_to_bob_distance_km.toFixed(1)} km` : '29.7 km'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold text-slate-700">Line-of-Sight Status:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                r?.geometry?.line_of_sight_available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {r?.geometry?.line_of_sight_available ? '● Available' : `● ${r?.geometry?.visibility_status || 'Unavailable'}`}
              </span>
            </div>
          </div>
        );

      case 'weather':
        return (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Ground Station Weather:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                r?.weather?.is_live ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {r?.weather?.is_live ? '● LIVE OPEN-METEO' : '● DEMO / CACHED WEATHER'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-1.5 bg-amber-50/50 rounded border border-amber-100 text-center">
                <span className="text-amber-700 block text-[10px]">Visibility</span>
                <span className="font-bold text-amber-900 font-mono">{r?.weather?.visibility_km != null ? `${r.weather.visibility_km.toFixed(1)} km` : '20.0 km'}</span>
              </div>
              <div className="p-1.5 bg-amber-50/50 rounded border border-amber-100 text-center">
                <span className="text-amber-700 block text-[10px]">Cloud Cover</span>
                <span className="font-bold text-amber-900 font-mono">{r?.weather?.cloud_cover_percent != null ? `${r.weather.cloud_cover_percent.toFixed(0)}%` : '15%'}</span>
              </div>
              <div className="p-1.5 bg-amber-50/50 rounded border border-amber-100 text-center">
                <span className="text-amber-700 block text-[10px]">Humidity</span>
                <span className="font-bold text-amber-900 font-mono">{r?.weather?.humidity_percent != null ? `${r.weather.humidity_percent.toFixed(0)}%` : '55%'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-600">Induced Weather Loss:</span>
              <span className="font-mono font-bold text-rose-700">+{r?.weather?.total_weather_loss_db != null ? r.weather.total_weather_loss_db.toFixed(2) : '1.20'} dB</span>
            </div>
          </div>
        );

      case 'loss':
        return (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Total Optical Loss:</span>
              <span className="font-mono font-extrabold text-rose-700 text-sm">
                {r?.simulation?.channel_loss_db != null ? `${r.simulation.channel_loss_db.toFixed(2)} dB` : '31.50 dB'}
              </span>
            </div>
            <div className="space-y-1 text-[11px] pt-1">
              <div className="flex justify-between text-slate-600">
                <span>Geometric Spreading:</span>
                <span className="font-mono">{r?.simulation?.geometric_loss_db != null ? `${r.simulation.geometric_loss_db.toFixed(2)} dB` : '24.20 dB'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Atmospheric Extinction (Kim):</span>
                <span className="font-mono">{r?.simulation?.atmospheric_loss_db != null ? `${r.simulation.atmospheric_loss_db.toFixed(2)} dB` : '3.80 dB'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pointing Jitter:</span>
                <span className="font-mono">{r?.simulation?.pointing_loss_db != null ? `${r.simulation.pointing_loss_db.toFixed(2)} dB` : '2.10 dB'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Relay Optical Coupling:</span>
                <span className="font-mono">{r?.simulation?.relay_loss_db != null ? `${r.simulation.relay_loss_db.toFixed(2)} dB` : '0.71 dB'}</span>
              </div>
            </div>
          </div>
        );

      case 'qber':
        return (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Quantum Bit Error Rate:</span>
              <span className={`font-mono font-extrabold text-sm ${
                (r?.simulation?.qber ?? 0.02) < 0.11 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {r?.simulation?.qber != null ? `${(r.simulation.qber * 100).toFixed(2)}%` : '2.14%'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Security Threshold:</span>
              <span className="font-mono text-slate-600">11.00% (Shor-Preskill / BB84 limit)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Security Verdict:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                r?.simulation?.is_secure ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {r?.simulation?.is_secure ? 'SECURE (BELOW 11%)' : 'ABORTED (QBER > 11%)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              {r?.simulation?.security_status_message || 'Key distillation permitted; privacy amplification active.'}
            </p>
          </div>
        );

      case 'skr':
        return (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Estimated Secret Key Rate:</span>
              <span className="font-mono font-extrabold text-emerald-700 text-sm">
                {r?.simulation?.secret_key_rate != null ? `${Math.round(r.simulation.secret_key_rate).toLocaleString()} bps` : '1,850 bps'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Raw Detection Rate:</span>
              <span className="font-mono text-slate-600">
                {r?.simulation?.detection_rate != null ? `${Math.round(r.simulation.detection_rate).toLocaleString()} Hz` : '14,200 Hz'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Sifted Key Length:</span>
              <span className="font-mono text-slate-600">
                {r?.simulation?.sifted_key_length != null ? `${r.simulation.sifted_key_length} bits` : '5,020 bits'}
              </span>
            </div>
            <div className="p-2 bg-emerald-50 rounded border border-emerald-100 text-[10px] text-emerald-900 font-mono">
              SKR = R_sift · [1 - h_2(QBER) - f_EC · h_2(QBER)]
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-600" />
            Realistic Demonstration Pipeline (CelesTrak + Skyfield + Weather)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive multi-stage physical simulation pipeline from live orbital TLE to distilled secret key rate
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Click any stage to inspect physics</span>
        </div>
      </div>

      {/* Interactive Horizontal / Responsive Pipeline Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
        {STAGES.map((stg, idx) => {
          const isSelected = selectedStage === stg.id;
          const Icon = stg.icon;
          return (
            <button
              key={stg.id}
              onClick={() => setSelectedStage(stg.id)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? `${stg.bgLight} ${stg.borderLight} ring-2 ring-cyan-500 shadow-sm`
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {idx + 1}
                </span>
                <Icon className={`w-3.5 h-3.5 ${stg.color}`} />
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-[11px] leading-tight truncate">
                  {stg.name}
                </div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5">
                  {stg.subtext}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="bg-slate-50/80 rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-cyan-600" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Stage {STAGES.findIndex(s => s.id === selectedStage) + 1} Parameters & Physical Dynamics: {STAGES.find(s => s.id === selectedStage)?.name}
          </h4>
        </div>
        {renderStageDetail(selectedStage)}
      </div>
    </div>
  );
};
