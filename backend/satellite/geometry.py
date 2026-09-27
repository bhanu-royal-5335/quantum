"""
Link Geometry and Dual-Hop Path Calculation
===========================================
Calculates physical slant distances, elevation angles, and atmospheric air-mass factors
for the hierarchical optical channel: LEO Satellite -> Relay / HAP -> Bob Ground Receiver.
"""

import math
from typing import Dict, Any, Tuple


EARTH_RADIUS_KM = 6371.0


def calculate_atmospheric_airmass(elevation_deg: float) -> float:
    """
    Computes relative atmospheric optical airmass M(theta) using the Kasten-Young formula.
    Zenith (90 deg) -> M = 1.0
    Low elevation (15 deg) -> M ~ 3.8
    Near horizon (5 deg) -> M ~ 10.3
    """
    theta = max(0.5, elevation_deg)
    # Kasten and Young (1989) formula
    denom = math.sin(math.radians(theta)) + 0.001867 * ((theta + 3.8299)**(-1.253))
    airmass = 1.0 / max(0.01, denom)
    return min(40.0, airmass)


def calculate_hierarchical_link_geometry(
    direct_range_km: float,
    elevation_deg: float,
    azimuth_deg: float,
    satellite_altitude_km: float,
    has_relay: bool = True,
    relay_altitude_km: float = 20.0,
    min_elevation_deg: float = 10.0
) -> Dict[str, Any]:
    """
    Decomposes the overall line-of-sight range into Link 1 (Space to Relay)
    and Link 2 (Relay to Bob Ground Receiver).
    """
    line_of_sight = elevation_deg >= min_elevation_deg
    theta_rad = math.radians(max(0.1, elevation_deg))
    airmass = calculate_atmospheric_airmass(elevation_deg)

    if has_relay:
        # Link 2: Ground Bob to Stratospheric Relay (h_relay ~ 20 km)
        # Using spherical law of cosines for Earth curvature:
        # D_link2 = sqrt(R_E^2 * sin^2(theta) + 2*R_E*h_r + h_r^2) - R_E*sin(theta)
        re = EARTH_RADIUS_KM
        hr = max(5.0, relay_altitude_km)
        d_link2 = math.sqrt((re * math.sin(theta_rad))**2 + 2.0 * re * hr + hr**2) - (re * math.sin(theta_rad))
        d_link2 = max(hr, d_link2)

        # Link 1: Space LEO Satellite to Stratospheric Relay
        d_link1 = max(10.0, direct_range_km - d_link2)
        total_dist = d_link1 + d_link2

        return {
            "has_relay": True,
            "elevation_deg": round(elevation_deg, 2),
            "azimuth_deg": round(azimuth_deg, 2),
            "airmass_factor": round(airmass, 3),
            "direct_range_km": round(direct_range_km, 2),
            "link1_distance_km": round(d_link1, 2),
            "link2_distance_km": round(d_link2, 2),
            "total_distance_km": round(total_dist, 2),
            "relay_altitude_km": relay_altitude_km,
            "line_of_sight": line_of_sight,
            "min_elevation_deg": min_elevation_deg,
            "link_status": "Available" if line_of_sight else "Unavailable (Below min elevation)"
        }
    else:
        # Direct Downlink without Relay
        return {
            "has_relay": False,
            "elevation_deg": round(elevation_deg, 2),
            "azimuth_deg": round(azimuth_deg, 2),
            "airmass_factor": round(airmass, 3),
            "direct_range_km": round(direct_range_km, 2),
            "link1_distance_km": round(direct_range_km, 2),
            "link2_distance_km": 0.0,
            "total_distance_km": round(direct_range_km, 2),
            "relay_altitude_km": 0.0,
            "line_of_sight": line_of_sight,
            "min_elevation_deg": min_elevation_deg,
            "link_status": "Available" if line_of_sight else "Unavailable (Below min elevation)"
        }
