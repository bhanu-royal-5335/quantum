"""
FastAPI Report Generation Router
================================
Provides PDF and CSV academic report downloads.
"""

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
import io

from ..database import get_simulation_result
from ..reports.generator import generate_pdf_report, generate_csv_report

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/pdf/{sim_id}")
def download_pdf_report(sim_id: str):
    """
    Renders and streams the comprehensive 17-section PDF research report.
    """
    sim = get_simulation_result(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation run not found")

    try:
        pdf_bytes = generate_pdf_report(sim=sim)
        filename = f"Quantum_Simulation_Report_{sim_id[:8]}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")


@router.get("/csv/{sim_id}")
def download_csv_report(sim_id: str):
    """
    Renders and streams the CSV numerical dataset for the simulation.
    """
    sim = get_simulation_result(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation run not found")

    try:
        csv_str = generate_csv_report(sim=sim)
        filename = f"Quantum_Simulation_Data_{sim_id[:8]}.csv"
        return Response(
            content=csv_str,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV report: {str(e)}")
