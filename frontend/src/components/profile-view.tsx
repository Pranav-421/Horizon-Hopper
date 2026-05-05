"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MemorySummary } from "@/lib/types";
import { clearSession, readSession } from "@/lib/session";
import { SharedHeader } from "@/components/shared-header";

const PROFILE_IMG =
  "https://lh3.googleusercontent.com/aida/ADBb0uj88jshewUxsNqCCY9GFJCPyKM_IQxTZq-W6-J97E2x7qlYodugp5p4rHscGwSa-Mp4BjhCGQLQbwfQupmsyw4wyBG06fId3gcNBumLiQVjWTn8mP6IO5R_PoMMUgRsQHDz74kyM_qdPGGZjO6k75gp3jDS9LHQdNVbPTuCcarbRz7HxgnIq64necZQJzcf48UjEjkjyazCjRYdv9LXNewRfA2C4K9vKqLXVOZmjSW4mi-F5SZTlk5mGQzbR8Y_Gfmad19T5Fp2";
const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLwGCQZ_IyLgeoBC-wUSpAOJeOKf6QuMERQ_1b-ZTqePma_i90dXqc_vWYs69TJUwFL_lMYL5laLiB_fqtoXAlTRMVGHSLMBmI3Alyj2cICBNYA0nkGT7gKI6HX40-gy1M4ShrBWksPmw5HHwDUI3iz23HmqKoIuL5izalV5DxHFznRv5v32JM5koJMb7tPXVStH3MXeXWuTI7yZnTpA6YPSio9m_5JFqR2yfFHdRuAbZ7WLByfbZ8Pde7y0dm4RQ2j7-ivFA61rE";

