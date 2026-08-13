"""
SQLAlchemy ORM Models — Database table definitions.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Float,
    ForeignKey, Enum, Boolean
)
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ContractStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PARSING = "parsing"
    ANALYZED = "analyzed"
    ERROR = "error"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar_color = Column(String(10), default="#2563EB")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    contracts = relationship("Contract", back_populates="user", cascade="all, delete-orphan")
    chat_history = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    file_name = Column(String(500), nullable=True)
    file_path = Column(String(1000), nullable=True)
    original_text = Column(Text, nullable=False)
    word_count = Column(Integer, default=0)
    page_count = Column(Integer, default=1)
    status = Column(String(50), default=ContractStatus.UPLOADED)
    risk_score = Column(Float, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    analyzed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="contracts")
    clauses = relationship("Clause", back_populates="contract", cascade="all, delete-orphan")
    negotiations = relationship("Negotiation", back_populates="contract", cascade="all, delete-orphan")


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    clause_type = Column(String(100), nullable=False)
    clause_text = Column(Text, nullable=False)
    risk_level = Column(String(20), default=RiskLevel.LOW)
    confidence = Column(Float, default=0.85)
    explanation = Column(Text, nullable=True)
    why_risky = Column(Text, nullable=True)
    optimized_text = Column(Text, nullable=True)
    shorter_version = Column(Text, nullable=True)
    client_favorable = Column(Text, nullable=True)
    vendor_favorable = Column(Text, nullable=True)
    negotiation_tip = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    contract = relationship("Contract", back_populates="clauses")


class Negotiation(Base):
    __tablename__ = "negotiations"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    user_prompt = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    suggestions = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    contract = relationship("Contract", back_populates="negotiations")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    context_contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="chat_history")
