from app.core.config import INTENT_LABELS


INTENT_KEYWORDS = {
    "office_commute": ["office", "commute", "work", "shift"],
    "business_trip": ["business", "meeting", "client", "conference"],
    "job_interview": ["interview", "job", "exam", "recruiter"],
    "leisure_trip": ["tour", "trip", "beach", "temple", "weekend", "holiday", "shopping"],
}


def detect_intent(user_input: str) -> str:
    text = (user_input or "").lower()
    for label in ["job_interview", "business_trip", "office_commute", "leisure_trip"]:
        if any(keyword in text for keyword in INTENT_KEYWORDS[label]):
            return label
    return INTENT_LABELS[-1]
