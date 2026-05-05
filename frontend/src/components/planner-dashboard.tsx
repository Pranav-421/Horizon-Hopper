"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlannerResponse, ServiceMode } from "@/lib/types";
import { clearSession, readSession, writeSession, getAuthHeaders } from "@/lib/session";
import { TravelMap } from "@/components/travel-map";
import { SharedHeader } from "@/components/shared-header";

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
const COAST_IMG = "/assets/cities/chennai_1.jpg";

const TN_CITIES = [
  "Select a city...", "Chennai", "Tambaram", "Chengalpattu", "Mahabalipuram", "Kanchipuram", "Coimbatore",
  "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur",
  "Vellore", "Erode", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet",
  "Karur", "Ooty", "Kodaikanal", "Kanyakumari", "Rameswaram", "Tiruvannamalai"
];

/* ── Per-city image maps (5 images each from /assets/cities/) ── */
const CITY_IMAGES: Record<string, string[]> = {
  chennai:         Array.from({ length: 5 }, (_, i) => `/assets/cities/chennai_${i + 1}.jpg`),
  tambaram:        Array.from({ length: 5 }, (_, i) => `/assets/cities/tambaram_${i + 1}.jpg`),
  chengalpattu:    Array.from({ length: 5 }, (_, i) => `/assets/cities/chengalpattu_${i + 1}.jpg`),
  mahabalipuram:   Array.from({ length: 5 }, (_, i) => `/assets/cities/mahabalipuram_${i + 1}.jpg`),
  kanchipuram:     Array.from({ length: 5 }, (_, i) => `/assets/cities/kanchipuram_${i + 1}.jpg`),
  coimbatore:      Array.from({ length: 5 }, (_, i) => `/assets/cities/coimbatore_${i + 1}.jpg`),
  madurai:         Array.from({ length: 5 }, (_, i) => `/assets/cities/madurai_${i + 1}.jpg`),
  tiruchirappalli: Array.from({ length: 5 }, (_, i) => `/assets/cities/tiruchirappalli_${i + 1}.jpg`),
  salem:           Array.from({ length: 5 }, (_, i) => `/assets/cities/salem_${i + 1}.jpg`),
  tirunelveli:     Array.from({ length: 5 }, (_, i) => `/assets/cities/tirunelveli_${i + 1}.jpg`),
  tiruppur:        Array.from({ length: 5 }, (_, i) => `/assets/cities/tiruppur_${i + 1}.jpg`),
  vellore:         Array.from({ length: 5 }, (_, i) => `/assets/cities/vellore_${i + 1}.jpg`),
  erode:           Array.from({ length: 5 }, (_, i) => `/assets/cities/erode_${i + 1}.jpg`),
  ooty:            Array.from({ length: 5 }, (_, i) => `/assets/cities/ooty_${i + 1}.jpg`),
  kodaikanal:      Array.from({ length: 5 }, (_, i) => `/assets/cities/kodaikanal_${i + 1}.jpg`),
  kanyakumari:     Array.from({ length: 5 }, (_, i) => `/assets/cities/kanyakumari_${i + 1}.jpg`),
  rameswaram:      Array.from({ length: 5 }, (_, i) => `/assets/cities/rameswaram_${i + 1}.jpg`),
  thanjavur:       Array.from({ length: 5 }, (_, i) => `/assets/cities/thanjavur_${i + 1}.jpg`),
};

/* Fallback images (original generic TN images) */
const DEFAULT_IMAGES = [
  "/assets/tn_kanyakumari_1775842503202.png",
  "/assets/tn_nilgiris_1775842577463.png",
  "/assets/tn_shore_temple_1775842523313.png",
  "/assets/tn_tea_estate_1775842468607.png",
  "/assets/tn_temple_1775842404019.png",
  "/assets/tn_waterfall_1775842541471.png",
];

function getCityImages(destination: string): string[] {
  const key = destination.split(",")[0].trim().toLowerCase();
  return CITY_IMAGES[key] ?? DEFAULT_IMAGES;
}

/* ═══════════════════════════════════════ */
/*  PLANNER DASHBOARD                     */
/* ═══════════════════════════════════════ */

