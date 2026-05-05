from app.core.config import INTENT_LABELS
from app.core.config import GROQ_API_KEY, MODEL

try:
    from groq import Groq
except Exception:  # pragma: no cover - optional dependency at runtime
    Groq = None


INTENT_KEYWORDS = {
    "office_commute": ["office", "commute", "work", "shift"],
    "business_trip": ["business", "meeting", "client", "conference"],
    "job_interview": ["interview", "job", "exam", "recruiter"],
    "leisure_trip": ["tour", "trip", "beach", "temple", "weekend", "holiday", "shopping"],
}

_INTENT_SET = set(INTENT_LABELS)


def _detect_intent_rules(user_input: str) -> str:
    text = (user_input or "").lower()
    for label in ["job_interview", "business_trip", "office_commute", "leisure_trip"]:
        if any(keyword in text for keyword in INTENT_KEYWORDS[label]):
            return label
    return INTENT_LABELS[-1]


def _detect_intent_groq(user_input: str) -> str | None:
    if not GROQ_API_KEY or Groq is None:
        return None
    try:
        client = Groq(api_key=GROQ_API_KEY)
        prompt = (
            "Classify this travel request into exactly one label: "
            "office_commute, business_trip, job_interview, leisure_trip. "
            "Return only the label.\n\n"
            f"Input: {user_input}"
        )
        response = client.chat.completions.create(
            model=MODEL,
            temperature=0,
            max_tokens=16,
            messages=[
                {"role": "system", "content": "You are a strict travel intent classifier."},
                {"role": "user", "content": prompt},
            ],
        )
        label = (response.choices[0].message.content or "").strip().lower()
        return label if label in _INTENT_SET else None
    except Exception:
        return None


def detect_intent(user_input: str) -> str:
    return _detect_intent_groq(user_input) or _detect_intent_rules(user_input)
