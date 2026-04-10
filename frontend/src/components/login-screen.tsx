"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ServiceMode, UserProfile } from "@/lib/types";
import { writeSession } from "@/lib/session";

/* ─── img urls from stitch exports ─── */
const HERO_TRAVEL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCwp0B-0anDdktP_GNnTVBpL5Sh4N81_eL8KyeYKQVZXvOcYuv1UXIDvx5ZIq9B9vJarPBFNBg2IP3ys09N_wloyK5AHN8XC4JizmeT1-gC-kklA1_PRKuCsNrS3RLmRxvFk1GPmXvR5HEsMmg-6BrW1QDG7hxc1ZCT0Eb1Mmn6L_Iw5iCRKi7CfiPAYYxI-8ChbEUZh3Y3VHQPckvuJYeyiJkvi0mox9W0SEQMHuH-4bjXtSAsr9RVnOwRKzuQyYKgsy1ika54bcIh";
const HERO_FULL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAiOT6nGLfsXU4h6kUExBur5e7Vmy3jLeleAO4GZzPwHnSjCyWnmU21f-nT8InjoMXvcQu1akDaAhAtwBShfevpaVor6dkSXOC3d-G9PEyTh4C_jMeUBKqEqDhGFzprkLsxp3Ysfr7lfkV-UEzFcDkfcsSIT1Mspr7HtRe668n3LSY-OpYOXnWxE7O9CJ7pCpYSgs7keapfWZYG-aVXKFyOVRMdQfHCJgNhy1v9VXeofSjU6khz1ViA2V7j6Foz1Wxx_ilOuwJPrJOI";

