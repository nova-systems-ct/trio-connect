import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth-context";
import { DEMO_ACCOUNTS } from "../lib/demo-data";
import { isSupabaseConfigured } from "../lib/supabase";
import ctStateLogo from "../assets/ctstate-logo.png";

type DemoRole = keyof typeof DEMO_ACCOUNTS;

const ROLE_COLORS: Record<DemoRole, string> = {
  admin:    "#111111",
  director: "#C1121F",
  advisor:  "#2563EB",
  student:  "#16A34A",
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
    const acct = DEMO_ACCOUNTS[role];
    setEmail(acct.email);
    setPassword(acct.password);
    setShowDemo(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAFAFA",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle dot grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      {/* Decorative circles — TRIO shapes, subtle */}
      <div style={{ position: "fixed", top: -120, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(193,18,31,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, left: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Main card */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}>
          {/* Gold gradient top bar */}
          <div style={{
            height: 4,
            background: "linear-gradient(90deg, #B8860B 0%, #D4AF37 20%, #F9E27D 45%, #FFF4B0 50%, #F9E27D 55%, #D4AF37 80%, #B8860B 100%)",
          }} />

          <div style={{ padding: "36px 40px 32px" }}>
            {/* Logo & branding */}
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <img src={ctStateLogo} alt="CT State" style={{ height: 30, marginBottom: 14, display: "inline-block" }} />
              <h1 style={{
                fontSize: 24, fontWeight: 800, color: "#111111",
                letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 4,
              }}>
                TRIO Success OS
              </h1>
              <p style={{ fontSize: 13, color: "#666666", marginBottom: 10 }}>
                Student Success Operating System
              </p>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 20,
                background: "#FFFBEB", border: "1px solid #F9E27D",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D4AF37" }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#92400E", textTransform: "uppercase" }}>
                  Powered by Nova Systems
                </span>
              </div>
            </div>

            {/* Demo mode banner */}
            {!isSupabaseConfigured && (
              <div style={{
                background: "#FFF4F4", border: "1px solid #FECDD3", borderRadius: 10,
                padding: "10px 14px", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C1121F", flexShrink: 0, animation: "pulse 2s ease-in-out infinite" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#C1121F" }}>Demo Mode Active</p>
                  <p style={{ fontSize: 10, color: "#9B1A25", marginTop: 1 }}>
                    50 students · 5 advisors · 20 events · Full demo data
                  </p>
                </div>
                <button
                  onClick={() => setShowDemo((p) => !p)}
                  style={{
                    fontSize: 11, fontWeight: 700, color: "#C1121F",
                    background: "none", border: "1px solid #FECDD3", borderRadius: 6,
                    padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  {showDemo ? "Hide" : "Quick Access"}
                </button>
              </div>
            )}

            {/* Demo role quick-select */}
            {showDemo && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 16 }}>
                {(Object.keys(DEMO_ACCOUNTS) as DemoRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => fillDemo(role)}
                    style={{
                      padding: "8px 4px", borderRadius: 8,
                      border: `1px solid ${ROLE_COLORS[role]}22`,
                      background: `${ROLE_COLORS[role]}08`,
                      fontSize: 10, fontWeight: 700, color: ROLE_COLORS[role],
                      cursor: "pointer", textTransform: "capitalize", lineHeight: 1,
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}

            {/* Microsoft SSO */}
            <button
              disabled
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 10,
                border: "1.5px solid #E5E7EB", background: "#F9FAFB",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                cursor: "not-allowed", opacity: 0.55, marginBottom: 18,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 21 21">
                <path fill="#f25022" d="M0 0h10v10H0z"/>
                <path fill="#7fba00" d="M11 0h10v10H11z"/>
                <path fill="#00a4ef" d="M0 11h10v10H0z"/>
                <path fill="#ffb900" d="M11 11h10v10H11z"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Sign in with Microsoft 365</span>
              <span style={{
                fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                background: "#E5E7EB", color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase",
              }}>Soon</span>
            </button>

            {/* OR divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
              <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, whiteSpace: "nowrap" }}>or continue with email</span>
              <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="your@ctstate.edu"
                  style={{
                    width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10,
                    padding: "11px 14px", fontSize: 14, background: "#FFFFFF",
                    outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif",
                    color: "#111111", transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#C1121F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(193,18,31,0.08)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Password</label>
                  <button type="button" style={{ fontSize: 11, color: "#C1121F", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••••••"
                  style={{
                    width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10,
                    padding: "11px 14px", fontSize: 14, background: "#FFFFFF",
                    outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif",
                    color: "#111111", transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#C1121F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(193,18,31,0.08)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              {error && (
                <div style={{
                  background: "#FFF4F4", border: "1px solid #FECDD3", borderRadius: 8,
                  padding: "10px 14px", fontSize: 13, color: "#C1121F", fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 8,
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
                  background: loading ? "#9CA3AF" : "#C1121F",
                  color: "#FFFFFF", fontWeight: 700, fontSize: 14,
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: loading ? "none" : "0 2px 8px rgba(193,18,31,0.28)",
                  transition: "all 0.15s", letterSpacing: "0.01em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#A00E18"; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#C1121F"; }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Demo credentials */}
            {!isSupabaseConfigured && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #F3F4F6" }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: "#9CA3AF", textAlign: "center", marginBottom: 10,
                }}>
                  Demo Credentials
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {(Object.entries(DEMO_ACCOUNTS) as [DemoRole, typeof DEMO_ACCOUNTS[DemoRole]][]).map(([role, acct]) => (
                    <div key={role} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px", borderRadius: 8, background: "#F9FAFB",
                    }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10,
                        background: ROLE_COLORS[role], color: "#fff",
                        textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0,
                      }}>
                        {role}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 10, color: "#374151", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {acct.email}
                        </p>
                        <p style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace" }}>{acct.password}</p>
                      </div>
                      <button
                        onClick={() => fillDemo(role)}
                        style={{
                          fontSize: 10, fontWeight: 700, color: "#C1121F",
                          background: "none", border: "1px solid #FECDD3", borderRadius: 6,
                          padding: "3px 8px", cursor: "pointer", fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <p style={{ fontSize: 11, color: "#9CA3AF" }}>
            CT State Community College · TRIO Student Support Services
          </p>
          <p style={{ fontSize: 10, color: "#C9D5E0", marginTop: 3 }}>
            Powered by Nova Systems · FERPA Compliant · AES-256 Encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
