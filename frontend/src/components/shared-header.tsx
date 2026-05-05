"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { clearSession, readSession } from "@/lib/session";

const PROFILE_IMG =
  "https://lh3.googleusercontent.com/aida/ADBb0uj88jshewUxsNqCCY9GFJCPyKM_IQxTZq-W6-J97E2x7qlYodugp5p4rHscGwSa-Mp4BjhCGQLQbwfQupmsyw4wyBG06fId3gcNBumLiQVjWTn8mP6IO5R_PoMMUgRsQHDz74kyM_qdPGGZjO6k75gp3jDS9LHQdNVbPTuCcarbRz7HxgnIq64necZQJzcf48UjEjkjyazCjRYdv9LXNewRfA2C4K9vKqLXVOZmjSW4mi-F5SZTlk5mGQzbR8Y_Gfmad19T5Fp2";

const NOTIFICATIONS = [
  { id: 1, icon: "flight_takeoff", title: "Trip to Mahabalipuram confirmed", desc: "Your itinerary for May 10 is ready.", time: "2 min ago", unread: true },
  { id: 2, icon: "local_offer", title: "20% off stays in Ooty", desc: "Exclusive deal on boutique hill-station retreats.", time: "1 hr ago", unread: true },
  { id: 3, icon: "rate_review", title: "Rate your Kanchipuram trip", desc: "Share your experience to improve future plans.", time: "3 hrs ago", unread: false },
  { id: 4, icon: "update", title: "Itinerary updated", desc: "Your Chennai day-trip plan has new dining spots.", time: "Yesterday", unread: false },
  { id: 5, icon: "emoji_events", title: "Explorer badge unlocked!", desc: "You've planned 5 trips. Keep exploring!", time: "2 days ago", unread: false },
];

export function SharedHeader({ active }: { active: "explore" | "profile" }) {
  const router = useRouter();
  const session = readSession();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showNotifs, setShowNotifs] = useState(false);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("horizon_theme") as "light" | "dark" | null;
    if (saved) { setTheme(saved); document.documentElement.setAttribute("data-theme", saved); }
  }, []);

  /* Close panel on outside click */
  useEffect(() => {
    if (!showNotifs) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifs]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("horizon_theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  const unreadCount = NOTIFICATIONS.filter(n => n.unread && !readIds.has(n.id)).length;

  const markAllRead = () => setReadIds(new Set(NOTIFICATIONS.map(n => n.id)));

  return (
    <header style={H.header}>
      <div style={H.inner}>
        <span style={H.logo} onClick={() => router.push("/planner")}>Horizon Hopper</span>
        <nav style={H.nav}>
          <a style={active === "explore" ? H.navActive : H.navLink} onClick={() => router.push("/planner")}>Explore</a>
          <a style={H.navLink} onClick={() => window.scrollTo({ top: 9999, behavior: "smooth" })}>Itinerary</a>
          <a style={active === "profile" ? H.navActive : H.navLink} onClick={() => router.push("/profile")}>Profile</a>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={toggleTheme} style={{ cursor: "pointer", color: "var(--on-surface-variant)" }}>
            <span className="material-symbols-outlined">{theme === "light" ? "dark_mode" : "light_mode"}</span>
          </button>

          {/* ── Notification Bell ── */}
          <div style={{ position: "relative" }} ref={panelRef}>
            <button
              onClick={() => setShowNotifs(prev => !prev)}
              style={{ cursor: "pointer", color: "var(--on-surface-variant)", position: "relative" }}
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span style={H.badge}>{unreadCount}</span>
              )}
            </button>

            {/* ── Notification Panel ── */}
            {showNotifs && (
              <div style={H.notifPanel}>
                <div style={H.notifHeader}>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--on-surface)" }}>Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={H.markReadBtn}>Mark all read</button>
                  )}
                </div>
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {NOTIFICATIONS.map(n => {
                    const isUnread = n.unread && !readIds.has(n.id);
                    return (
                      <div
                        key={n.id}
                        style={{
                          ...H.notifItem,
                          background: isUnread ? "rgba(0,104,95,0.04)" : "transparent",
                        }}
                        onClick={() => setReadIds(prev => new Set(prev).add(n.id))}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: isUnread ? "var(--primary)" : "var(--surface-container)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: isUnread ? "#fff" : "var(--on-surface-variant)" }}>{n.icon}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "0.875rem", fontWeight: isUnread ? 700 : 500, color: "var(--on-surface)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</p>
                          <p style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)", opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.desc}</p>
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--outline)", whiteSpace: "nowrap", flexShrink: 0 }}>{n.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <img src={PROFILE_IMG} alt="avatar" style={H.avatar} onClick={() => router.push("/profile")} />
          <button style={{ color: "var(--on-surface-variant)", cursor: "pointer" }} onClick={() => { clearSession(); router.replace("/"); }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

const H: Record<string, React.CSSProperties> = {
  header: {
    position: "fixed", top: 0, width: "100%", zIndex: 50, height: 72,
    background: "var(--header-bg)", backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
  },
  inner: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 48px", height: "100%", maxWidth: 1440, margin: "0 auto",
  },
  logo: { fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.03em", cursor: "pointer" },
  nav: { display: "flex", gap: 32 },
  navLink: { color: "var(--on-surface-variant)", fontWeight: 500, cursor: "pointer", transition: "color 0.2s", fontSize: "0.9375rem" },
  navActive: { color: "var(--primary)", fontWeight: 600, cursor: "pointer", fontSize: "0.9375rem", borderBottom: "2px solid var(--primary)", paddingBottom: 4 },
  avatar: { width: 36, height: 36, borderRadius: "50%", objectFit: "cover" as const, cursor: "pointer", border: "2px solid var(--primary-fixed-dim)" },

  /* notification badge */
  badge: {
    position: "absolute" as const, top: -4, right: -6,
    width: 18, height: 18, borderRadius: "50%", background: "#ef4444",
    color: "#fff", fontSize: "0.65rem", fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px solid var(--background)",
  },

  /* notification panel */
  notifPanel: {
    position: "absolute" as const, top: "calc(100% + 12px)", right: 0,
    width: 380, background: "var(--surface-container-lowest)",
    borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)",
    overflow: "hidden", zIndex: 999,
    animation: "fadeSlideDown 0.2s ease-out",
  },
  notifHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 20px", borderBottom: "1px solid var(--surface-container)",
  },
  markReadBtn: {
    background: "none", border: "none", color: "var(--primary)",
    fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
  },
  notifItem: {
    display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
    cursor: "pointer", transition: "background 0.15s",
    borderBottom: "1px solid var(--surface-container)",
  },
};
