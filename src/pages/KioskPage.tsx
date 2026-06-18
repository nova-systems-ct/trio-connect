import { useState, useEffect, useRef, useCallback } from "react";
import {
  getStudents, getActivities, createActivity, updateActivity,
  getMeetings, getEvents,
} from "../lib/db";
import type { TRIOStudent, Activity, Meeting, TRIOEvent } from "../lib/types";
import { differenceInMinutes } from "date-fns";

// ── Design tokens ──────────────────────────────────────────────
const RED    = "#D72638";
// Luxury metallic satin gold — not yellow, not orange
const GOLD   = "#C4A052";
const GOLDB  = "rgba(196,160,82,0.25)";
const GOLDBR = "rgba(196,160,82,0.12)";
const CARD   = "#0F0F0F";
const BDR    = "rgba(255,255,255,0.07)";
const MUTED  = "rgba(255,255,255,0.42)";
const DIM    = "rgba(255,255,255,0.18)";
const GREEN  = "#22C55E";

type Step = "home" | "found" | "already-in" | "submitting" | "success" | "co-success";

const REASONS = [
  { id: "Appointment / Advising Meeting", label: "Appointment"      },
  { id: "Walk-In Advising",              label: "Advisor Meeting"   },
  { id: "Workshop or Event",             label: "Workshop"          },
  { id: "Event Attendance",              label: "Event"             },
  { id: "Study Space",                   label: "Study Space"       },
  { id: "Computer Lab",                  label: "Computer Lab"      },
  { id: "FAFSA Assistance",              label: "FAFSA Help"        },
  { id: "Transfer Planning",             label: "Transfer Help"     },
  { id: "Career Support",                label: "Career Services"   },
  { id: "General Visit",                 label: "General Visit"     },
  { id: "Other",                         label: "Other"             },
];

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name, size = 64 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const palette = ["#8B1E2A", "#1A3A6B", "#4A2070", "#0F5A3A", "#7A4A10"];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.2,
      background: palette[name.charCodeAt(0) % palette.length],
      border: `1px solid rgba(255,255,255,0.1)`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.35, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.02em" }}>{initials}</span>
    </div>
  );
}

// ── Live clock ─────────────────────────────────────────────────
function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontSize: 12, color: DIM, letterSpacing: "0.04em" }}>
      {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
      {"  ·  "}
      {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
    </span>
  );
}

