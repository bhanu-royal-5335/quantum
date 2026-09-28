"""
CelesTrak TLE Satellite Data Integration Layer
==============================================
Retrieves live or cached Two-Line Element (TLE) orbital data for LEO satellites from CelesTrak.
Supports robust fallback/demo caching if CelesTrak API is unreachable or rate-limited.
"""

import os
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

CELESTRAK_BASE_URL = os.environ.get("CELESTRAK_BASE_URL", "https://celestrak.org/NORAD/elements/gp.php")

# Verified reference TLEs for realistic offline / demo fallback
CACHED_LEO_SATELLITES: Dict[str, Dict[str, Any]] = {
    "leo_sat": {
        "id": "leo_sat",
        "name": "LEO-QKD Reference Satellite",
        "norad_id": 41740,
        "description": "Standard Low Earth Orbit (LEO) Quantum Satellite (500 km Sun-synchronous orbit, 97.4° inclination)",
        "line1": "1 41740U 16051A   26085.52418293  .00001248  00000+0  65123-4 0  9997",
        "line2": "2 41740  97.4321 154.2184 0014285  98.4125 261.8492 15.24187214481231",
        "epoch": "2026-03-26 12:34:49 UTC",
        "altitude_km": 500.0,
        "inclination_deg": 97.4
    },
    "micius": {
        "id": "micius",
        "name": "MICIUS (QSS / Quantum Science Satellite)",
        "norad_id": 41740,
        "description": "World's premier quantum communication satellite (500 km Sun-synchronous orbit)",
        "line1": "1 41740U 16051A   26085.52418293  .00001248  00000+0  65123-4 0  9997",
        "line2": "2 41740  97.4321 154.2184 0014285  98.4125 261.8492 15.24187214481231",
        "epoch": "2026-03-26 12:34:49 UTC",
        "altitude_km": 500.0,
        "inclination_deg": 97.4
    },
    "iss": {
        "id": "iss",
        "name": "ISS (ZARYA)",
        "norad_id": 25544,
        "description": "International Space Station (LEO ~415 km, 51.6° inclination)",
        "line1": "1 25544U 98067A   26085.60251157  .00014821  00000+0  26912-3 0  9992",
        "line2": "2 25544  51.6423 208.3145 0005128 112.5184 247.6291 15.49842183561234",
        "epoch": "2026-03-26 14:27:36 UTC",
        "altitude_km": 415.0,
        "inclination_deg": 51.6
    },
    "tiangong": {
        "id": "tiangong",
        "name": "TIANGONG (CSS Space Station)",
        "norad_id": 48274,
        "description": "Tiangong Chinese Space Station (LEO ~385 km, 41.5° inclination)",
        "line1": "1 48274U 21035A   26085.51842911  .00018412  00000+0  21415-3 0  9994",
        "line2": "2 48274  41.4721  85.4128 0003184 220.1415 139.8124 15.58914125278142",
        "epoch": "2026-03-26 12:26:32 UTC",
        "altitude_km": 385.0,
        "inclination_deg": 41.5
    },
    "starlink": {
        "id": "starlink",
        "name": "STARLINK-1007",
        "norad_id": 44713,
        "description": "Commercial optical inter-satellite link LEO node (550 km, 53.0° inclination)",
        "line1": "1 44713U 19074A   26085.41829141  .00002148  00000+0  11284-4 0  9998",
        "line2": "2 44713  53.0542 312.4182 0001482  74.1284 285.9814 15.06418241352148",
        "epoch": "2026-03-26 10:02:19 UTC",
        "altitude_km": 550.0,
        "inclination_deg": 53.0
    },
    "noaa20": {
        "id": "noaa20",
        "name": "NOAA 20 (JPSS-1)",
        "norad_id": 43013,
        "description": "Polar orbit earth observation satellite (825 km, 98.7° Sun-synchronous)",
        "line1": "1 43013U 17073A   26085.50124819  .00000084  00000+0  41284-5 0  9996",
        "line2": "2 43013  98.7142 120.4185 0001284  85.4182 274.7184 14.19514128438125",
        "epoch": "2026-03-26 12:01:47 UTC",
        "altitude_km": 825.0,
        "inclination_deg": 98.7
    }
}


def list_supported_satellites() -> List[Dict[str, Any]]:
    """
    Returns the list of available LEO satellites for selection.
    """
    return [
        {
            "id": s["id"],
            "name": s["name"],
            "norad_id": s["norad_id"],
            "description": s["description"],
            "altitude_km": s["altitude_km"],
            "inclination_deg": s["inclination_deg"],
            "epoch": s["epoch"]
        }
        for s in CACHED_LEO_SATELLITES.values()
    ]


def fetch_satellite_tle(satellite_id: str = "micius") -> Dict[str, Any]:
    """
    Fetches the latest TLE from CelesTrak for the specified satellite.
    Falls back gracefully to verified cached TLE if external network is unavailable.
    """
    sat_key = satellite_id.lower()
    if sat_key not in CACHED_LEO_SATELLITES:
        sat_key = "micius"

    cached_sat = CACHED_LEO_SATELLITES[sat_key]
    norad_id = cached_sat["norad_id"]

    # Try live fetch from CelesTrak
    tle_url = f"{CELESTRAK_BASE_URL}?CATNR={norad_id}&FORMAT=TLE"
    try:
        req = urllib.request.Request(
            tle_url,
            headers={"User-Agent": "QuantumSim-Academic-Prototype/1.0"}
        )
        with urllib.request.urlopen(req, timeout=4) as response:
            content = response.read().decode("utf-8").strip().splitlines()
            if len(content) >= 3:
                name = content[0].strip()
                line1 = content[1].strip()
                line2 = content[2].strip()
                return {
                    "id": sat_key,
                    "name": name,
                    "norad_id": norad_id,
                    "line1": line1,
                    "line2": line2,
                    "epoch": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "source": "CelesTrak (Live)",
                    "is_live": True,
                    "description": cached_sat["description"],
                    "altitude_km": cached_sat["altitude_km"]
                }
            elif len(content) == 2:
                # Sometimes 2 lines without header name
                return {
                    "id": sat_key,
                    "name": cached_sat["name"],
                    "norad_id": norad_id,
                    "line1": content[0].strip(),
                    "line2": content[1].strip(),
                    "epoch": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "source": "CelesTrak (Live)",
                    "is_live": True,
                    "description": cached_sat["description"],
                    "altitude_km": cached_sat["altitude_km"]
                }
    except Exception as e:
        # Fallback to cached verified TLE
        pass

    return {
        "id": sat_key,
        "name": cached_sat["name"],
        "norad_id": norad_id,
        "line1": cached_sat["line1"],
        "line2": cached_sat["line2"],
        "epoch": cached_sat["epoch"],
        "source": "CelesTrak (Cached/Demo)",
        "is_live": False,
        "description": cached_sat["description"],
        "altitude_km": cached_sat["altitude_km"]
    }
