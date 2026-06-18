import { useState, useEffect, useRef, useCallback } from "react";
import {
  getStudents, getActivities, createActivity, updateActivity,
  getMeetings, getEvents,
} from "../lib/db";
import type { TRIOStudent, Activity, Meeting, TRIOEvent } from "../lib/types";
import { differenceInMinutes } from "date-fns";

// ── Palette ────────────────────────────────────────────────────
const BG        = "#050505";
const RED       = "#C1121F";
const WHITE     = "#FAFAFA";
const MUTED     = "rgba(250,250,250,0.38)";
const DIM       = "rgba(250,250,250,0.15)";
const BORDER    = "rgba(250,250,250,0.08)";
const FIELD_BG  = "#0C0C0C";
const GOLD      = "#D4AF37";
const GOLD_GRAD = "linear-gradient(135deg, #B8860B 0%, #D4AF37 42%, #F8E7A1 76%, #FFF3C4 100%)";
const GOLD_RING = "rgba(212,175,55,0.32)";
const GOLD_FILL = "rgba(212,175,55,0.07)";

// ── Reasons ────────────────────────────────────────────────────
const REASONS_EN = [
  { id: "Advising Appointment",  label: "Advising Appointment" },
  { id: "FAFSA Assistance",      label: "FAFSA Help"           },
  { id: "Workshop or Event",     label: "Workshop"             },
  { id: "Tutoring",              label: "Tutoring"             },
  { id: "Transfer Planning",     label: "Transfer Services"    },
  { id: "Career Support",        label: "Career Services"      },
  { id: "Computer Lab",          label: "Computer Lab"         },
  { id: "Other",                 label: "Other"                },
];

const REASONS_ES = [
  { id: "Advising Appointment",  label: "Cita de Asesoría"    },
  { id: "FAFSA Assistance",      label: "Ayuda con FAFSA"     },
  { id: "Workshop or Event",     label: "Taller o Evento"     },
  { id: "Tutoring",              label: "Tutoría"             },
  { id: "Transfer Planning",     label: "Servicios de Transferencia" },
  { id: "Career Support",        label: "Servicios de Carrera" },
  { id: "Computer Lab",          label: "Laboratorio de Cómputo" },
  { id: "Other",                 label: "Otro"                },
];

// ── i18n ───────────────────────────────────────────────────────
const T = {
  en: {
    brand: "TRIO CONNECT",
    powered: "Powered by Nova Systems",
    welcome: "Welcome Student",
    english: "English",
    espanol: "Español",
    namePlaceholder: "Type name or student ID number...",
    whyLabel: "Why Are You Here?",
    whyPlaceholder: "Select a visit reason",
    checkIn: "CHECK IN",
    checkOut: "CHECK OUT",
    selectReason: "Select a visit reason to check in",
    noStudent: "No student found — try again.",
    notYou: "Not you?",
    currentlyIn: "You are currently checked in.",
    checkInTime: "Check-In Time",
    duration: "Duration",
    checkInComplete: "CHECK-IN COMPLETE",
    checkOutComplete: "CHECK-OUT COMPLETE",
    studentLabel: "Student",
    timeLabel: "Time",
    reasonLabel: "Visit Reason",
    locationLabel: "Location",
    statusLabel: "Status",
    statusActive: "Active",
    statusComplete: "Complete",
    checkOutTime: "Check-Out Time",
    visitDuration: "Visit Duration",
    location: "TRIO Office",
    returning: "Returning to home in",
  },
  es: {
    brand: "TRIO CONNECT",
    powered: "Desarrollado por Nova Systems",
    welcome: "Bienvenido Estudiante",
    english: "English",
    espanol: "Español",
    namePlaceholder: "Escriba nombre o número de ID...",
    whyLabel: "¿Por Qué Está Aquí?",
    whyPlaceholder: "Seleccione una razón",
    checkIn: "REGISTRARSE",
    checkOut: "MARCAR SALIDA",
    selectReason: "Seleccione una razón para registrarse",
    noStudent: "Estudiante no encontrado — intente de nuevo.",
    notYou: "¿No es usted?",
    currentlyIn: "Actualmente está registrado.",
    checkInTime: "Hora de Entrada",
    duration: "Duración",
    checkInComplete: "REGISTRO COMPLETO",
    checkOutComplete: "SALIDA COMPLETA",
    studentLabel: "Estudiante",
    timeLabel: "Hora",
    reasonLabel: "Razón de Visita",
    locationLabel: "Ubicación",
    statusLabel: "Estado",
    statusActive: "Activo",
    statusComplete: "Completo",
    checkOutTime: "Hora de Salida",
    visitDuration: "Duración de Visita",
    location: "Oficina TRIO",
    returning: "Regresando al inicio en",
  },
};

