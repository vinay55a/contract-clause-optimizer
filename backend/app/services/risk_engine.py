"""
Risk Engine — Contract risk scoring and health assessment.
"""
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

# Risk weights for clause types
CLAUSE_RISK_WEIGHTS = {
    "Liability": 20,
    "Termination": 20,
    "Indemnity": 18,
    "Non-Compete": 16,
    "Payment": 15,
    "Confidentiality": 12,
    "Arbitration": 10,
    "Renewal": 10,
    "Governing Law": 8,
    "Force Majeure": 7,
    "Intellectual Property": 15,
    "Notice": 8,
    "General": 5,
}

RISK_LEVEL_SCORES = {
    "low": 1.0,
    "medium": 0.6,
    "high": 0.2,
}


def calculate_clause_risk_score(clauses: List[Dict]) -> float:
    """
    Calculate risk score (0-100) from analyzed clauses.
    Higher score = healthier/lower risk contract.
    """
    if not clauses:
        return 50.0

    total_weight = 0
    weighted_score = 0

    for clause in clauses:
        clause_type = clause.get("clause_type", "General")
        risk_level = clause.get("risk_level", "medium").lower()
        weight = CLAUSE_RISK_WEIGHTS.get(clause_type, 5)
        score = RISK_LEVEL_SCORES.get(risk_level, 0.6)

        total_weight += weight
        weighted_score += weight * score

    if total_weight == 0:
        return 50.0

    raw_score = (weighted_score / total_weight) * 100
    return round(min(100.0, max(10.0, raw_score)), 1)


def calculate_risk_breakdown(clauses: List[Dict]) -> Dict:
    """Calculate per-category risk breakdown."""
    categories = {
        "liability_balance": {"types": ["Liability", "Indemnity"], "max": 20},
        "termination_rights": {"types": ["Termination", "Notice"], "max": 20},
        "payment_terms": {"types": ["Payment"], "max": 20},
        "confidentiality": {"types": ["Confidentiality", "Non-Compete", "Intellectual Property"], "max": 20},
        "dispute_resolution": {"types": ["Arbitration", "Governing Law", "Force Majeure"], "max": 20},
    }

    breakdown = {}

    for category, config in categories.items():
        relevant = [c for c in clauses if c.get("clause_type") in config["types"]]

        if not relevant:
            breakdown[category] = config["max"] * 0.6  # Default to moderate
        else:
            avg_score = sum(
                RISK_LEVEL_SCORES.get(c.get("risk_level", "medium").lower(), 0.6)
                for c in relevant
            ) / len(relevant)
            breakdown[category] = round(config["max"] * avg_score, 1)

    return breakdown


def get_risk_label(score: float) -> str:
    """Get human-readable risk label."""
    if score >= 75:
        return "Low Risk"
    elif score >= 50:
        return "Moderate Risk"
    elif score >= 30:
        return "High Risk"
    else:
        return "Critical Risk"


def get_risk_color(score: float) -> str:
    """Get color code for risk score."""
    if score >= 75:
        return "#10B981"  # Green
    elif score >= 50:
        return "#F59E0B"  # Amber
    elif score >= 30:
        return "#EF4444"  # Red
    else:
        return "#7F1D1D"  # Dark red


def generate_risk_flags(clauses: List[Dict], contract_text: str = "") -> List[str]:
    """Generate list of risk flags for the contract."""
    flags = []
    text_lower = contract_text.lower()

    high_risk = [c for c in clauses if c.get("risk_level") == "high"]
    if len(high_risk) > 2:
        flags.append(f"{len(high_risk)} high-risk clauses detected requiring immediate attention")

    if "automatic renewal" in text_lower or "auto-renew" in text_lower:
        flags.append("Automatic renewal clause detected — may lock you in without adequate notice")

    if "unlimited liability" in text_lower:
        flags.append("Unlimited liability exposure detected — negotiate a liability cap")

    if "sole discretion" in text_lower:
        flags.append("'Sole discretion' language detected — request mutual agreement requirements")

    liability_clauses = [c for c in clauses if c.get("clause_type") == "Liability"]
    if not liability_clauses:
        flags.append("No clear liability limitation found — missing liability cap is a significant risk")

    arbitration_clauses = [c for c in clauses if c.get("clause_type") in ["Arbitration", "Governing Law"]]
    if not arbitration_clauses:
        flags.append("No dispute resolution mechanism specified — add arbitration or mediation clause")

    if "irrevocable" in text_lower:
        flags.append("Irrevocable rights granted — ensure this aligns with your business needs")

    return flags[:8]  # Max 8 flags
