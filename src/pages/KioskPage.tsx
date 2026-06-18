import { useState, useEffect, useRef, useCallback } from "react";
import {
  getStudents, getActivities, createActivity, updateActivity,
  getMeetings, getEvents,
} from "../lib/db";
import type { TRIOStudent, Activity, Meeting, TRIOEvent } from "../lib/types";
import { differenceInMinutes } from "date-fns";

// ─── Palette ───────────────────────────────────────────────────
const BG      = "#050505";
const PANEL   = "#111111";
const RED     = "#C1121F";
const TEXT    = "#FFFFFF";
const SUB     = "#A1A1A1";
const BORDER  = "#2A2A2A";
const GOLD    = "#D4AF37";
const GOLD_G  = "linear-gradient(135deg, #B8860B 0%, #D4AF37 38%, #F8E7A1 72%, #FFF3C4 100%)";
const GOLD_B  = "rgba(212,175,55,0.28)";
const GOLD_F  = "rgba(212,175,55,0.06)";

// ─── Reasons ──────────────────────────────────────────────────
const REASONS_EN = [
  { id: "Academic Advising",   label: "Academic Advising"   },
  { id: "Appointment",         label: "Appointment"         },
  { id: "Workshop or Event",   label: "Workshop"            },
  { id: "Study Session",       label: "Study Session"       },
  { id: "Computer Lab",        label: "Computer Lab"        },
  { id: "Transfer Planning",   label: "Transfer Services"   },
  { id: "FAFSA Assistance",    label: "FAFSA Assistance"    },
  { id: "Career Support",      label: "Career Services"     },
  { id: "Event Attendance",    label: "Event"               },
  { id: "General Visit",       label: "General Visit"       },
  { id: "Other",               label: "Other"               },
];
const REASONS_ES = [
  { id: "Academic Advising",   label: "Asesoría Académica"  },
  { id: "Appointment",         label: "Cita Programada"     },
  { id: "Workshop or Event",   label: "Taller"              },
  { id: "Study Session",       label: "Sesión de Estudio"   },
  { id: "Computer Lab",        label: "Lab de Cómputo"      },
  { id: "Transfer Planning",   label: "Transferencia"       },
  { id: "FAFSA Assistance",    label: "Ayuda FAFSA"         },
  { id: "Career Support",      label: "Servicios Carrera"   },
  { id: "Event Attendance",    label: "Evento"              },
  { id: "General Visit",       label: "Visita General"      },
  { id: "Other",               label: "Otro"                },
];

// ─── i18n ──────────────────────────────────────────────────────
const COPY = {
  en: {
    tagline: "Student Success Platform",
    powered: "Powered by Nova Systems",
    placeholder: "Type your name, student ID number, or scan your student ID...",
    continue: "CONTINUE",
    whyHere: "Why are you here today?",
    checkIn: "CHECK IN",
    checkOut: "CHECK OUT",
    noStudent: "No student found — try a different name or ID.",
    checkedIn: "CHECK-IN COMPLETE",
    checkedOut: "CHECK-OUT COMPLETE",
    welcome: "Welcome",
    thankYou: "Thank You",
    seeYou: "See You Soon",
    time: "Time",
    reason: "Reason",
    status: "Status",
    statusActive: "Checked In",
    visitDuration: "Visit Duration",
    checkOutTime: "Check-Out Time",
    currentlyIn: "You are currently checked in.",
    checkInTime: "Check-In Time",
    duration: "Duration",
    notYou: "Not you?",
    selectReason: "Select a visit reason to enable check-in",
    advisor: "Advisor",
    program: "Program",
    campus: "Campus",
    returning: "Returning to home in",
    location: "TRIO Office",
  },
  es: {
    tagline: "Plataforma para el Éxito Estudiantil",
    powered: "Desarrollado por Nova Systems",
    placeholder: "Escriba su nombre, número de ID, o escanee su tarjeta...",
    continue: "CONTINUAR",
    whyHere: "¿Por qué está aquí hoy?",
    checkIn: "REGISTRARSE",
    checkOut: "MARCAR SALIDA",
    noStudent: "Estudiante no encontrado — intente de nuevo.",
    checkedIn: "REGISTRO COMPLETO",
    checkedOut: "SALIDA COMPLETA",
    welcome: "Bienvenido",
    thankYou: "Gracias",
    seeYou: "Hasta Pronto",
    time: "Hora",
    reason: "Razón",
    status: "Estado",
    statusActive: "Registrado",
    visitDuration: "Duración de Visita",
    checkOutTime: "Hora de Salida",
    currentlyIn: "Actualmente está registrado.",
    checkInTime: "Hora de Entrada",
    duration: "Duración",
    notYou: "¿No es usted?",
    selectReason: "Seleccione una razón para registrarse",
    advisor: "Asesor",
    program: "Programa",
    campus: "Campus",
    returning: "Regresando al inicio en",
    location: "Oficina TRIO",
  },
} as const;

