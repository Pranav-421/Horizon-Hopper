"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlannerResponse, ServiceMode } from "@/lib/types";
import { clearSession, readSession } from "@/lib/session";
import { TravelMap } from "@/components/travel-map";

/* ─── Stitch destination images ─── */
/* map frontend purpose → backend-friendly purpose string */
const PURPOSE_MAP: Record<string, string> = {
  leisure: "Leisure / Tourism",
  business: "Business Meeting",
  commute: "Office Commute",
  interview: "Job Interview",
};

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBSxEl1dNwGtsbq49uVkNqUnWzpnp6y9n9TOAwe3S0RKOSNluSCscUqOIMjVDQH2-8K2A8aXRkcho-eqv8k4e0QjCbbcE-L4ntW51xnQnCiByEv_NPGqMIDJq5PCQrLO-VErrzhy6sR4iY-wr_Ba2QZY0l3XRmVaAQuFg3sFueRUX_wPP07IPEgbf6XrZJqswUH5yMOXT5YCBbOvT_yvUlf11ZgTE9l_VaaXLqVFP9TsVmcfBt8qR2GQhu9_kCWlkLiNXzy_G0SWrgg";
const COAST_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCXbqH6F4SY8LWc3mjUDz_iL3e9hAb3xdJa6fraygZmOj8VT3GYbRZzhEGFOzlxF-vaKYHhrKTksErf16_oSdh7plE92Vyz_-yyiWI8k8OK4dQjQkl6O4dry-ra6eGx7rpYyd6EPvmfURLCIPMlrO104NPZGKcxzj-rJMSLHi5Y_4Z11lJ6NqH2yYgMshM1hlU1OmMXVmWJVycKs6KBkzrcFPROLMc9Xdz8S8Ah6vgNy5OI-ZLxT0jZ_8tcntMY0KU1Zaw7Dcsxy_Bg";

const TN_CITIES = [
  "Select a city...", "Chennai", "Chengalpattu", "Mahabalipuram", "Kanchipuram", "Coimbatore",
  "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur",
  "Vellore", "Erode", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet",
  "Karur", "Ooty", "Kodaikanal", "Kanyakumari", "Rameswaram", "Tiruvannamalai"
];

const TN_IMAGES = [
  "/assets/tn_kanyakumari_1775842503202.png",
  "/assets/tn_nilgiris_1775842577463.png",
  "/assets/tn_shore_temple_1775842523313.png",
  "/assets/tn_tea_estate_1775842468607.png",
  "/assets/tn_temple_1775842404019.png",
  "/assets/tn_waterfall_1775842541471.png",
  "/assets/tn_kanyakumari_1775842503202.png",
  "/assets/tn_shore_temple_1775842523313.png"
];

/* ═══════════════════════════════════════ */
/*  PLANNER DASHBOARD                     */
/* ═══════════════════════════════════════ */

