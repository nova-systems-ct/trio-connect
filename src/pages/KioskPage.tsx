import { useState } from "react";
import { DEMO_STUDENTS } from "../lib/demo-data";
import type { TRIOStudent } from "../lib/types";

type Method = "id" | "qr" | "search";
type Step = "home" | "select-method" | "id-entry" | "search-entry" | "confirm" | "success";

const REASONS = [
  "Advising Meeting", "Tutoring", "Financial Aid",
  "Study Space", "Workshop", "Event",
  "Computer Use", "Quick Question", "Other",
];

export default function KioskPage() {
  const [step, setStep] = useState<Step>("home");
  const [method, setMethod] = useState<Method>("id");
  const [idInput, setIdInput] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [foundStudent, setFoundStudent] = useState<TRIOStudent | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<TRIOStudent[]>([]);

  const allStudents: TRIOStudent[] = DEMO_STUDENTS;

  function reset() {
    setStep("home");
    setIdInput("");
    setSearchInput("");
    setFoundStudent(null);
    setReason("");
    setError("");
    setSearchResults([]);
  }

  function handleIdLookup() {
    setError("");
    const found = allStudents.find(
      (s) => s.student_number === idInput.trim() || s.id === idInput.trim()
    );
    if (found) {
      setFoundStudent(found);
      setStep("confirm");
    } else {
      setError("No student found with that ID. Please try again or use Search.");
    }
  }

  function handleSearch(q: string) {
    setSearchInput(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const lower = q.toLowerCase();
    setSearchResults(
      allStudents.filter((s) =>
        s.full_name.toLowerCase().includes(lower) ||
        (s.email ?? "").toLowerCase().includes(lower) ||
        (s.student_number ?? "").toLowerCase().includes(lower)
      ).slice(0, 6)
    );
  }

  function handleCheckIn() {
    if (!foundStudent || !reason) { setError("Please select a reason."); return; }
    setStep("success");
    setTimeout(() => reset(), 4000);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0B0B0B",
      display: "flex", flexDirection: "column",
      fontFamily: "'Inter', sans-serif", userSelect: "none",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background ambient glow */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "rgba(193,18,31,0.04)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-1px" }}>TRIO Connect</p>
          <p style={{ fontSize: 12, color: "#606060", marginTop: 2 }}>Student Check-In Kiosk · Self-Service</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 12, color: "#606060" }}>Powered by</p>
          <p style={{ fontSize: 14, fontWeight: 800, background: "linear-gradient(135deg,#FFF6C5,#D4AF37,#B8860B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Nova Systems
          </p>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 40px" }}>
        <div style={{ width: "100%", maxWidth: 680, animation: "fadeIn 0.3s ease both" }}>

          {/* HOME */}
          {step === "home" && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 36, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-1px", marginBottom: 8 }}>
                Welcome to TRIO
              </p>
              <p style={{ fontSize: 16, color: "#A0A0A0", marginBottom: 48 }}>
                Select how you'd like to check in today
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[
                  { m: "id" as Method, label: "Student ID", sub: "Enter your TRIO student ID number", icon: "🪪" },
                  { m: "qr" as Method, label: "QR Code", sub: "Scan your digital student pass", icon: "📱" },
                  { m: "search" as Method, label: "Search Name", sub: "Search by your first or last name", icon: "🔍" },
                ].map(({ m, label, sub, icon }) => (
                  <button
                    key={m}
                    onClick={() => { setMethod(m); setStep(m === "qr" ? "select-method" : m === "id" ? "id-entry" : "search-entry"); }}
                    style={{
                      padding: "36px 24px", borderRadius: 20,
                      background: "#151515", border: "1.5px solid rgba(255,255,255,0.08)",
                      cursor: "pointer", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 12, transition: "all 0.15s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(193,18,31,0.4)"; e.currentTarget.style.background = "#1B1B1B"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "#151515"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <span style={{ fontSize: 42 }}>{icon}</span>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>{label}</p>
                    <p style={{ fontSize: 12, color: "#606060", lineHeight: 1.4 }}>{sub}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ID ENTRY */}
          {step === "id-entry" && (
            <div style={{ textAlign: "center" }}>
              <button onClick={reset} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", color: "#A0A0A0", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: 13, marginBottom: 32 }}>
                ← Back
              </button>
              <p style={{ fontSize: 30, fontWeight: 800, color: "#FFFFFF", marginBottom: 8 }}>Enter Your Student ID</p>
              <p style={{ fontSize: 14, color: "#606060", marginBottom: 36 }}>Your TRIO student ID number</p>
              <input
                type="text" value={idInput} onChange={(e) => setIdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleIdLookup()}
                placeholder="e.g. STU-2024-001"
                autoFocus
                style={{
                  display: "block", width: "100%", padding: "20px 24px",
                  background: "#151515", border: "2px solid rgba(255,255,255,0.1)",
                  borderRadius: 16, color: "#FFFFFF", fontSize: 22, fontWeight: 700,
                  textAlign: "center", outline: "none", fontFamily: "'Inter', sans-serif",
                  marginBottom: 16, letterSpacing: "0.05em",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#C1121F"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              {error && <p style={{ color: "#C1121F", fontSize: 13, marginBottom: 16 }}>{error}</p>}
              <button
                onClick={handleIdLookup}
                disabled={!idInput.trim()}
                style={{
                  width: "100%", padding: "18px", borderRadius: 16, border: "none",
                  background: idInput.trim() ? "#C1121F" : "#2A2A2A",
                  color: idInput.trim() ? "#FFFFFF" : "#404040",
                  fontSize: 17, fontWeight: 800, cursor: idInput.trim() ? "pointer" : "not-allowed",
                  fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
                  boxShadow: idInput.trim() ? "0 4px 20px rgba(193,18,31,0.4)" : "none",
                }}
              >
                Find My Record
              </button>
            </div>
          )}

          {/* SEARCH ENTRY */}
          {step === "search-entry" && (
            <div>
              <button onClick={reset} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", color: "#A0A0A0", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: 13, marginBottom: 32 }}>
                ← Back
              </button>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", marginBottom: 8, textAlign: "center" }}>Search Your Name</p>
              <p style={{ fontSize: 14, color: "#606060", marginBottom: 24, textAlign: "center" }}>Type your first or last name to find your record</p>
              <input
                type="text" value={searchInput} onChange={(e) => handleSearch(e.target.value)}
                placeholder="First or last name…"
                autoFocus
                style={{
                  display: "block", width: "100%", padding: "18px 24px",
                  background: "#151515", border: "2px solid rgba(255,255,255,0.1)",
                  borderRadius: 16, color: "#FFFFFF", fontSize: 20, fontWeight: 600,
                  outline: "none", fontFamily: "'Inter', sans-serif", marginBottom: 16,
                }}
                onFocus={(e) => { e.target.style.borderColor = "#C1121F"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              {searchResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {searchResults.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setFoundStudent(s); setStep("confirm"); }}
                      style={{
                        padding: "16px 20px", borderRadius: 14,
                        background: "#151515", border: "1.5px solid rgba(255,255,255,0.08)",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 16,
                        fontFamily: "'Inter', sans-serif", transition: "all 0.1s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C1121F"; e.currentTarget.style.background = "#1B1B1B"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "#151515"; }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(193,18,31,0.12)", border: "1.5px solid rgba(193,18,31,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#C1121F" }}>
                          {s.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>{s.full_name}</p>
                        <p style={{ fontSize: 12, color: "#606060" }}>{s.student_number ?? s.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchInput.length > 1 && searchResults.length === 0 && (
                <p style={{ textAlign: "center", color: "#606060", fontSize: 14, marginTop: 16 }}>No students found. Try a different spelling or use Student ID.</p>
              )}
            </div>
          )}

          {/* QR PLACEHOLDER */}
          {step === "select-method" && method === "qr" && (
            <div style={{ textAlign: "center" }}>
              <button onClick={reset} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", color: "#A0A0A0", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: 13, marginBottom: 40 }}>
                ← Back
              </button>
              <div style={{ width: 200, height: 200, borderRadius: 24, border: "2px solid rgba(255,255,255,0.1)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", background: "#151515" }}>
                <span style={{ fontSize: 60 }}>📷</span>
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF", marginBottom: 8 }}>Scan Your QR Pass</p>
              <p style={{ fontSize: 14, color: "#606060", maxWidth: 340, margin: "0 auto 24px" }}>
                Open your TRIO digital student pass and hold the QR code up to the camera.
              </p>
              <p style={{ fontSize: 12, color: "#404040" }}>Camera access required. Contact TRIO staff if you need assistance.</p>
              <button onClick={reset} style={{ marginTop: 32, padding: "12px 28px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#A0A0A0", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                Try Another Method
              </button>
            </div>
          )}

          {/* CONFIRM */}
          {step === "confirm" && foundStudent && (
            <div>
              <button onClick={() => setStep("home")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", color: "#A0A0A0", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: 13, marginBottom: 28 }}>
                ← Not you?
              </button>
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(193,18,31,0.12)", border: "2px solid rgba(193,18,31,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#C1121F" }}>
                    {foundStudent.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", marginBottom: 4 }}>{foundStudent.full_name}</p>
                <p style={{ fontSize: 13, color: "#606060" }}>{foundStudent.student_number ?? foundStudent.email}</p>
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 16, textAlign: "center" }}>
                Why are you visiting TRIO today?
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    style={{
                      padding: "14px 12px", borderRadius: 12, border: "1.5px solid",
                      borderColor: reason === r ? "#C1121F" : "rgba(255,255,255,0.08)",
                      background: reason === r ? "rgba(193,18,31,0.12)" : "#151515",
                      color: reason === r ? "#FFFFFF" : "#A0A0A0",
                      fontSize: 12, fontWeight: reason === r ? 700 : 400,
                      cursor: "pointer", fontFamily: "'Inter', sans-serif",
                      transition: "all 0.1s", textAlign: "center",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {error && <p style={{ color: "#C1121F", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</p>}
              <button
                onClick={handleCheckIn}
                style={{
                  width: "100%", padding: "18px", borderRadius: 16, border: "none",
                  background: reason ? "#C1121F" : "#2A2A2A",
                  color: reason ? "#FFFFFF" : "#404040",
                  fontSize: 17, fontWeight: 800, cursor: reason ? "pointer" : "not-allowed",
                  fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
                  boxShadow: reason ? "0 4px 20px rgba(193,18,31,0.4)" : "none",
                }}
              >
                Complete Check-In
              </button>
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && foundStudent && (
            <div style={{ textAlign: "center", animation: "scaleIn 0.3s ease both" }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid #22C55E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 0 40px rgba(34,197,94,0.2)" }}>
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p style={{ fontSize: 32, fontWeight: 900, color: "#FFFFFF", marginBottom: 8 }}>Checked In!</p>
              <p style={{ fontSize: 18, color: "#22C55E", fontWeight: 700, marginBottom: 4 }}>{foundStudent.full_name}</p>
              <p style={{ fontSize: 14, color: "#A0A0A0", marginBottom: 8 }}>{reason}</p>
              <p style={{ fontSize: 14, color: "#D4AF37" }}>
                {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
              </p>
              <p style={{ fontSize: 12, color: "#404040", marginTop: 32 }}>Returning to home screen…</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 40px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: "#303030" }}>TRIO Connect Kiosk · FERPA-compliant check-in</p>
        <p style={{ fontSize: 11, color: "#303030" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}
