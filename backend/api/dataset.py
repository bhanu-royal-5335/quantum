from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import io
import csv
from datetime import datetime, timezone, timedelta

from backend.dataset.processor import dataset_processor
from backend.dataset.ml_trainer import ml_trainer
from backend.models.schemas import (
    GroundStationConfig,
    ChannelParameters,
    RealisticSimulationResult,
    WeatherData
)
from backend.simulation.realistic_channel import run_realistic_quantum_simulation
from backend.satellite.celestrak import fetch_satellite_tle
from backend.satellite.skyfield_propagation import compute_satellite_pass_trajectory
from backend.satellite.geometry import calculate_atmospheric_airmass
from backend.simulation.pointing_error import calculate_pointing_parameters
from backend.simulation.noise import calculate_detection_probabilities
from backend.simulation.secret_key import calculate_secure_key_rate

router = APIRouter(prefix="/api/dataset", tags=["Dataset"])


class DatasetSimulateRequest(BaseModel):
    record_id: int = 1
    satellite_norad_id: int = 41740
    use_dataset_location: bool = True
    channel_parameters: Optional[ChannelParameters] = None

NORAD_MAP = {
    41740: "micius",
    25544: "iss",
    48274: "tiangong",
    44713: "starlink",
    43013: "noaa20"
}


@router.get("/overview")
def get_dataset_overview() -> Dict[str, Any]:
    """Retrieve metadata, column catalog, and quality metrics of the NASA POWER dataset."""
    return dataset_processor.get_overview()


@router.get("/mapping")
def get_dataset_mapping() -> Dict[str, Any]:
    """
    Retrieve internal mapping architecture linking dataset meteorological columns
    through satellite geometry, atmospheric models, BB84 detection, and estimated SKR.
    """
    return dataset_processor.get_dataset_mapping()


@router.get("/celestrak-leo/overview")
def get_celestrak_leo_overview() -> Dict[str, Any]:
    """Retrieve CelesTrak LEO satellite dataset metadata, orbital regimes, and constellations."""
    return dataset_processor.get_celestrak_leo_overview()


@router.get("/celestrak-leo/satellites")
def get_celestrak_leo_satellites(
    search: Optional[str] = Query(None, description="Search LEO satellite name"),
    regime: Optional[str] = Query(None, description="Filter by LEO orbital regime"),
    min_alt: Optional[float] = Query(None, ge=100.0, le=2000.0),
    max_alt: Optional[float] = Query(None, ge=100.0, le=2000.0),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
) -> Dict[str, Any]:
    """Retrieve paginated and filtered list of 14,120 CelesTrak Low Earth Orbit (LEO) satellites."""
    satellites, total_matching = dataset_processor.filter_celestrak_leo_satellites(
        search=search,
        regime=regime,
        min_alt=min_alt,
        max_alt=max_alt,
        limit=limit,
        offset=offset
    )
    return {
        "total_leo_satellites": len(dataset_processor.leo_satellites),
        "total_matching": total_matching,
        "offset": offset,
        "limit": limit,
        "satellites": satellites
    }


@router.get("/records")
def get_dataset_records(
    month: Optional[int] = Query(None, ge=1, le=12, description="Filter by month (1-12)"),
    min_humidity: Optional[float] = Query(None, ge=0.0, le=100.0),
    max_humidity: Optional[float] = Query(None, ge=0.0, le=100.0),
    min_visibility: Optional[float] = Query(None, ge=0.0, le=100.0),
    max_visibility: Optional[float] = Query(None, ge=0.0, le=100.0),
    weather_condition: Optional[str] = Query(None),
    has_rain: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
) -> Dict[str, Any]:
    """Retrieve paginated and filtered hourly records from the dataset."""
    records, total_matching = dataset_processor.filter_records(
        month=month,
        min_humidity=min_humidity,
        max_humidity=max_humidity,
        min_visibility=min_visibility,
        max_visibility=max_visibility,
        weather_condition=weather_condition,
        has_rain=has_rain,
        limit=limit,
        offset=offset
    )
    return {
        "total_records": len(dataset_processor.records),
        "total_matching": total_matching,
        "offset": offset,
        "limit": limit,
        "records": records
    }


