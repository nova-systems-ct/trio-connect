import { useState, useEffect, useRef, useCallback } from "react";
// useCallback kept for handleKeyDown memoization
import {
  getStudents, getActivities, createActivity, updateActivity,
  getMeetings, getEvents,
} from "../lib/db";
import type { TRIOStudent, Activity, Meeting, TRIOEvent } from "../lib/types";
import { differenceInMinutes } from "date-fns";

// ── Design tokens ──────────────────────────────────────────────
const RED   = "#D72638";
const GOLD  = "#D4AF37";
const GOLDT = "linear-gradient(135deg, #FFF4B0 0%, #E6C76B 30%, #D4AF37 60%, #F7E8A4 100%)";
const GOLDB = "rgba(212,175,55,0.35)";
const CARD  = "#111111";
const CARD2 = "#181818";
const BDR   = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.45)";
const DIM   = "rgba(255,255,255,0.22)";

type Step = "home" | "found" | "submitting" | "success" | "co-success";

const REASONS = [
  { id: "Appointment / Advising Meeting", label: "Appointment",      icon: "📅" },
  { id: "Walk-In Advising",              label: "Advisor Meeting",  icon: "👤" },
  { id: "Workshop or Event",             label: "Workshop",         icon: "📚" },
  { id: "Event Attendance",              label: "Event",            icon: "🎉" },
  { id: "Study Space",                   label: "Study Space",      icon: "📖" },
  { id: "Computer Lab",                  label: "Computer Lab",     icon: "💻" },
  { id: "FAFSA Assistance",              label: "FAFSA Help",       icon: "📋" },
  { id: "Transfer Planning",             label: "Transfer Help",    icon: "🎓" },
  { id: "Career Support",                label: "Career Services",  icon: "💼" },
  { id: "General Visit",                 label: "General Visit",    icon: "🏠" },
  { id: "Other",                         label: "Other",            icon: "✦"  },
];

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name, size = 80 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const palette = ["#D72638", "#2563EB", "#7C3AED", "#059669", "#D97706"];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: palette[name.charCodeAt(0) % palette.length],
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.36, fontWeight: 900, color: "#fff" }}>{initials}</span>
    </div>
  );
}

