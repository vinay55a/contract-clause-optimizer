"""
Analysis API — Run AI analysis on contracts, retrieve results.
"""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.utils import get_current_user
from app.services.clause_detector import detect_clauses
from app.services.optimizer import optimize_all_clauses
from app.services.risk_engine import (
    calculate_clause_risk_score,
    calculate_risk_breakdown,
    get_risk_label,
    get_risk_color,
    generate_risk_flags,
)
from app.services.gemini_service import score_contract_risk, summarize_contract

router = APIRouter()
logger = logging.getLogger(__name__)


def _run_analysis(contract_id: int, db: Session):
    """Core analysis logic — detects clauses, optimizes, scores risk."""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        return

    try:
        # Update status
        contract.status = models.ContractStatus.PARSING
        db.commit()

        # Step 1: Detect clauses
        raw_clauses = detect_clauses(contract.original_text)

        # Step 2: Optimize each clause with AI
        optimized_clauses = optimize_all_clauses(raw_clauses)

        # Step 3: Save clauses to DB (clear existing first)
        db.query(models.Clause).filter(models.Clause.contract_id == contract_id).delete()

        for clause_data in optimized_clauses:
            clause = models.Clause(
                contract_id=contract_id,
                clause_type=clause_data.get("clause_type", "General"),
                clause_text=clause_data.get("clause_text", ""),
                risk_level=clause_data.get("risk_level", "medium"),
                confidence=clause_data.get("confidence", 0.75),
                explanation=clause_data.get("explanation", ""),
                why_risky=clause_data.get("why_risky", ""),
                optimized_text=clause_data.get("optimized_text", ""),
                shorter_version=clause_data.get("shorter_version", ""),
                client_favorable=clause_data.get("client_favorable", ""),
                vendor_favorable=clause_data.get("vendor_favorable", ""),
                negotiation_tip=clause_data.get("negotiation_tip", ""),
            )
            db.add(clause)

        # Step 4: Calculate risk score
        risk_score = calculate_clause_risk_score(optimized_clauses)

        # Update contract
        contract.risk_score = risk_score
        contract.status = models.ContractStatus.ANALYZED
        contract.analyzed_at = datetime.utcnow()
        db.commit()

        logger.info(f"Analysis complete for contract {contract_id}: score={risk_score}")

    except Exception as e:
        logger.error(f"Analysis failed for contract {contract_id}: {e}")
        contract.status = models.ContractStatus.ERROR
        db.commit()


@router.post("/run/{contract_id}")
async def run_analysis(
    contract_id: int,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger AI analysis for a contract."""
    contract = db.query(models.Contract).filter(
        models.Contract.id == contract_id,
        models.Contract.user_id == current_user.id,
    ).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if contract.status == models.ContractStatus.PARSING:
        return {"message": "Analysis already in progress", "contract_id": contract_id}

    # Run analysis (synchronously for simplicity, use background_tasks for async)
    _run_analysis(contract_id, db)
    db.refresh(contract)

    return {
        "message": "Analysis complete",
        "contract_id": contract_id,
        "status": contract.status,
        "risk_score": contract.risk_score,
    }


@router.get("/{contract_id}", response_model=schemas.AnalysisResult)
async def get_analysis(
    contract_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get analysis results for a contract."""
    contract = db.query(models.Contract).filter(
        models.Contract.id == contract_id,
        models.Contract.user_id == current_user.id,
    ).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if contract.status != models.ContractStatus.ANALYZED:
        raise HTTPException(status_code=400, detail=f"Contract not yet analyzed. Status: {contract.status}")

    clauses = db.query(models.Clause).filter(models.Clause.contract_id == contract_id).all()
    clause_dicts = [
        {
            "clause_type": c.clause_type,
            "risk_level": c.risk_level,
            "confidence": c.confidence,
        }
        for c in clauses
    ]

    risk_breakdown = calculate_risk_breakdown(clause_dicts)
    risk_flags = generate_risk_flags(clause_dicts, contract.original_text)

    high_risk = sum(1 for c in clauses if c.risk_level == "high")
    medium_risk = sum(1 for c in clauses if c.risk_level == "medium")
    low_risk = sum(1 for c in clauses if c.risk_level == "low")

    return schemas.AnalysisResult(
        contract_id=contract_id,
        risk_score=contract.risk_score or 50.0,
        risk_breakdown=risk_breakdown,
        clauses=clauses,
        summary=summarize_contract(contract.original_text[:2000]),
        total_clauses=len(clauses),
        high_risk_count=high_risk,
        medium_risk_count=medium_risk,
        low_risk_count=low_risk,
    )


@router.post("/optimize/clause")
async def optimize_clause(
    request: schemas.ClauseOptimizeRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Optimize a single clause on demand."""
    from app.services.gemini_service import analyze_clause
    result = analyze_clause(request.clause_type or "General", request.clause_text)
    return result
