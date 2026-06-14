import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth-context";
import { DEMO_ACCOUNTS } from "../lib/demo-data";
import { isSupabaseConfigured } from "../lib/supabase";
import ctStateLogo from "../assets/ctstate-logo.png";

const NAVY = "#1B3A6B";
const GOLD = "#C5A028";

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

  const fillDemo = (role: "director" | "advisor" | "student") => {
    const acct = DEMO_ACCOUNTS[role];
    setEmail(acct.email);
    setPassword(acct.password);
    setShowDemo(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${NAVY} 0%, #0F2040 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "44px 44px", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <img src={ctStateLogo} alt="CT State" style={{ height: 36, marginBottom: 10 }} />
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD }} />
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: NAVY }}>TRIO Connect</span>
            </div>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", textAlign: "center", marginBottom: 6 }}>Sign In</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", textAlign: "center", marginBottom: 28 }}>Student Success Operating System</p>

          {!isSupabaseConfigured && (
            <div style={{ background: "#FFF9E6", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#92400E" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#92400E" }}>Demo Mode</p>
                <p style={{ fontSize: 10, color: "#B45309", marginTop: 1 }}>50 students · 5 advisors · full demo data</p>
              </div>
              <button onClick={() => setShowDemo((p) => !p)} style={{ fontSize: 11, fontWeight: 700, color: NAVY, background: "none", border: "1px solid #FDE68A", borderRadius: 6, padding: "4px 8px", cursor: "pointer", whiteSpace: "nowrap" }}>
                Quick Login
              </button>
            </div>
          )}

          {showDemo && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["director", "advisor", "student"] as const).map((role) => (
                <button key={role} onClick={() => fillDemo(role)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 11, fontWeight: 700, color: "#475569", cursor: "pointer", textTransform: "capitalize" }}>
                  {role}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748B", display: "block", marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@ctstate.edu"
                style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", fontSize: 14, background: "#F8FAFC", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => e.currentTarget.style.borderColor = NAVY}
                onBlur={(e) => e.currentTarget.style.borderColor = "#E2E8F0"} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748B", display: "block", marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••••••"
                style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", fontSize: 14, background: "#F8FAFC", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => e.currentTarget.style.borderColor = NAVY}
                onBlur={(e) => e.currentTarget.style.borderColor = "#E2E8F0"} />
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "13px", borderRadius: 10, background: loading ? "#94A3B8" : NAVY, color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {!isSupabaseConfigured && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #F1F5F9" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", textAlign: "center", marginBottom: 12 }}>Demo Credentials</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(Object.entries(DEMO_ACCOUNTS) as ["director" | "advisor" | "student", typeof DEMO_ACCOUNTS[keyof typeof DEMO_ACCOUNTS]][]).map(([role, acct]) => (
                  <div key={role} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "#F8FAFC" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: role === "director" ? NAVY : role === "advisor" ? "#7C3AED" : "#059669", color: "#fff", textTransform: "capitalize", flexShrink: 0 }}>{role}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, color: "#475569", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acct.email}</p>
                      <p style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>{acct.password}</p>
                    </div>
                    <button onClick={() => fillDemo(role)}
                      style={{ fontSize: 10, fontWeight: 700, color: NAVY, background: "none", border: "1px solid #E2E8F0", borderRadius: 6, padding: "3px 7px", cursor: "pointer" }}>
                      Use
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 20 }}>
          CT State Community College · TRIO Student Support Services
        </p>
      </div>
    </div>
  );
}
