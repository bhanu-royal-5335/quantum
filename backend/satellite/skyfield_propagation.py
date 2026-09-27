"""
Skyfield Satellite Orbital Propagation Engine
=============================================
Calculates real-time topocentric coordinates, subpoint locations, and pass trajectories
using the SGP4 algorithm through Skyfield.
"""

import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from skyfield.api import load, wgs84, EarthSatellite


# Use built-in timescale tables for instant, completely offline-capable execution
_TIMESCALES = load.timescale(builtin=True)


def propagate_satellite(
    line1: str,
    line2: str,
    name: str = "LEO Satellite",
    ground_lat: float = 28.6139,
    ground_lon: float = 77.2090,
    ground_elevation_m: float = 216.0,
    observation_dt: Optional[datetime] = None,
    min_elevation_deg: float = 10.0
) -> Dict[str, Any]:
    """
    Propagates the satellite TLE to compute instantaneous subpoint and topocentric look-angles from ground.
    """
    ts = _TIMESCALES
    sat = EarthSatellite(line1, line2, name, ts)
    
    if observation_dt is None:
        observation_dt = datetime.now(timezone.utc)
    elif observation_dt.tzinfo is None:
        observation_dt = observation_dt.replace(tzinfo=timezone.utc)

    t = ts.from_datetime(observation_dt)

    # 1. Geocentric position & subpoint
    geocentric = sat.at(t)
    subpoint = wgs84.subpoint(geocentric)
    sat_lat = float(subpoint.latitude.degrees)
    sat_lon = float(subpoint.longitude.degrees)
    sat_alt_km = float(subpoint.elevation.km)

    # 2. Topocentric look-angles from Ground Station (Bob)
    ground_station = wgs84.latlon(ground_lat, ground_lon, elevation_m=ground_elevation_m)
    difference = sat - ground_station
    topocentric = difference.at(t)
    alt, az, distance = topocentric.altaz()

    elevation_deg = float(alt.degrees)
    azimuth_deg = float(az.degrees)
    range_km = float(distance.km)

    # Line of Sight verification
    line_of_sight = elevation_deg >= min_elevation_deg
    if line_of_sight:
        status_message = (
            f"Line of Sight Available: Satellite elevation ({elevation_deg:.1f}°) "
            f"exceeds ground receiver mask ({min_elevation_deg:.1f}°)."
        )
    else:
        status_message = (
            f"Link Unavailable: Satellite is below the minimum optical elevation angle "
            f"({elevation_deg:.1f}° < {min_elevation_deg:.1f}°). Atmospheric occlusion prevents QKD."
        )

    return {
        "timestamp": observation_dt.isoformat(),
        "satellite_name": name,
        "latitude": round(sat_lat, 4),
        "longitude": round(sat_lon, 4),
        "altitude_km": round(sat_alt_km, 2),
        "azimuth_deg": round(azimuth_deg, 2),
        "elevation_deg": round(elevation_deg, 2),
        "range_km": round(range_km, 2),
        "line_of_sight": line_of_sight,
        "min_elevation_deg": min_elevation_deg,
        "status_message": status_message
    }


def compute_satellite_pass_trajectory(
    line1: str,
    line2: str,
    name: str = "LEO Satellite",
    ground_lat: float = 28.6139,
    ground_lon: float = 77.2090,
    ground_elevation_m: float = 216.0,
    min_elevation_deg: float = 10.0,
    duration_minutes: int = 15,
    num_points: int = 25
) -> List[Dict[str, Any]]:
    """
    Computes a sweep of elevation, range, and azimuth over a satellite pass window (time series).
    If currently below horizon, shifts time window to the nearest overhead culmination.
    """
    ts = _TIMESCALES
    sat = EarthSatellite(line1, line2, name, ts)
    ground_station = wgs84.latlon(ground_lat, ground_lon, elevation_m=ground_elevation_m)
    
    now_utc = datetime.now(timezone.utc)
    t_now = ts.from_datetime(now_utc)
    current_alt = (sat - ground_station).at(t_now).altaz()[0].degrees

    # If the satellite is currently near or above horizon, center around now.
    # Otherwise, search ahead within the next 12 hours for the culmination of the next pass.
    center_dt = now_utc
    if current_alt < 5.0:
        # Search for culmination peak within next 8 hours in 2-min increments
        best_dt = now_utc
        max_alt = -90.0
        for m in range(0, 480, 2):
            test_dt = now_utc + timedelta(minutes=m)
            test_alt = (sat - ground_station).at(ts.from_datetime(test_dt)).altaz()[0].degrees
            if test_alt > max_alt:
                max_alt = test_alt
                best_dt = test_dt
                if max_alt > 40.0:
                    break
        if max_alt > 15.0:
            center_dt = best_dt

    start_dt = center_dt - timedelta(minutes=duration_minutes / 2.0)
    step_minutes = duration_minutes / (num_points - 1)

    trajectory: List[Dict[str, Any]] = []
    for i in range(num_points):
        point_dt = start_dt + timedelta(minutes=i * step_minutes)
        t_pt = ts.from_datetime(point_dt)
        alt, az, dist = (sat - ground_station).at(t_pt).altaz()
        
        el_val = float(alt.degrees)
        az_val = float(az.degrees)
        rng_val = float(dist.km)

        trajectory.append({
            "step_index": i + 1,
            "time_offset_min": round((i * step_minutes) - (duration_minutes / 2.0), 1),
            "timestamp": point_dt.strftime("%H:%M:%S UTC"),
            "elevation_deg": round(el_val, 2),
            "azimuth_deg": round(az_val, 2),
            "range_km": round(rng_val, 2),
            "line_of_sight": el_val >= min_elevation_deg
        })

    return trajectory
