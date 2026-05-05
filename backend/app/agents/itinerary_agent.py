"""Itinerary agent — uses Groq LLM to generate a rich, personalised itinerary."""

from app.core.config import GROQ_API_KEY, MODEL
from app.utils.weather_tool import seasonal_advisory

try:
    from groq import Groq
except Exception:
    Groq = None


def _build_itinerary_groq(
    user_input, intent, source, destination, commute, stay,
    attractions, budget, travel_time, preferences
) -> str | None:
    """Call Groq LLM to produce a human-quality itinerary."""
    if not GROQ_API_KEY or Groq is None:
        return None

    weather = seasonal_advisory(destination)

    system_prompt = (
        "You are Horizon Hopper, an expert Tamil Nadu travel planner. "
        "You produce concise, well-structured itineraries that feel personal "
        "and actionable. "
        "IMPORTANT: The 'Nearby Attractions' section below contains VERIFIED data "
        "from a curated local dataset — use ONLY those attractions. Do NOT invent, "
        "add, or substitute any attraction not listed there. "
        "Use the transport, hotel, and attraction data as ground truth, then add "
        "your own reasoning, helpful tips, and time estimates. "
        "Keep the tone warm and professional."
    )

    user_prompt = f"""Create a detailed travel itinerary based on this information:

**Trip:** {source} → {destination}
**Purpose:** {intent.replace('_', ' ').title()}
**Budget:** ₹{budget or 'flexible'}
**Preferred arrival:** {travel_time or 'flexible'}
**Preferences:** {preferences or 'none shared'}

--- Transport Options (from real data) ---
{commute}

--- Stay Options ---
{stay or 'Not requested (one-day trip)'}

--- Nearby Attractions ---
{attractions}

--- Weather Note ---
{weather}

Please produce an itinerary with these sections:
1. **Trip Overview** — one-liner summary
2. **Recommended Transport** — pick the best option and explain why, mention alternatives
3. **Suggested Timeline** — hour-by-hour or block-by-block schedule
4. {"**Where to Stay** — recommend the best option from the list above" if stay else ""}
5. **Must-Visit Spots** — top 3 with brief reasoning
6. **Pro Tips** — 2-3 local insider tips

Keep the response under 400 words.  Do NOT use markdown headers (no # symbols).
Use plain text with numbered sections and bullet points."""

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model=MODEL,
            temperature=0.7,
            max_tokens=800,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return (response.choices[0].message.content or "").strip()
    except Exception as exc:
        print(f"[itinerary_agent] Groq call failed: {exc}")
        return None


def _build_itinerary_static(
    user_input, intent, source, destination, commute, stay,
    attractions, budget, travel_time, preferences
) -> str:
    """Fallback static itinerary when LLM is unavailable."""
    lines = [
        f"Trip type: {intent.replace('_', ' ').title()}",
        f"Route: {source} to {destination}",
        f"Arrival target: {travel_time or 'Flexible'}",
        f"Budget: {budget or 'Not specified'}",
        f"Preferences: {preferences or 'None shared'}",
        "",
        "Recommended commute:",
        commute,
        "",
    ]
    if stay:
        lines.extend([
            "Stay and services:",
            stay,
            ""
        ])
    lines.extend([
        "Nearby attractions:",
        attractions,
        "",
        seasonal_advisory(destination),
        "Carry a 20-30 minute buffer if your schedule is strict.",
    ])
    return "\n".join(lines)


def build_itinerary(
    user_input, intent, source, destination, commute, stay,
    attractions, budget, travel_time, preferences
):
    """Try LLM-powered itinerary first, fall back to static."""
    result = _build_itinerary_groq(
        user_input, intent, source, destination, commute, stay,
        attractions, budget, travel_time, preferences,
    )
    if result:
        return result
    return _build_itinerary_static(
        user_input, intent, source, destination, commute, stay,
        attractions, budget, travel_time, preferences,
    )