@router.get("/record/{record_id}")
def get_record(record_id: int) -> Dict[str, Any]:
    """Retrieve single dataset record by 1-indexed ID."""
    rec = dataset_processor.get_record_by_id(record_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Record {record_id} not found in dataset")
    return rec


@router.get("/validation")
def get_dataset_validation() -> Dict[str, Any]:
    """Retrieve validation metrics comparing model outputs across dataset weather regimes."""
    return dataset_processor.get_validation_metrics()


@router.get("/analytics")
def get_dataset_analytics() -> Dict[str, Any]:
    """Retrieve seasonal monthly analytics, 24-hour diurnal atmospheric cycles, and extreme events."""
    return dataset_processor.get_analytics()


@router.get("/joined-pass")
def get_joined_pass(
    record_id: int = Query(1, ge=1, le=8760),
    satellite_norad_id: int = Query(41740)
) -> Dict[str, Any]:
    """
    Combines dataset meteorological observation with Skyfield satellite orbital pass trajectory.
    Synchronizes temporal timestamp (LST -> UTC), computes look angles, slant range,
    and applies dataset atmospheric extinction (Kim model & Olsen rain loss) across the pass.
    """
    rec = dataset_processor.get_record_by_id(record_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Record {record_id} not found")

    sat_str = NORAD_MAP.get(satellite_norad_id, "micius")
    sat_dict = fetch_satellite_tle(sat_str)

    # Station coordinates from NASA POWER Header
    lat = 14.0
    lon = 78.0
    elev_m = 604.05

    # Compute trajectory
    raw_pass = compute_satellite_pass_trajectory(
        line1=sat_dict["line1"],
        line2=sat_dict["line2"],
        name=sat_dict["name"],
        ground_lat=lat,
        ground_lon=lon,
        ground_elevation_m=elev_m,
        min_elevation_deg=10.0,
        duration_minutes=16,
        num_points=25
    )

    pass_trajectory = []
    weather_loss = rec["simulated_atmospheric_loss_db"]

    for pt in raw_pass:
        el = pt["elevation_deg"]
        rng = pt["range_km"]
        los = pt["line_of_sight"]

        if not los:
            pt_loss = 120.0
            pt_qber = 50.0
            pt_skr = 0.0
        else:
            pt_airmass = calculate_atmospheric_airmass(el)
            pt_loss = round(20.0 + 8.0 * (pt_airmass - 1.0) + weather_loss + (rng / 500.0) * 3.0, 2)
            pt_t = 10.0 ** (-pt_loss / 10.0)
            det = calculate_detection_probabilities(
                total_channel_transmittance=pt_t,
                mean_photon_number=0.6,
                detector_efficiency=0.80,
                dark_count_rate=1e-6,
                background_noise=1e-6,
                optical_error_rate=0.015
            )
            pt_qber = round(det["qber"] * 100.0, 2)
            skr_obj = calculate_secure_key_rate(
                qber=det["qber"],
                sifted_key_length=int(10000 * 0.5 * det["p_click"]),
                repetition_rate_hz=1e7,
                p_click=det["p_click"],
                fec_efficiency=1.16
            )
            pt_skr = round(skr_obj["secret_key_rate_bps"], 1)

        pass_trajectory.append({
            "step_index": pt["step_index"],
            "time_offset_min": pt["time_offset_min"],
            "timestamp": pt["timestamp"],
            "elevation_deg": el,
            "azimuth_deg": pt["azimuth_deg"],
            "range_km": rng,
            "channel_loss_db": pt_loss,
            "qber_percent": pt_qber,
            "secret_key_rate": pt_skr,
            "line_of_sight": los,
            "source_geometry": "Skyfield SGP4 Orbit Propagation",
            "source_weather": f"NASA POWER Record #{rec['id']} ({rec['timestamp']})"
        })

    return {
        "dataset_record": rec,
        "satellite": sat_dict,
        "ground_station": {
            "name": "NASA POWER Ground Station (Rayalaseema 14°N, 78°E)",
            "latitude": lat,
            "longitude": lon,
            "elevation_m": elev_m
        },
        "pass_trajectory": pass_trajectory
    }


@router.post("/simulate", response_model=RealisticSimulationResult)
def simulate_from_dataset_record(req: DatasetSimulateRequest) -> RealisticSimulationResult:
    """
    Execute full realistic QKD simulation driven directly by a specific record
    from the NASA POWER meteorological dataset.
    """
    rec = dataset_processor.get_record_by_id(req.record_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Dataset record {req.record_id} not found")

    gs = GroundStationConfig(
        name="NASA POWER Ground Station (Rayalaseema 14°N, 78°E)",
        latitude=14.0,
        longitude=78.0,
        altitude_m=604.05,
        min_elevation_deg=10.0
    )

    weather = WeatherData(
        visibility_km=rec["derived_visibility_km"],
        cloud_cover_percent=rec["derived_cloud_cover_percent"],
        humidity_percent=rec["relative_humidity_percent"],
        temperature_c=rec["temperature_c"],
        precipitation_mm=rec["precipitation_mmh"],
        wind_speed_kmh=round(rec["wind_speed_ms"] * 3.6, 1),
        condition=rec["weather_condition"],
        source=f"NASA POWER MERRA-2 (Record #{rec['id']} - {rec['timestamp']})",
        is_live=False,
        cloud_loss_db=round(rec["derived_cloud_cover_percent"] * 0.035, 2),
        rain_loss_db=round(0.35 * (rec["precipitation_mmh"] ** 0.65) if rec["precipitation_mmh"] > 0 else 0.0, 2),
        humidity_loss_db=round((rec["relative_humidity_percent"] / 100.0) * 0.8, 2),
        total_weather_loss_db=round(rec["simulated_atmospheric_loss_db"], 2)
    )

    params = req.channel_parameters or ChannelParameters()
    params.visibility = rec["derived_visibility_km"]
    params.cn2_ground = rec["derived_cn2_ground"]

    sat_str = NORAD_MAP.get(req.satellite_norad_id, "micius")

    res = run_realistic_quantum_simulation(
        satellite_id=sat_str,
        ground_station=gs,
        custom_params=params,
        use_live_tle=True,
        use_live_weather=False,
        custom_weather=weather
    )

    # Attach dataset reference QBER and comparison delta for validation
    ref_q = rec["simulated_qber_percent"] / 100.0
    res.simulation_result.reference_qber = round(ref_q, 5)
    res.simulation_result.qber_difference = round(abs(res.simulation_result.qber - ref_q), 5)

    return res


@router.get("/export/csv")
def export_dataset_csv():
    """Download comprehensive CSV of NASA POWER dataset observations and validation metrics."""
    output = io.StringIO()
    writer = csv.writer(output)

    meta = dataset_processor.metadata
    writer.writerow(["NASA POWER METEOROLOGICAL DATASET VALIDATION REPORT"])
    writer.writerow(["Dataset File", meta.get("filename", "")])
    writer.writerow(["Source", meta.get("source", "")])
    writer.writerow(["Location", f"{meta.get('latitude')} N, {meta.get('longitude')} E, {meta.get('elevation_m')} m"])
    writer.writerow(["Observations", meta.get("total_records", 8760)])
    writer.writerow([])

    # Metrics
    vm = dataset_processor.get_validation_metrics()["metrics"]
    writer.writerow(["STATISTICAL VALIDATION ERROR METRICS"])
    writer.writerow(["Metric", "MAE", "RMSE", "MAPE (%)", "R2 Score", "Mean Diff", "Relative Error (%)"])
    writer.writerow(["Channel Loss (dB)", vm["loss_mae_db"], vm["loss_rmse_db"], vm["loss_mape_percent"], vm["loss_r2"], vm["loss_mean_diff_db"], vm["loss_rel_error_percent"]])
    writer.writerow(["QBER (%)", vm["qber_mae_percent"], vm["qber_rmse_percent"], vm["qber_mape_percent"], vm["qber_r2"], vm["qber_mean_diff_percent"], vm["qber_rel_error_percent"]])
    writer.writerow(["Secret Key Rate (bps)", vm["skr_mae_bps"], vm["skr_rmse_bps"], vm["skr_mape_percent"], vm["skr_r2"], vm["skr_mean_diff_bps"], vm["skr_rel_error_percent"]])
    writer.writerow([])

    # Records Preview (All 8,760 or sample)
    writer.writerow(["HOURLY OBSERVATIONS & PHYSICAL PROJECTIONS"])
    writer.writerow([
        "ID", "Timestamp (LST)", "Year", "Month", "Day", "Hour",
        "Temp (C)", "DewPoint (C)", "RH (%)", "Pressure (kPa)", "WindSpeed (m/s)", "Precip (mm/h)",
        "Derived Vis (km)", "Cloud (%)", "Cn2 (m^-2/3)", "Weather Condition",
        "Sim Loss (dB)", "Sim QBER (%)", "Sim SKR (bps)", "Security Status"
    ])
    for r in dataset_processor.records:
        writer.writerow([
            r["id"], r["timestamp"], r["year"], r["month"], r["day"], r["hour"],
            r["temperature_c"], r["dew_point_c"], r["relative_humidity_percent"],
            r["surface_pressure_kpa"], r["wind_speed_ms"], r["precipitation_mmh"],
            r["derived_visibility_km"], r["derived_cloud_cover_percent"],
            f"{r['derived_cn2_ground']:.2e}", r["weather_condition"],
            r["simulated_channel_loss_db"], r["simulated_qber_percent"],
            r["simulated_skr_bps"], "SECURE" if r["is_secure"] else "ABORT"
        ])

    csv_data = output.getvalue()
    filename = f"NASA_POWER_Dataset_Validation_2025.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


class MLPredictRequest(BaseModel):
    # CelesTrak LEO Satellite Orbital Features
    satellite_altitude_km: float = 500.0
    elevation_deg: float = 45.0
    slant_range_km: Optional[float] = None
    inclination_deg: float = 97.4
    mean_motion_rev_per_day: float = 15.24
    satellite_name: Optional[str] = "Micius LEO Satellite (NORAD 41740)"
    # NASA POWER Meteorological Features
    temperature_c: float = 25.0
    dew_point_c: float = 16.0
    relative_humidity_percent: float = 58.0
    surface_pressure_kpa: float = 94.5
    wind_speed_ms: float = 3.5
    wind_direction_deg: float = 80.0
    precipitation_mmh: float = 0.0
    hour: int = 14
    month: int = 5
    record_id: Optional[int] = None


@router.get("/ml/status")
def get_ml_status() -> Dict[str, Any]:
    """Retrieve machine learning model training status, test metrics, and multi-source feature importances."""
    if not ml_trainer.is_trained:
        ml_trainer.train_models()
    return ml_trainer.training_summary


@router.post("/ml/train")
def retrain_ml_models() -> Dict[str, Any]:
    """Triggers complete retraining of Random Forest regressors & classifiers on the joined CelesTrak LEO (14,120 satellites) and NASA POWER (8,760 hours) datasets."""
    return ml_trainer.train_models()


@router.post("/ml/predict")
def predict_with_ml(req: MLPredictRequest) -> Dict[str, Any]:
    """Executes multi-source ML model inference (CelesTrak LEO + NASA POWER) and compares against physical model projections."""
    input_dict = req.model_dump()
    if req.record_id:
        rec = dataset_processor.get_record_by_id(req.record_id)
        if rec:
            input_dict.update({
                "temperature_c": rec["temperature_c"],
                "dew_point_c": rec["dew_point_c"],
                "relative_humidity_percent": rec["relative_humidity_percent"],
                "surface_pressure_kpa": rec["surface_pressure_kpa"],
                "wind_speed_ms": rec["wind_speed_ms"],
                "wind_direction_deg": rec["wind_direction_deg"],
                "precipitation_mmh": rec["precipitation_mmh"],
                "hour": rec["hour"],
                "month": rec["month"]
            })

    pred = ml_trainer.predict(input_dict)

    physics_comparison = None
    if req.record_id:
        rec = dataset_processor.get_record_by_id(req.record_id)
        if rec:
            phys_loss = rec["simulated_channel_loss_db"]
            phys_qber = rec["simulated_qber_percent"]
            phys_skr = rec["simulated_skr_bps"]
            physics_comparison = {
                "physics_channel_loss_db": phys_loss,
                "physics_qber_percent": phys_qber,
                "physics_skr_bps": phys_skr,
                "loss_residual_db": round(abs(pred["predicted_channel_loss_db"] - phys_loss), 3),
                "qber_residual_percent": round(abs(pred["predicted_qber_percent"] - phys_qber), 4),
                "skr_residual_bps": round(abs(pred["predicted_skr_bps"] - phys_skr), 1)
            }
    else:
        # Calculate physics model prediction incorporating CelesTrak LEO orbital slant range
        alt = float(input_dict.get("satellite_altitude_km", 500.0))
        el_deg = float(input_dict.get("elevation_deg", 45.0))
        el_rad = math.radians(el_deg)
        earth_r = 6371.0

        if input_dict.get("slant_range_km"):
            d_slant = float(input_dict["slant_range_km"])
        else:
            term = (earth_r * math.sin(el_rad)) ** 2 + 2.0 * earth_r * alt + (alt ** 2)
            d_slant = math.sqrt(max(1.0, term)) - earth_r * math.sin(el_rad)

        geom_loss = 24.20 + 20.0 * math.log10(max(100.0, d_slant) / 500.0)
        airmass = 1.0 / max(0.05, math.sin(el_rad) + 0.00186 * ((el_deg + 3.8) ** -1.253))

        t2m = input_dict.get("temperature_c", 25.0)
        t2mdew = input_dict.get("dew_point_c", 16.0)
        rh2m = input_dict.get("relative_humidity_percent", 58.0)
        precip = input_dict.get("precipitation_mmh", 0.0)
        dew_dep = max(0.0, t2m - t2mdew)

        if dew_dep < 0.5:
            vis = 1.2
        elif dew_dep < 2.0:
            vis = 4.5
        elif dew_dep < 5.0:
            vis = 12.0
        elif dew_dep < 10.0:
            vis = 20.0
        else:
            vis = 30.0

        if precip > 5.0:
            vis = min(vis, 3.0)
        elif precip > 0.1:
            vis = min(vis, 8.0)

        if precip > 0.0:
            cld = min(100.0, 70.0 + precip * 5.0)
        else:
            cld = max(0.0, (rh2m - 20.0) * 0.5)

        q_val = 0.585 * (vis ** (1.0 / 3.0)) if vis < 6.0 else 1.3
        alpha_aer = (3.91 / max(0.1, vis)) * ((550.0 / 1550.0) ** q_val) * 4.343
        alpha_rain = (0.35 * (precip ** 0.65)) if precip > 0.0 else 0.0
        atm_loss = ((alpha_aer * 2.5) + (alpha_rain * 2.0)) * airmass + (cld * 0.035)
        total_loss = geom_loss + atm_loss + 2.10 + 0.71 + 0.97

        transmittance = 10.0 ** (-total_loss / 10.0)
        rep_rate = 1e7
        mu = 0.6
        dark_count = 1e-6
        det_rate = rep_rate * mu * transmittance * 0.80
        qber_sim = max(0.015, min(0.50, (0.015 * det_rate + dark_count * rep_rate * 0.5) / max(1.0, det_rate + dark_count * rep_rate)))

        if qber_sim < 0.11 and total_loss < 46.0:
            h2 = -qber_sim * math.log2(qber_sim) - (1.0 - qber_sim) * math.log2(1.0 - qber_sim)
            skr_sim = max(0.0, 0.5 * det_rate * (1.0 - 2.16 * h2))
        else:
            skr_sim = 0.0

        phys_loss = round(total_loss, 2)
        phys_qber = round(qber_sim * 100.0, 3)
        phys_skr = round(skr_sim, 1)

        physics_comparison = {
            "physics_channel_loss_db": phys_loss,
            "physics_qber_percent": phys_qber,
            "physics_skr_bps": phys_skr,
            "loss_residual_db": round(abs(pred["predicted_channel_loss_db"] - phys_loss), 3),
            "qber_residual_percent": round(abs(pred["predicted_qber_percent"] - phys_qber), 4),
            "skr_residual_bps": round(abs(pred["predicted_skr_bps"] - phys_skr), 1)
        }

    return {
        "inputs": input_dict,
        "prediction": pred,
        "physics_comparison": physics_comparison
    }

