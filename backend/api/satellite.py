"""
FastAPI Satellite & Orbit Router
================================
Provides CelesTrak TLE retrieval and Skyfield orbital propagation endpoints.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional

from ..satellite.celestrak import list_supported_satellites, fetch_satellite_tle
from ..satellite.skyfield_propagation import propagate_satellite, compute_satellite_pass_trajectory
from ..models.schemas import SatelliteInfo, SatellitePosition

router = APIRouter(prefix="/api/satellite", tags=["satellite"])


@router.get("/list")
def get_satellites():
    """
    Returns the catalog of supported LEO satellites for quantum communication.
    """
    return list_supported_satellites()


@router.get("/tle", response_model=SatelliteInfo)
def get_satellite_tle(id: str = Query("micius", description="Satellite identifier (e.g. micius, iss, tiangong, starlink)")):
    """
    Retrieves live or cached TLE data from CelesTrak.
    """
    tle_dict = fetch_satellite_tle(id)
    return SatelliteInfo(**tle_dict)


@router.get("/position", response_model=SatellitePosition)
def get_satellite_position(
    id: str = Query("micius"),
    lat: float = Query(28.6139, ge=-90.0, le=90.0),
    lon: float = Query(77.2090, ge=-180.0, le=180.0),
    elevation_m: float = Query(216.0),
    min_elevation_deg: float = Query(10.0)
):
    """
    Propagates the satellite orbit with Skyfield to return instantaneous look angles and line-of-sight status.
    """
    sat_dict = fetch_satellite_tle(id)
    pos = propagate_satellite(
        line1=sat_dict["line1"],
        line2=sat_dict["line2"],
        name=sat_dict["name"],
        ground_lat=lat,
        ground_lon=lon,
        ground_elevation_m=elevation_m,
        min_elevation_deg=min_elevation_deg
    )
    return SatellitePosition(**pos)


@router.get("/pass")
def get_satellite_pass(
    id: str = Query("micius"),
    lat: float = Query(28.6139),
    lon: float = Query(77.2090),
    elevation_m: float = Query(216.0),
    min_elevation_deg: float = Query(10.0),
    duration_min: int = Query(16, ge=5, le=60)
):
    """
    Computes a sweep of satellite elevation and range across a pass window.
    """
    sat_dict = fetch_satellite_tle(id)
    trajectory = compute_satellite_pass_trajectory(
        line1=sat_dict["line1"],
        line2=sat_dict["line2"],
        name=sat_dict["name"],
        ground_lat=lat,
        ground_lon=lon,
        ground_elevation_m=elevation_m,
        min_elevation_deg=min_elevation_deg,
        duration_minutes=duration_min,
        num_points=25
    )
    return {
        "satellite": sat_dict["name"],
        "trajectory": trajectory
    }
