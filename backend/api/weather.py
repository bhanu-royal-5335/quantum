"""
FastAPI Weather Router
======================
Provides live or cached ground station weather data and optical attenuation factors.
"""

from fastapi import APIRouter, Query
from typing import Dict, Any

from ..weather.weather_service import fetch_weather_data, calculate_weather_optical_loss
from ..models.schemas import WeatherData

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("", response_model=WeatherData)
def get_current_weather(
    lat: float = Query(28.6139, ge=-90.0, le=90.0),
    lon: float = Query(77.2090, ge=-180.0, le=180.0),
    wavelength_nm: float = Query(1550.0)
):
    """
    Fetches real-time or cached weather conditions and computes optical attenuation components.
    """
    weather_dict = fetch_weather_data(lat=lat, lon=lon)
    loss_dict = calculate_weather_optical_loss(weather_dict, wavelength_nm=wavelength_nm)
    weather_dict.update(loss_dict)
    return WeatherData(**weather_dict)