type Lang = "en" | "es";
type Step = "search" | "found" | "already-in" | "success" | "co-success";

// ─── Avatar ────────────────────────────────────────────────────
function Avatar({ name, size = 72 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hues = [0, 220, 270, 155, 30];
  const h = hues[name.charCodeAt(0) % hues.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${h},55%,26%)`,
      border: `2px solid rgba(255,255,255,0.1)`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.34, fontWeight: 800, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>
        {initials}
      </span>
    </div>
  );
}

// ─── Divider ───────────────────────────────────────────────────
function HR({ my = 0 }: { my?: number }) {
  return <div style={{ height: 1, background: BORDER, margin: `${my}px 0` }} />;
}

// ─── TRIO wordmark SVG ─────────────────────────────────────────
function TrioMark({ size = 56 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.24,
      background: RED, display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 8px 32px rgba(193,18,31,0.22)",
    }}>
      <svg width={size * 0.52} height={size * 0.52} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    </div>
  );
}

// ─── Live clock ────────────────────────────────────────────────
function LiveClock({ lang, align = "left" }: { lang: Lang; align?: "left" | "right" | "center" }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const locale = lang === "es" ? "es-US" : "en-US";
  return (
    <div style={{ textAlign: align }}>
      <p style={{ fontSize: 12, color: SUB, letterSpacing: "0.02em", margin: "0 0 3px" }}>
        {now.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      </p>
      <p style={{ fontSize: 18, fontWeight: 700, color: TEXT, letterSpacing: "-0.01em", margin: 0 }}>
        {now.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true })}
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════
export default function KioskPage() {
  const [lang, setLang]             = useState<Lang>("en");
  const [step, setStep]             = useState<Step>("search");
  const [students, setStudents]     = useState<TRIOStudent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [meetings, setMeetings]     = useState<Meeting[]>([]);
  const [events, setEvents]         = useState<TRIOEvent[]>([]);
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<TRIOStudent[]>([]);
  const [found, setFound]           = useState<TRIOStudent | null>(null);
  const [reason, setReason]         = useState("");
  const [session, setSession]       = useState<Activity | null>(null);
  const [countdown, setCountdown]   = useState(5);
  const [checkinTime, setCheckinTime] = useState("");
  const [showNoResult, setShowNoResult] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const today    = new Date().toISOString().split("T")[0];
  const c        = COPY[lang];
  const reasons  = lang === "es" ? REASONS_ES : REASONS_EN;

  // ── Load ──────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getStudents(), getActivities(), getMeetings(), getEvents()]).then(([s, a, m, e]) => {
      setStudents(s);
      setActivities(a.filter((x) => x.check_in_time.startsWith(today)));
      setMeetings(m.filter((x) => x.meeting_date === today && x.status === "Scheduled"));
      setEvents(e.filter((x) => x.event_date === today && x.is_active));
    });
  }, [today]);

  // ── Auto-focus ────────────────────────────────────────────────
  useEffect(() => {
    if (step === "search") {
      setQuery("");
      setResults([]);
      setFound(null);
      setShowNoResult(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [step]);

  // ── Global key → re-focus ─────────────────────────────────────
  useEffect(() => {
    if (step !== "search") return;
    const h = (e: KeyboardEvent) => {
      if (e.key.length === 1 && document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [step]);

  // ── Countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "success" && step !== "co-success") return;
    setCountdown(5);
    const iv = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) { clearInterval(iv); reset(); return 0; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [step]);

  // ── Live search ───────────────────────────────────────────────
  useEffect(() => {
    if (found) return;
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); setShowNoResult(false); return; }
    const r = students.filter((s) =>
      s.full_name.toLowerCase().includes(q) ||
      s.student_number.toLowerCase().includes(q) ||
      s.student_number.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
    ).slice(0, 5);
    setResults(r);
    setShowNoResult(q.length > 1 && r.length === 0);
  }, [query, students, found]);

  function reset() {
    setStep("search");
    setQuery("");
    setResults([]);
    setFound(null);
    setReason("");
    setSession(null);
    setCheckinTime("");
    setShowNoResult(false);
  }

  function clearSearch() {
    setFound(null);
    setQuery("");
    setResults([]);
    setReason("");
    setSession(null);
    setShowNoResult(false);
    setTimeout(() => inputRef.current?.focus(), 60);
  }

  function selectStudent(s: TRIOStudent) {
    const sess = activities.find((a) => a.student_id === s.id && !a.check_out_time) ?? null;
    setFound(s);
    setSession(sess);
    setQuery(s.full_name);
    setResults([]);
    setShowNoResult(false);
    setReason("");
  }

  function handleContinue() {
    if (!found) return;
    setStep(session ? "already-in" : "found");
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (found) { handleContinue(); return; }
    if (results.length === 1) { selectStudent(results[0]); return; }
    if (results.length > 1) {
      const exact = results.find((s) => s.student_number.toLowerCase() === query.trim().toLowerCase());
      if (exact) selectStudent(exact);
    }
  }, [results, query, found, session]);

  async function doCheckIn() {
    if (!found || !reason) return;
    const now = new Date();
    setCheckinTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
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
    setStep("success");
  }

  async function doCheckOut() {
    if (!found) return;
    if (session) {
      const mins = differenceInMinutes(new Date(), new Date(session.check_in_time));
      await updateActivity(session.id, {
        check_out_time:   new Date().toISOString(),
        duration_minutes: Math.max(1, mins),
      });
    }
    setStep("co-success");
  }

  function getDuration(): string {
    if (!session) return "—";
    const mins = differenceInMinutes(new Date(), new Date(session.check_in_time));
    if (mins < 1) return "< 1 min";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} ${lang === "es" ? "minuto" + (m !== 1 ? "s" : "") : "minute" + (m !== 1 ? "s" : "")}`;
    if (m === 0) return `${h} ${lang === "es" ? "hora" + (h !== 1 ? "s" : "") : "hour" + (h !== 1 ? "s" : "")}`;
    return `${h} ${lang === "es" ? "hr" : "hr"} ${m} ${lang === "es" ? "min" : "min"}`;
  }

  function getSessionTime(): string {
    if (!session) return "—";
    return new Date(session.check_in_time).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  }

  // ── Page shell ────────────────────────────────────────────────
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: BG,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
    color: TEXT,
    position: "relative",
  };

  // ── Lang toggle ───────────────────────────────────────────────
  const langToggle = (
    <div style={{ display: "flex", gap: 0 }}>
      {(["en", "es"] as const).map((l, i) => (
        <button key={l} onClick={() => setLang(l)}
          style={{
            background: lang === l ? "rgba(255,255,255,0.07)" : "transparent",
            border: "none",
            borderLeft: i > 0 ? `1px solid ${BORDER}` : "none",
            color: lang === l ? TEXT : SUB,
            fontSize: 11, fontWeight: lang === l ? 700 : 400,
            letterSpacing: "0.1em", textTransform: "uppercase" as const,
            cursor: "pointer", padding: "5px 12px", fontFamily: "inherit",
            transition: "all 0.15s", borderRadius: i === 0 ? "6px 0 0 6px" : "0 6px 6px 0",
          }}>
          {l === "en" ? "EN" : "ES"}
        </button>
      ))}
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // SCREEN 1 — SEARCH
  // ══════════════════════════════════════════════════════════════
  if (step === "search") return (
    <div style={page}>
      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 36px", zIndex: 10 }}>
        <LiveClock lang={lang} align="left" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {langToggle}
        </div>
      </div>

      {/* Centered content */}
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* TRIO mark + wordmark */}
          <TrioMark size={72} />
          <h1 style={{ fontSize: 38, fontWeight: 900, color: TEXT, letterSpacing: "-0.03em", margin: "22px 0 6px", textAlign: "center" }}>
            TRIO CONNECT
          </h1>
          <p style={{ fontSize: 14, color: SUB, letterSpacing: "0.04em", margin: "0 0 6px", textAlign: "center" }}>
            {c.tagline}
          </p>
          <p style={{ fontSize: 11, background: GOLD_G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never, letterSpacing: "0.1em", margin: "0 0 44px", textAlign: "center", fontWeight: 600 }}>
            {c.powered}
          </p>

          {/* Search field */}
          <div style={{ width: "100%", position: "relative" }}>
            <input
              ref={inputRef}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (found) clearSearch(); }}
              onKeyDown={handleKeyDown}
              placeholder={c.placeholder}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: PANEL,
                border: `1px solid ${found ? GOLD_B : BORDER}`,
                borderRadius: (results.length > 0 || showNoResult) ? "12px 12px 0 0" : 12,
                padding: "18px 44px 18px 20px",
                fontSize: 16,
                color: TEXT,
                outline: "none",
                fontFamily: "inherit",
                letterSpacing: "0.01em",
                transition: "border-color 0.15s, border-radius 0.1s",
              }}
              onFocus={(e) => { if (!found) e.currentTarget.style.borderColor = GOLD_B; }}
              onBlur={(e)  => { if (!found) e.currentTarget.style.borderColor = BORDER; }}
            />
            {(found || query.length > 0) && (
              <button onClick={clearSearch}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: SUB, fontSize: 14, cursor: "pointer", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontFamily: "inherit" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = SUB; }}>
                ✕
              </button>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div style={{ background: PANEL, border: `1px solid ${GOLD_B}`, borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                {results.map((s, i) => (
                  <button key={s.id} onClick={() => selectStudent(s)}
                    style={{ width: "100%", background: "transparent", border: "none", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left", borderTop: i > 0 ? `1px solid ${BORDER}` : "none", fontFamily: "inherit", transition: "background 0.08s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: TEXT, margin: 0 }}>{s.full_name}</p>
                      <p style={{ fontSize: 11, color: SUB, margin: "3px 0 0" }}>{s.student_number}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: s.enrollment_status === "active" ? "#4ADE80" : "#F87171", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                      {s.enrollment_status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showNoResult && (
              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "14px 20px" }}>
                <p style={{ color: SUB, fontSize: 13, margin: 0 }}>{c.noStudent}</p>
              </div>
            )}
          </div>

          {/* Continue button */}
          <button onClick={handleContinue} disabled={!found}
            style={{
              width: "100%",
              height: 56,
              marginTop: 16,
              background: found ? RED : "transparent",
              border: `1px solid ${found ? RED : BORDER}`,
              borderRadius: 12,
              color: found ? TEXT : SUB,
              fontSize: 13, fontWeight: 800, letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              cursor: found ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "all 0.18s",
              boxShadow: found ? "0 4px 24px rgba(193,18,31,0.22)" : "none",
            }}
            onMouseEnter={(e) => { if (found) e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
            {c.continue}
          </button>

        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // SCREEN 2 — STUDENT + REASONS
  // ══════════════════════════════════════════════════════════════
  if (step === "found" && found) return (
    <div style={page}>
      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 36px", zIndex: 10 }}>
        <LiveClock lang={lang} align="left" />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {langToggle}
          <button onClick={reset}
            style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 6, color: SUB, fontSize: 11, cursor: "pointer", padding: "5px 14px", fontFamily: "inherit", letterSpacing: "0.06em", transition: "all 0.12s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = SUB; e.currentTarget.style.borderColor = BORDER; }}>
            HOME
          </button>
        </div>
      </div>

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "96px 24px 120px" }}>
        <div style={{ width: "100%", maxWidth: 660, display: "flex", flexDirection: "column" }}>

          {/* Student profile */}
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 32 }}>
            <Avatar name={found.full_name} size={76} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: TEXT, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
                {found.full_name}
              </h2>
              <p style={{ fontSize: 13, color: SUB, margin: "0 0 10px" }}>
                {found.student_number}
                {found.work_location ? ` · ${found.work_location}` : ""}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                {found.advisor_name && (
                  <span style={{ fontSize: 11, color: GOLD, background: GOLD_F, border: `1px solid ${GOLD_B}`, borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>
                    {c.advisor}: {found.advisor_name}
                  </span>
                )}
                {found.program && (
                  <span style={{ fontSize: 11, color: SUB, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "3px 10px" }}>
                    {found.program}
                  </span>
                )}
              </div>
            </div>
            <button onClick={reset}
              style={{ background: "transparent", border: "none", color: SUB, fontSize: 11, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em", flexShrink: 0, transition: "color 0.12s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = SUB; }}>
              {c.notYou}
            </button>
          </div>

          <HR my={0} />

          {/* Why are you here */}
          <p style={{ fontSize: 11, color: SUB, letterSpacing: "0.14em", textTransform: "uppercase" as const, margin: "28px 0 16px" }}>
            {c.whyHere}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 28 }}>
            {reasons.map((r) => {
              const active = reason === r.id;
              return (
                <button key={r.id} onClick={() => setReason(active ? "" : r.id)}
                  style={{
                    background: active ? "rgba(193,18,31,0.1)" : PANEL,
                    border: `1px solid ${active ? "rgba(193,18,31,0.45)" : BORDER}`,
                    borderRadius: 10,
                    padding: "14px 8px",
                    cursor: "pointer",
                    textAlign: "center" as const,
                    fontFamily: "inherit",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = GOLD_B; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = PANEL; } }}>
                  <p style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#ff6b7a" : SUB, margin: 0, lineHeight: 1.3, letterSpacing: "0.01em" }}>
                    {r.label}
                  </p>
                </button>
              );
            })}
          </div>

          <HR my={0} />
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: `linear-gradient(to top, ${BG} 65%, transparent)`, padding: "16px 24px 28px", zIndex: 20 }}>
        <div style={{ display: "flex", gap: 12, maxWidth: 660, margin: "0 auto" }}>
          <button onClick={doCheckIn} disabled={!reason}
            style={{
              flex: 1, height: 56,
              background: reason ? RED : "transparent",
              border: `1px solid ${reason ? RED : BORDER}`,
              borderRadius: 12,
              color: reason ? TEXT : SUB,
              fontSize: 13, fontWeight: 800, letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              cursor: reason ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "all 0.15s",
              boxShadow: reason ? "0 4px 24px rgba(193,18,31,0.2)" : "none",
            }}
            onMouseEnter={(e) => { if (reason) e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
            {c.checkIn}
          </button>
          <button onClick={doCheckOut}
            style={{
              flex: 1, height: 56,
              background: GOLD_F,
              border: `1px solid ${GOLD_B}`,
              borderRadius: 12,
              color: GOLD,
              fontSize: 13, fontWeight: 800, letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.13)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = GOLD_F; }}>
            {c.checkOut}
          </button>
        </div>
        {!reason && (
          <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.12)", marginTop: 8, letterSpacing: "0.08em" }}>
            {c.selectReason}
          </p>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // ALREADY CHECKED IN
  // ══════════════════════════════════════════════════════════════
  if (step === "already-in" && found) return (
    <div style={page}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 36px", zIndex: 10 }}>
        <LiveClock lang={lang} align="left" />
        <div style={{ display: "flex", gap: 10 }}>
          {langToggle}
          <button onClick={reset}
            style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 6, color: SUB, fontSize: 11, cursor: "pointer", padding: "5px 14px", fontFamily: "inherit", letterSpacing: "0.06em", transition: "all 0.12s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = SUB; }}>
            HOME
          </button>
        </div>
      </div>

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>

          {/* Student */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 32 }}>
            <Avatar name={found.full_name} size={64} />
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: TEXT, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
                {found.full_name}
              </h2>
              <p style={{ fontSize: 12, color: SUB, margin: 0 }}>{found.student_number}</p>
            </div>
            <button onClick={reset}
              style={{ marginLeft: "auto", background: "transparent", border: "none", color: SUB, fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "color 0.12s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = SUB; }}>
              {c.notYou}
            </button>
          </div>

          <HR />

          <div style={{ padding: "28px 0", display: "flex", flexDirection: "column", gap: 24 }}>
            <p style={{ fontSize: 14, color: SUB, margin: 0, lineHeight: 1.7 }}>{c.currentlyIn}</p>

            <div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", letterSpacing: "0.14em", textTransform: "uppercase" as const, margin: "0 0 6px" }}>
                {c.checkInTime}
              </p>
              <p style={{ fontSize: 32, fontWeight: 800, color: TEXT, letterSpacing: "-0.02em", margin: 0 }}>
                {getSessionTime()}
              </p>
            </div>

            <HR />

            <div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", letterSpacing: "0.14em", textTransform: "uppercase" as const, margin: "0 0 6px" }}>
                {c.duration}
              </p>
              <p style={{ fontSize: 32, fontWeight: 800, color: TEXT, letterSpacing: "-0.02em", margin: 0 }}>
                {getDuration()}
              </p>
            </div>
          </div>

          <HR />

          <button onClick={doCheckOut}
            style={{ width: "100%", height: 56, marginTop: 28, background: GOLD_F, border: `1px solid ${GOLD_B}`, borderRadius: 12, color: GOLD, fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.14)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = GOLD_F; }}>
            {c.checkOut}
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CHECK-IN COMPLETE
  // ══════════════════════════════════════════════════════════════
  if (step === "success" && found) return (
    <div style={page}>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          <p style={{ fontSize: 10, fontWeight: 700, background: GOLD_G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never, letterSpacing: "0.22em", textTransform: "uppercase" as const, margin: "0 0 20px" }}>
            {c.checkedIn}
          </p>

          <p style={{ fontSize: 13, color: SUB, letterSpacing: "0.06em", margin: "0 0 8px" }}>{c.welcome}</p>
          <h2 style={{ fontSize: 46, fontWeight: 900, color: TEXT, letterSpacing: "-0.04em", lineHeight: 1, margin: "0 0 36px" }}>
            {found.full_name}
          </h2>

          <HR />

          <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", gap: 16 }}>
            {([
              [c.time,   checkinTime],
              [c.reason, reason],
              [c.status, c.statusActive],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ fontSize: 13, color: SUB }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: label === c.status ? "#4ADE80" : "rgba(255,255,255,0.8)", textAlign: "right" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <HR />

          <div style={{ marginTop: 24 }}>
            <div style={{ height: 2, background: BORDER, borderRadius: 1, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", background: GOLD, width: `${(countdown / 5) * 100}%`, transition: "width 1s linear" }} />
            </div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>
              {c.returning} {countdown}s
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CHECK-OUT COMPLETE
  // ══════════════════════════════════════════════════════════════
  if (step === "co-success" && found) return (
    <div style={page}>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          <p style={{ fontSize: 10, fontWeight: 700, background: GOLD_G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never, letterSpacing: "0.22em", textTransform: "uppercase" as const, margin: "0 0 20px" }}>
            {c.checkedOut}
          </p>

          <p style={{ fontSize: 13, color: SUB, letterSpacing: "0.06em", margin: "0 0 8px" }}>{c.thankYou}</p>
          <h2 style={{ fontSize: 46, fontWeight: 900, color: TEXT, letterSpacing: "-0.04em", lineHeight: 1, margin: "0 0 8px" }}>
            {found.full_name}
          </h2>
          <p style={{ fontSize: 14, color: SUB, margin: "0 0 36px" }}>{c.seeYou}</p>

          <HR />

          <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", gap: 16 }}>
            {([
              [c.checkOutTime,  new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })],
              [c.visitDuration, getDuration()],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ fontSize: 13, color: SUB }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", textAlign: "right" }}>{value}</span>
              </div>
            ))}
          </div>

          <HR />

          <div style={{ marginTop: 24 }}>
            <div style={{ height: 2, background: BORDER, borderRadius: 1, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", background: GOLD, width: `${(countdown / 5) * 100}%`, transition: "width 1s linear" }} />
            </div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>
              {c.returning} {countdown}s
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}
