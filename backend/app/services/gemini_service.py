"""
Gemini AI Service Layer — Production-ready integration with fallback mock.

Usage:
  - Set GEMINI_API_KEY in .env for real AI
  - Set USE_MOCK_AI=true for intelligent mock responses (no API key needed)
"""
import os
import json
import logging
import time
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
USE_MOCK_AI = os.getenv("USE_MOCK_AI", "true").lower() == "true"
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds


def _get_gemini_client():
    """Initialize and return Gemini client."""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your-gemini-api-key-here":
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        return genai.GenerativeModel(GEMINI_MODEL)
    except Exception as e:
        logger.warning(f"Failed to initialize Gemini client: {e}")
        return None


def _call_gemini(prompt: str) -> Optional[str]:
    """Call Gemini API with retry logic."""
    model = _get_gemini_client()
    if not model:
        return None

    for attempt in range(MAX_RETRIES):
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.warning(f"Gemini API attempt {attempt + 1} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
    return None


def _extract_json(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks."""
    try:
        # Try direct JSON parse first
        return json.loads(text)
    except Exception:
        pass
    # Try extracting from markdown code blocks
    import re
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass
    return {}


# ─── Prompt Templates ─────────────────────────────────────────────────────────

CLAUSE_EXPLAIN_PROMPT = """
You are an expert legal AI. Analyze the following contract clause and respond ONLY with valid JSON.

Clause Type: {clause_type}
Clause Text: {clause_text}

Respond with this exact JSON structure:
{{
  "explanation": "Plain English explanation of what this clause means",
  "risk_level": "low|medium|high",
  "why_risky": "Explanation of risks, or 'No significant risk' if low",
  "optimized_text": "An improved, balanced version of the clause",
  "shorter_version": "A concise version of the clause",
  "client_favorable": "Version more favorable to the client/buyer",
  "vendor_favorable": "Version more favorable to the vendor/seller",
  "negotiation_tip": "Key negotiation recommendation for this clause"
}}
"""

RISK_SCORE_PROMPT = """
You are a contract risk assessment AI. Analyze this contract and respond ONLY with valid JSON.

Contract Text (first 3000 chars): {contract_text}

Respond with this JSON structure:
{{
  "overall_score": <0-100, where 100 is perfectly balanced and 0 is extremely risky>,
  "summary": "2-3 sentence overall assessment",
  "breakdown": {{
    "liability_balance": <0-20>,
    "termination_rights": <0-20>,
    "payment_terms": <0-20>,
    "confidentiality": <0-20>,
    "dispute_resolution": <0-20>
  }},
  "top_risks": ["risk 1", "risk 2", "risk 3"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}}
"""

NEGOTIATION_PROMPT = """
You are an expert contract negotiation AI assistant. Answer the following question about contract negotiation.

Context Contract: {contract_context}
User Question: {user_prompt}

Respond ONLY with valid JSON:
{{
  "answer": "Detailed answer to the user's question",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "alternative_wording": "If relevant, provide alternative clause wording",
  "risk_impact": "How this affects the overall contract risk"
}}
"""

CHATBOT_PROMPT = """
You are ClauseAI, an expert legal assistant specialized in contract analysis and negotiation.
Be helpful, precise, and explain legal concepts in plain English.

{contract_context}
User: {message}

Respond naturally and helpfully. If asked to rewrite or analyze a clause, do so directly.
"""

CONTRACT_SUMMARY_PROMPT = """
You are a legal AI. Summarize the following contract in plain English.

Contract Text: {contract_text}

Provide:
1. A brief overview (2-3 sentences)
2. Key parties involved
3. Main obligations
4. Important dates/deadlines
5. Top 3 clauses to review carefully
"""


# ─── Mock Responses ───────────────────────────────────────────────────────────

def _mock_clause_analysis(clause_type: str, clause_text: str) -> dict:
    """Intelligent mock clause analysis based on clause type."""
    risk_map = {
        "payment": "medium",
        "termination": "high",
        "liability": "high",
        "confidentiality": "medium",
        "non-compete": "high",
        "indemnity": "high",
        "governing law": "low",
        "arbitration": "medium",
        "force majeure": "low",
        "renewal": "medium",
    }

    risk = risk_map.get(clause_type.lower(), "medium")

    explanations = {
        "payment": "This clause defines when and how payments must be made between the parties.",
        "termination": "This clause outlines the conditions under which either party may end the contract.",
        "liability": "This clause limits or defines the extent of financial responsibility if something goes wrong.",
        "confidentiality": "This clause requires parties to keep certain information private and not disclose it to third parties.",
        "non-compete": "This clause restricts one party from competing with the other during or after the contract.",
        "indemnity": "This clause requires one party to compensate the other for certain losses or damages.",
        "governing law": "This clause specifies which jurisdiction's laws govern the contract.",
        "arbitration": "This clause requires disputes to be resolved through arbitration rather than court proceedings.",
        "force majeure": "This clause excuses performance if extraordinary events beyond control occur.",
        "renewal": "This clause defines how and when the contract can be extended or renewed.",
    }

    why_risky_map = {
        "low": "This clause is generally balanced and poses minimal risk to either party.",
        "medium": "This clause has some one-sided provisions that may need negotiation to ensure fairness.",
        "high": "This clause heavily favors one party and could expose the other to significant financial or legal risk.",
    }

    return {
        "explanation": explanations.get(clause_type.lower(), f"This {clause_type} clause establishes rights and obligations related to {clause_type} between the contracting parties."),
        "risk_level": risk,
        "why_risky": why_risky_map[risk],
        "optimized_text": f"[Optimized] The parties agree that {clause_text[:100]}... [balanced terms apply with mutual protections and reasonable notice periods]",
        "shorter_version": f"[Concise] {clause_text[:80]}...",
        "client_favorable": f"[Client-Favorable] {clause_text[:100]}... [with additional protections for the client, including right to exit with 14 days notice]",
        "vendor_favorable": f"[Vendor-Favorable] {clause_text[:100]}... [with payment protection, limitation of liability, and automatic renewal terms]",
        "negotiation_tip": f"For the {clause_type} clause, negotiate for mutual rights, reasonable timeframes (30-60 days), and cap any liability at the total contract value.",
    }


def _mock_risk_score(contract_text: str) -> dict:
    """Mock risk scoring based on keyword detection."""
    text_lower = contract_text.lower()

    # Keyword-based scoring
    risk_keywords = ["unlimited liability", "automatic renewal", "irrevocable", "no termination", "sole discretion"]
    safe_keywords = ["mutual", "reasonable", "written consent", "30 days notice", "dispute resolution"]

    risk_count = sum(1 for kw in risk_keywords if kw in text_lower)
    safe_count = sum(1 for kw in safe_keywords if kw in text_lower)

    base_score = 65
    score = min(95, max(25, base_score + (safe_count * 5) - (risk_count * 8)))

    return {
        "overall_score": score,
        "summary": f"This contract scores {score}/100 on the health assessment. {'It contains several balanced provisions but has some areas requiring attention.' if score > 60 else 'Several high-risk clauses were detected that require careful negotiation before signing.'}",
        "breakdown": {
            "liability_balance": min(20, 12 + safe_count - risk_count),
            "termination_rights": 14 if "termination" in text_lower else 10,
            "payment_terms": 15 if "payment" in text_lower else 12,
            "confidentiality": 13 if "confidential" in text_lower else 10,
            "dispute_resolution": 13 if "arbitration" in text_lower or "dispute" in text_lower else 8,
        },
        "top_risks": [
            "Automatic renewal clauses may lock you in without adequate notice",
            "Liability caps may not be clearly defined",
            "Confidentiality obligations may be overly broad",
        ],
        "recommendations": [
            "Negotiate a mutual termination right with 30-day notice",
            "Add a clear liability cap equal to total contract value",
            "Ensure confidentiality carve-outs for publicly available information",
        ],
    }


def _mock_negotiation(prompt: str, contract_context: str) -> dict:
    """Mock negotiation response."""
    prompt_lower = prompt.lower()

    if "notice" in prompt_lower:
        answer = "Notice periods of 30-90 days are standard. Longer periods (90+ days) may be excessive and limit flexibility. Request a 30-day written notice period with mutual application."
        suggestions = ["Request reduction to 30 days", "Ensure mutual application to both parties", "Add electronic notice acceptance"]
    elif "payment" in prompt_lower:
        answer = "Payment clauses should specify exact amounts, due dates, late payment interest rates, and acceptable payment methods. Net-30 is standard for B2B contracts."
        suggestions = ["Add late payment penalty clause (1.5% monthly)", "Specify accepted payment methods", "Include milestone-based payment schedule"]
    elif "termination" in prompt_lower:
        answer = "A balanced termination clause should allow both parties to exit with reasonable notice. Include termination for cause (immediate) and termination for convenience (30-90 days)."
        suggestions = ["Add mutual termination for convenience", "Define 'cause' precisely", "Include wind-down obligations after termination"]
    else:
        answer = "Based on the contract analysis, there are several negotiation opportunities. Focus on mutual obligations, clear timelines, and balanced liability provisions to create a fair agreement."
        suggestions = ["Request mutual application of all restrictive clauses", "Add clear dispute resolution with mediation first", "Include annual review clause"]

    return {
        "answer": answer,
        "suggestions": suggestions,
        "alternative_wording": "Either party may terminate this Agreement upon thirty (30) days prior written notice to the other party, without cause. Termination for cause may be immediate upon written notice specifying the breach.",
        "risk_impact": "Addressing these negotiation points could improve the overall contract health score by 15-20 points.",
    }


def _mock_chatbot(message: str) -> str:
    """Mock chatbot response."""
    msg_lower = message.lower()

    if any(kw in msg_lower for kw in ["explain", "what is", "what does", "mean"]):
        return "I'd be happy to explain that! In contract law, this type of clause establishes the rights and obligations of the parties. Key points to understand: (1) the scope of the obligation, (2) the duration it applies, and (3) any exceptions or carve-outs. If you paste the specific clause text, I can give you a detailed plain-English explanation."

    if any(kw in msg_lower for kw in ["risky", "risk", "dangerous"]):
        return "Based on my analysis, the main risk factors to watch for are: **Unlimited liability** clauses, **automatic renewals** without adequate notice, **one-sided termination rights**, and **overly broad confidentiality** obligations. Upload your contract and I'll give you a comprehensive risk assessment!"

    if any(kw in msg_lower for kw in ["improve", "optimize", "better", "rewrite"]):
        return "I can help optimize contract clauses! For the best results, paste the specific clause you want improved. I'll provide: a plain English version, a balanced rewrite, and versions favorable to each party. What clause would you like me to work on?"

    if any(kw in msg_lower for kw in ["negotiat", "strategy", "point"]):
        return "Great negotiation points to focus on: (1) **Notice periods** — aim for 30 days mutual, (2) **Liability caps** — insist on a cap equal to contract value, (3) **IP ownership** — ensure you retain IP created before the contract, (4) **Termination rights** — request mutual termination for convenience. Which area would you like to dive deeper into?"

    if any(kw in msg_lower for kw in ["summar", "overview"]):
        return "To summarize your contract, please upload it using the Upload page first. I'll extract key information including: parties involved, main obligations, payment terms, termination rights, and the top clauses that need your attention before signing."

    return "Hello! I'm **ClauseAI**, your AI-powered contract assistant. I can help you:\n\n• **Explain** legal clauses in plain English\n• **Analyze** contract risks\n• **Optimize** clause wording\n• **Suggest** negotiation strategies\n• **Compare** buyer vs seller-friendly terms\n\nWhat would you like help with today?"


# ─── Public API ───────────────────────────────────────────────────────────────

def analyze_clause(clause_type: str, clause_text: str) -> dict:
    """Analyze a contract clause and return structured results."""
    if not USE_MOCK_AI:
        prompt = CLAUSE_EXPLAIN_PROMPT.format(clause_type=clause_type, clause_text=clause_text)
        response = _call_gemini(prompt)
        if response:
            result = _extract_json(response)
            if result:
                return result

    # Fall back to mock
    return _mock_clause_analysis(clause_type, clause_text)


def score_contract_risk(contract_text: str) -> dict:
    """Generate a risk score for the entire contract."""
    if not USE_MOCK_AI:
        prompt = RISK_SCORE_PROMPT.format(contract_text=contract_text[:3000])
        response = _call_gemini(prompt)
        if response:
            result = _extract_json(response)
            if result:
                return result

    return _mock_risk_score(contract_text)


def get_negotiation_suggestion(prompt: str, contract_context: str = "") -> dict:
    """Generate AI negotiation suggestions."""
    if not USE_MOCK_AI:
        gemini_prompt = NEGOTIATION_PROMPT.format(
            contract_context=contract_context[:2000],
            user_prompt=prompt,
        )
        response = _call_gemini(gemini_prompt)
        if response:
            result = _extract_json(response)
            if result:
                return result

    return _mock_negotiation(prompt, contract_context)


def chat_response(message: str, contract_context: str = "") -> str:
    """Get a chatbot response."""
    if not USE_MOCK_AI:
        context_str = f"Current Contract Context:\n{contract_context[:1500]}\n\n" if contract_context else ""
        prompt = CHATBOT_PROMPT.format(contract_context=context_str, message=message)
        response = _call_gemini(prompt)
        if response:
            return response

    return _mock_chatbot(message)


def summarize_contract(contract_text: str) -> str:
    """Summarize a full contract."""
    if not USE_MOCK_AI:
        prompt = CONTRACT_SUMMARY_PROMPT.format(contract_text=contract_text[:4000])
        response = _call_gemini(prompt)
        if response:
            return response

    return f"""**Contract Summary**

**Overview:** This contract establishes a business relationship between the contracting parties with defined terms for service delivery, payment, and obligations.

**Key Parties:** As specified in the Parties section of the agreement.

**Main Obligations:**
• Service/product delivery as specified
• Timely payment per agreed terms  
• Confidentiality maintenance
• Compliance with applicable laws

**Important Dates:** Review termination notice periods and renewal dates carefully.

**Clauses to Review Carefully:**
1. Liability and indemnification provisions
2. Termination and renewal terms
3. Confidentiality and non-compete obligations

*Upload your contract for a detailed AI-powered analysis.*"""
