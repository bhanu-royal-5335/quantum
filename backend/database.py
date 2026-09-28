"""
SQLite Database Layer for Scenarios, Simulations, and Comparisons
================================================================
"""

import sqlite3
import json
import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .models.schemas import ChannelParameters, ScenarioResponse, SimulationResult


DB_PATH = os.path.join(os.path.dirname(__file__), "data", "quantum_sim.db")


DEFAULT_SCENARIOS = [
    {
        "id": "scenario-a",
        "name": "Scenario A: Baseline LEO → HAP Relay → Ground",
        "description": "Standard nominal configuration featuring LEO satellite at 500 km, stratospheric HAP relay at 20 km, 1550 nm wavelength, and clear atmosphere.",
        "is_default": True,
        "parameters": ChannelParameters(
            satellite_altitude=500.0,
            has_relay=True,
            relay_altitude=20.0,
            relay_efficiency=0.85,
            relay_aperture=0.35,
            wavelength=1550.0,
            transmitter_aperture=0.25,
            beam_divergence=10.0,
            receiver_aperture=0.60,
            visibility=20.0,
            atmospheric_condition="clear",
            turbulence_level="moderate",
            cn2_ground=1e-14,
            pointing_level="low",
            pointing_error=2.5,
            detector_efficiency=0.80,
            dark_count_rate=1e-6,
            background_noise=1e-6,
            optical_error_rate=0.015,
            num_bits=10000,
            monte_carlo_iterations=1000
        ).model_dump()
    },
    {
        "id": "scenario-b",
        "name": "Scenario B: Extended Distance Orbit (1,000 km)",
        "description": "Evaluates higher altitude orbit (1,000 km LEO), increasing free-space diffraction spreading and optical path loss.",
        "is_default": True,
        "parameters": ChannelParameters(
            satellite_altitude=1000.0,
            has_relay=True,
            relay_altitude=20.0,
            relay_efficiency=0.85,
            relay_aperture=0.35,
            wavelength=1550.0,
            transmitter_aperture=0.25,
            beam_divergence=10.0,
            receiver_aperture=0.60,
            visibility=20.0,
            atmospheric_condition="clear",
            turbulence_level="moderate",
            cn2_ground=1e-14,
            pointing_level="low",
            pointing_error=2.5,
            detector_efficiency=0.80,
            dark_count_rate=1e-6,
            background_noise=1e-6,
            optical_error_rate=0.015,
            num_bits=10000,
            monte_carlo_iterations=1000
        ).model_dump()
    },
    {
        "id": "scenario-c",
        "name": "Scenario C: Adverse Weather / Low Visibility Fog",
        "description": "Tests degraded visibility (3.0 km) representing ground haze and fog in the lower boundary layer.",
        "is_default": True,
        "parameters": ChannelParameters(
            satellite_altitude=500.0,
            has_relay=True,
            relay_altitude=20.0,
            relay_efficiency=0.85,
            relay_aperture=0.35,
            wavelength=1550.0,
            transmitter_aperture=0.25,
            beam_divergence=10.0,
            receiver_aperture=0.60,
            visibility=3.0,
            atmospheric_condition="haze",
            turbulence_level="moderate",
            cn2_ground=1e-14,
            pointing_level="low",
            pointing_error=2.5,
            detector_efficiency=0.80,
            dark_count_rate=1e-6,
            background_noise=3e-6,
            optical_error_rate=0.018,
            num_bits=10000,
            monte_carlo_iterations=1000
        ).model_dump()
    },
    {
        "id": "scenario-d",
        "name": "Scenario D: Strong Atmospheric Turbulence",
        "description": "High thermal turbulence regime with ground Cn2 = 1.0e-13 m^(-2/3), inducing severe optical scintillation and deep fades.",
        "is_default": True,
        "parameters": ChannelParameters(
            satellite_altitude=500.0,
            has_relay=True,
            relay_altitude=20.0,
            relay_efficiency=0.85,
            relay_aperture=0.35,
            wavelength=1550.0,
            transmitter_aperture=0.25,
            beam_divergence=10.0,
            receiver_aperture=0.60,
            visibility=20.0,
            atmospheric_condition="clear",
            turbulence_level="strong",
            cn2_ground=1e-13,
            pointing_level="moderate",
            pointing_error=4.0,
            detector_efficiency=0.80,
            dark_count_rate=1e-6,
            background_noise=1e-6,
            optical_error_rate=0.020,
            num_bits=10000,
            monte_carlo_iterations=1000
        ).model_dump()
    },
    {
        "id": "scenario-e",
        "name": "Scenario E: High Pointing Jitter Misalignment",
        "description": "Severe pointing jitter of 10.0 μrad simulating satellite platform mechanical vibration or degraded attitude determination.",
        "is_default": True,
        "parameters": ChannelParameters(
            satellite_altitude=500.0,
            has_relay=True,
            relay_altitude=20.0,
            relay_efficiency=0.85,
            relay_aperture=0.35,
            wavelength=1550.0,
            transmitter_aperture=0.25,
            beam_divergence=10.0,
            receiver_aperture=0.60,
            visibility=20.0,
            atmospheric_condition="clear",
            turbulence_level="moderate",
            cn2_ground=1e-14,
            pointing_level="high",
            pointing_error=10.0,
            detector_efficiency=0.80,
            dark_count_rate=1e-6,
            background_noise=1e-6,
            optical_error_rate=0.015,
            num_bits=10000,
            monte_carlo_iterations=1000
        ).model_dump()
    },
    {
        "id": "scenario-f",
        "name": "Scenario F: Direct Downlink (Without Relay / HAP)",
        "description": "Direct optical link from LEO satellite directly to Bob Ground Receiver without the intermediate stratospheric HAP relay.",
        "is_default": True,
        "parameters": ChannelParameters(
            satellite_altitude=500.0,
            has_relay=False,
            relay_altitude=0.0,
            relay_efficiency=1.0,
            relay_aperture=0.0,
            wavelength=1550.0,
            transmitter_aperture=0.25,
            beam_divergence=10.0,
            receiver_aperture=0.60,
            visibility=20.0,
            atmospheric_condition="clear",
            turbulence_level="moderate",
            cn2_ground=1e-14,
            pointing_level="low",
            pointing_error=2.5,
            detector_efficiency=0.80,
            dark_count_rate=1e-6,
            background_noise=1e-6,
            optical_error_rate=0.015,
            num_bits=10000,
            monte_carlo_iterations=1000
        ).model_dump()
    }
]