export function PlannerDashboard() {
  const router = useRouter();
  const session = useMemo(() => readSession(), []);
  const [mounted, setMounted] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("horizon_theme") as "light" | "dark" | null;
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);


  /* ── redirect if no session ── */
  useEffect(() => {
    if (!mounted) return;
    if (!session) router.replace("/");
  }, [session, router]);

  /* ── state ── */
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("Chennai");
  const [purpose, setPurpose] = useState("leisure");
  const [budget, setBudget] = useState("5000");
  const [travelTime, setTravelTime] = useState("");
  const [preferences, setPreferences] = useState("");
  const [planning, setPlanning] = useState(false);


  const [result, setResult] = useState<PlannerResponse | null>(null);

  /* ── derived city images ── */
  const cityImages = useMemo(() => getCityImages(destination), [destination]);

  /* feedback */
  const [feedbackText, setFeedbackText] = useState("");
  const [refining, setRefining] = useState(false);
  /* selected commute card — show map when clicked */
  const [selectedCommuteIdx, setSelectedCommuteIdx] = useState<number | null>(null);
  const [satisfied, setSatisfied] = useState<boolean | null>(null);

  const serviceMode: ServiceMode = session?.serviceMode ?? "full_package";
  const userId = session?.user?.id ?? "guest";

  /* ── plan trip ── */
  const handlePlan = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPlanning(true);
      setResult(null);
      setSelectedCommuteIdx(null);
      try {
        const res = await fetch("/api/trips/plan", {
          method: "POST",
          headers: { "content-type": "application/json", ...getAuthHeaders() },
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
        // Persist updated memory back to session
        if (session && data.memory) {
          writeSession({ ...session, user: { ...session.user, memory: data.memory } });
        }
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
      // Persist updated memory back to session
      if (session && data.memory) {
        writeSession({ ...session, user: { ...session.user, memory: data.memory } });
      }
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

  if (!mounted) return null;
  if (!session) return null;

  return (
    <div style={S.pageWrapper}>
      {/* ── FILM ROLL RIGHT ── */}
      <div className="film-roll-container" style={{ ...S.filmRollContainer, right: 0 }}>
        <div style={{ ...S.filmRollInner, animation: "scrollDown 40s linear infinite" }}>
          {[...cityImages, ...cityImages].slice().reverse().map((img, i) => (
            <div key={`r-${i}`} style={S.filmFrame}>
              <img src={img} alt="" style={S.filmImage} />
            </div>
          ))}
        </div>
      </div>

      <SharedHeader active="explore" />

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* ── SIDEBAR NAV ── */}
        <aside className="sidebar-nav" style={S.sidebar}>
          <div style={S.sidebarInner}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                {icon:"dashboard",label:"Dashboard",active:true, onClick: () => {}},
                {icon:"map",label:"Itinerary", onClick: () => window.scrollTo({top: 800, behavior: "smooth"})},
                {icon:"bookmark",label:"Saved", onClick: () => router.push("/profile")},
                {icon:"settings",label:"Settings", onClick: () => router.push("/profile?edit=true")}
              ].map(item => (
                <button key={item.label} onClick={item.onClick} style={{...S.sideNavBtn, ...(item.active ? {background:"rgba(0,104,95,0.08)",color:"var(--primary)",fontWeight:600} : {})}}>
                  <span className="material-symbols-outlined" style={{fontSize:20}}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
            <button style={S.sideNewBtn} onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>
              <span className="material-symbols-outlined" style={{fontSize:18}}>add</span>
              New Trip
            </button>
          </div>
        </aside>

      <div className="page-content" style={S.page}>
        {/* Header rendered by SharedHeader above */}

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
                      <option key={city} value={city} disabled={city.includes("Select")} style={{ background: "var(--surface-container-highest)", color: "var(--on-surface)" }}>
                        {city}
                      </option>
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
                      <option key={city} value={city} disabled={city.includes("Select")} style={{ background: "var(--surface-container-highest)", color: "var(--on-surface)" }}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Purpose + Time */}
            <div style={S.formGrid2}>
              <div>
                <label style={S.fieldLabel}>Nature of Trip</label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
                <div style={{ ...S.inputWrap, height: 84 }}>
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

          {/* ── Skeleton Loaders ── */}
          {planning && (
            <div style={{ marginTop: 64 }} className="stagger-children">
              <div className="skeleton-card" style={{ height: 200, marginBottom: 32 }}>
                <div className="skeleton-bar" style={{ height: 24, width: "30%", marginBottom: 16 }}></div>
                <div className="skeleton-bar" style={{ height: 48, width: "70%", marginBottom: 24 }}></div>
                <div className="skeleton-bar" style={{ height: 16, width: "50%" }}></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                <div className="skeleton-card" style={{ height: 180 }}></div>
                <div className="skeleton-card" style={{ height: 180 }}></div>
                <div className="skeleton-card" style={{ height: 180 }}></div>
              </div>
            </div>
          )}

          {/* ── Inspiration Cards ── */}
          {!result && !planning && (
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
              <div style={{ ...S.inspBig, marginTop: 48 }}>
                <img src="/assets/cities/mahabalipuram_1.jpg" alt="Cultural Heritage" style={S.inspImg} />
                <div style={S.inspGradient} />
                <div style={S.inspText}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.85, color: "#fff" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>history_edu</span>
                    Cultural Heritage
                  </span>
                  <h3 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", marginTop: 12, color: "#fff", lineHeight: 1.3 }}>
                    Discover the ancient stone carvings of Chengalpattu.
                  </h3>
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

              {/* Route map removed — now shown inside selected commute card */}

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
                  {result.sections.commute.items.map((opt, i) => {
                    const isSelected = selectedCommuteIdx === i;
                    return (
                    <div
                      key={i}
                      style={{
                        ...S.commuteCard,
                        cursor: "pointer",
                        borderColor: isSelected ? "var(--primary)" : "rgba(10,25,49,0.06)",
                        boxShadow: isSelected ? "0 8px 32px rgba(10,25,49,0.12)" : "none",
                      }}
                      onClick={() => setSelectedCommuteIdx(isSelected ? null : i)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={S.commuteIconBox}>
                          <span className="material-symbols-outlined" style={{ color: "#fff" }}>
                            {opt.mode.toLowerCase().includes("train") ? "train"
                              : opt.mode.toLowerCase().includes("bus") ? "directions_bus"
                              : opt.mode.toLowerCase().includes("metro") ? "subway"
                              : "directions_car"}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {opt.duration && (
                            <span style={S.durationBadge}>{opt.duration}</span>
                          )}
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: 18,
                              color: "var(--secondary)",
                              transition: "transform 0.3s ease",
                              transform: isSelected ? "rotate(180deg)" : "rotate(0deg)",
                            }}
                          >
                            expand_more
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--primary)", letterSpacing: "-0.01em" }}>
                          {opt.mode.replace(/\*+/g, "")}
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
                      {/* Show map modal when this card is selected */}
                      {isSelected && (
                        <div
                          style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 1000,
                            background: "rgba(10,25,49,0.4)",
                            backdropFilter: "blur(8px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "1.5rem",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCommuteIdx(null);
                          }}
                        >
                          <div
                            style={{
                              background: "var(--surface-container-lowest)",
                              borderRadius: "var(--radius-2xl)",
                              padding: "2rem",
                              width: "100%",
                              maxWidth: 600,
                              boxShadow: "var(--shadow-xl)",
                              animation: "slideUp 0.4s var(--ease-out) both",
                              display: "flex",
                              flexDirection: "column",
                              gap: "1.5rem",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                               <div>
                                 <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.02em" }}>
                                   Route via {opt.mode.replace(/\*+/g, "")}
                                 </h3>
                                 <p style={{ fontSize: "0.9rem", color: "var(--secondary)", fontWeight: 500, marginTop: 6 }}>
                                   {opt.duration && `${opt.duration} • `}{opt.price}
                                 </p>
                               </div>
                               <button 
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCommuteIdx(null);
                                 }}
                                 style={{ 
                                   background: "var(--surface-container)", 
                                   border: "none", 
                                   cursor: "pointer", 
                                   color: "var(--primary)",
                                   width: 36,
                                   height: 36,
                                   borderRadius: "50%",
                                   display: "flex",
                                   alignItems: "center",
                                   justifyContent: "center",
                                   transition: "background 0.2s"
                                 }}>
                                 <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                               </button>
                            </div>
                            
                            <div style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid rgba(10,25,49,0.08)", background: "var(--surface-container-low)" }}>
                               <TravelMap map={result.map} transportMode={opt.mode} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Stays ── */}
              {serviceMode !== "travel_only" && result.sections.stay.length > 0 && (
                <div>
                  <h3 style={S.sectionTitle}>Stay Recommendations</h3>
                  <div style={S.stayGrid}>
                    {result.sections.stay.map((s, i) => (
                      <div key={i} style={S.stayCard}>
                        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                          <img 
                            src={`/assets/stays/${result.trip_context.destination.split(",")[0].toLowerCase().replace(/\s+/g, "")}_${
                              s.type?.toLowerCase().includes("luxury") ? "luxury" :
                              s.type?.toLowerCase().includes("premium") ? "premium" :
                              s.type?.toLowerCase().includes("budget") ? "budget" :
                              s.type?.toLowerCase().includes("hostel") ? "hostel" : "midrange"
                            }_${(i % 3) + 1}.jpg`} 
                            alt={s.name}
                            style={{
                              width: 120,
                              height: 120,
                              objectFit: "cover",
                              borderRadius: "var(--radius-lg)",
                              boxShadow: "var(--shadow-sm)"
                            }}
                            onError={(e) => {
                               // Fallback if image not found
                               e.currentTarget.src = "/assets/stays/chennai_midrange_1.jpg";
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <h4 style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--primary)", letterSpacing: "-0.01em" }}>
                                  {s.name}
                                </h4>
                                {s.area && (
                                  <p style={{ fontSize: "0.85rem", color: "var(--secondary)", fontWeight: 500, marginTop: 4 }}>
                                    {s.area} • {s.type || "General"}
                                  </p>
                                )}
                              </div>
                              {s.rating && (
                                <span style={S.ratingBadge}><StarRating rating={s.rating} /></span>
                              )}
                            </div>
                            {s.details && (
                              <p style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem", lineHeight: 1.6, fontWeight: 500, marginTop: 12 }}>
                                {s.details}
                              </p>
                            )}
                            {s.price && (
                              <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)", marginTop: 12 }}>
                                ₹{s.price}
                                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--secondary)", marginLeft: 4 }}>/night</span>
                              </p>
                            )}
                          </div>
                        </div>
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
      </div>{/* close sidebar flex */}
    </div>
  );
}



function StarRating({ rating }: { rating: string }) {
  const num = parseFloat(rating);
  if (isNaN(num)) return <span>{rating} ★</span>;
  
  const fullStars = Math.floor(num);
  const hasHalfStar = num % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="star-rating" title={rating}>
      <span style={{ marginRight: 6 }}>{rating}</span>
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={`f-${i}`} className="material-symbols-outlined star">star</span>
      ))}
      {hasHalfStar && <span className="material-symbols-outlined star">star_half</span>}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={`e-${i}`} className="material-symbols-outlined star-empty">star</span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════ */
/*  STYLES                                */
/* ═══════════════════════════════════════ */

const S: Record<string, React.CSSProperties> = {
  pageWrapper: { position: "relative", minHeight: "100vh", overflow: "hidden", background: "var(--background)" },

  /* film roll */
  filmRollContainer: { position: "absolute", top: 0, bottom: 0, width: "22vw", overflow: "hidden", zIndex: 0, opacity: 0.85, pointerEvents: "none" as const },
  filmRollInner: { display: "flex", flexDirection: "column", gap: 24, padding: 24 },
  filmFrame: { width: "100%", aspectRatio: "4/3", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.06)" },
  filmImage: { width: "100%", height: "100%", objectFit: "cover" as const },

  /* sidebar */
  sidebar: { width: 240, borderRight: "1px solid var(--surface-container)", background: "var(--surface-container-lowest)", position: "fixed", top: 72, left: 0, bottom: 0, zIndex: 40 },
  sidebarInner: { display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", padding: "24px 16px" },
  sideNavBtn: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, fontSize: "0.9375rem", color: "var(--on-surface-variant)", cursor: "pointer", transition: "all 0.2s", width: "100%", textAlign: "left" },
  sideNewBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 16px", background: "var(--primary)", color: "#fff", borderRadius: 12, fontWeight: 600, fontSize: "0.9375rem", cursor: "pointer", boxShadow: "var(--shadow-md)" },

  page: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "transparent", position: "relative", zIndex: 1, marginLeft: 240, flex: 1 },

  /* header handled by SharedHeader */

  /* main */
  main: { flexGrow: 1, paddingTop: 96, paddingBottom: 96 },
  container: { maxWidth: 820, margin: "0 auto", padding: "0 1.5rem", marginRight: "24vw" },

  /* hero */
  heroWrap: { textAlign: "center", marginBottom: 48 },
  heroLabel: { fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--secondary)", marginBottom: 16, display: "block" },
  heroTitle: { fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--primary)", marginBottom: 24 },
  heroSub: { fontSize: "1.1rem", color: "var(--secondary)", fontWeight: 500, maxWidth: 580, margin: "0 auto", lineHeight: 1.6, opacity: 0.8 },

  /* form */
  formCard: {
    background: "var(--surface-container-lowest)", borderRadius: "var(--radius-2xl)", padding: "clamp(2rem, 4vw, 3.5rem)",
    boxShadow: "var(--shadow-xl)", border: "1px solid rgba(10,25,49,0.04)", display: "flex", flexDirection: "column", gap: 40,
  },
  formGrid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 32 },
  fieldLabel: { display: "block", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--secondary)", marginBottom: 10, marginLeft: 4 },
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
    padding: 16, borderRadius: "var(--radius-lg)", border: "2px solid transparent",
    cursor: "pointer", transition: "all var(--transition-fast)", boxShadow: "var(--shadow-sm)",
  },
  rangeInput: { width: "100%", accentColor: "var(--primary)", cursor: "pointer" },
  rangeLabel: { fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--outline-variant)" },
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
  inspGrid: { marginTop: 96, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 32, alignItems: "start" },
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