type Lang = "en" | "es";
type Step = "home" | "already-in" | "success" | "co-success";

// ── Live clock ────────────────────────────────────────────────
function LiveClock({ lang }: { lang: Lang }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const locale = lang === "es" ? "es-US" : "en-US";
  return (
    <div style={{ textAlign: "center", margin: "0 0 28px" }}>
      <p style={{ fontSize: 18, color: MUTED, letterSpacing: "0.03em", margin: "0 0 10px" }}>
        {now.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      </p>
      <p style={{ fontSize: 64, fontWeight: 900, color: WHITE, letterSpacing: "-0.05em", lineHeight: 1, margin: 0 }}>
        {now.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true })}
      </p>
    </div>
  );
}

// ── Horizontal rule ───────────────────────────────────────────
function Rule({ style: s }: { style?: React.CSSProperties }) {
  return <div style={{ height: 1, background: BORDER, ...s }} />;
}

// ══════════════════════════════════════════════════════════════
// Kiosk
// ══════════════════════════════════════════════════════════════
export default function KioskPage() {
  const [lang, setLang]       = useState<Lang>("en");
  const [step, setStep]       = useState<Step>("home");
  const [students, setStudents]   = useState<TRIOStudent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [meetings, setMeetings]   = useState<Meeting[]>([]);
  const [events, setEvents]     = useState<TRIOEvent[]>([]);
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<TRIOStudent[]>([]);
  const [found, setFound]       = useState<TRIOStudent | null>(null);
  const [reason, setReason]     = useState("");
  const [session, setSession]   = useState<Activity | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [checkinTime, setCheckinTime] = useState("");
  const [showNoResult, setShowNoResult] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const today    = new Date().toISOString().split("T")[0];
  const t        = T[lang];
  const reasons  = lang === "es" ? REASONS_ES : REASONS_EN;

  // ── Load data ─────────────────────────────────────────────────
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
    if (step === "home") setTimeout(() => inputRef.current?.focus(), 60);
  }, [step]);

  // ── Global keypress → re-focus ────────────────────────────────
  useEffect(() => {
    if (step !== "home") return;
    const h = (e: KeyboardEvent) => {
      if (e.key.length === 1 && document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
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
    setStep("home");
    setQuery("");
    setResults([]);
    setFound(null);
    setReason("");
    setSession(null);
    setCheckinTime("");
    setShowNoResult(false);
  }

  function clearStudent() {
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
    if (sess) setStep("already-in");
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (results.length === 1) { selectStudent(results[0]); return; }
    if (results.length > 1) {
      const exact = results.find((s) => s.student_number.toLowerCase() === query.trim().toLowerCase());
      if (exact) selectStudent(exact);
    }
  }, [results, query]);

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
    if (h === 0) return `${m} ${lang === "es" ? "min" : "minutes"}`;
    if (m === 0) return `${h} ${lang === "es" ? "hora" : "hour"}${h > 1 ? "s" : ""}`;
    return `${h} ${lang === "es" ? "hr" : "hr"} ${m} min`;
  }

  function getSessionTime(): string {
    if (!session) return "—";
    return new Date(session.check_in_time).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  }

  // ── Shared shell ──────────────────────────────────────────────
  const shell: React.CSSProperties = {
    minHeight: "100vh",
    background: BG,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
    color: WHITE,
    padding: "32px 16px",
  };

  const col: React.CSSProperties = {
    width: "100%",
    maxWidth: 460,
    display: "flex",
    flexDirection: "column",
  };

  // ── Branding block ────────────────────────────────────────────
  const brand = (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <p style={{
        fontSize: 13, fontWeight: 800, letterSpacing: "0.26em",
        textTransform: "uppercase", margin: "0 0 6px",
        background: GOLD_GRAD, WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent" as never,
      }}>
        {t.brand}
      </p>
      <p style={{ fontSize: 10, color: DIM, letterSpacing: "0.1em", margin: 0 }}>{t.powered}</p>
    </div>
  );

  // ── Language toggle ───────────────────────────────────────────
  const langToggle = (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0" }}>
      {(["en", "es"] as const).map((l) => (
        <button key={l} onClick={() => setLang(l)}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            fontFamily: "inherit", padding: "2px 0",
          }}>
          <span style={{
            fontSize: 14,
            fontWeight: lang === l ? 700 : 400,
            color: lang === l ? WHITE : MUTED,
            letterSpacing: "0.02em",
            transition: "color 0.15s",
          }}>
            {l === "en" ? t.english : t.espanol}
          </span>
        </button>
      ))}
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // HOME SCREEN
  // ══════════════════════════════════════════════════════════════
  if (step === "home") return (
    <div style={shell}>
      <div style={col}>
        {brand}

        <p style={{ textAlign: "center", fontSize: 22, fontWeight: 700, color: WHITE, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
          {t.welcome}
        </p>

        <LiveClock lang={lang} />

        <Rule />
        {langToggle}
        <Rule style={{ marginBottom: 28 }} />

        {/* Name / ID field */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <input
            ref={inputRef}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (found) clearStudent();
            }}
            onKeyDown={handleKeyDown}
            placeholder={t.namePlaceholder}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: FIELD_BG,
              border: `1.5px solid ${found ? GOLD_RING : BORDER}`,
              borderRadius: (results.length > 0 || showNoResult) ? "12px 12px 0 0" : 12,
              padding: "17px 44px 17px 18px",
              fontSize: 16,
              color: WHITE,
              outline: "none",
              fontFamily: "inherit",
              letterSpacing: "0.01em",
              transition: "border-color 0.15s, border-radius 0.1s",
            }}
            onFocus={(e) => { if (!found) e.currentTarget.style.borderColor = GOLD_RING; }}
            onBlur={(e) => { if (!found) e.currentTarget.style.borderColor = BORDER; }}
          />
          {(found || query.length > 0) && (
            <button onClick={clearStudent}
              style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "none", color: MUTED, fontSize: 15,
                cursor: "pointer", width: 26, height: 26, display: "flex",
                alignItems: "center", justifyContent: "center", borderRadius: "50%",
                fontFamily: "inherit", transition: "color 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = WHITE; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}>
              ✕
            </button>
          )}

          {/* Dropdown results */}
          {results.length > 0 && (
            <div style={{
              position: "absolute", left: 0, right: 0, top: "100%", zIndex: 50,
              background: FIELD_BG, border: `1.5px solid ${GOLD_RING}`, borderTop: "none",
              borderRadius: "0 0 12px 12px", overflow: "hidden",
            }}>
              {results.map((s, i) => (
                <button key={s.id} onClick={() => selectStudent(s)}
                  style={{
                    width: "100%", background: "transparent", border: "none",
                    padding: "13px 18px", display: "flex", alignItems: "center",
                    justifyContent: "space-between", cursor: "pointer", textAlign: "left",
                    borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
                    fontFamily: "inherit", transition: "background 0.08s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(250,250,250,0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: WHITE, margin: 0, letterSpacing: "-0.01em" }}>
                      {s.full_name}
                    </p>
                    <p style={{ fontSize: 11, color: MUTED, margin: "3px 0 0", letterSpacing: "0.02em" }}>
                      {s.student_number}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: s.enrollment_status === "active" ? "#4ADE80" : "#F87171",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                  }}>
                    {s.enrollment_status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {showNoResult && (
            <div style={{
              position: "absolute", left: 0, right: 0, top: "100%", zIndex: 50,
              background: FIELD_BG, border: `1.5px solid ${BORDER}`, borderTop: "none",
              borderRadius: "0 0 12px 12px", padding: "14px 18px",
            }}>
              <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.noStudent}</p>
            </div>
          )}
        </div>

        {/* Reason dropdown */}
        <p style={{ fontSize: 11, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" }}>
          {t.whyLabel}
        </p>
        <div style={{ position: "relative", marginBottom: 32 }}>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={!found}
            style={{
              width: "100%",
              appearance: "none" as const,
              background: FIELD_BG,
              border: `1.5px solid ${reason ? GOLD_RING : BORDER}`,
              borderRadius: 12,
              padding: "17px 44px 17px 18px",
              fontSize: 16,
              color: found ? WHITE : MUTED,
              outline: "none",
              fontFamily: "inherit",
              cursor: found ? "pointer" : "not-allowed",
              transition: "border-color 0.15s",
            }}>
            <option value="" style={{ background: "#111" }}>{t.whyPlaceholder}</option>
            {reasons.map((r) => (
              <option key={r.id} value={r.id} style={{ background: "#111", color: WHITE }}>
                {r.label}
              </option>
            ))}
          </select>
          <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={found ? MUTED : DIM} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={doCheckIn} disabled={!found || !reason}
            style={{
              flex: 1, height: 56,
              background: found && reason ? RED : "transparent",
              border: `1.5px solid ${found && reason ? RED : BORDER}`,
              borderRadius: 12,
              color: found && reason ? WHITE : MUTED,
              fontSize: 13, fontWeight: 800, letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              cursor: found && reason ? "pointer" : "not-allowed",
              fontFamily: "inherit", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (found && reason) e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
            {t.checkIn}
          </button>

          <button onClick={() => { if (found) doCheckOut(); }} disabled={!found}
            style={{
              flex: 1, height: 56,
              background: found ? GOLD_FILL : "transparent",
              border: `1.5px solid ${found ? GOLD_RING : BORDER}`,
              borderRadius: 12,
              color: found ? GOLD : MUTED,
              fontSize: 13, fontWeight: 800, letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              cursor: found ? "pointer" : "not-allowed",
              fontFamily: "inherit", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (found) e.currentTarget.style.background = "rgba(212,175,55,0.14)"; }}
            onMouseLeave={(e) => { if (found) e.currentTarget.style.background = GOLD_FILL; }}>
            {t.checkOut}
          </button>
        </div>

        {found && !reason && (
          <p style={{ textAlign: "center", fontSize: 10, color: DIM, marginTop: 10, letterSpacing: "0.08em" }}>
            {t.selectReason}
          </p>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // ALREADY CHECKED IN
  // ══════════════════════════════════════════════════════════════
  if (step === "already-in" && found) return (
    <div style={shell}>
      <div style={col}>
        {brand}

        <LiveClock lang={lang} />

        <Rule />
        {langToggle}
        <Rule style={{ marginBottom: 32 }} />

        {/* Student name */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 28 }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: WHITE, letterSpacing: "-0.02em", margin: 0 }}>
            {found.full_name}
          </p>
          <button onClick={reset}
            style={{ background: "transparent", border: "none", color: MUTED, fontSize: 12, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em", transition: "color 0.1s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = WHITE; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}>
            {t.notYou}
          </button>
        </div>

        <Rule />

        {/* Session info */}
        <div style={{ padding: "28px 0", display: "flex", flexDirection: "column", gap: 22 }}>
          <p style={{ fontSize: 15, color: MUTED, margin: 0, lineHeight: 1.6 }}>{t.currentlyIn}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 11, color: DIM, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
              {t.checkInTime}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: WHITE, letterSpacing: "-0.03em", margin: 0 }}>
              {getSessionTime()}
            </p>
          </div>

          <Rule />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 11, color: DIM, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
              {t.duration}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: WHITE, letterSpacing: "-0.03em", margin: 0 }}>
              {getDuration()}
            </p>
          </div>
        </div>

        <Rule style={{ marginBottom: 28 }} />

        <button onClick={doCheckOut}
          style={{
            width: "100%", height: 56,
            background: GOLD_FILL, border: `1.5px solid ${GOLD_RING}`,
            borderRadius: 12, color: GOLD,
            fontSize: 13, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = GOLD_FILL; }}>
          {t.checkOut}
        </button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CHECK-IN COMPLETE
  // ══════════════════════════════════════════════════════════════
  if (step === "success" && found) return (
    <div style={shell}>
      <div style={col}>
        {brand}

        <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase" as const, margin: "0 0 20px" }}>
          {t.checkInComplete}
        </p>

        <h2 style={{ fontSize: 48, fontWeight: 900, color: WHITE, letterSpacing: "-0.04em", lineHeight: 1, margin: "0 0 36px" }}>
          {found.full_name.split(" ")[0]}
        </h2>

        <Rule />

        <div style={{ padding: "28px 0", display: "flex", flexDirection: "column", gap: 18 }}>
          {([
            [t.studentLabel,  found.full_name],
            [t.timeLabel,     checkinTime],
            [t.reasonLabel,   reason],
            [t.locationLabel, t.location],
            [t.statusLabel,   t.statusActive],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <span style={{ fontSize: 13, color: MUTED }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: label === t.statusLabel ? "#4ADE80" : "rgba(250,250,250,0.8)", textAlign: "right" }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <Rule />

        <div style={{ marginTop: 24 }}>
          <div style={{ height: 2, background: BORDER, borderRadius: 1, overflow: "hidden", marginBottom: 10 }}>
            <div style={{ height: "100%", background: GOLD, width: `${(countdown / 5) * 100}%`, transition: "width 1s linear" }} />
          </div>
          <p style={{ fontSize: 10, color: DIM, letterSpacing: "0.06em" }}>{t.returning} {countdown}s</p>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CHECK-OUT COMPLETE
  // ══════════════════════════════════════════════════════════════
  if (step === "co-success" && found) return (
    <div style={shell}>
      <div style={col}>
        {brand}

        <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase" as const, margin: "0 0 20px" }}>
          {t.checkOutComplete}
        </p>

        <h2 style={{ fontSize: 48, fontWeight: 900, color: WHITE, letterSpacing: "-0.04em", lineHeight: 1, margin: "0 0 36px" }}>
          {found.full_name.split(" ")[0]}
        </h2>

        <Rule />

        <div style={{ padding: "28px 0", display: "flex", flexDirection: "column", gap: 18 }}>
          {([
            [t.studentLabel,    found.full_name],
            [t.checkOutTime,    new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })],
            [t.visitDuration,   getDuration()],
            [t.statusLabel,     t.statusComplete],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <span style={{ fontSize: 13, color: MUTED }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: label === t.statusLabel ? GOLD : "rgba(250,250,250,0.8)", textAlign: "right" }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <Rule />

        <div style={{ marginTop: 24 }}>
          <div style={{ height: 2, background: BORDER, borderRadius: 1, overflow: "hidden", marginBottom: 10 }}>
            <div style={{ height: "100%", background: GOLD, width: `${(countdown / 5) * 100}%`, transition: "width 1s linear" }} />
          </div>
          <p style={{ fontSize: 10, color: DIM, letterSpacing: "0.06em" }}>{t.returning} {countdown}s</p>
        </div>
      </div>
    </div>
  );

  return null;
}
