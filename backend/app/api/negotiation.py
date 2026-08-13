"""
Negotiation API — AI negotiation strategy suggestions.
"""
import json
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.utils import get_current_user
from app.services.gemini_service import get_negotiation_suggestion

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/suggest", response_model=schemas.NegotiationResponse)
async def get_suggestion(
    request: schemas.NegotiationRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI negotiation suggestions for a contract question."""
    # Get contract context
    contract = db.query(models.Contract).filter(
        models.Contract.id == request.contract_id,
        models.Contract.user_id == current_user.id,
    ).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    # Get AI suggestions
    result = get_negotiation_suggestion(request.prompt, contract.original_text[:2000])

    suggestions_json = json.dumps(result.get("suggestions", []))

    # Save to DB
    negotiation = models.Negotiation(
        contract_id=request.contract_id,
        user_prompt=request.prompt,
        ai_response=result.get("answer", ""),
        suggestions=suggestions_json,
    )
    db.add(negotiation)
    db.commit()
    db.refresh(negotiation)

    logger.info(f"Negotiation suggestion for contract {request.contract_id}")

    return schemas.NegotiationResponse(
        id=negotiation.id,
        user_prompt=negotiation.user_prompt,
        ai_response=negotiation.ai_response,
        suggestions=result.get("suggestions", []),
        created_at=negotiation.created_at,
    )


@router.get("/history/{contract_id}", response_model=List[schemas.NegotiationResponse])
async def get_negotiation_history(
    contract_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get negotiation history for a contract."""
    contract = db.query(models.Contract).filter(
        models.Contract.id == contract_id,
        models.Contract.user_id == current_user.id,
    ).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    negotiations = (
        db.query(models.Negotiation)
        .filter(models.Negotiation.contract_id == contract_id)
        .order_by(models.Negotiation.created_at.desc())
        .all()
    )

    return [
        schemas.NegotiationResponse(
            id=n.id,
            user_prompt=n.user_prompt,
            ai_response=n.ai_response,
            suggestions=json.loads(n.suggestions) if n.suggestions else [],
            created_at=n.created_at,
        )
        for n in negotiations
    ]
