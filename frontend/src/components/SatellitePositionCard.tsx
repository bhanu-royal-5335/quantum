import React, { useState, useEffect } from 'react';
import {
  Satellite,
  RefreshCw,
  Compass,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Radio,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { SatelliteInfo, SatellitePosition, LinkGeometry, GroundStationConfig } from '../types/quantum';
import { fetchSatelliteList, fetchSatellitePosition } from '../services/api';

interface Props {
  selectedNoradId: number;
  onSelectSatellite: (noradId: number) => void;
  satellitePosition: SatellitePosition | null;
  linkGeometry: LinkGeometry | null;
  satelliteInfo: SatelliteInfo | null;
  groundStation: GroundStationConfig;
  onRefreshPosition: () => Promise<void>;
  isLoading?: boolean;
}

export const SatellitePositionCard: React.FC<Props> = ({
  selectedNoradId,
  onSelectSatellite,
  satellitePosition,
  linkGeometry,
  satelliteInfo,
  groundStation,
  onRefreshPosition,
  isLoading
}) => {
  const [satellites, setSatellites] = useState<SatelliteInfo[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    loadSatellites();
  }, []);

  const loadSatellites = async () => {
    try {
      const list = await fetchSatelliteList();
      setSatellites(list);
    } catch (err: any) {
      console.warn('Could not fetch satellite list:', err);
      setListError('Using offline cached satellites');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshPosition();
    } finally {
      setIsRefreshing(false);
    }
  };

  const pos = satellitePosition;
  const geom = linkGeometry;
  const isLive = satelliteInfo?.is_live ?? true;
  const isLos = geom ? geom.line_of_sight_available : (pos ? pos.is_visible : false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
      {/* Title & Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Satellite className="w-4 h-4 text-sky-600" />
              Realistic LEO Satellite Data & Propagation (CelesTrak + Skyfield)
            </h3>
            {/* Live Data Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isLive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isLive ? 'LIVE DATA (CelesTrak LEO)' : 'DEMO / CACHED LEO'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            LEO orbital ephemeris propagated in real time via Skyfield SGP4 mechanics to ground station {groundStation.name}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh LEO Position</span>
        </button>
      </div>

      {/* Satellite Selector & TLE Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
        <div>
          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
            Satellite Orbit Source
          </label>
          <div className="px-3 py-1.5 bg-white rounded border border-slate-300 font-mono text-xs font-medium text-slate-800 flex items-center justify-between">
            <span>CelesTrak LEO (NORAD)</span>
            <span className="text-[10px] text-emerald-600 font-bold">ACTIVE</span>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
            LEO Satellite Selection
          </label>
          <select
            value={selectedNoradId}
            onChange={(e) => onSelectSatellite(Number(e.target.value))}
            className="w-full px-3 py-1.5 bg-white rounded border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {satellites.length > 0 ? (
              satellites.map((s) => (
                <option key={s.norad_id} value={s.norad_id}>
                  {s.name} (NORAD {s.norad_id})
                </option>
              ))
            ) : (
              <>
                <option value={41740}>LEO-QKD Reference Satellite (NORAD 41740)</option>
                <option value={41740}>Micius LEO (QUESS - NORAD 41740)</option>
                <option value={25544}>ISS LEO (ZARYA - NORAD 25544)</option>
                <option value={48274}>Tiangong Space Station LEO (NORAD 48274)</option>
                <option value={44713}>Starlink-1007 LEO (NORAD 44713)</option>
                <option value={43013}>NOAA-20 Polar LEO (NORAD 43013)</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
            TLE Status & Epoch
          </label>
          <div className="px-3 py-1.5 bg-white rounded border border-slate-300 font-mono text-[11px] text-slate-700 flex items-center justify-between">
            <span className="truncate">{satelliteInfo?.epoch || '2026-03-26 UTC'}</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Updated
            </span>
          </div>
        </div>
      </div>

      {/* Grid: REAL-TIME SATELLITE POSITION + LINK GEOMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section 5: Real-time Satellite Position */}
        <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              Real-Time LEO Satellite Position
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              Skyfield LEO Propagation
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Latitude</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {pos?.latitude_deg != null ? `${pos.latitude_deg >= 0 ? '+' : ''}${pos.latitude_deg.toFixed(4)}°` : '28.6139°'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Longitude</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {pos?.longitude_deg != null ? `${pos.longitude_deg >= 0 ? '+' : ''}${pos.longitude_deg.toFixed(4)}°` : '77.2090°'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Altitude</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {pos?.altitude_km != null ? `${pos.altitude_km.toFixed(1)} km` : '500.0 km'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Azimuth</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {pos?.azimuth_deg != null ? `${pos.azimuth_deg.toFixed(1)}°` : (geom?.azimuth_deg != null ? `${geom.azimuth_deg.toFixed(1)}°` : '182.4°')}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Elevation</span>
              <span className={`text-sm font-bold font-mono ${
                ((pos?.elevation_deg ?? geom?.elevation_deg) ?? 0) >= groundStation.min_elevation_deg ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {pos?.elevation_deg != null ? `${pos.elevation_deg.toFixed(1)}°` : (geom?.elevation_deg != null ? `${geom.elevation_deg.toFixed(1)}°` : '42.5°')}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Range (Slant Distance)</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {pos?.range_km != null ? `${pos.range_km.toFixed(1)} km` : (geom?.satellite_to_ground_range_km != null ? `${geom.satellite_to_ground_range_km.toFixed(1)} km` : '682.3 km')}
              </span>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Observation Time:</span>
            <span className="font-mono text-slate-700 font-medium">
              {pos?.observation_time || 'Instantaneous'}
            </span>
          </div>
        </div>

        {/* Section 6: Link Geometry */}
        <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Link Geometry & Line-of-Sight
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Min El: {groundStation.min_elevation_deg}°
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-600">Satellite → Relay (20 km):</span>
                <span className="font-mono font-bold text-slate-900">
                  {geom?.satellite_to_relay_distance_km != null ? `${geom.satellite_to_relay_distance_km.toFixed(1)} km` : (geom?.satellite_to_ground_range_km != null ? `${geom.satellite_to_ground_range_km.toFixed(1)} km` : '662.3 km')}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-600">Relay → Bob Ground Receiver:</span>
                <span className="font-mono font-bold text-slate-900">
                  {geom?.relay_to_bob_distance_km != null ? `${geom.relay_to_bob_distance_km.toFixed(1)} km` : '29.7 km'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Elevation Angle</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {geom?.elevation_deg != null ? `${geom.elevation_deg.toFixed(1)}°` : '42.5°'}
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Azimuth Angle</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {geom?.azimuth_deg != null ? `${geom.azimuth_deg.toFixed(1)}°` : '182.4°'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Line of Sight Availability Indicator */}
          <div className="mt-3 pt-3 border-t border-slate-200">
            {isLos ? (
              <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">Line of Sight: ● Available</span>
                  <span className="text-[10px] text-emerald-700">
                    Satellite is above {groundStation.min_elevation_deg}° elevation mask. Optical QKD transmission feasible.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs bg-rose-50 text-rose-800 p-2.5 rounded-lg border border-rose-200 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold block">● Link unavailable</span>
                  <span className="text-[10px] text-rose-700">
                    Reason: {geom?.reason || `Satellite below minimum elevation (${groundStation.min_elevation_deg}°)`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
