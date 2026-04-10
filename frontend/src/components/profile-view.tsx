"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MemorySummary } from "@/lib/types";
import { clearSession, readSession } from "@/lib/session";

export function ProfileView() {
  const router = useRouter();
  const session = useMemo(() => readSession(), []);
  const [memory, setMemory] = useState<MemorySummary | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!session) {
      router.replace("/");
      return;
    }
    fetch(`/api/users/${session.user.id}/memory`)
      .then((r) => r.json())
      .then((d) => setMemory(d.memory ?? session.user.memory))
      .catch(() => setMemory(session.user.memory));
  }, [session, router]);

  if (!mounted) return null;
  if (!session) return null;
  const user = session.user;

  const dnaCards = [
    {
      icon: "train",
      label: "Transport",
      value: memory?.preferred_transport || "Not set",
      desc: "Prioritizing scenic slow-travel and sustainability.",
    },
    {
      icon: "payments",
      label: "Investment",
      value: memory?.budget_range || "Not set",
      desc: "Your preferred daily budget allocation.",
    },
    {
      icon: "restaurant",
      label: "Cuisine",
      value: memory?.food_preference || "Not set",
      desc: "Your dining and food style preferences.",
    },
  ];

  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.headerLeft}>
            <span style={S.logo} onClick={() => router.push("/planner")}>
              Horizon Hopper
            </span>
            <nav style={S.nav}>
              <span style={S.navItem} onClick={() => router.push("/planner")}>Journeys</span>
              <span style={{ ...S.navItem, borderBottom: "2px solid var(--primary)", paddingBottom: 4 }}>Profile</span>
            </nav>
          </div>
          <div style={S.headerRight}>
            <div style={S.avatarCircle}>{user.avatar}</div>
            <button style={S.logoutBtn} onClick={() => { clearSession(); router.replace("/"); }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            </button>
          </div>
        </div>
      </header>

      <div style={S.layout}>
        {/* Sidebar */}
        <aside style={S.sidebar}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={S.sidebarIcon}>
              <span className="material-symbols-outlined" style={{ color: "var(--background)" }}>map</span>
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Wayfarer</h2>
              <p style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(10,25,49,0.4)" }}>
                {session.serviceMode === "full_package" ? "Premium Member" : "Solo Navigator"}
              </p>
            </div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <a style={S.sideNavItem} onClick={() => router.push("/planner")}>
              <span className="material-symbols-outlined">map</span>
              <span style={{ fontSize: "0.85rem" }}>Journeys</span>
            </a>
            <a style={{ ...S.sideNavItem, background: "rgba(10,25,49,0.04)", color: "var(--primary)", fontWeight: 700 }}>
              <span className="material-symbols-outlined">settings</span>
              <span style={{ fontSize: "0.85rem" }}>Settings</span>
            </a>
          </nav>
          <button style={S.sidebarBtn} onClick={() => router.push("/planner")}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Plan New Trip
          </button>
        </aside>

        {/* Main Content */}
        <main style={S.main}>
          <div style={S.contentWrap}>
            {/* Profile Hero */}
            <section style={S.heroGrid} className="animate-fade-in">
              {/* User card */}
              <div style={S.userCard}>
                <div style={S.avatarBig}>{user.avatar}</div>
                <h1 style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{user.name}</h1>
                <p style={{ color: "rgba(10,25,49,0.4)", fontWeight: 500, fontSize: "0.85rem" }}>
                  {user.id}@wayfarer.com
                </p>
                <div style={S.statsRow}>
                  <div style={S.stat}>
                    <p style={S.statValue}>{memory?.trip_count ?? 0}</p>
                    <p style={S.statLabel}>Trips</p>
                  </div>
                  <div style={{ ...S.stat, borderLeft: "1px solid rgba(10,25,49,0.06)", borderRight: "1px solid rgba(10,25,49,0.06)", padding: "0 2.5rem" }}>
                    <p style={S.statValue}>{memory?.past_trips?.length ?? 0}</p>
                    <p style={S.statLabel}>Logged</p>
                  </div>
                  <div style={S.stat}>
                    <p style={S.statValue}>4.9</p>
                    <p style={S.statLabel}>Score</p>
                  </div>
                </div>
              </div>

              {/* Stats dashboard */}
              <div style={S.statsCol}>
                <div style={S.darkCard}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.8, marginBottom: 20 }}>travel</span>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.5, marginBottom: 4 }}>
                    Global Reach
                  </p>
                  <p style={{ fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-0.03em" }}>
                    {((memory?.trip_count ?? 0) * 55).toLocaleString()} km
                  </p>
                </div>
                <div style={S.accentCard}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(10,25,49,0.35)", marginBottom: 8 }}>
                    Accommodation
                  </p>
                  <p style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
                    {memory?.accommodation_type || "Not set"}
                  </p>
                </div>
              </div>
            </section>

            {/* Travel DNA */}
            <section style={{ marginTop: 64 }} className="animate-slide-up">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(10,25,49,0.06)", paddingBottom: 20, marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>The Travel DNA</h2>
                  <p style={{ color: "rgba(10,25,49,0.4)", fontSize: "0.85rem", fontWeight: 500, marginTop: 4 }}>
                    Curated preferences for your next escape
                  </p>
                </div>
              </div>
              <div style={S.dnaGrid}>
                {dnaCards.map((card) => (
                  <div key={card.label} style={S.dnaCard}>
                    <div style={S.dnaIconBox}>
                      <span className="material-symbols-outlined" style={{ fontSize: 28, color: "var(--primary)" }}>{card.icon}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(10,25,49,0.25)", marginBottom: 8 }}>
                        {card.label}
                      </p>
                      <p style={{ fontSize: "1.15rem", fontWeight: 800 }}>{card.value}</p>
                      <p style={{ fontSize: "0.75rem", color: "rgba(10,25,49,0.5)", marginTop: 8, fontWeight: 500 }}>{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Avoid List & Feedback */}
            {memory && (memory.avoid.length > 0 || memory.feedback_notes.length > 0) && (
              <section style={{ marginTop: 64 }}>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 24 }}>
                  Memory Notes
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 20 }}>
                  {memory.avoid.length > 0 && (
                    <div style={S.noteCard}>
                      <h4 style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--primary)", marginBottom: 12 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 8, verticalAlign: "middle" }}>block</span>
                        Avoids
                      </h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {memory.avoid.map((item, i) => (
                          <span key={i} style={S.chip}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {memory.feedback_notes.length > 0 && (
                    <div style={S.noteCard}>
                      <h4 style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--primary)", marginBottom: 12 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 8, verticalAlign: "middle" }}>rate_review</span>
                        Past Feedback
                      </h4>
                      {memory.feedback_notes.slice(0, 5).map((note, i) => (
                        <p key={i} style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)", fontWeight: 500, marginBottom: 6, lineHeight: 1.5 }}>
                          &ldquo;{note}&rdquo;
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Past trips */}
            {memory && memory.past_trips.length > 0 && (
              <section style={{ marginTop: 64 }}>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 24 }}>
                  Past Journeys
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {memory.past_trips.map((trip, i) => (
                    <div key={i} style={S.tripRow}>
                      <div style={S.tripDot} />
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--primary)" }}>{trip.input}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--secondary)", fontWeight: 500, marginTop: 4 }}>
                          {trip.intent?.replace(/_/g, " ")} · {trip.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ═══ STYLES ═══ */
const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--background)" },

  header: {
    position: "fixed", top: 0, width: "100%", zIndex: 50, height: 80,
    background: "rgba(253,251,247,0.8)", backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(10,25,49,0.04)", display: "flex", alignItems: "center", justifyContent: "center",
  },
  headerInner: { width: "100%", maxWidth: 1440, padding: "0 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { display: "flex", alignItems: "center", gap: 48 },
  logo: { fontSize: "1.2rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.02em", cursor: "pointer" },
  nav: { display: "flex", gap: 32 },
  navItem: { fontSize: "0.8rem", fontWeight: 600, color: "rgba(10,25,49,0.5)", cursor: "pointer", transition: "color 0.2s" },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  avatarCircle: { width: 40, height: 40, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 },
  logoutBtn: { padding: 8, color: "var(--secondary)", cursor: "pointer" },

  layout: { display: "flex", minHeight: "100vh", paddingTop: 80 },

  sidebar: {
    display: "flex", flexDirection: "column", padding: 32, gap: 32,
    width: 280, background: "var(--background)", borderRight: "1px solid rgba(10,25,49,0.04)",
    position: "sticky", top: 80, height: "calc(100vh - 80px)",
  },
  sidebarIcon: { width: 48, height: 48, borderRadius: "var(--radius-lg)", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" },
  sideNavItem: {
    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
    color: "rgba(10,25,49,0.5)", fontWeight: 600, borderRadius: "var(--radius-md)",
    cursor: "pointer", transition: "all 0.2s",
  },
  sidebarBtn: {
    marginTop: "auto", width: "100%", padding: 16, background: "var(--primary)",
    color: "var(--background)", borderRadius: "var(--radius-lg)", fontWeight: 700,
    fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8, boxShadow: "0 8px 24px rgba(10,25,49,0.12)", cursor: "pointer",
  },

  main: { flex: 1, padding: 48 },
  contentWrap: { maxWidth: 1000, margin: "0 auto" },

  heroGrid: { display: "grid", gridTemplateColumns: "5fr 7fr", gap: 24, alignItems: "stretch" },
  userCard: {
    background: "#fff", border: "1px solid rgba(10,25,49,0.06)", padding: 40,
    borderRadius: "var(--radius-2xl)", display: "flex", flexDirection: "column",
    alignItems: "center", textAlign: "center", gap: 16,
  },
  avatarBig: {
    width: 128, height: 128, borderRadius: "50%", background: "var(--primary)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: "3rem", boxShadow: "0 0 0 4px rgba(10,25,49,0.06)",
  },
  statsRow: { display: "flex", gap: 0, paddingTop: 16 },
  stat: { textAlign: "center", padding: "0 1.5rem" },
  statValue: { fontSize: "1.5rem", fontWeight: 900 },
  statLabel: { fontSize: "0.55rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(10,25,49,0.3)", marginTop: 4 },

  statsCol: { display: "flex", flexDirection: "column", gap: 20 },
  darkCard: {
    background: "var(--primary)", color: "#fff", padding: 40,
    borderRadius: "var(--radius-2xl)", flex: 1, display: "flex", flexDirection: "column",
    justifyContent: "space-between", position: "relative", overflow: "hidden",
  },
  accentCard: {
    background: "rgba(230,225,211,0.4)", padding: 40, borderRadius: "var(--radius-2xl)",
    border: "1px solid rgba(10,25,49,0.06)", flex: 1, display: "flex",
    flexDirection: "column", justifyContent: "space-between",
  },

  dnaGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 },
  dnaCard: {
    aspectRatio: "1", background: "#fff", border: "1px solid rgba(10,25,49,0.06)",
    borderRadius: "var(--radius-2xl)", padding: 32, display: "flex", flexDirection: "column",
    justifyContent: "space-between", transition: "box-shadow 0.3s",
  },
  dnaIconBox: {
    width: 56, height: 56, borderRadius: "var(--radius-lg)",
    background: "rgba(230,225,211,0.3)", display: "flex", alignItems: "center", justifyContent: "center",
  },

  noteCard: {
    background: "var(--surface-container-low)", padding: 28, borderRadius: "var(--radius-xl)",
    border: "1px solid rgba(10,25,49,0.06)",
  },
  chip: {
    display: "inline-block", padding: "6px 14px", background: "var(--surface-container-high)",
    borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)",
  },

  tripRow: {
    display: "flex", alignItems: "center", gap: 16, padding: 20,
    background: "var(--surface-container-low)", borderRadius: "var(--radius-xl)",
    border: "1px solid rgba(10,25,49,0.06)",
  },
  tripDot: { width: 12, height: 12, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 },
};