// ── Clock ──────────────────────────────────────────────────────
function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontSize: 13, color: MUTED, letterSpacing: "0.02em" }}>
      {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
      {" · "}
      {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
// Main Kiosk
// ══════════════════════════════════════════════════════════════
export default function KioskPage() {
  const [step, setStep]             = useState<Step>("home");
  const [students, setStudents]     = useState<TRIOStudent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [meetings, setMeetings]     = useState<Meeting[]>([]);
  const [events, setEvents]         = useState<TRIOEvent[]>([]);
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<TRIOStudent[]>([]);
  const [found, setFound]           = useState<TRIOStudent | null>(null);
  const [reason, setReason]         = useState("");
  const [activeSession, setSession] = useState<Activity | null>(null);
  const [countdown, setCountdown]   = useState(5);
  const [wasCheckOut, setWasCheckOut] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().split("T")[0];

  // ── Load data ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const [s, a, m, e] = await Promise.all([
        getStudents(), getActivities(), getMeetings(), getEvents(),
      ]);
      setStudents(s);
      setActivities(a.filter((x) => x.check_in_time.startsWith(today)));
      setMeetings(m.filter((x) => x.meeting_date === today && x.status === "Scheduled"));
      setEvents(e.filter((x) => x.event_date === today && x.is_active));
    };
    load();
  }, [today]);

  // ── Auto-focus search on home ─────────────────────────────────
  useEffect(() => {
    if (step === "home") {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [step]);

  // ── Success countdown ─────────────────────────────────────────
  useEffect(() => {
    if (step !== "success" && step !== "co-success") return;
    setCountdown(5);
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(iv); reset(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [step]);

  // ── Live search ───────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) { setResults([]); return; }
    setResults(
      students.filter((s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.student_number.toLowerCase().includes(q) ||
        s.student_number.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
      ).slice(0, 6)
    );
  }, [query, students]);

  function reset() {
    setStep("home");
    setFound(null);
    setReason("");
    setSession(null);
    setWasCheckOut(false);
  }

  function selectStudent(s: TRIOStudent) {
    const sess = activities.find((a) => a.student_id === s.id && !a.check_out_time) ?? null;
    setFound(s);
    setSession(sess);
    setReason("");
    setStep("found");
  }

  // ── Scanner input handling ────────────────────────────────────
  // QR/barcode scanners behave like keyboards — they type fast then send Enter.
  // We detect rapid-fire input and treat Enter as auto-select when exactly 1 result.
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length === 1) {
        selectStudent(results[0]);
      } else if (results.length > 1) {
        // exact match on student number?
        const exact = results.find((s) => s.student_number.toLowerCase() === query.trim().toLowerCase());
        if (exact) selectStudent(exact);
      }
    }
  }, [results, query]);

  // Also watch for global keypress to wake scanner input even if field loses focus
  useEffect(() => {
    if (step !== "home") return;
    const handler = (e: KeyboardEvent) => {
      // If a printable character is pressed and input isn't focused, refocus
      if (e.key.length === 1 && document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step]);

  async function doCheckIn() {
    if (!found || !reason) return;
    setStep("submitting");
    setWasCheckOut(false);
    const appt = meetings.find((m) => m.student_id === found.id);
    const evt  = !appt ? (events[0] ?? null) : null;
    await createActivity({
      student_id:    found.id,
      student_name:  found.full_name,
      activity_type: "Walk-In Advising",
      check_in_time: new Date().toISOString(),
      location:      "TRIO Office (Kiosk)",
      notes:         reason,
      meeting_id:    appt?.id,
      event_id:      evt?.id,
    });
    setStep("success");
  }

  async function doCheckOut() {
    if (!found) return;
    setStep("submitting");
    setWasCheckOut(true);
    if (activeSession) {
      const mins = differenceInMinutes(new Date(), new Date(activeSession.check_in_time));
      await updateActivity(activeSession.id, {
        check_out_time:   new Date().toISOString(),
        duration_minutes: Math.max(1, mins),
      });
    }
    setStep("co-success");
  }

  function getDuration(): string {
    if (!activeSession) return "";
    const mins = differenceInMinutes(new Date(), new Date(activeSession.check_in_time));
    if (mins < 1) return "< 1 min";
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  // ── Shared layout ─────────────────────────────────────────────
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "#050505",
    display: "flex",
    flexDirection: "column",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
  };

  const gridBg = (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.013) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.013) 1px,transparent 1px)", backgroundSize: "80px 80px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%)", width: 1400, height: 1400, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,175,55,0.025) 0%,transparent 55%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "10%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle,rgba(215,38,56,0.03) 0%,transparent 60%)", pointerEvents: "none" }} />
    </>
  );

  // ── Top bar ───────────────────────────────────────────────────
  const topBar = (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: RED, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(215,38,56,0.25)" }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>TRIO Connect</p>
          <p style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase" }}>CT State Community College</p>
        </div>
      </div>
      <Clock />
      {step !== "home" && (
        <button onClick={reset} style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${BDR}`, background: "transparent", color: MUTED, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BDR; }}>
          ← Home
        </button>
      )}
    </div>
  );

  const footer = (
    <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
      <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.13)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Powered by Nova Systems · CT State TRIO Student Support Services
      </p>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // HOME — single search field, everything goes here
  // ══════════════════════════════════════════════════════════════
  if (step === "home") return (
    <div style={page}>
      {gridBg}{topBar}{footer}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "96px 24px 72px", position: "relative", zIndex: 1 }}>
        {/* TRIO logo mark */}
        <div style={{ width: 80, height: 80, borderRadius: 22, background: RED, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, boxShadow: "0 0 80px rgba(215,38,56,0.18)" }}>
          <svg width="42" height="42" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
          </svg>
        </div>

        <h1 style={{ fontSize: 48, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.05, textAlign: "center", margin: "0 0 10px" }}>
          Welcome to TRIO Connect
        </h1>
        <p style={{ fontSize: 18, color: MUTED, marginBottom: 52, textAlign: "center" }}>
          Student Check-In System
        </p>

        {/* Search field — the ONLY entry point */}
        <div style={{ width: "100%", maxWidth: 640, position: "relative" }}>
          <div style={{ position: "absolute", left: 22, top: "50%", transform: query ? "translateY(-60%)" : "translateY(-50%)", pointerEvents: "none", transition: "transform 0.15s" }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your name, student ID, or scan your ID card..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: CARD,
              border: `2px solid ${query ? GOLDB : BDR}`,
              borderRadius: results.length > 0 ? "20px 20px 0 0" : 20,
              padding: "22px 22px 22px 58px",
              fontSize: 18,
              color: "#fff",
              outline: "none",
              transition: "border-color 0.2s, border-radius 0.15s",
              letterSpacing: "0.01em",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = GOLDB; }}
            onBlur={(e) => { if (!results.length) e.currentTarget.style.borderColor = BDR; }}
          />
          {query && (
            <button onClick={() => setQuery("")}
              style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", color: MUTED, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>
          )}

          {/* Live results */}
          {results.length > 0 && (
            <div style={{ background: CARD, border: `2px solid ${GOLDB}`, borderTop: "none", borderRadius: "0 0 20px 20px", overflow: "hidden" }}>
              {results.map((s, i) => {
                const statusColor = s.enrollment_status === "active" ? "#22c55e" : RED;
                return (
                  <button key={s.id} onClick={() => selectStudent(s)}
                    style={{ width: "100%", background: "transparent", border: "none", padding: "16px 22px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", textAlign: "left", borderTop: i > 0 ? `1px solid ${BDR}` : "none", transition: "background 0.1s", fontFamily: "inherit" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = CARD2; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <Avatar name={s.full_name} size={48} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>{s.full_name}</p>
                      <p style={{ fontSize: 12, color: MUTED, margin: "3px 0 0" }}>
                        {s.student_number} · {s.work_location ?? "CT State"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: statusColor, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                        {s.enrollment_status}
                      </p>
                      <p style={{ fontSize: 11, color: MUTED, margin: "3px 0 0" }}>
                        {s.advisor_name ?? "Unassigned"}
                      </p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth={2} style={{ flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}

          {query.trim().length > 1 && results.length === 0 && (
            <div style={{ background: CARD, border: `2px solid ${BDR}`, borderTop: "none", borderRadius: "0 0 20px 20px", padding: "18px 22px", textAlign: "center" }}>
              <p style={{ color: MUTED, fontSize: 14 }}>No students found. Try a different name or ID number.</p>
            </div>
          )}
        </div>

        <p style={{ marginTop: 22, fontSize: 12, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Supports keyboard · QR scanner · barcode scanner
        </p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // FOUND — student card + reason grid + CHECK IN / CHECK OUT
  // ══════════════════════════════════════════════════════════════
  if (step === "found" && found) {
    const statusColor = found.enrollment_status === "active" ? "#22c55e" : RED;
    const hasSession  = !!activeSession;

    return (
      <div style={page}>
        {gridBg}{topBar}{footer}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "84px 0 100px", overflow: "auto", position: "relative", zIndex: 1 }}>

          {/* ── Student card ─────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "center", padding: "0 24px", marginBottom: 32 }}>
            <div style={{ background: CARD, border: `1px solid ${GOLDB}`, borderRadius: 20, padding: "22px 28px", display: "flex", alignItems: "center", gap: 20, maxWidth: 600, width: "100%", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2.5, background: GOLDT }} />
              <Avatar name={found.full_name} size={72} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 4px" }}>{found.full_name}</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: MUTED }}>{found.student_number}</span>
                  <span style={{ fontSize: 10, color: DIM }}>·</span>
                  <span style={{ fontSize: 12, color: MUTED }}>{found.work_location ?? "CT State"}</span>
                  <span style={{ fontSize: 10, color: DIM }}>·</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>{found.enrollment_status}</span>
                </div>
                {found.advisor_name && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, background: "rgba(212,175,55,0.08)", border: `1px solid ${GOLDB}`, borderRadius: 20, padding: "4px 12px" }}>
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    <span style={{ fontSize: 11, color: GOLD, fontWeight: 600 }}>{found.advisor_name}</span>
                  </div>
                )}
              </div>
              {hasSession && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "6px 12px" }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Active Visit</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>{getDuration()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Why are you here? ─────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 24px" }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em", marginBottom: 6, textAlign: "center" }}>
              Why are you here today?
            </p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, textAlign: "center" }}>
              Select one — then press Check In or Check Out below
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxWidth: 720, width: "100%" }}>
              {REASONS.map((r) => {
                const active = reason === r.id;
                return (
                  <button key={r.id} onClick={() => setReason(active ? "" : r.id)}
                    style={{
                      background: active ? "rgba(215,38,56,0.12)" : CARD,
                      border: `2px solid ${active ? RED : BDR}`,
                      borderRadius: 14,
                      padding: "16px 8px",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                      transform: active ? "scale(1.04)" : "scale(1)",
                    }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = GOLDB; e.currentTarget.style.background = CARD2; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = BDR; e.currentTarget.style.background = CARD; } }}>
                    <span style={{ fontSize: 24, display: "block", marginBottom: 7 }}>{r.icon}</span>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: active ? RED : "#fff", margin: 0, lineHeight: 1.3 }}>{r.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Fixed bottom action bar ───────────────────────── */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, #050505 60%, transparent)", padding: "20px 24px 28px", zIndex: 20 }}>
          <div style={{ display: "flex", gap: 14, maxWidth: 720, margin: "0 auto" }}>
            {/* CHECK IN */}
            <button onClick={doCheckIn} disabled={!reason}
              style={{
                flex: 1, height: 68,
                background: reason ? RED : "#1a1a1a",
                border: `2px solid ${reason ? RED : BDR}`,
                borderRadius: 16,
                color: reason ? "#fff" : MUTED,
                fontSize: 18, fontWeight: 900, cursor: reason ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.2s", fontFamily: "inherit",
                boxShadow: reason ? "0 0 40px rgba(215,38,56,0.25)" : "none",
                letterSpacing: "0.04em",
              }}
              onMouseEnter={(e) => { if (reason) e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              CHECK IN
            </button>

            {/* CHECK OUT */}
            <button onClick={doCheckOut}
              style={{
                flex: 1, height: 68,
                background: "transparent",
                border: `2px solid ${hasSession ? GOLDB : BDR}`,
                borderRadius: 16,
                color: hasSession ? GOLD : MUTED,
                fontSize: 18, fontWeight: 900, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.2s", fontFamily: "inherit",
                letterSpacing: "0.04em",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.06)"; e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              CHECK OUT
            </button>
          </div>
          {!reason && (
            <p style={{ textAlign: "center", fontSize: 11, color: DIM, marginTop: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Select a reason above to enable Check In · Check Out is always available
            </p>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // SUBMITTING
  // ══════════════════════════════════════════════════════════════
  if (step === "submitting") return (
    <div style={{ ...page, alignItems: "center", justifyContent: "center" }}>
      {gridBg}{topBar}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ width: 52, height: 52, border: "4px solid rgba(255,255,255,0.06)", borderTopColor: wasCheckOut ? GOLD : RED, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 20px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: MUTED, fontSize: 15 }}>Processing…</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // SUCCESS — check in
  // ══════════════════════════════════════════════════════════════
  if (step === "success" && found) return (
    <div style={{ ...page, alignItems: "center", justifyContent: "center" }}>
      {gridBg}{topBar}{footer}
      <div style={{ textAlign: "center", maxWidth: 480, padding: "0 24px", position: "relative", zIndex: 1 }}>
        {/* Check mark */}
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", boxShadow: "0 0 60px rgba(34,197,94,0.1)" }}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
          Successfully Checked In
        </p>
        <h2 style={{ fontSize: 52, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 12px" }}>
          Welcome,<br />{found.full_name.split(" ")[0]}!
        </h2>
        <p style={{ fontSize: 16, color: MUTED, marginBottom: 8 }}>
          {reason}
        </p>
        <p style={{ fontSize: 15, color: DIM, marginBottom: 40 }}>
          Have a great day.
        </p>

        {/* Progress bar */}
        <div style={{ width: "100%", height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ height: "100%", background: "#22c55e", width: `${(countdown / 5) * 100}%`, transition: "width 1s linear", borderRadius: 2 }} />
        </div>
        <p style={{ fontSize: 12, color: DIM }}>Returning to home in {countdown}…</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CO-SUCCESS — check out
  // ══════════════════════════════════════════════════════════════
  if (step === "co-success" && found) return (
    <div style={{ ...page, alignItems: "center", justifyContent: "center" }}>
      {gridBg}{topBar}{footer}
      <div style={{ textAlign: "center", maxWidth: 480, padding: "0 24px", position: "relative", zIndex: 1 }}>
        {/* Gold check */}
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(212,175,55,0.08)", border: `2px solid ${GOLDB}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", boxShadow: "0 0 60px rgba(212,175,55,0.08)" }}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
          Successfully Checked Out
        </p>
        <h2 style={{ fontSize: 52, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 12px" }}>
          Goodbye,<br />{found.full_name.split(" ")[0]}!
        </h2>
        {activeSession && (
          <p style={{ fontSize: 16, color: MUTED, marginBottom: 8 }}>
            Visit duration: {getDuration()}
          </p>
        )}
        <p style={{ fontSize: 15, color: DIM, marginBottom: 40 }}>
          See you next time.
        </p>

        {/* Progress bar */}
        <div style={{ width: "100%", height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ height: "100%", background: GOLD, width: `${(countdown / 5) * 100}%`, transition: "width 1s linear", borderRadius: 2 }} />
        </div>
        <p style={{ fontSize: 12, color: DIM }}>Returning to home in {countdown}…</p>
      </div>
    </div>
  );

  return null;
}