def get_db_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Scenarios table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        parameters_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_default INTEGER DEFAULT 0
    )
    """)

    # Simulations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS simulations (
        id TEXT PRIMARY KEY,
        scenario_id TEXT,
        scenario_name TEXT,
        timestamp TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        results_json TEXT NOT NULL,
        FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
    )
    """)

    # Dedicated Quantum Simulation Experiments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quantum_experiments (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        satellite TEXT NOT NULL,
        distance_km REAL NOT NULL,
        num_bits INTEGER NOT NULL,
        eavesdropping_enabled INTEGER NOT NULL,
        eavesdropping_probability REAL NOT NULL,
        qber REAL NOT NULL,
        estimated_skr REAL NOT NULL,
        results_json TEXT NOT NULL
    )
    """)
    conn.commit()

    # Seed default scenarios if empty
    cursor.execute("SELECT COUNT(*) FROM scenarios")
    count = cursor.fetchone()[0]
    if count == 0:
        now_str = datetime.now(timezone.utc).isoformat()
        for s in DEFAULT_SCENARIOS:
            cursor.execute(
                """
                INSERT INTO scenarios (id, name, description, parameters_json, created_at, is_default)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    s["id"],
                    s["name"],
                    s["description"],
                    json.dumps(s["parameters"]),
                    now_str,
                    1
                )
            )
        conn.commit()
    conn.close()


