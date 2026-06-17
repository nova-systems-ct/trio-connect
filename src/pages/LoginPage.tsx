import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth-context";
import { DEMO_ACCOUNTS } from "../lib/demo-data";
import { isSupabaseConfigured } from "../lib/supabase";
import ctStateLogo from "../assets/ctstate-logo.png";

type DemoRole = keyof typeof DEMO_ACCOUNTS;

const ROLE_COLORS: Record<DemoRole, string> = {
  admin:    "#A0A0A0",
  director: "#C1121F",
  advisor:  "#3B82F6",
  student:  "#22C55E",
};

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await login(email.trim(), password);
    setLoading(false);
    if (err) setError(err);
  };

  const fillDemo = (role: DemoRole) => {
    setEmail(DEMO_ACCOUNTS[role].email);
    setPassword(DEMO_ACCOUNTS[role].password);
    setShowDemo(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0B0B0B",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }} />

      {/* Ambient glow — red top left */}
      <div style={{ position: "fixed", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(193,18,31,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      {/* Ambient glow — gold bottom right */}
      <div style={{ position: "fixed", bottom: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1, animation: "fadeIn 0.4s ease both" }}>

        {/* Card */}
        <div style={{
          background: "#151515",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}>
          {/* Gold top bar */}
          <div style={{
            height: 3,
            background: "linear-gradient(90deg, #B8860B 0%, #D4AF37 20%, #F5E6A5 45%, #FFF6C5 50%, #F5E6A5 55%, #D4AF37 80%, #B8860B 100%)",
          }} />

          <div style={{ padding: "36px 36px 32px" }}>
            {/* ── Branding: TRIO first ─────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              {/* Primary: TRIO */}
              <div style={{ marginBottom: 8 }}>
                <span style={{
                  fontSize: 32, fontWeight: 900, color: "#FFFFFF",
                  letterSpacing: "-1px", lineHeight: 1,
                  display: "block",
                }}>
                  TRIO Connect
                </span>
                <span style={{
                  fontSize: 13, color: "#A0A0A0", fontWeight: 500, letterSpacing: "0.02em",
                  display: "block", marginTop: 4,
                }}>
                  Student Success Platform
                </span>
              </div>

              {/* Secondary: Nova Systems */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 12px", borderRadius: 20,
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.2)",
                marginBottom: 12,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#D4AF37" }} />
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  color: "#D4AF37", textTransform: "uppercase",
                }}>
                  Powered by Nova Systems
                </span>
              </div>

              {/* Tertiary: CT State */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: 0.45 }}>
                <img src={ctStateLogo} alt="CT State" style={{ height: 14, filter: "brightness(0) invert(1)" }} />
                <span style={{ fontSize: 10, color: "#A0A0A0", fontWeight: 500 }}>CT State Community College</span>
              </div>
            </div>

            {/* Demo banner */}
            {!isSupabaseConfigured && (
              <div style={{
                background: "rgba(193,18,31,0.08)",
                border: "1px solid rgba(193,18,31,0.2)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#C1121F", flexShrink: 0, animation: "pulse 2s ease-in-out infinite" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#C1121F" }}>Demo Mode Active</p>
                  <p style={{ fontSize: 10, color: "#A0A0A0", marginTop: 1 }}>50 students · 5 advisors · 20 events · Full demo data</p>
                </div>
                <button
                  onClick={() => setShowDemo((p) => !p)}
                  style={{
                    fontSize: 11, fontWeight: 700, color: "#C1121F",
                    background: "none", border: "1px solid rgba(193,18,31,0.3)",
                    borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                    fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
                  }}
                >
                  {showDemo ? "Hide" : "Quick Access"}
                </button>
              </div>
            )}

            {/* Demo role buttons */}
            {showDemo && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 16 }}>
                {(Object.keys(DEMO_ACCOUNTS) as DemoRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => fillDemo(role)}
                    style={{
                      padding: "8px 4px", borderRadius: 8,
                      border: `1px solid ${ROLE_COLORS[role]}30`,
                      background: `${ROLE_COLORS[role]}10`,
                      fontSize: 10, fontWeight: 700, color: ROLE_COLORS[role],
                      cursor: "pointer", textTransform: "capitalize",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}

            {/* Microsoft SSO */}
            <button disabled style={{
              width: "100%", padding: "12px 16px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: "not-allowed", opacity: 0.4, marginBottom: 18,
            }}>
              <svg width="18" height="18" viewBox="0 0 21 21">
                <path fill="#f25022" d="M0 0h10v10H0z"/><path fill="#7fba00" d="M11 0h10v10H11z"/>
                <path fill="#00a4ef" d="M0 11h10v10H0z"/><path fill="#ffb900" d="M11 11h10v10H11z"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#A0A0A0" }}>Sign in with Microsoft 365</span>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.08)", color: "#606060", letterSpacing: "0.05em" }}>SOON</span>
            </button>

            {/* OR divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize: 11, color: "#606060", fontWeight: 500 }}>or continue with email</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#A0A0A0", marginBottom: 6, letterSpacing: "0.02em" }}>
                  Email Address
                </label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="your@ctstate.edu"
                  style={{
                    width: "100%", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "11px 14px", fontSize: 14,
                    background: "#0B0B0B", color: "#FFFFFF",
                    outline: "none", boxSizing: "border-box",
                    fontFamily: "'Inter', sans-serif", transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#C1121F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(193,18,31,0.12)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#A0A0A0", letterSpacing: "0.02em" }}>Password</label>
                  <button type="button" style={{ fontSize: 11, color: "#C1121F", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••••••"
                  style={{
                    width: "100%", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "11px 14px", fontSize: 14,
                    background: "#0B0B0B", color: "#FFFFFF",
                    outline: "none", boxSizing: "border-box",
                    fontFamily: "'Inter', sans-serif", transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#C1121F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(193,18,31,0.12)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              {error && (
                <div style={{
                  background: "rgba(193,18,31,0.1)", border: "1px solid rgba(193,18,31,0.3)",
                  borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#FF4444",
                  fontWeight: 500, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10,
                  background: loading ? "#333" : "#C1121F",
                  color: "#FFFFFF", fontWeight: 700, fontSize: 14,
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(193,18,31,0.35)",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#A00E18"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(193,18,31,0.45)"; }}}
                onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = "#C1121F"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(193,18,31,0.35)"; }}}
              >
                {loading ? (
                  <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Signing in…</>
                ) : (
                  <>Sign In<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></>
                )}
              </button>
            </form>

            {/* Demo credentials */}
            {!isSupabaseConfigured && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#606060", textAlign: "center", marginBottom: 10 }}>
                  Demo Credentials
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {(Object.entries(DEMO_ACCOUNTS) as [DemoRole, typeof DEMO_ACCOUNTS[DemoRole]][]).map(([role, acct]) => (
                    <div key={role} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px", borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10,
                        background: `${ROLE_COLORS[role]}20`, color: ROLE_COLORS[role],
                        textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0,
                        border: `1px solid ${ROLE_COLORS[role]}30`,
                      }}>{role}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 10, color: "#A0A0A0", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acct.email}</p>
                        <p style={{ fontSize: 10, color: "#606060", fontFamily: "monospace" }}>{acct.password}</p>
                      </div>
                      <button
                        onClick={() => fillDemo(role)}
                        style={{
                          fontSize: 10, fontWeight: 700, color: "#C1121F",
                          background: "none", border: "1px solid rgba(193,18,31,0.3)",
                          borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >Use</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: "#404040", marginTop: 16 }}>
          FERPA Compliant · AES-256 Encrypted · Nova Systems
        </p>
      </div>
    </div>
  );
}