export function PlannerDashboard() {
  const router = useRouter();
  const session = useMemo(() => readSession(), []);
  const resultRef = useRef<HTMLDivElement>(null);

  /* ── redirect if no session ── */
  useEffect(() => {
    if (!session) router.replace("/");
  }, [session, router]);

  /* ── state ── */
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("Chennai, Tamil Nadu");
  const [purpose, setPurpose] = useState("leisure");
  const [budget, setBudget] = useState("5000");
  const [travelTime, setTravelTime] = useState("");
  const [preferences, setPreferences] = useState("");
  const [planning, setPlanning] = useState(false);
  const [result, setResult] = useState<PlannerResponse | null>(null);

  /* feedback */
  const [feedbackText, setFeedbackText] = useState("");
  const [refining, setRefining] = useState(false);
  const [satisfied, setSatisfied] = useState<boolean | null>(null);

  const serviceMode: ServiceMode = session?.serviceMode ?? "full_package";
  const userId = session?.user?.id ?? "guest";

  /* ── plan trip ── */
  const handlePlan = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPlanning(true);
      setResult(null);
      try {
        const res = await fetch("/api/trips/plan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            source,
            destination,
            purpose: PURPOSE_MAP[purpose] ?? purpose,
            budget,
            travel_time: travelTime,
            preferences,
            service_mode: serviceMode,
          }),
        });
        const data: PlannerResponse = await res.json();
        setResult(data);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
      } catch {
        alert("Failed to generate plan. Ensure the backend is running.");
      } finally {
        setPlanning(false);
      }
    },
    [userId, source, destination, purpose, budget, travelTime, preferences, serviceMode],
  );

  /* ── refine ── */
  const handleRefine = useCallback(async () => {
    if (!result || !feedbackText.trim()) return;
    setRefining(true);
    try {
      const res = await fetch("/api/trips/refine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          result: result.agent_result,
          feedback: feedbackText,
          trip_context: result.trip_context,
          service_mode: serviceMode,
        }),
      });
      const data: PlannerResponse = await res.json();
      setResult(data);
      setFeedbackText("");
    } catch {
      alert("Refinement failed.");
    } finally {
      setRefining(false);
    }
  }, [result, feedbackText, serviceMode]);

  /* ── save feedback ── */
  const handleSaveFeedback = useCallback(
    async (isSatisfied: boolean) => {
      setSatisfied(isSatisfied);
      try {
        await fetch(`/api/users/${userId}/feedback`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            feedback: feedbackText || (isSatisfied ? "Great trip!" : "Needs improvement"),
            section: "general",
            satisfied: isSatisfied,
          }),
        });
      } catch {
        /* silent */
      }
    },
    [userId, feedbackText],
  );

  /* ── logout ── */
  const handleLogout = useCallback(() => {
    clearSession();
    router.replace("/");
  }, [router]);

  if (!session) return null;

  return (
    <div style={S.pageWrapper}>
      {/* ── FILM ROLL LEFT ── */}
      <div style={{ ...S.filmRollContainer, left: 0 }}>
        <div style={{ ...S.filmRollInner, animation: "scrollUp 40s linear infinite" }}>
          {[...TN_IMAGES, ...TN_IMAGES].map((img, i) => (
            <div key={`l-${i}`} style={S.filmFrame}>
              <img src={img} alt="" style={S.filmImage} />
            </div>
          ))}
        </div>
      </div>

      {/* ── FILM ROLL RIGHT ── */}
      <div style={{ ...S.filmRollContainer, right: 0 }}>
        <div style={{ ...S.filmRollInner, animation: "scrollDown 40s linear infinite" }}>
          {[...TN_IMAGES, ...TN_IMAGES].reverse().map((img, i) => (
            <div key={`r-${i}`} style={S.filmFrame}>
              <img src={img} alt="" style={S.filmImage} />
            </div>
          ))}
        </div>
      </div>

      <div style={S.page}>
        {/* ── HEADER ── */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.headerLeft}>
            <span style={S.logo}>Horizon Hopper</span>
            <nav style={S.nav}>
              <span style={{ ...S.navItem, borderBottom: "2px solid var(--primary)", paddingBottom: 4 }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Trips</span>
              <span style={S.navItem} onClick={() => router.push("/profile")}>Profile</span>

            </nav>
          </div>
          <div style={S.headerRight}>
            <div style={S.userPill}>
              <div style={S.avatar}>{session.user.avatar}</div>
              <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{session.user.name}</span>
            </div>
            <button style={S.logoutBtn} onClick={handleLogout}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            </button>
          </div>
        </div>
      </header>

      <main style={S.main}>
        <div style={S.container}>
          {/* ── HERO ── */}
          <div style={S.heroWrap} className="animate-fade-in">
            <span style={S.heroLabel}>
              {serviceMode === "travel_only" ? "One Day Trip" : "Full Package"} · Travel Designer
            </span>
            <h1 style={S.heroTitle}>Chart Your Course</h1>
            <p style={S.heroSub}>
              Personalized itineraries for the discerning wayfarer. Explore
              Chennai&apos;s heritage or Chengalpattu&apos;s serene landscapes.
            </p>
          </div>

          {/* ── FORM ── */}
          <form onSubmit={handlePlan} style={S.formCard} className="animate-slide-up">
            {/* Location grid */}
            <div style={S.formGrid2}>
              <div>
                <label style={S.fieldLabel}>Departure Point</label>
                <div style={S.inputWrap}>
                  <span className="material-symbols-outlined" style={S.inputIcon}>my_location</span>
                  <select
                    style={{ ...S.inputField, cursor: "pointer", appearance: "none" as const }}
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    required
                  >
                    {TN_CITIES.map((city) => (
                      <option key={city} value={city} disabled={city.includes("Select")}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={S.fieldLabel}>Destination</label>
                <div style={S.inputWrap}>
                  <span className="material-symbols-outlined" style={S.inputIcon}>map</span>
                  <select
                    style={{ ...S.inputField, cursor: "pointer", appearance: "none" as const }}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    {TN_CITIES.map((city) => (
                      <option key={city} value={city} disabled={city.includes("Select")}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Purpose + Time */}
            <div style={S.formGrid2}>
              <div>
                <label style={S.fieldLabel}>Nature of Trip</label>
                <div style={{ display: "flex", gap: 16 }}>
                  {(["leisure", "business", "commute", "interview"] as const).map((p) => (
                    <label
                      key={p}
                      style={{
                        ...S.purposeChip,
                        borderColor: purpose === p ? "var(--primary)" : "transparent",
                        background: purpose === p ? "#fff" : "var(--surface-container)",
                        color: purpose === p ? "var(--primary)" : "var(--secondary)",
                      }}
                    >
                      <input
                        type="radio"
                        name="purpose"
                        value={p}
                        checked={purpose === p}
                        onChange={() => setPurpose(p)}
                        style={{ display: "none" }}
                      />
                      <span className="material-symbols-outlined" style={{ fontSize: 22, marginBottom: 4 }}>
                        {p === "leisure" ? "beach_access" : p === "business" ? "work" : p === "commute" ? "directions_bus" : "badge"}
                      </span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {p}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.fieldLabel}>Preferred Arrival</label>
                <div style={{ ...S.inputWrap, height: 92 }}>
                  <span className="material-symbols-outlined" style={S.inputIcon}>schedule</span>
                  <input
                    type="time"
                    style={S.inputField}
                    value={travelTime}
                    onChange={(e) => setTravelTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Budget */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                <label style={S.fieldLabel}>Estimated Budget</label>
                <span style={{ color: "var(--primary)", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
                  ₹{Number(budget).toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                style={S.rangeInput}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={S.rangeLabel}>Economy</span>
                <span style={S.rangeLabel}>Luxury</span>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <label style={S.fieldLabel}>Travel Preferences</label>
              <div style={S.textareaWrap}>
                <textarea
                  style={S.textarea}
                  rows={4}
                  placeholder="Tell us about your interests (e.g., temples, food, coastal drives...)"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={planning}
              style={{ ...S.submitBtn, opacity: planning ? 0.7 : 1 }}
            >
              {planning ? (
                <>
                  <span className="animate-pulse-soft">Crafting your plan…</span>
                </>
              ) : (
                <>
                  Generate My Plan
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_awesome</span>
                </>
              )}
            </button>
          </form>

          {/* ── Inspiration Cards ── */}
          {!result && (
            <div style={S.inspGrid}>
              <div style={S.inspBig}>
                <img src={COAST_IMG} alt="Chennai Coast" style={S.inspImg} />
                <div style={S.inspGradient} />
                <div style={S.inspText}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", opacity: 0.7 }}>
                    Chennai Coastal
                  </span>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginTop: 8, color: "#fff" }}>
                    The Gateway of South India
                  </h3>
                </div>
              </div>
              <div style={S.inspSide}>
                <div style={S.inspInfoCard}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--primary)", opacity: 0.3, marginBottom: 16 }}>
                    history_edu
                  </span>
                  <h4 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)", marginBottom: 8, letterSpacing: "-0.02em" }}>
                    Cultural Heritage
                  </h4>
                  <p style={{ color: "var(--secondary)", fontWeight: 500, lineHeight: 1.6, opacity: 0.8, fontSize: "0.9rem" }}>
                    Discover the ancient stone carvings and lake views of
                    Chengalpattu, a serene escape from the urban pulse.
                  </p>
                </div>
                <div style={S.inspDarkCard}>
                  <div style={{ position: "relative", zIndex: 10 }}>
                    <h4 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>
                      Instant Itinerary
                    </h4>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500, marginBottom: 24, lineHeight: 1.6, fontSize: "0.9rem" }}>
                      Our AI generates transport, dining, and stay
                      recommendations in under 5 seconds.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════ */}
          {/*  RESULTS                               */}
          {/* ══════════════════════════════════════ */}
          {result && (
            <div ref={resultRef} style={{ display: "flex", flexDirection: "column", gap: 48, marginTop: 48 }} className="stagger-children">
              {/* ── Hero Banner ── */}
              <div style={S.resultHero}>
                <img src={HERO_IMG} alt="Destination" style={S.resultHeroImg} />
                <div style={S.resultHeroGradient} />
                <div style={S.resultHeroContent}>
                  <span style={S.resultHeroTag}>
                    Intent: {result.intent.replace(/_/g, " ")}
                  </span>
                  <h1 style={S.resultHeroTitle}>
                    {result.trip_context.destination.split(",")[0].toUpperCase()}{" "}
                    <span style={{ opacity: 0.4 }}>&amp;</span> BEYOND
                  </h1>
                  <p style={S.resultHeroSub}>
                    A curated journey from {result.trip_context.source} to{" "}
                    {result.trip_context.destination}.
                  </p>
                </div>
              </div>

              {/* ── Location Info ── */}
              {result.location_info && (
                <div style={S.locationInfoGrid}>
                  {result.location_info.approximate_distance_km && (
                    <div style={S.locationInfoItem}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--primary)", opacity: 0.5 }}>straighten</span>
                      <div>
                        <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)" }}>{result.location_info.approximate_distance_km} km</p>
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--secondary)", marginTop: 2 }}>Distance</p>
                      </div>
                    </div>
                  )}
                  {result.location_info.estimated_drive_time_mins && (
                    <div style={S.locationInfoItem}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--primary)", opacity: 0.5 }}>schedule</span>
                      <div>
                        <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)" }}>{result.location_info.estimated_drive_time_mins} min</p>
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--secondary)", marginTop: 2 }}>Drive Time</p>
                      </div>
                    </div>
                  )}
                  {result.location_info.nearest_metro_source && result.location_info.nearest_metro_source !== "NA" && (
                    <div style={S.locationInfoItem}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--primary)", opacity: 0.5 }}>subway</span>
                      <div>
                        <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--primary)" }}>{result.location_info.nearest_metro_source}</p>
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--secondary)", marginTop: 2 }}>Nearest Metro (Source)</p>
                      </div>
                    </div>
                  )}
                  {result.location_info.nearest_metro_destination && result.location_info.nearest_metro_destination !== "NA" && (
                    <div style={S.locationInfoItem}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--primary)", opacity: 0.5 }}>subway</span>
                      <div>
                        <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--primary)" }}>{result.location_info.nearest_metro_destination}</p>
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--secondary)", marginTop: 2 }}>Nearest Metro (Dest)</p>
                      </div>
                    </div>
                  )}
                  {result.location_info.travel_notes && (
                    <div style={{ ...S.locationInfoItem, gridColumn: "1 / -1" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--primary)", opacity: 0.5 }}>info</span>
                      <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--on-surface-variant)", lineHeight: 1.6 }}>{result.location_info.travel_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Map ── */}
              <div>
                <h3 style={S.sectionTitle}>Route Map</h3>
                <div style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid rgba(10,25,49,0.06)" }}>
                  <TravelMap map={result.map} />
                </div>
              </div>

              {/* ── Commute ── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <h3 style={S.sectionTitle}>Route Suggestions</h3>
                  {result.sections.commute.traffic_outlook && (
                    <span style={S.badge}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>bolt</span>
                      {result.sections.commute.traffic_outlook}
                    </span>
                  )}
                </div>
                <div style={S.commuteGrid}>
                  {result.sections.commute.items.map((opt, i) => (
                    <div key={i} style={S.commuteCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={S.commuteIconBox}>
                          <span className="material-symbols-outlined" style={{ color: "#fff" }}>
                            {opt.mode.toLowerCase().includes("train") ? "train"
                              : opt.mode.toLowerCase().includes("bus") ? "directions_bus"
                              : opt.mode.toLowerCase().includes("metro") ? "subway"
                              : "directions_car"}
                          </span>
                        </div>
                        {opt.duration && (
                          <span style={S.durationBadge}>{opt.duration}</span>
                        )}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--primary)", letterSpacing: "-0.01em" }}>
                          {opt.mode}
                        </h4>
                        {opt.price && (
                          <p style={{ fontSize: "0.85rem", color: "var(--secondary)", fontWeight: 500, marginTop: 4 }}>
                            {opt.price}
                          </p>
                        )}
                      </div>
                      {opt.summary && (
                        <p style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem", fontWeight: 500, lineHeight: 1.5 }}>
                          {opt.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Stays ── */}
              {serviceMode !== "travel_only" && result.sections.stay.length > 0 && (
                <div>
                  <h3 style={S.sectionTitle}>Stay Recommendations</h3>
                  <div style={S.stayGrid}>
                    {result.sections.stay.map((s, i) => (
                      <div key={i} style={S.stayCard}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <h4 style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--primary)", letterSpacing: "-0.01em" }}>
                              {s.name}
                            </h4>
                            {s.area && (
                              <p style={{ fontSize: "0.85rem", color: "var(--secondary)", fontWeight: 500, marginTop: 4 }}>
                                {s.area}
                              </p>
                            )}
                          </div>
                          {s.rating && (
                            <span style={S.ratingBadge}>{s.rating} ★</span>
                          )}
                        </div>
                        {s.details && (
                          <p style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem", lineHeight: 1.6, fontWeight: 500 }}>
                            {s.details}
                          </p>
                        )}
                        {s.price && (
                          <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)" }}>
                            ₹{s.price}
                            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--secondary)", marginLeft: 4 }}>/night</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Attractions ── */}
              {serviceMode !== "travel_only" && result.sections.attractions.length > 0 && (
                <div>
                  <h3 style={S.sectionTitle}>Top Attractions</h3>
                  <div style={S.attrGrid}>
                    {result.sections.attractions.map((a, i) => (
                      <div key={i} style={S.attrCard}>
                        <div style={S.attrIconBox}>
                          <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 24 }}>
                            {i % 3 === 0 ? "temple_hindu" : i % 3 === 1 ? "landscape" : "restaurant"}
                          </span>
                        </div>
                        <div>
                          <h5 style={{ fontWeight: 800, fontSize: "1rem", color: "var(--primary)" }}>{a.name}</h5>
                          {a.distance && (
                            <p style={{ fontSize: "0.75rem", color: "var(--secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>
                              {a.distance} · {a.best_time}
                            </p>
                          )}
                          {a.fit && (
                            <p style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)", marginTop: 6, fontWeight: 500, lineHeight: 1.5 }}>
                              {a.fit}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Itinerary ── */}
              {result.sections.itinerary && (
                <div>
                  <h3 style={S.sectionTitle}>Your Itinerary</h3>
                  <div style={S.itineraryCard}>
                    {result.sections.itinerary.split("\n").map((line, i) => (
                      <p key={i} style={{ marginBottom: line.trim() === "" ? 16 : 6, fontWeight: line.startsWith("#") || line.match(/^\d+\./) ? 700 : 500, fontSize: line.startsWith("#") ? "1.1rem" : "0.9rem", color: line.startsWith("#") ? "var(--primary)" : "var(--on-surface-variant)" }}>
                        {line.replace(/^#+\s*/, "")}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Feedback & Refine ── */}
              <div style={S.feedbackSection}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--primary)" }}>
                    Feedback &amp; Refine
                  </h3>
                  <p style={{ color: "var(--secondary)", fontSize: "1.05rem", fontWeight: 500, lineHeight: 1.6, maxWidth: 420 }}>
                    Help Horizon Hopper learn your taste. Your feedback shapes
                    your next journey into a masterpiece.
                  </p>
                  <div style={{ display: "flex", gap: 16 }}>
                    <button
                      style={{
                        ...S.thumbBtn,
                        borderColor: satisfied === true ? "var(--success)" : "rgba(10,25,49,0.08)",
                      }}
                      onClick={() => handleSaveFeedback(true)}
                    >
                      <span className="material-symbols-outlined" style={{ color: "var(--success)", fontVariationSettings: "'FILL' 1" }}>
                        thumb_up
                      </span>
                      <span style={S.thumbLabel}>Love it</span>
                    </button>
                    <button
                      style={{
                        ...S.thumbBtn,
                        borderColor: satisfied === false ? "var(--error)" : "rgba(10,25,49,0.08)",
                      }}
                      onClick={() => handleSaveFeedback(false)}
                    >
                      <span className="material-symbols-outlined" style={{ color: "var(--error)" }}>
                        thumb_down
                      </span>
                      <span style={S.thumbLabel}>Not for me</span>
                    </button>
                  </div>
                </div>
                <div style={S.feedbackFormWrap}>
                  <label style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800, color: "var(--secondary)" }}>
                    Personalized Note
                  </label>
                  <textarea
                    style={S.feedbackTextarea}
                    placeholder="e.g. 'I prefer more nature spots than museums...'"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                  />
                  <button
                    style={{ ...S.refineBtn, opacity: refining ? 0.7 : 1 }}
                    disabled={refining || !feedbackText.trim()}
                    onClick={handleRefine}
                  >
                    {refining ? "Refining…" : "Refine My Itinerary"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <span style={S.footerBrand}>Horizon Hopper</span>
          <p style={S.footerCopy}>© 2025 Travel with Distinction.</p>
          <div style={S.footerLinks}>
            <span style={S.footerLink}>Privacy</span>
            <span style={S.footerLink}>Terms</span>
            <span style={S.footerLink}>Support</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════ */
/*  STYLES                                */
/* ═══════════════════════════════════════ */

const S: Record<string, React.CSSProperties> = {
  pageWrapper: { position: "relative", minHeight: "100vh", overflow: "hidden", background: "var(--background)" },
  filmRollContainer: { position: "fixed", top: 0, bottom: 0, width: "clamp(120px, 15vw, 240px)", zIndex: 0, overflow: "hidden", pointerEvents: "none", boxShadow: "inset 0 0 20px rgba(0,0,0,0.02)" },
  filmRollInner: { display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" },
  filmFrame: { width: "100%", padding: "0 16px" },
  filmImage: { width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "10px", border: "5px solid rgba(255,255,255,0.7)", boxShadow: "var(--shadow-md)" },
  
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "transparent", position: "relative", zIndex: 1, padding: "0 clamp(120px, 15vw, 240px)" },

  /* header */
  header: {
    position: "fixed", top: 0, width: "100%", zIndex: 50, height: 80,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(253,251,247,0.8)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(10,25,49,0.05)",
  },
  headerInner: { width: "100%", maxWidth: 1440, padding: "0 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { display: "flex", alignItems: "center", gap: 40 },
  logo: { fontSize: "1.25rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.03em", textTransform: "uppercase" },
  nav: { display: "flex", gap: 32 },
  navItem: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--secondary)", cursor: "pointer", transition: "color var(--transition-fast)" },
  headerRight: { display: "flex", alignItems: "center", gap: 16 },
  userPill: { display: "flex", alignItems: "center", gap: 10, background: "var(--surface-container)", borderRadius: "var(--radius-full)", padding: "6px 16px 6px 6px", border: "1px solid rgba(10,25,49,0.05)" },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem" },
  logoutBtn: { padding: 8, color: "var(--secondary)", cursor: "pointer", borderRadius: "var(--radius-sm)", transition: "all var(--transition-fast)" },

  /* main */
  main: { flexGrow: 1, paddingTop: 128, paddingBottom: 96 },
  container: { maxWidth: 900, margin: "0 auto", padding: "0 1.5rem" },

  /* hero */
  heroWrap: { textAlign: "center", marginBottom: 48 },
  heroLabel: { fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--secondary)", marginBottom: 16, display: "block" },
  heroTitle: { fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--primary)", marginBottom: 24 },
  heroSub: { fontSize: "1.1rem", color: "var(--secondary)", fontWeight: 500, maxWidth: 580, margin: "0 auto", lineHeight: 1.6, opacity: 0.8 },

  /* form */
  formCard: {
    background: "var(--surface-container-lowest)", borderRadius: "var(--radius-2xl)", padding: "clamp(2rem, 4vw, 3.5rem)",
    boxShadow: "var(--shadow-xl)", border: "1px solid rgba(10,25,49,0.04)", display: "flex", flexDirection: "column", gap: 40,
  },
  formGrid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 32 },
  fieldLabel: { display: "block", fontSize: "0.625rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--secondary)", marginBottom: 10, marginLeft: 4 },
  inputWrap: {
    display: "flex", alignItems: "center", background: "var(--surface-container)", borderRadius: "var(--radius-lg)",
    padding: "0 20px", border: "2px solid transparent", transition: "all var(--transition-fast)", boxShadow: "var(--shadow-sm)",
  },
  inputIcon: { color: "var(--primary)", opacity: 0.5, marginRight: 16, fontSize: 20 },
  inputField: {
    flex: 1, background: "transparent", border: "none", padding: "18px 0", fontWeight: 600, fontSize: "0.95rem",
    color: "var(--on-surface)", outline: "none", width: "100%",
  },
  purposeChip: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: 20, borderRadius: "var(--radius-lg)", border: "2px solid transparent",
    cursor: "pointer", transition: "all var(--transition-fast)", boxShadow: "var(--shadow-sm)",
  },
  rangeInput: { width: "100%", accentColor: "var(--primary)", cursor: "pointer" },
  rangeLabel: { fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--outline-variant)" },
  textareaWrap: {
    background: "var(--surface-container)", borderRadius: "var(--radius-lg)", padding: 24,
    border: "2px solid transparent", transition: "all var(--transition-fast)", boxShadow: "var(--shadow-sm)",
  },
  textarea: { width: "100%", background: "transparent", border: "none", resize: "none", fontWeight: 600, fontSize: "0.95rem", color: "var(--on-surface)", lineHeight: 1.6, outline: "none" },
  submitBtn: {
    width: "100%", padding: "22px 40px", background: "var(--primary)", color: "#fff",
    fontWeight: 800, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em",
    borderRadius: "var(--radius-lg)", border: "none", display: "flex", alignItems: "center",
    justifyContent: "center", gap: 12, boxShadow: "var(--shadow-lg)", transition: "all var(--transition-base)", cursor: "pointer",
  },

  /* inspiration */
  inspGrid: { marginTop: 96, display: "grid", gridTemplateColumns: "7fr 5fr", gap: 32, alignItems: "start" },
  inspBig: { position: "relative", borderRadius: "var(--radius-2xl)", overflow: "hidden", height: 420, boxShadow: "var(--shadow-lg)", border: "1px solid rgba(10,25,49,0.04)" },
  inspImg: { width: "100%", height: "100%", objectFit: "cover", transition: "transform var(--transition-glacial)" },
  inspGradient: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,25,49,0.88) 0%, rgba(10,25,49,0.15) 50%, transparent 100%)" },
  inspText: { position: "absolute", bottom: 0, left: 0, padding: 40, color: "#fff" },
  inspSide: { display: "flex", flexDirection: "column", gap: 24, marginTop: 48 },
  inspInfoCard: { background: "var(--surface-container)", borderRadius: "var(--radius-2xl)", padding: 40, border: "1px solid rgba(10,25,49,0.04)" },
  inspDarkCard: {
    background: "var(--primary)", color: "#fff", borderRadius: "var(--radius-2xl)", padding: 40,
    position: "relative", overflow: "hidden", boxShadow: "0 24px 48px rgba(10,25,49,0.2)",
  },

  /* results */
  resultHero: { position: "relative", borderRadius: "var(--radius-2xl)", overflow: "hidden", height: 420 },
  resultHeroImg: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 },
  resultHeroGradient: { position: "absolute", inset: 0, background: "linear-gradient(to top, var(--primary) 0%, rgba(10,25,49,0.35) 50%, transparent 100%)" },
  resultHeroContent: { position: "absolute", bottom: 0, left: 0, padding: 48 },
  resultHeroTag: {
    display: "inline-block", padding: "6px 16px", background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "var(--radius-full)", color: "#fff", fontSize: "0.625rem",
    textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700,
  },
  resultHeroTitle: { fontSize: "clamp(2.5rem, 5vw, 5rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1, marginTop: 12 },
  resultHeroSub: { color: "rgba(255,255,255,0.75)", fontSize: "1.15rem", fontWeight: 500, maxWidth: 520, lineHeight: 1.5, marginTop: 12 },

  sectionTitle: { fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--primary)", marginBottom: 24 },

  /* location info */
  locationInfoGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16,
    background: "var(--surface-container-low)", padding: 28, borderRadius: "var(--radius-2xl)",
    border: "1px solid rgba(10,25,49,0.06)",
  },
  locationInfoItem: {
    display: "flex", alignItems: "center", gap: 14,
  },

  /* commute */
  commuteGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 20 },
  commuteCard: {
    background: "var(--surface-container-low)", padding: 32, borderRadius: "var(--radius-2xl)",
    border: "1px solid rgba(10,25,49,0.06)", display: "flex", flexDirection: "column", gap: 20,
    transition: "all var(--transition-slow)",
  },
  commuteIconBox: { background: "var(--primary)", padding: 12, borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center" },
  durationBadge: {
    fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.1em", color: "var(--primary)",
    background: "#fff", padding: "6px 12px", borderRadius: "var(--radius-full)",
    border: "1px solid rgba(10,25,49,0.08)", boxShadow: "var(--shadow-sm)",
  },
  badge: {
    display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700,
    color: "var(--primary)", background: "var(--surface-container-high)", padding: "6px 14px",
    borderRadius: "var(--radius-full)",
  },

  /* stay */
  stayGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 20 },
  stayCard: {
    background: "var(--surface-container-low)", padding: 28, borderRadius: "var(--radius-2xl)",
    border: "1px solid rgba(10,25,49,0.06)", display: "flex", flexDirection: "column", gap: 16,
    transition: "all var(--transition-slow)",
  },
  ratingBadge: {
    background: "#fff", padding: "8px 16px", borderRadius: "var(--radius-lg)",
    fontWeight: 900, fontSize: "0.85rem", color: "var(--primary)", boxShadow: "var(--shadow-lg)",
  },

  /* attractions */
  attrGrid: { display: "flex", flexDirection: "column", gap: 12 },
  attrCard: {
    display: "flex", gap: 20, alignItems: "center", background: "var(--surface-container-low)",
    padding: 20, borderRadius: "var(--radius-2xl)", border: "1px solid rgba(10,25,49,0.06)",
    transition: "all var(--transition-base)",
  },
  attrIconBox: {
    width: 56, height: 56, borderRadius: "var(--radius-lg)", background: "var(--accent)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },

  /* itinerary */
  itineraryCard: { background: "var(--surface-container-low)", padding: 40, borderRadius: "var(--radius-2xl)", border: "1px solid rgba(10,25,49,0.06)", lineHeight: 1.7 },

  /* feedback */
  feedbackSection: {
    background: "var(--surface-container)", borderRadius: "var(--radius-2xl)", padding: 48,
    display: "flex", gap: 48, flexWrap: "wrap", border: "1px solid rgba(10,25,49,0.06)",
  },
  thumbBtn: {
    display: "flex", alignItems: "center", gap: 12, padding: "16px 32px",
    background: "#fff", borderRadius: "var(--radius-lg)", border: "2px solid rgba(10,25,49,0.08)",
    boxShadow: "var(--shadow-md)", transition: "all var(--transition-base)", cursor: "pointer",
  },
  thumbLabel: { fontWeight: 900, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)" },
  feedbackFormWrap: {
    flex: 1, minWidth: 280, background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)",
    padding: 32, borderRadius: "var(--radius-2xl)", display: "flex", flexDirection: "column", gap: 20,
    border: "1px solid rgba(255,255,255,0.8)",
  },
  feedbackTextarea: {
    width: "100%", background: "#fff", border: "1px solid rgba(10,25,49,0.08)",
    borderRadius: "var(--radius-lg)", height: 100, padding: 16, fontSize: "0.95rem",
    fontWeight: 500, resize: "none", color: "var(--on-surface)", outline: "none",
    transition: "all var(--transition-fast)",
  },
  refineBtn: {
    width: "100%", padding: 20, background: "var(--primary)", color: "#fff",
    borderRadius: "var(--radius-lg)", fontWeight: 800, fontSize: "0.8rem",
    textTransform: "uppercase", letterSpacing: "0.1em", border: "none",
    boxShadow: "var(--shadow-lg)", cursor: "pointer", transition: "all var(--transition-base)",
  },

  /* footer */
  footer: {
    background: "var(--surface-container)", padding: "4rem 2rem", borderTop: "1px solid rgba(10,25,49,0.04)",
  },
  footerInner: { maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 },
  footerBrand: { fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.02em", textTransform: "uppercase" },
  footerCopy: { fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--secondary)", opacity: 0.6 },
  footerLinks: { display: "flex", gap: 32 },
  footerLink: { fontSize: "0.625rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--secondary)", cursor: "pointer", transition: "color var(--transition-fast)" },
};
