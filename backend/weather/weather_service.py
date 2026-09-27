"""
Weather Data Integration and Atmospheric Loss Modeling
======================================================
Retrieves live or cached weather observations (visibility, cloud cover, humidity,
temperature, precipitation, wind) and computes physical optical link attenuation modifiers.
"""

import os
import math
import urllib.request
import urllib.error
import json
from typing import Dict, Any, Optional

OPEN_METEO_BASE_URL = os.environ.get("WEATHER_API_BASE_URL", "https://api.open-meteo.com/v1/forecast")
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", None)

# Default cached / demo weather when offline or network unavailable
CACHED_DEMO_WEATHER: Dict[str, Any] = {
    "visibility_km": 18.5,
    "cloud_cover_percent": 24.0,
    "humidity_percent": 58.0,
    "temperature_c": 22.4,
    "precipitation_mm": 0.0,
    "wind_speed_kmh": 11.2,
    "condition": "Favorable / Partly Cloudy",
    "source": "Cached / Demo Weather",
    "is_live": False
}


def fetch_weather_data(lat: float = 28.6139, lon: float = 77.2090) -> Dict[str, Any]:
    """
    Fetches real-time weather data for the specified ground station latitude/longitude.
    Falls back gracefully to realistic cached weather if the external API is unreachable.
    """
    url = (
        f"{OPEN_METEO_BASE_URL}?latitude={lat:.4f}&longitude={lon:.4f}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,visibility,wind_speed_10m"
    )

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "QuantumSim-Academic-Prototype/1.0"}
        )
        with urllib.request.urlopen(req, timeout=4) as response:
            data = json.loads(response.read().decode("utf-8"))
            current = data.get("current", {})
            
            vis_m = current.get("visibility", 18500.0)
            vis_km = max(0.5, min(50.0, float(vis_m) / 1000.0))
            cloud_pct = max(0.0, min(100.0, float(current.get("cloud_cover", 20.0))))
            humidity = max(5.0, min(100.0, float(current.get("relative_humidity_2m", 50.0))))
            temp_c = float(current.get("temperature_2m", 20.0))
            precip_mm = max(0.0, float(current.get("precipitation", 0.0)))
            wind_kmh = float(current.get("wind_speed_10m", 10.0))

            # Synthesize human-readable condition
            if precip_mm > 1.0:
                cond = "Rain / Precipitation"
            elif cloud_pct > 75.0:
                cond = "Heavy Overcast"
            elif cloud_pct > 35.0:
                cond = "Scattered Clouds"
            elif vis_km < 4.0:
                cond = "Hazy / Low Visibility"
            else:
                cond = "Clear / Favorable"

            return {
                "visibility_km": round(vis_km, 2),
                "cloud_cover_percent": round(cloud_pct, 1),
                "humidity_percent": round(humidity, 1),
                "temperature_c": round(temp_c, 1),
                "precipitation_mm": round(precip_mm, 2),
                "wind_speed_kmh": round(wind_kmh, 1),
                "condition": cond,
                "source": "Open-Meteo API (Live)",
                "is_live": True
            }
    except Exception as e:
        # Fallback to realistic cached weather
        pass

    return {
        **CACHED_DEMO_WEATHER,
        "is_live": False,
        "source": "Cached / Demo Weather"
    }


def calculate_weather_optical_loss(
    weather: Dict[str, Any],
    wavelength_nm: float = 1550.0
) -> Dict[str, float]:
    """
    Computes additional optical extinction contributions (dB) induced by real-time weather:
    1. Cloud cover attenuation: thin clouds add modest diffuse scattering; heavy clouds block direct photons.
    2. Rain / Precipitation attenuation: using ITU-R optical rain model alpha_rain = a * R^b.
    3. High humidity water vapor absorption penalty at 1550 nm.
    """
    cloud_pct = weather.get("cloud_cover_percent", 0.0)
    precip_mm = weather.get("precipitation_mm", 0.0)
    humidity_pct = weather.get("humidity_percent", 50.0)

    # A. Cloud cover extinction:
    # 0 - 20%: minimal diffuse loss (0.05 - 0.5 dB)
    # 20 - 60%: moderate cloud attenuation (0.5 - 3.5 dB)
    # > 60%: heavy cloud cover (3.5 - 15.0 dB)
    if cloud_pct <= 20.0:
        cloud_loss_db = 0.02 * cloud_pct
    elif cloud_pct <= 60.0:
        cloud_loss_db = 0.4 + 0.08 * (cloud_pct - 20.0)
    else:
        cloud_loss_db = 3.6 + 0.25 * (cloud_pct - 60.0)

    # B. Rain / Precipitation loss (ITU-R optical FSO approximation):
    # alpha_rain ~ 1.076 * R^0.67 dB/km across ~2.5 km lower troposphere path
    if precip_mm > 0.01:
        rain_rate_mm_hr = precip_mm  # approximate hourly accumulation
        rain_loss_db = min(25.0, 1.076 * (rain_rate_mm_hr**0.67) * 2.5)
    else:
        rain_loss_db = 0.0

    # C. Humidity / vapor absorption adjustment at 1550 nm:
    # High humidity (>70%) adds slight water vapor absorption
    if humidity_pct > 70.0:
        humidity_loss_db = 0.015 * (humidity_pct - 70.0)
    else:
        humidity_loss_db = 0.0

    total_weather_loss_db = cloud_loss_db + rain_loss_db + humidity_loss_db

    return {
        "cloud_loss_db": round(cloud_loss_db, 2),
        "rain_loss_db": round(rain_loss_db, 2),
        "humidity_loss_db": round(humidity_loss_db, 2),
        "total_weather_loss_db": round(total_weather_loss_db, 2)
    }
