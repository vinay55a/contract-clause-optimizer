"""
Chatbot API — AI legal assistant chat endpoint.
"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.utils import get_current_user
from app.services.gemini_service import chat_response

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/message", response_model=schemas.ChatResponse)
async def send_message(
    chat_msg: schemas.ChatMessage,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message to the AI legal chatbot."""
    # Get contract context if provided
    contract_context = ""
    if chat_msg.contract_id:
        contract = db.query(models.Contract).filter(
            models.Contract.id == chat_msg.contract_id,
            models.Contract.user_id == current_user.id,
        ).first()
        if contract:
            contract_context = contract.original_text[:2000]

    # Get AI response
    response_text = chat_response(chat_msg.message, contract_context)

    # Save to DB
    history = models.ChatHistory(
        user_id=current_user.id,
        message=chat_msg.message,
        response=response_text,
        context_contract_id=chat_msg.contract_id,
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    logger.info(f"Chat message from user {current_user.id}")
    return history


@router.get("/history", response_model=List[schemas.ChatResponse])
async def get_chat_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
):
    """Get recent chat history for the current user."""
    history = (
        db.query(models.ChatHistory)
        .filter(models.ChatHistory.user_id == current_user.id)
        .order_by(models.ChatHistory.timestamp.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(history))
