"""
Optimizer Service — Clause optimization orchestration.
"""
import logging
from typing import List, Dict

from app.services import gemini_service

logger = logging.getLogger(__name__)


def optimize_single_clause(clause_type: str, clause_text: str) -> Dict:
    """Optimize a single clause using AI analysis."""
    return gemini_service.analyze_clause(clause_type, clause_text)


def optimize_all_clauses(clauses: List[Dict]) -> List[Dict]:
    """Optimize all detected clauses in a contract."""
    optimized = []
    for clause in clauses:
        analysis = gemini_service.analyze_clause(
            clause.get("clause_type", "General"),
            clause.get("clause_text", ""),
        )
        optimized.append({
            **clause,
            "risk_level": analysis.get("risk_level", "medium"),
            "explanation": analysis.get("explanation", ""),
            "why_risky": analysis.get("why_risky", ""),
            "optimized_text": analysis.get("optimized_text", ""),
            "shorter_version": analysis.get("shorter_version", ""),
            "client_favorable": analysis.get("client_favorable", ""),
            "vendor_favorable": analysis.get("vendor_favorable", ""),
            "negotiation_tip": analysis.get("negotiation_tip", ""),
        })
    return optimized
