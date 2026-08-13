"""
Pydantic schemas for request/response validation.
"""
import re
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator


# ─── Auth Schemas ────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError("Invalid email address")
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar_color: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ─── Contract Schemas ─────────────────────────────────────────────────────────

class ContractOut(BaseModel):
    id: int
    title: str
    file_name: Optional[str]
    word_count: int
    page_count: int
    status: str
    risk_score: Optional[float]
    uploaded_at: datetime
    analyzed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ContractDetail(ContractOut):
    original_text: str
    clauses: List["ClauseOut"] = []


# ─── Clause Schemas ───────────────────────────────────────────────────────────

class ClauseOut(BaseModel):
    id: int
    clause_type: str
    clause_text: str
    risk_level: str
    confidence: float
    explanation: Optional[str]
    why_risky: Optional[str]
    optimized_text: Optional[str]
    shorter_version: Optional[str]
    client_favorable: Optional[str]
    vendor_favorable: Optional[str]
    negotiation_tip: Optional[str]

    class Config:
        from_attributes = True


class ClauseOptimizeRequest(BaseModel):
    clause_text: str
    clause_type: Optional[str] = "general"
    context: Optional[str] = None


# ─── Analysis Schemas ─────────────────────────────────────────────────────────

class AnalysisResult(BaseModel):
    contract_id: int
    risk_score: float
    risk_breakdown: dict
    clauses: List[ClauseOut]
    summary: str
    total_clauses: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int


# ─── Chat Schemas ─────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str
    contract_id: Optional[int] = None


class ChatResponse(BaseModel):
    id: int
    message: str
    response: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ─── Negotiation Schemas ──────────────────────────────────────────────────────

class NegotiationRequest(BaseModel):
    contract_id: int
    prompt: str


class NegotiationResponse(BaseModel):
    id: int
    user_prompt: str
    ai_response: str
    suggestions: Optional[List[str]] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Export Schemas ───────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    contract_id: int
    format: str = "pdf"  # pdf | docx


# Resolve forward references
ContractDetail.model_rebuild()
