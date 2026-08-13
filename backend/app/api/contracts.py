"""
Contracts API — Upload, list, retrieve, delete contracts.
"""
import os
import uuid
import logging
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.utils import get_current_user
from app.services.contract_parser import parse_contract_file, parse_contract_text

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", "20")) * 1024 * 1024  # bytes
ALLOWED_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"}


@router.post("/upload", response_model=schemas.ContractOut, status_code=status.HTTP_201_CREATED)
async def upload_contract(
    file: Optional[UploadFile] = File(None),
    title: str = Form(...),
    raw_text: Optional[str] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a contract file (PDF/DOCX) or paste raw text."""
    extracted_text = ""
    file_name = None
    file_path_str = None
    word_count = 0
    page_count = 1

    if file and file.filename:
        # Validate file size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File too large. Max {os.getenv('MAX_FILE_SIZE_MB', 20)}MB")

        # Save file
        ext = os.path.splitext(file.filename)[1].lower()
        safe_name = f"{uuid.uuid4().hex}{ext}"
        file_path_str = os.path.join(UPLOAD_DIR, safe_name)

        os.makedirs(UPLOAD_DIR, exist_ok=True)
        with open(file_path_str, "wb") as f:
            f.write(contents)

        # Parse
        result = parse_contract_file(file_path_str, file.content_type or "")
        if result["error"]:
            raise HTTPException(status_code=400, detail=f"Could not parse file: {result['error']}")

        extracted_text = result["text"]
        file_name = file.filename
        word_count = result["word_count"]
        page_count = result["page_count"]

    elif raw_text and raw_text.strip():
        result = parse_contract_text(raw_text)
        extracted_text = result["text"]
        word_count = result["word_count"]
        page_count = result["page_count"]
    else:
        raise HTTPException(status_code=400, detail="Please upload a file or paste contract text")

    # Create DB record
    contract = models.Contract(
        user_id=current_user.id,
        title=title,
        file_name=file_name,
        file_path=file_path_str,
        original_text=extracted_text,
        word_count=word_count,
        page_count=page_count,
        status=models.ContractStatus.UPLOADED,
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)

    logger.info(f"Contract uploaded: id={contract.id} by user={current_user.id}")
    return contract


@router.get("", response_model=List[schemas.ContractOut])
async def list_contracts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
):
    """List all contracts for the current user."""
    contracts = (
        db.query(models.Contract)
        .filter(models.Contract.user_id == current_user.id)
        .order_by(models.Contract.uploaded_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return contracts


@router.get("/{contract_id}", response_model=schemas.ContractDetail)
async def get_contract(
    contract_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific contract with its clauses."""
    contract = db.query(models.Contract).filter(
        models.Contract.id == contract_id,
        models.Contract.user_id == current_user.id,
    ).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    return contract


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contract(
    contract_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a contract and its associated data."""
    contract = db.query(models.Contract).filter(
        models.Contract.id == contract_id,
        models.Contract.user_id == current_user.id,
    ).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    # Delete uploaded file if exists
    if contract.file_path and os.path.exists(contract.file_path):
        try:
            os.remove(contract.file_path)
        except Exception:
            pass

    db.delete(contract)
    db.commit()
    logger.info(f"Contract deleted: id={contract_id}")
