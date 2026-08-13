"""
Clause Detector Service — Rule-based + AI clause detection and classification.
"""
import re
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

# Clause type patterns (regex-based detection)
CLAUSE_PATTERNS = {
    "Payment": [
        r"payment\s+terms?", r"shall\s+pay", r"invoice", r"fees?\s+and\s+charges?",
        r"compensation", r"remuneration", r"amount\s+due", r"net\s+\d+", r"billing",
    ],
    "Termination": [
        r"termination", r"terminate\s+this\s+agreement", r"cancel", r"expir",
        r"end\s+of\s+term", r"discontinu", r"wind.?down",
    ],
    "Renewal": [
        r"automatic\s+renewal", r"renew", r"extension\s+of\s+term", r"roll.?over",
        r"successive\s+term",
    ],
    "Confidentiality": [
        r"confidential", r"non.?disclosure", r"proprietary\s+information",
        r"trade\s+secret", r"nda", r"disclose",
    ],
    "Non-Compete": [
        r"non.?compete", r"non.?solicitation", r"not\s+to\s+compete",
        r"restriction\s+on\s+competition", r"competing\s+business",
    ],
    "Indemnity": [
        r"indemnif", r"hold\s+harmless", r"defend\s+and\s+indemnify",
        r"indemnification", r"reimburse",
    ],
    "Liability": [
        r"liability", r"limitation\s+of\s+liability", r"liable\s+for",
        r"damages", r"consequential\s+damages", r"cap\s+on\s+liability",
    ],
    "Governing Law": [
        r"governing\s+law", r"jurisdiction", r"choice\s+of\s+law",
        r"laws\s+of\s+the\s+state", r"applicable\s+law",
    ],
    "Arbitration": [
        r"arbitration", r"arbitrator", r"dispute\s+resolution",
        r"mediation", r"binding\s+arbitration", r"adr",
    ],
    "Force Majeure": [
        r"force\s+majeure", r"act\s+of\s+god", r"beyond.*control",
        r"unforeseeable\s+circumstances", r"natural\s+disaster",
    ],
    "Intellectual Property": [
        r"intellectual\s+property", r"ip\s+rights?", r"copyright",
        r"patent", r"trademark", r"ownership\s+of.*works?",
    ],
    "Notice": [
        r"notice\s+period", r"written\s+notice", r"notice\s+shall\s+be",
        r"days.*notice", r"notification",
    ],
}

# Section splitters
SECTION_MARKERS = [
    r"(?:^|\n)(?:\d+\.|\b[A-Z][A-Z\s]{3,}\b)(?:\s*[:.-])",
    r"\n(?=WHEREAS|NOW,\s*THEREFORE|IN\s*WITNESS)",
    r"\n(?=[A-Z]{2,}(?:\s[A-Z]{2,})*\s*\n)",
]


def split_into_sections(text: str) -> List[Dict[str, str]]:
    """Split contract text into sections."""
    # Split on double newlines or section markers
    sections = re.split(r"\n{2,}", text)
    result = []
    current_section = []
    
    for section in sections:
        section = section.strip()
        if not section:
            continue
        
        # Check if this looks like a section header
        lines = section.split("\n")
        first_line = lines[0].strip()
        
        # Merge short sections into previous
        if len(section.split()) < 5 and current_section:
            current_section.append(section)
        else:
            if current_section:
                result.append({
                    "text": "\n\n".join(current_section),
                    "header": current_section[0].split("\n")[0][:100],
                })
            current_section = [section]
    
    if current_section:
        result.append({
            "text": "\n\n".join(current_section),
            "header": current_section[0].split("\n")[0][:100],
        })
    
    return result


def detect_clause_type(text: str) -> tuple[str, float]:
    """
    Detect the clause type from text using pattern matching.
    Returns (clause_type, confidence_score).
    """
    text_lower = text.lower()
    scores = {}
    
    for clause_type, patterns in CLAUSE_PATTERNS.items():
        match_count = sum(1 for p in patterns if re.search(p, text_lower))
        if match_count > 0:
            confidence = min(0.99, 0.60 + (match_count * 0.08))
            scores[clause_type] = confidence
    
    if not scores:
        return "General", 0.50
    
    best_type = max(scores, key=scores.get)
    return best_type, scores[best_type]


def detect_clauses(contract_text: str) -> List[Dict]:
    """
    Detect and classify all clauses in a contract.
    Returns list of clause dicts with type, text, and confidence.
    """
    sections = split_into_sections(contract_text)
    detected_clauses = []
    seen_types = set()
    
    for section in sections:
        text = section["text"]
        
        # Skip very short or header-only sections
        if len(text.split()) < 15:
            continue
        
        clause_type, confidence = detect_clause_type(text)
        
        # Deduplicate (keep highest confidence version)
        existing = next((c for c in detected_clauses if c["clause_type"] == clause_type), None)
        if existing:
            if confidence > existing["confidence"]:
                existing["clause_text"] = text[:2000]
                existing["confidence"] = confidence
        else:
            detected_clauses.append({
                "clause_type": clause_type,
                "clause_text": text[:2000],
                "confidence": round(confidence, 2),
            })
    
    # Ensure we have at least some clauses
    if not detected_clauses and contract_text.strip():
        # Fall back to chunking
        words = contract_text.split()
        chunk_size = 150
        for i in range(0, min(len(words), 1500), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            clause_type, confidence = detect_clause_type(chunk)
            detected_clauses.append({
                "clause_type": clause_type,
                "clause_text": chunk,
                "confidence": round(confidence, 2),
            })
    
    return detected_clauses[:20]  # Max 20 clauses per contract