/* ─── styles ─── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "var(--background)",
  },

  /* ── header ── */
  header: {
    position: "fixed",
    top: 0,
    width: "100%",
    zIndex: 50,
    height: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(253,251,247,0.8)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(10,25,49,0.05)",
  },
  headerInner: {
    width: "100%",
    maxWidth: 1440,
    padding: "0 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "var(--primary)",
    letterSpacing: "-0.03em",
  },
  navLinks: {
    display: "flex",
    gap: "2.5rem",
    alignItems: "center",
  },
  navLink: {
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    color: "var(--secondary)",
    transition: "color var(--transition-fast)",
    cursor: "pointer",
  },

  /* ── main ── */
  main: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "8rem",
    paddingBottom: "5rem",
    paddingLeft: "1.5rem",
    paddingRight: "1.5rem",
  },

  /* ── hero text ── */
  heroWrap: {
    textAlign: "center" as const,
    marginBottom: "4rem",
    maxWidth: 680,
  },
  heroTitle: {
    fontSize: "clamp(2.5rem, 5vw, 3.8rem)",
    fontWeight: 800,
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
    color: "var(--primary)",
    marginBottom: "1.5rem",
  },
  heroSub: {
    fontSize: "1.15rem",
    fontWeight: 500,
    color: "var(--secondary)",
    opacity: 0.9,
    lineHeight: 1.6,
  },

  /* ── card grid ── */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",
    gap: "2.5rem",
    width: "100%",
    maxWidth: 1100,
  },

  /* ── service card ── */
  card: {
    background: "var(--surface-container-lowest)",
    borderRadius: "var(--radius-xl)",
    padding: 12,
    boxShadow: "var(--shadow-lg)",
    transition: "transform var(--transition-slow)",
    display: "flex",
    flexDirection: "column",
    cursor: "pointer",
  },
  cardImgWrap: {
    position: "relative" as const,
    height: 380,
    width: "100%",
    overflow: "hidden",
    borderRadius: "var(--radius-lg)",
  },
  cardImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    transition: "transform var(--transition-glacial)",
  },
  cardGradient: {
    position: "absolute" as const,
    inset: 0,
    background: "linear-gradient(to top, rgba(10,25,49,0.88) 0%, rgba(10,25,49,0.18) 50%, transparent 100%)",
  },
  cardIconBubble: {
    position: "absolute" as const,
    top: 24,
    left: 24,
    width: 48,
    height: 48,
    borderRadius: "var(--radius-full)",
    background: "rgba(253,251,247,0.7)",
    backdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--primary)",
  },
  cardTextOverlay: {
    position: "absolute" as const,
    bottom: 28,
    left: 28,
    right: 28,
  },
  cardLabel: {
    fontSize: "0.6rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.7)",
  },
  cardTitle: {
    fontWeight: 800,
    fontSize: "1.75rem",
    color: "#fff",
    marginTop: 4,
    letterSpacing: "-0.02em",
  },
  cardBody: {
    padding: "2rem",
    display: "flex",
    flexDirection: "column" as const,
    flexGrow: 1,
  },
  cardDesc: {
    color: "var(--on-surface-variant)",
    marginBottom: "2rem",
    lineHeight: 1.7,
    fontWeight: 500,
  },
  cardFeatures: {
    listStyle: "none",
    marginBottom: "2.5rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  cardFeatureItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "var(--primary)",
  },
  cardBtn: {
    marginTop: "auto",
    width: "100%",
    height: 56,
    background: "var(--primary)",
    color: "#fff",
    fontWeight: 700,
    borderRadius: "var(--radius-lg)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "all var(--transition-base)",
    fontSize: "0.95rem",
  },

  /* ── login section ── */
  loginWrap: {
    marginTop: "4rem",
    textAlign: "center" as const,
  },
  loginLabel: {
    fontSize: "0.65rem",
    fontWeight: 800,
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: "var(--outline)",
    marginBottom: "2rem",
  },
  loginRow: {
    display: "flex",
    flexDirection: "row" as const,
    gap: "1.5rem",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap" as const,
  },
  loginBtn: {
    padding: "0.9rem 3rem",
    background: "var(--surface-container-high)",
    color: "var(--primary)",
    fontWeight: 700,
    borderRadius: "var(--radius-lg)",
    border: "none",
    transition: "all var(--transition-base)",
    fontSize: "0.9rem",
  },
  guestBtn: {
    padding: "0.75rem 2rem",
    color: "var(--primary)",
    fontWeight: 700,
    borderBottom: "2px solid rgba(10,25,49,0.15)",
    background: "transparent",
    transition: "all var(--transition-base)",
    fontSize: "0.9rem",
  },

  /* ── modal overlay ── */
  overlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 100,
    background: "rgba(10,25,49,0.4)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
  },
  modal: {
    background: "var(--surface-container-lowest)",
    borderRadius: "var(--radius-2xl)",
    padding: "3rem",
    width: "100%",
    maxWidth: 440,
    boxShadow: "var(--shadow-xl)",
    animation: "slideUp 0.4s var(--ease-out) both",
  },
  modalTitle: {
    fontSize: "1.75rem",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "var(--primary)",
    marginBottom: "0.5rem",
  },
  modalSub: {
    color: "var(--secondary)",
    fontSize: "0.9rem",
    marginBottom: "2rem",
    fontWeight: 500,
  },
  inputGroup: {
    marginBottom: "1.25rem",
  },
  inputLabel: {
    display: "block",
    fontSize: "0.625rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "var(--secondary)",
    marginBottom: "0.5rem",
    marginLeft: 4,
  },
  input: {
    width: "100%",
    background: "var(--surface-container)",
    border: "2px solid transparent",
    borderRadius: "var(--radius-lg)",
    padding: "1rem 1.25rem",
    fontWeight: 600,
    fontSize: "0.95rem",
    color: "var(--on-surface)",
    transition: "all var(--transition-fast)",
  },
  submitBtn: {
    width: "100%",
    padding: "1rem",
    background: "var(--primary)",
    color: "#fff",
    fontWeight: 700,
    borderRadius: "var(--radius-lg)",
    border: "none",
    fontSize: "0.9rem",
    marginTop: "0.5rem",
    transition: "all var(--transition-base)",
    cursor: "pointer",
  },
  errorText: {
    color: "var(--error)",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginTop: "0.75rem",
    textAlign: "center" as const,
  },
  userPickerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
    marginBottom: "1.5rem",
  },
  userCard: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
    padding: "1rem",
    borderRadius: "var(--radius-lg)",
    border: "2px solid transparent",
    background: "var(--surface-container-low)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    textAlign: "center" as const,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: "var(--radius-full)",
    background: "var(--primary)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "1rem",
  },
  userName: {
    fontWeight: 700,
    fontSize: "0.8rem",
    color: "var(--primary)",
  },

  /* ── footer ── */
  footer: {
    width: "100%",
    padding: "2.5rem 2rem",
    background: "var(--surface-container)",
    borderTop: "1px solid rgba(10,25,49,0.04)",
    display: "flex",
    justifyContent: "center",
  },
  footerInner: {
    width: "100%",
    maxWidth: 1440,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "1rem",
  },
  footerText: {
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--on-surface-variant)",
  },
  footerLinks: {
    display: "flex",
    gap: "2rem",
  },
  footerLink: {
    fontSize: "0.65rem",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.15em",
    color: "rgba(10,25,49,0.4)",
    transition: "color var(--transition-fast)",
    cursor: "pointer",
  },
};