def list_scenarios() -> List[ScenarioResponse]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, description, parameters_json, created_at, is_default FROM scenarios ORDER BY is_default DESC, created_at ASC")
    rows = cursor.fetchall()
    conn.close()
    
    scenarios = []
    for r in rows:
        scenarios.append(
            ScenarioResponse(
                id=r["id"],
                name=r["name"],
                description=r["description"] or "",
                parameters=ChannelParameters(**json.loads(r["parameters_json"])),
                created_at=r["created_at"],
                is_default=bool(r["is_default"])
            )
        )
    return scenarios


def get_scenario_by_id(scenario_id: str) -> Optional[ScenarioResponse]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, description, parameters_json, created_at, is_default FROM scenarios WHERE id = ?", (scenario_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return ScenarioResponse(
        id=row["id"],
        name=row["name"],
        description=row["description"] or "",
        parameters=ChannelParameters(**json.loads(row["parameters_json"])),
        created_at=row["created_at"],
        is_default=bool(row["is_default"])
    )


def save_scenario(name: str, description: str, parameters: ChannelParameters) -> ScenarioResponse:
    import uuid
    conn = get_db_connection()
    cursor = conn.cursor()
    scenario_id = f"custom-{uuid.uuid4().hex[:8]}"
    now_str = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        """
        INSERT INTO scenarios (id, name, description, parameters_json, created_at, is_default)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            scenario_id,
            name,
            description,
            json.dumps(parameters.model_dump()),
            now_str,
            0
        )
    )
    conn.commit()
    conn.close()
    return ScenarioResponse(
        id=scenario_id,
        name=name,
        description=description,
        parameters=parameters,
        created_at=now_str,
        is_default=False
    )


def save_simulation_result(result: SimulationResult):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO simulations (id, scenario_id, scenario_name, timestamp, parameters_json, results_json)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            result.id,
            result.scenario_id,
            result.scenario_name,
            result.timestamp,
            json.dumps(result.parameters.model_dump()),
            json.dumps(result.model_dump())
        )
    )
    conn.commit()
    conn.close()


def get_simulation_result(sim_id: str) -> Optional[SimulationResult]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT results_json FROM simulations WHERE id = ?", (sim_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return SimulationResult(**json.loads(row["results_json"]))


def get_recent_simulations(limit: int = 10) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, scenario_name, timestamp, results_json FROM simulations ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    recent = []
    for r in rows:
        data = json.loads(r["results_json"])
        recent.append({
            "id": r["id"],
            "scenario_name": r["scenario_name"],
            "timestamp": r["timestamp"],
            "qber": data.get("qber"),
            "channel_loss_db": data.get("channel_loss_db"),
            "secret_key_rate": data.get("secret_key_rate"),
            "is_secure": data.get("is_secure")
        })
    return recent


def save_quantum_experiment_result(result: Dict[str, Any]):
    """
    Persists a complete Quantum Simulation experiment run into SQLite.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR REPLACE INTO quantum_experiments (
            id, timestamp, satellite, distance_km, num_bits,
            eavesdropping_enabled, eavesdropping_probability,
            qber, estimated_skr, results_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            result["id"],
            result["timestamp"],
            str(result.get("satellite", "micius")),
            float(result.get("distance_km", 500.0)),
            int(result.get("num_bits", 10000)),
            1 if result.get("eavesdropping_enabled") else 0,
            float(result.get("eavesdropping_probability", 0.0)),
            float(result.get("qber", 0.0)),
            float(result.get("estimated_skr", 0.0)),
            json.dumps(result)
        )
    )
    conn.commit()
    conn.close()


def get_quantum_experiment_history(limit: int = 15) -> List[Dict[str, Any]]:
    """
    Retrieves recent Quantum Simulation experiment summaries.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, timestamp, satellite, distance_km, num_bits,
               eavesdropping_enabled, eavesdropping_probability,
               qber, estimated_skr
        FROM quantum_experiments
        ORDER BY timestamp DESC
        LIMIT ?
        """,
        (limit,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_quantum_experiment_result(exp_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves full details of a saved Quantum Simulation experiment by ID.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT results_json FROM quantum_experiments WHERE id = ?", (exp_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return json.loads(row["results_json"])

