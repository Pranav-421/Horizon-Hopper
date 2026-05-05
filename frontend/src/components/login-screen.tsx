"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ServiceMode, UserProfile } from "@/lib/types";
import { writeSession, saveToken } from "@/lib/session";

/* ─── Stitch Coastal Slate images ─── */
const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLwGCQZ_IyLgeoBC-wUSpAOJeOKf6QuMERQ_1b-ZTqePma_i90dXqc_vWYs69TJUwFL_lMYL5laLiB_fqtoXAlTRMVGHSLMBmI3Alyj2cICBNYA0nkGT7gKI6HX40-gy1M4ShrBWksPmw5HHwDUI3iz23HmqKoIuL5izalV5DxHFznRv5v32JM5koJMb7tPXVStH3MXeXWuTI7yZnTpA6YPSio9m_5JFqR2yfFHdRuAbZ7WLByfbZ8Pde7y0dm4RQ2j7-ivFA61rE";


/* ════════════════════════════════════════ */

export function LoginScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {});
  }, []);

  const handleServiceSelect = useCallback(
    (mode: ServiceMode) => {
      if (!authenticatedUser) return;
      writeSession({ serviceMode: mode, user: authenticatedUser });
      router.push("/planner");
    },
    [authenticatedUser, router],
  );

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) { setError("Invalid username or password."); setLoading(false); return; }
        const data = await res.json();
        setAuthenticatedUser(data.user);
        if (data.token) saveToken(data.token);
        setError("");
      } catch {
        setError("Connection failed. Is the backend running?");
      } finally {
        setLoading(false);
      }
    },
    [username, password],
  );

  const pickUser = useCallback((u: UserProfile) => {
    setSelectedUser(u);
    setUsername(u.id);
    setPassword(u.id === "arjun" ? "arjun123" : u.id === "priya" ? "priya456" : "vikram789");
  }, []);

  /* ── Service Mode Selector (post-login) ── */
  if (authenticatedUser) {
    return (
      <div style={S.page}>
        <div style={S.bgBlur1} />
        <div style={S.bgBlur2} />
        {/* ── Top Nav for Service Mode ── */}
        <header style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 20 }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--on-surface)", letterSpacing: "-0.02em" }}>Horizon Hopper</div>
          <div style={{ display: "flex", gap: 32, fontSize: "0.875rem", fontWeight: 600, color: "var(--on-surface-variant)" }}>
            <span style={{ cursor: "pointer" }}>Help</span>
            <span style={{ cursor: "pointer" }}>Safety</span>
          </div>
        </header>

        <main style={{ ...S.modeMain, maxWidth: 1000 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--primary)" }}>explore</span>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.04em" }}>Horizon Hopper</h1>
          </div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--on-surface-variant)", marginBottom: 24, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Welcome back, {authenticatedUser.name}
          </p>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--on-surface)", letterSpacing: "-0.03em", marginBottom: 8 }}>
            Choose Your Experience
          </h2>
          <p style={{ fontSize: "1.125rem", color: "var(--on-surface-variant)", marginBottom: 48 }}>
            Select how you want to travel today.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            {/* One Day Trip Card */}
            <div style={S.largeCard}>
              <div style={S.largeCardImgWrap}>
                <img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=800" alt="City Transit" style={S.largeCardImg} />
                <div style={S.largeCardGradient} />
                <div style={S.largeCardIcon}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>route</span>
                </div>
                <div style={S.largeCardImgText}>
                  <p style={{ fontSize: "0.625rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Transportation</p>
                  <h3 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>One Day Trip</h3>
                </div>
              </div>
              <div style={S.largeCardContent}>
                <p style={{ fontSize: "0.9375rem", color: "var(--on-surface-variant)", lineHeight: 1.6, marginBottom: 24, minHeight: 60 }}>
                  For the independent explorer. Access real-time transport suggestions, optimized walking paths through Mylapore, and local transit schedules across Chennai.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                  <div style={S.featureRow}><span className="material-symbols-outlined" style={S.featureIcon}>directions_bus</span><span style={S.featureText}>Smart Local Transit Sync</span></div>
                  <div style={S.featureRow}><span className="material-symbols-outlined" style={S.featureIcon}>map</span><span style={S.featureText}>Offline Route Suggestions</span></div>
                </div>
                <button style={S.largeCardBtn} onClick={() => handleServiceSelect("travel_only")}>
                  Begin Journey <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Full Experience Card */}
            <div style={S.largeCard}>
              <div style={S.largeCardImgWrap}>
                <img src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=800" alt="Villa" style={S.largeCardImg} />
                <div style={S.largeCardGradient} />
                <div style={S.largeCardIcon}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>card_travel</span>
                </div>
                <div style={S.largeCardImgText}>
                  <p style={{ fontSize: "0.625rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Full Package Services</p>
                  <h3 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Full Experience</h3>
                </div>
              </div>
              <div style={S.largeCardContent}>
                <p style={{ fontSize: "0.9375rem", color: "var(--on-surface-variant)", lineHeight: 1.6, marginBottom: 24, minHeight: 60 }}>
                  Curated for the premium wayfarer. Includes boutique stays in Chengalpattu, VIP access to heritage landmarks, and a personalized 5-day itinerary.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                  <div style={S.featureRow}><span className="material-symbols-outlined" style={S.featureIcon}>bed</span><span style={S.featureText}>Curated Boutique Stays</span></div>
                  <div style={S.featureRow}><span className="material-symbols-outlined" style={S.featureIcon}>local_activity</span><span style={S.featureText}>All-access Landmark Pass</span></div>
                </div>
                <button style={{ ...S.largeCardBtn, background: "#0a192f" }} onClick={() => handleServiceSelect("full_package")}>
                  Go Premium <span className="material-symbols-outlined" style={{ fontSize: 18 }}>workspace_premium</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Login View ── */
  return (
    <div style={S.page}>
      <div style={S.bgBlur1} />
      <div style={S.bgBlur2} />
      <main style={S.splitMain}>
        {/* Brand Side (desktop) */}
        <div style={S.brandSide}>
          <div style={S.brandContent}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--primary)" }}>explore</span>
              <h1 style={{ fontSize: "3rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.04em" }}>Horizon Hopper</h1>
            </div>
            <p style={{ fontSize: "1.125rem", color: "var(--on-surface-variant)", maxWidth: 440, lineHeight: 1.6 }}>
              Experience the art of effortless travel. Curate your journey with precision and rediscover the joy of exploring Tamil Nadu.
            </p>
            <div style={S.heroImgWrap}>
              <img src={HERO_IMG} alt="Tamil Nadu Coast" style={S.heroImg} />
              <div style={S.heroImgOverlay} />
              <div style={S.heroImgText}>
                <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>Tamil Nadu, India</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.15em" }}>Premium Destination</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Card Side */}
        <div style={S.loginSide}>
          <div className="glass-card" style={S.loginCard}>
            {/* Mobile logo */}
            <div style={S.mobileLogo}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--primary)" }}>explore</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.04em" }}>Horizon Hopper</span>
            </div>

            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--on-surface)", marginBottom: 8 }}>Welcome back</h2>
              <p style={{ color: "var(--on-surface-variant)" }}>Choose your traveler profile to continue.</p>
            </div>

            {/* Profile Selector */}
            {users.length > 0 && (
              <div style={S.profileGrid}>
                {users.map((u, i) => {
                  const isActive = selectedUser?.id === u.id;
                  return (
                    <button key={u.id} style={S.profileBtn} onClick={() => pickUser(u)}>
                      <div style={{
                        width: 64, height: 64, borderRadius: 16, overflow: "hidden",
                        border: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                        boxShadow: isActive ? "0 0 0 4px rgba(0,104,95,0.1)" : "var(--shadow-sm)",
                        transform: isActive ? "scale(1.05)" : "scale(1)",
                        transition: "all 0.2s ease",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isActive ? "var(--primary)" : "var(--surface-container-high)",
                        color: isActive ? "#fff" : "var(--primary)",
                        fontSize: "1.5rem", fontWeight: 700
                      }}>
                        {u.name.charAt(0)}
                      </div>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: isActive ? "var(--primary)" : "var(--on-surface-variant)", textAlign: "center" }}>
                        {u.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={S.label}>Username</label>
                <div style={S.inputWrap}>
                  <span className="material-symbols-outlined" style={S.inputIcon}>person</span>
                  <input style={S.input} placeholder="Enter username" value={username}
                    onChange={e => setUsername(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                  <label style={S.label}>Password</label>
                </div>
                <div style={S.inputWrap}>
                  <span className="material-symbols-outlined" style={S.inputIcon}>lock</span>
                  <input type="password" style={S.input} placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Signing in…" : "Sign In"}
                {!loading && <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>}
              </button>
              {error && <p style={S.errorText}>{error}</p>}
            </form>

            <p style={{ marginTop: 40, textAlign: "center", fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>
              Don&apos;t have an account? <span style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer" }} onClick={() => setError("Registration is currently invite-only. Please use a demo profile above.")}>Join the hopper</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ═══ STYLES ═══ */
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #f7f9fb 0%, #e6f2f1 50%, #d1e8e6 100%)",
    position: "relative", overflow: "hidden", padding: 24,
  },
  bgBlur1: {
    position: "absolute", top: "-10%", right: "-5%", width: "40vw", height: "40vw",
    borderRadius: "50%", background: "rgba(0,104,95,0.05)", filter: "blur(120px)",
  },
  bgBlur2: {
    position: "absolute", bottom: "-10%", left: "-5%", width: "35vw", height: "35vw",
    borderRadius: "50%", background: "rgba(157,67,0,0.05)", filter: "blur(100px)",
  },
  splitMain: {
    width: "100%", maxWidth: 1100, display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 64, alignItems: "center", position: "relative", zIndex: 10,
  },
  brandSide: { display: "flex", flexDirection: "column", gap: 24, paddingRight: 64 },
  brandContent: { display: "flex", flexDirection: "column", gap: 24 },
  heroImgWrap: {
    marginTop: 16, position: "relative", borderRadius: "2rem", overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
  },
  heroImg: { width: "100%", height: 400, objectFit: "cover" as const },
  heroImgOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
  },
  heroImgText: { position: "absolute", bottom: 24, left: 24, color: "#fff" },
  loginSide: { display: "flex", justifyContent: "center" },
  loginCard: {
    width: "100%", maxWidth: 480, borderRadius: "2rem", padding: 40,
    boxShadow: "0 32px 64px -16px rgba(0,106,97,0.1)",
    border: "1px solid rgba(255,255,255,0.5)",
  },
  mobileLogo: {
    display: "none", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 40,
  },
  profileGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 40,
  },
  profileBtn: {
    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8,
    background: "none", border: "none", cursor: "pointer", transition: "all 0.2s",
  },
  label: { fontSize: "0.875rem", fontWeight: 600, color: "var(--on-surface-variant)", marginLeft: 4 },
  inputWrap: { position: "relative" as const },
  inputIcon: {
    position: "absolute" as const, left: 16, top: "50%", transform: "translateY(-50%)",
    color: "var(--outline)", fontSize: 20, transition: "color 0.2s",
  },
  input: {
    width: "100%", height: 56, paddingLeft: 48, paddingRight: 16,
    background: "rgba(255,255,255,0.5)", border: "1px solid var(--outline-variant)",
    borderRadius: 12, fontSize: "1rem", fontWeight: 400,
    color: "var(--on-surface)", transition: "all 0.2s",
  },
  submitBtn: {
    width: "100%", height: 56, background: "var(--primary)", color: "#fff",
    fontSize: "1.125rem", fontWeight: 600, borderRadius: 12,
    border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 8px 24px rgba(0,104,95,0.2)", cursor: "pointer", transition: "all 0.2s",
  },
  errorText: { color: "var(--error)", fontSize: "0.875rem", fontWeight: 600, textAlign: "center" as const },

  /* Mode selector */
  modeMain: {
    position: "relative" as const, zIndex: 10, textAlign: "center" as const,
    maxWidth: 1000, width: "100%", marginTop: 40,
  },
  largeCard: {
    background: "#fff", borderRadius: 24, overflow: "hidden",
    boxShadow: "0 12px 32px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" as const,
    border: "1px solid rgba(0,0,0,0.05)", textAlign: "left" as const,
  },
  largeCardImgWrap: {
    position: "relative" as const, height: 280, width: "100%",
  },
  largeCardImg: {
    width: "100%", height: "100%", objectFit: "cover" as const,
  },
  largeCardGradient: {
    position: "absolute" as const, inset: 0,
    background: "linear-gradient(to top, rgba(10,25,47,0.9) 0%, rgba(10,25,47,0.2) 50%, transparent 100%)",
  },
  largeCardIcon: {
    position: "absolute" as const, top: 20, left: 20, width: 40, height: 40,
    borderRadius: "50%", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", color: "var(--on-surface)",
  },
  largeCardImgText: {
    position: "absolute" as const, bottom: 24, left: 24, right: 24,
  },
  largeCardContent: {
    padding: 32, display: "flex", flexDirection: "column" as const, flex: 1,
  },
  featureRow: { display: "flex", alignItems: "center", gap: 12 },
  featureIcon: { fontSize: 20, color: "var(--on-surface-variant)" },
  featureText: { fontSize: "0.875rem", fontWeight: 600, color: "var(--on-surface)" },
  largeCardBtn: {
    width: "100%", padding: "16px", borderRadius: 12, background: "#111827", color: "#fff",
    fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    border: "none", cursor: "pointer", marginTop: "auto",
  },
};