/* ────────────────────────────────────────── */

export function LoginScreen() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingMode, setPendingMode] = useState<ServiceMode>("full_package");

  /* fetch sample users */
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {});
  }, []);

  const handleServiceSelect = useCallback(
    (mode: ServiceMode) => {
      setPendingMode(mode);
      setShowLogin(true);
    },
    [],
  );

  const handleGuestContinue = useCallback(() => {
    const guest: UserProfile = {
      id: "guest",
      name: "Guest",
      avatar: "G",
      memory: { avoid: [], feedback_notes: [], past_trips: [], trip_count: 0 },
    };
    writeSession({ serviceMode: "full_package", user: guest });
    router.push("/planner");
  }, [router]);

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
        if (!res.ok) {
          setError("Invalid username or password.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        writeSession({ serviceMode: pendingMode, user: data.user });
        router.push("/planner");
      } catch {
        setError("Connection failed. Is the backend running?");
      } finally {
        setLoading(false);
      }
    },
    [username, password, pendingMode, router],
  );

  const pickUser = useCallback(
    (u: UserProfile) => {
      setSelectedUser(u);
      setUsername(u.id);
      setPassword(u.id === "arjun" ? "arjun123" : u.id === "priya" ? "priya456" : "vikram789");
    },
    [],
  );

  /* ── render ── */
  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>Horizon Hopper</span>
          <div style={styles.navLinks}>
            <span style={styles.navLink}>Help</span>
            <span style={styles.navLink}>Safety</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        {/* Hero */}
        <div style={styles.heroWrap} className="animate-fade-in">
          <h1 style={styles.heroTitle}>
            Your Southern Odyssey
            <br />
            Starts Here.
          </h1>
          <p style={styles.heroSub}>
            Select your preferred way to discover the soul of Chennai and
            beyond.
          </p>
        </div>

        {/* Service cards */}
        <div style={styles.grid} className="stagger-children">
          {/* Solo Navigator */}
          <div
            style={styles.card}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-8px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <div style={styles.cardImgWrap}>
              <img
                src={HERO_TRAVEL}
                alt="Solo traveler in Chennai"
                style={styles.cardImg}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }}
              />
              <div style={styles.cardGradient} />
              <div style={styles.cardIconBubble}>
                <span className="material-symbols-outlined">route</span>
              </div>
              <div style={styles.cardTextOverlay}>
                <span style={styles.cardLabel}>Transportation &amp; Routes</span>
                <h3 style={styles.cardTitle}>One Day Trip</h3>
              </div>
            </div>
            <div style={styles.cardBody}>
              <p style={styles.cardDesc}>
                For the independent explorer. Access real-time transport
                suggestions, optimized walking paths through Mylapore, and local
                transit schedules across Chennai.
              </p>
              <ul style={styles.cardFeatures}>
                <li style={styles.cardFeatureItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>
                    directions_bus
                  </span>
                  Smart Local Transit Sync
                </li>
                <li style={styles.cardFeatureItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>
                    map
                  </span>
                  Offline Route Suggestions
                </li>
              </ul>
              <button
                style={styles.cardBtn}
                onClick={() => handleServiceSelect("travel_only")}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--primary-container)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--primary)";
                }}
              >
                Begin Journey
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Full Experience */}
          <div
            style={styles.card}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-8px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <div style={styles.cardImgWrap}>
              <img
                src={HERO_FULL}
                alt="Luxury stay in Chennai"
                style={styles.cardImg}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }}
              />
              <div style={styles.cardGradient} />
              <div style={styles.cardIconBubble}>
                <span className="material-symbols-outlined">card_travel</span>
              </div>
              <div style={styles.cardTextOverlay}>
                <span style={styles.cardLabel}>Full Package Services</span>
                <h3 style={styles.cardTitle}>Full Experience</h3>
              </div>
            </div>
            <div style={styles.cardBody}>
              <p style={styles.cardDesc}>
                Curated for the premium wayfarer. Includes boutique stays in
                Chengalpattu, VIP access to heritage landmarks, and a
                personalized itinerary.
              </p>
              <ul style={styles.cardFeatures}>
                <li style={styles.cardFeatureItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>
                    hotel
                  </span>
                  Curated Boutique Stays
                </li>
                <li style={styles.cardFeatureItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>
                    confirmation_number
                  </span>
                  All-access Landmark Pass
                </li>
              </ul>
              <button
                style={styles.cardBtn}
                onClick={() => handleServiceSelect("full_package")}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--primary-container)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--primary)";
                }}
              >
                Go Premium
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
                >
                  stars
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary login */}
        <div style={styles.loginWrap}>
          <p style={styles.loginLabel}>Already planning with us?</p>
          <div style={styles.loginRow}>
            <button
              style={styles.loginBtn}
              onClick={() => {
                setPendingMode("full_package");
                setShowLogin(true);
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--surface-container-highest)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)";
              }}
            >
              Sign In
            </button>
            <button
              style={styles.guestBtn}
              onClick={handleGuestContinue}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderBottomColor = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderBottomColor = "rgba(10,25,49,0.15)";
              }}
            >
              Guest Preview
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <p style={styles.footerText}>
            © 2025 Horizon Hopper. Experiencing Tamil Nadu.
          </p>
          <div style={styles.footerLinks}>
            <span style={styles.footerLink}>Privacy</span>
            <span style={styles.footerLink}>Terms</span>
            <span style={styles.footerLink}>Contact</span>
          </div>
        </div>
      </footer>

      {/* ── Login Modal ── */}
      {showLogin && (
        <div
          style={styles.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLogin(false);
              setError("");
            }
          }}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Authentication</h2>
            <p style={styles.modalDesc}>
              {pendingMode === "travel_only"
                ? "Sign in to access One Day Trip mode."
                : "Sign in to connect with your Travel Designer."}
            </p>

            {/* Quick user picker */}
            {users.length > 0 && (
              <>
                <p style={{ ...styles.inputLabel, marginBottom: 12 }}>
                  Quick Select
                </p>
                <div style={styles.userPickerGrid}>
                  {users.map((u) => (
                    <div
                      key={u.id}
                      style={{
                        ...styles.userCard,
                        borderColor:
                          selectedUser?.id === u.id
                            ? "var(--primary)"
                            : "transparent",
                        background:
                          selectedUser?.id === u.id
                            ? "var(--surface-container-lowest)"
                            : "var(--surface-container-low)",
                      }}
                      onClick={() => pickUser(u)}
                    >
                      <div style={styles.userAvatar}>{u.avatar}</div>
                      <span style={styles.userName}>{u.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <form onSubmit={handleLogin}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Username</label>
                <input
                  style={styles.input}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(10,25,49,0.15)";
                    (e.currentTarget as HTMLElement).style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
                  }}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Password</label>
                <input
                  type="password"
                  style={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(10,25,49,0.15)";
                    (e.currentTarget as HTMLElement).style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  ...styles.submitBtn,
                  opacity: loading ? 0.7 : 1,
                  pointerEvents: loading ? "none" : "auto",
                }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
              {error && <p style={styles.errorText}>{error}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