// ── Thin divider ───────────────────────────────────────────────
function Divider({ style: s }: { style?: React.CSSProperties }) {
  return <div style={{ width: "100%", height: 1, background: BDR, ...s }} />;
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
  const [checkInTime, setCheckInTime] = useState("");

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

  // ── Auto-focus on home ────────────────────────────────────────
  useEffect(() => {
    if (step === "home") {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [step]);

  // ── Global keypress → re-focus search ────────────────────────
  useEffect(() => {
    if (step !== "home") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key.length === 1 && document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
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
    setCheckInTime("");
  }

  function selectStudent(s: TRIOStudent) {
    const sess = activities.find((a) => a.student_id === s.id && !a.check_out_time) ?? null;
    setFound(s);
    setSession(sess);
    setReason("");
    // Route to "already-in" if they have an active session — prevents duplicate check-ins
    setStep(sess ? "already-in" : "found");
  }

  // ── Enter key / scanner support ───────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length === 1) {
        selectStudent(results[0]);
      } else if (results.length > 1) {
        const exact = results.find((s) =>
          s.student_number.toLowerCase() === query.trim().toLowerCase()
        );
        if (exact) selectStudent(exact);
      }
    }
  }, [results, query]);

  // ── Actions ───────────────────────────────────────────────────
  async function doCheckIn() {
    if (!found || !reason) return;
    setStep("submitting");
    const now = new Date();
    const appt = meetings.find((m) => m.student_id === found.id);
    const evt  = !appt ? (events[0] ?? null) : null;
    await createActivity({
      student_id:    found.id,
      student_name:  found.full_name,
      activity_type: "Walk-In Advising",
      check_in_time: now.toISOString(),
      location:      "TRIO Office (Kiosk)",
      notes:         reason,
      meeting_id:    appt?.id,
      event_id:      evt?.id,
    });
    setCheckInTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    setStep("success");
  }

  async function doCheckOut() {
    if (!found) return;
    setStep("submitting");
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

  function getSessionTime(): string {
    if (!activeSession) return "";
    return new Date(activeSession.check_in_time).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  }

  // ── Shared wrappers ───────────────────────────────────────────
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "#050505",
    display: "flex",
    flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
    color: "#fff",
  };

  // Subtle ambient background — very minimal
  const ambientBg = (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%,-50%)", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle,rgba(196,160,82,0.018) 0%,transparent 60%)" }} />
    </div>
  );

  const topBar = (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: RED, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", lineHeight: 1.2, letterSpacing: "0.02em" }}>TRIO Connect</p>
          <p style={{ fontSize: 9, color: DIM, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1 }}>CT State Community College</p>
        </div>
      </div>
      <Clock />
      {step !== "home" && (
        <button onClick={reset}
          style={{ padding: "5px 14px", borderRadius: 6, border: `1px solid ${BDR}`, background: "transparent", color: MUTED, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.03em" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BDR; }}>
          Home
        </button>
      )}
    </div>
  );

  const footer = (
    <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.1)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
        Powered by Nova Systems
      </p>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // HOME
  // ══════════════════════════════════════════════════════════════
  if (step === "home") return (
    <div style={page}>
      {ambientBg}{topBar}{footer}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 32px 80px", position: "relative", zIndex: 1 }}>

        {/* TRIO mark */}
        <div style={{ width: 72, height: 72, borderRadius: 20, background: RED, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
          </svg>
        </div>

        <h1 style={{ fontSize: 52, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1, textAlign: "center", margin: "0 0 12px" }}>
          Welcome to TRIO Connect
        </h1>
        <p style={{ fontSize: 17, color: MUTED, marginBottom: 56, textAlign: "center", fontWeight: 400, letterSpacing: "0.01em" }}>
          Student Check-In System
        </p>

        {/* Single search field */}
        <div style={{ width: "100%", maxWidth: 600, position: "relative" }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth={2}
            style={{ position: "absolute", left: 20, top: 22, pointerEvents: "none" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>

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
              border: `1.5px solid ${query.length > 0 ? GOLDB : BDR}`,
              borderRadius: results.length > 0 || (query.trim().length > 1 && results.length === 0) ? "16px 16px 0 0" : 16,
              padding: "20px 20px 20px 52px",
              fontSize: 17,
              color: "#fff",
              outline: "none",
              transition: "border-color 0.2s, border-radius 0.12s",
              letterSpacing: "0.01em",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = GOLDB; }}
            onBlur={(e) => { if (!results.length) e.currentTarget.style.borderColor = query.length > 0 ? GOLDB : BDR; }}
          />

          {query.length > 0 && (
            <button onClick={() => setQuery("")}
              style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: MUTED, fontSize: 16, cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}>
              ✕
            </button>
          )}

          {/* Results dropdown */}
          {results.length > 0 && (
            <div style={{ background: CARD, border: `1.5px solid ${GOLDB}`, borderTop: "none", borderRadius: "0 0 16px 16px", overflow: "hidden" }}>
              {results.map((s, i) => (
                <button key={s.id} onClick={() => selectStudent(s)}
                  style={{ width: "100%", background: "transparent", border: "none", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left", borderTop: i > 0 ? `1px solid ${BDR}` : "none", transition: "background 0.1s", fontFamily: "inherit" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <Avatar name={s.full_name} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>{s.full_name}</p>
                    <p style={{ fontSize: 11, color: MUTED, margin: "3px 0 0", letterSpacing: "0.02em" }}>
                      {s.student_number}
                      {s.work_location ? `  ·  ${s.work_location}` : ""}
                    </p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.enrollment_status === "active" ? GREEN : RED, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>
                    {s.enrollment_status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {query.trim().length > 1 && results.length === 0 && (
            <div style={{ background: CARD, border: `1.5px solid ${BDR}`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: "16px 20px", textAlign: "center" }}>
              <p style={{ color: MUTED, fontSize: 13 }}>No students found — try a different name or ID number.</p>
            </div>
          )}
        </div>

        <p style={{ marginTop: 20, fontSize: 11, color: DIM, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Keyboard · QR scanner · Barcode scanner
        </p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // ALREADY CHECKED IN — prevent duplicate sessions
  // ══════════════════════════════════════════════════════════════
  if (step === "already-in" && found) return (
    <div style={page}>
      {ambientBg}{topBar}{footer}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 32px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 540, width: "100%" }}>

          {/* Student row */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 36 }}>
            <Avatar name={found.full_name} size={64} />
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 4px" }}>{found.full_name}</h2>
              <p style={{ fontSize: 13, color: MUTED }}>
                {found.student_number}
                {found.advisor_name ? `  ·  ${found.advisor_name}` : ""}
              </p>
            </div>
          </div>

          <Divider />

          {/* Already checked in notice */}
          <div style={{ padding: "32px 0" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>
              Currently Checked In
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: MUTED }}>Check-In Time</span>
                <span style={{ fontSize: 15, color: "#fff", fontWeight: 600 }}>{getSessionTime()}</span>
              </div>
              <Divider />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: MUTED }}>Duration</span>
                <span style={{ fontSize: 15, color: "#fff", fontWeight: 600 }}>{getDuration()}</span>
              </div>
              {activeSession?.notes && (
                <>
                  <Divider />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 15, color: MUTED }}>Visit Reason</span>
                    <span style={{ fontSize: 15, color: "#fff", fontWeight: 600 }}>{activeSession.notes}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <Divider />

          <p style={{ fontSize: 14, color: MUTED, margin: "28px 0 32px", lineHeight: 1.6 }}>
            To start a new visit, please check out first.
          </p>

          <button onClick={doCheckOut}
            style={{ width: "100%", height: 64, background: GOLDBR, border: `1.5px solid ${GOLDB}`, borderRadius: 14, color: GOLD, fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "inherit", transition: "all 0.18s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(196,160,82,0.18)"; e.currentTarget.style.borderColor = `rgba(196,160,82,0.5)`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = GOLDBR; e.currentTarget.style.borderColor = GOLDB; }}>
            Check Out
          </button>

        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // FOUND — no active session, can check in or out
  // ══════════════════════════════════════════════════════════════
  if (step === "found" && found) return (
    <div style={page}>
      {ambientBg}{topBar}{footer}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "88px 0 110px", overflowY: "auto", position: "relative", zIndex: 1 }}>

        {/* ── Student ──────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 32px 0" }}>
          <div style={{ maxWidth: 640, width: "100%", display: "flex", alignItems: "center", gap: 20 }}>
            <Avatar name={found.full_name} size={64} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 5px" }}>{found.full_name}</h2>
              <p style={{ fontSize: 13, color: MUTED, letterSpacing: "0.02em" }}>
                {found.student_number}
                {found.work_location ? `  ·  ${found.work_location}` : ""}
                {found.advisor_name ? `  ·  ${found.advisor_name}` : ""}
              </p>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: found.enrollment_status === "active" ? GREEN : RED, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>
              {found.enrollment_status}
            </span>
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 32px" }}>
          <div style={{ maxWidth: 640, width: "100%", height: 1, background: BDR }} />
        </div>

        {/* ── Reason selection ──────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 32px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20, textAlign: "center" }}>
            Why are you here today?
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, maxWidth: 640, width: "100%" }}>
            {REASONS.map((r) => {
              const active = reason === r.id;
              return (
                <button key={r.id} onClick={() => setReason(active ? "" : r.id)}
                  style={{
                    background: active ? GOLDBR : "transparent",
                    border: `1.5px solid ${active ? GOLDB : BDR}`,
                    borderRadius: 10,
                    padding: "14px 10px",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.12s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = BDR;
                      e.currentTarget.style.background = "transparent";
                    }
                  }}>
                  <p style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? GOLD : "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.3, letterSpacing: "0.01em" }}>
                    {r.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Fixed action bar ─────────────────────────────────── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 32px 28px", background: "linear-gradient(to top, #050505 70%, transparent)", zIndex: 20 }}>
        <div style={{ display: "flex", gap: 12, maxWidth: 640, margin: "0 auto" }}>

          {/* CHECK IN */}
          <button onClick={doCheckIn} disabled={!reason}
            style={{
              flex: 1, height: 62,
              background: reason ? RED : "transparent",
              border: `1.5px solid ${reason ? RED : BDR}`,
              borderRadius: 12,
              color: reason ? "#fff" : MUTED,
              fontSize: 14, fontWeight: 800, cursor: reason ? "pointer" : "not-allowed",
              letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "all 0.18s", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { if (reason) { e.currentTarget.style.opacity = "0.88"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
            Check In
          </button>

          {/* CHECK OUT */}
          <button onClick={doCheckOut}
            style={{
              flex: 1, height: 62,
              background: "transparent",
              border: `1.5px solid ${GOLDB}`,
              borderRadius: 12,
              color: GOLD,
              fontSize: 14, fontWeight: 800, cursor: "pointer",
              letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "all 0.18s", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = GOLDBR; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            Check Out
          </button>

        </div>
        {!reason && (
          <p style={{ textAlign: "center", fontSize: 10, color: DIM, marginTop: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Select a reason to enable check in
          </p>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // SUBMITTING
  // ══════════════════════════════════════════════════════════════
  if (step === "submitting") return (
    <div style={{ ...page, alignItems: "center", justifyContent: "center" }}>
      {topBar}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ width: 44, height: 44, border: "3px solid rgba(255,255,255,0.05)", borderTopColor: GOLD, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 18px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: DIM, fontSize: 13, letterSpacing: "0.06em" }}>Processing</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CHECK-IN COMPLETE
  // ══════════════════════════════════════════════════════════════
  if (step === "success" && found) return (
    <div style={{ ...page, alignItems: "center", justifyContent: "center" }}>
      {ambientBg}{topBar}{footer}
      <div style={{ maxWidth: 480, width: "100%", padding: "0 32px", position: "relative", zIndex: 1 }}>

        <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 20 }}>
          Check-In Complete
        </p>

        <h2 style={{ fontSize: 46, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 32px" }}>
          {found.full_name.split(" ")[0]}
        </h2>

        <Divider />

        <div style={{ padding: "28px 0", display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            ["Student",      found.full_name],
            ["Student ID",   found.student_number],
            ["Time",         checkInTime],
            ["Visit Reason", reason],
            ["Location",     "TRIO Office"],
            ["Status",       "Active"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
              <span style={{ fontSize: 13, color: MUTED, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: label === "Status" ? GREEN : "rgba(255,255,255,0.8)", fontWeight: 600, textAlign: "right" }}>{value}</span>
            </div>
          ))}
        </div>

        <Divider />

        {/* Progress */}
        <div style={{ marginTop: 28 }}>
          <div style={{ width: "100%", height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: "100%", background: GOLD, width: `${(countdown / 5) * 100}%`, transition: "width 1s linear" }} />
          </div>
          <p style={{ fontSize: 11, color: DIM, letterSpacing: "0.06em" }}>Returning to home in {countdown}s</p>
        </div>

      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CHECK-OUT COMPLETE
  // ══════════════════════════════════════════════════════════════
  if (step === "co-success" && found) return (
    <div style={{ ...page, alignItems: "center", justifyContent: "center" }}>
      {ambientBg}{topBar}{footer}
      <div style={{ maxWidth: 480, width: "100%", padding: "0 32px", position: "relative", zIndex: 1 }}>

        <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 20 }}>
          Check-Out Complete
        </p>

        <h2 style={{ fontSize: 46, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 32px" }}>
          {found.full_name.split(" ")[0]}
        </h2>

        <Divider />

        <div style={{ padding: "28px 0", display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            ["Student",       found.full_name],
            ["Check-Out",     new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })],
            ["Duration",      getDuration() || "—"],
            ["Status",        "Complete"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
              <span style={{ fontSize: 13, color: MUTED, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: label === "Status" ? GOLD : "rgba(255,255,255,0.8)", fontWeight: 600, textAlign: "right" }}>{value}</span>
            </div>
          ))}
        </div>

        <Divider />

        <div style={{ marginTop: 28 }}>
          <div style={{ width: "100%", height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: "100%", background: GOLD, width: `${(countdown / 5) * 100}%`, transition: "width 1s linear" }} />
          </div>
          <p style={{ fontSize: 11, color: DIM, letterSpacing: "0.06em" }}>Returning to home in {countdown}s</p>
        </div>

      </div>
    </div>
  );

  return null;
}