export function ProfileView() {
  const router = useRouter();
  const session = useMemo(() => readSession(), []);
  const [memory, setMemory] = useState<MemorySummary | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Open edit mode if query param is present
    if (window.location.search.includes("edit=true")) {
      setIsEditing(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!session) { router.replace("/"); return; }
    fetch(`/api/users/${session.user.id}/memory`)
      .then((r) => r.json())
      .then((d) => {
        const mem = d?.preferred_transport !== undefined ? d : d?.memory ?? session.user.memory;
        setMemory(mem);
      })
      .catch(() => setMemory(session.user.memory));
  }, [session, router, mounted]);

  if (!mounted || !session) return null;
  const user = session.user;

  const dnaItems = [
    { label: "Preferred Transport", value: memory?.preferred_transport || "Train", pct: 88 },
    { label: "Food Preference", value: memory?.food_preference || "Vegetarian", pct: 92 },
    { label: "Budget Range", value: memory?.budget_range || "Mid-range", pct: 65 },
  ];

  const tags = [
    memory?.preferred_transport || "Train Travel",
    memory?.food_preference || "Local Cuisine",
    memory?.accommodation_type || "Budget Stay",
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <SharedHeader active="profile" />

      <main style={{ paddingTop: 112, paddingBottom: 96, maxWidth: 1280, margin: "0 auto", padding: "112px 24px 96px" }}>
        {/* ── Profile Header ── */}
        <section style={S.profileHeader} className="animate-fade-in">
          <div style={{ position: "relative" }}>
            <div style={S.avatarWrap}>
              <img src={PROFILE_IMG} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={S.premiumBadge}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>verified</span>
              Premium
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "3rem", fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 8 }}>{user.name}</h1>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, alignItems: "center" }}>
              <span style={{ fontSize: "1.125rem", color: "var(--tertiary)", fontWeight: 500 }}>{memory?.trip_count ?? 0} Trips</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--outline-variant)" }} />
              <span style={{ fontSize: "1.125rem", color: "var(--tertiary)", fontWeight: 500 }}>Explorer</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--outline-variant)" }} />
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--primary)", fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                Tamil Nadu
              </span>
            </div>
          </div>
          <button style={S.editBtn} onClick={() => setIsEditing(true)}>
            <span className="material-symbols-outlined">edit</span>
            Edit Profile
          </button>
        </section>

        {/* ── Bento Grid ── */}
        <div style={S.bentoGrid}>
          {/* Travel DNA Card */}
          <div style={S.dnaCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Travel DNA</h3>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>analytics</span>
            </div>
            <p style={{ color: "var(--on-surface-variant)", marginBottom: 32 }}>Your core preferences analyzed from past journeys.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {dnaItems.map(item => (
                <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", fontWeight: 600 }}>
                    <span style={{ color: "var(--on-surface-variant)" }}>{item.label}</span>
                    <span style={{ color: "var(--primary)", fontWeight: 700 }}>{item.pct}% Match</span>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "var(--surface-container)", borderRadius: 9999, overflow: "hidden" }}>
                    <div style={{ width: `${item.pct}%`, height: "100%", background: "var(--primary)", borderRadius: 9999 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 32 }}>
              {tags.map(tag => (
                <span key={tag} style={S.tagChip}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Memory Notes Card */}
          <div style={S.memoryCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Memory Notes</h3>
              <div style={S.aiBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>auto_awesome</span>
                AI Personalization
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {(memory?.avoid ?? []).concat(memory?.feedback_notes ?? []).slice(0, 4).map((note, i) => (
                <div key={i} style={S.noteItem}>
                  <p style={{ fontSize: "1rem", color: "var(--on-surface-variant)", fontStyle: "italic", lineHeight: 1.6 }}>
                    &ldquo;{note}&rdquo;
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--outline)" }}>Learned from trips</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--outline)", cursor: "pointer" }}>toggle_on</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--outline)", cursor: "pointer" }}>delete</span>
                    </div>
                  </div>
                </div>
              ))}
              {(memory?.avoid ?? []).length === 0 && (memory?.feedback_notes ?? []).length === 0 && (
                <div style={{ ...S.noteItem, gridColumn: "1 / -1", textAlign: "center" }}>
                  <p style={{ color: "var(--outline)", fontStyle: "italic" }}>No memory notes yet. Start planning trips to build your AI profile!</p>
                </div>
              )}
            </div>
          </div>

          {/* Trip History */}
          <div style={S.historyCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Recent Itineraries</h3>
              <button style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>View All History</button>
            </div>
            {memory?.past_trips && memory.past_trips.length > 0 ? (
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--surface-container)" }}>
                    <th style={S.th}>DESTINATION</th>
                    <th style={S.th}>DATE</th>
                    <th style={S.th}>TYPE</th>
                    <th style={S.th}>RATING</th>
                  </tr>
                </thead>
                <tbody>
                  {memory.past_trips.slice(0, 5).map((trip, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--surface-container-low)" }}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 700, color: "var(--on-surface)" }}>{trip.input || "Trip"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--outline)" }}>{trip.intent?.replace(/_/g, " ")}</div>
                      </td>
                      <td style={S.td}>{trip.date}</td>
                      <td style={S.td}>
                        <span style={S.statusBadge}>Completed</span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", color: "var(--primary)" }}>
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: s <= 4 ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "var(--outline)", textAlign: "center", padding: 32 }}>No past trips yet. Start exploring!</p>
            )}
          </div>

          {/* CTA Banner */}
          <div style={S.ctaBanner}>
            <div style={S.ctaBannerBg}>
              <img src={HERO_IMG} alt="Travel" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.6), transparent)" }} />
            </div>
            <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 48px", color: "#fff" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 8 }}>Ready for your next trip?</h2>
              <p style={{ fontSize: "1.125rem", opacity: 0.9, maxWidth: 500, marginBottom: 24 }}>Our AI has curated recommendations based on your Travel DNA.</p>
              <button style={S.ctaBtn} onClick={() => router.push("/planner")}>
                Explore Recommendations
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Edit Profile Modal ── */}
      {isEditing && (
        <div style={S.modalOverlay} onClick={() => setIsEditing(false)}>
          <div style={S.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24, color: "var(--on-surface)" }}>Edit Profile & Settings</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--on-surface-variant)", marginBottom: 8 }}>Name</label>
                <input type="text" defaultValue={user.name} style={S.input} />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--on-surface-variant)", marginBottom: 8 }}>Email</label>
                <input type="email" defaultValue={user.email} style={S.input} disabled />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--on-surface-variant)", marginBottom: 8 }}>Preferred Transport</label>
                <select defaultValue={memory?.preferred_transport} style={S.input}>
                  <option value="Train">Train</option>
                  <option value="Flight">Flight</option>
                  <option value="Bus">Bus</option>
                  <option value="Car">Car</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--on-surface-variant)", marginBottom: 8 }}>Food Preference</label>
                <select defaultValue={memory?.food_preference} style={S.input}>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Any">Any</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
              <button style={S.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
              <button style={S.saveBtn} onClick={() => setIsEditing(false)}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ STYLES ═══ */
const S: Record<string, React.CSSProperties> = {
  profileHeader: {
    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 24, marginBottom: 64,
  },
  avatarWrap: {
    width: 160, height: 160, borderRadius: "50%", overflow: "hidden",
    border: "4px solid white", boxShadow: "var(--ambient-shadow)",
  },
  premiumBadge: {
    position: "absolute" as const, bottom: 8, right: 8,
    background: "var(--secondary-container)", color: "var(--on-secondary-container)",
    padding: "4px 12px", borderRadius: 9999, fontSize: "0.875rem", fontWeight: 600,
    display: "flex", alignItems: "center", gap: 4, boxShadow: "var(--shadow-md)",
  },
  editBtn: {
    background: "var(--primary)", color: "#fff", padding: "14px 32px", borderRadius: 12,
    fontWeight: 600, display: "flex", alignItems: "center", gap: 12,
    boxShadow: "var(--shadow-md)", cursor: "pointer", transition: "all 0.2s",
  },

  bentoGrid: { display: "grid", gridTemplateColumns: "5fr 7fr", gap: 24 },
  dnaCard: {
    gridColumn: "1", background: "var(--surface-container-lowest)", borderRadius: 12,
    padding: 24, boxShadow: "var(--ambient-shadow)", border: "1px solid var(--surface-container)",
  },
  memoryCard: {
    gridColumn: "2", background: "var(--surface-container-lowest)", borderRadius: 12,
    padding: 24, boxShadow: "var(--ambient-shadow)", border: "1px solid var(--surface-container)",
  },
  historyCard: {
    gridColumn: "1 / -1", background: "var(--surface-container-lowest)", borderRadius: 12,
    padding: 24, boxShadow: "var(--ambient-shadow)", border: "1px solid var(--surface-container)",
    overflow: "hidden", marginTop: 0,
  },
  ctaBanner: {
    gridColumn: "1 / -1", position: "relative" as const, height: 256, borderRadius: 12,
    overflow: "hidden", boxShadow: "var(--ambient-shadow)",
  },
  ctaBannerBg: { position: "absolute" as const, inset: 0, zIndex: 0 },

  tagChip: {
    padding: "8px 16px", background: "rgba(0,104,95,0.06)", color: "var(--primary)",
    fontSize: "0.875rem", fontWeight: 700, borderRadius: 9999,
  },
  aiBadge: {
    background: "rgba(0,104,95,0.06)", padding: "4px 12px", borderRadius: 9999,
    fontSize: "0.875rem", fontWeight: 600, color: "var(--primary)",
    display: "flex", alignItems: "center", gap: 4,
  },
  noteItem: {
    padding: 16, background: "var(--surface-container-low)", borderRadius: 8,
    border: "1px solid var(--surface-container)", display: "flex", flexDirection: "column" as const,
    justifyContent: "space-between",
  },
  th: { paddingBottom: 16, fontWeight: 600, color: "var(--outline)", fontSize: "0.875rem", letterSpacing: "0.05em" },
  td: { padding: "16px 0", fontSize: "1rem", color: "var(--on-surface-variant)" },
  statusBadge: {
    padding: "4px 12px", background: "rgba(16,185,129,0.08)", color: "#059669",
    fontSize: "0.75rem", fontWeight: 700, borderRadius: 9999, border: "1px solid rgba(16,185,129,0.15)",
  },
  ctaBtn: {
    background: "var(--secondary-container)", color: "var(--on-secondary-container)", padding: "14px 32px",
    borderRadius: 12, fontWeight: 700, border: "none", cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)", transition: "transform 0.2s",
    width: "fit-content",
  },
  modalOverlay: {
    position: "fixed" as const, top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modalContent: {
    background: "var(--surface-container-lowest)", padding: 40, borderRadius: 24,
    width: "100%", maxWidth: 500, boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
    animation: "fadeSlideDown 0.2s ease-out",
  },
  input: {
    width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--surface-container-high)",
    background: "var(--surface)", color: "var(--on-surface)", fontSize: "1rem", outline: "none",
  },
  cancelBtn: {
    padding: "12px 24px", borderRadius: 12, border: "1px solid var(--surface-container-high)",
    background: "transparent", color: "var(--on-surface-variant)", fontWeight: 600, cursor: "pointer",
  },
  saveBtn: {
    padding: "12px 24px", borderRadius: 12, border: "none",
    background: "var(--primary)", color: "#fff", fontWeight: 600, cursor: "pointer",
  },
};
