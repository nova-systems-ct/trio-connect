import { useState, useEffect, useRef } from "react";
import {
  getStudents, getActivities, createActivity, updateActivity,
  getMeetings, getEvents, getAdvisors,
} from "../lib/db";
import type { TRIOStudent, Activity, Meeting, TRIOEvent, Profile } from "../lib/types";
import { differenceInMinutes } from "date-fns";

type Lang  = "en" | "es";
type Mode  = "normal" | "accessible";
type Flow  = "checkin" | "checkout";
type Step  =
  | "home"
  | "method"
  | "id-entry"
  | "search-entry"
  | "confirm"
  | "appointment-detected"
  | "reason"
  | "advisor"
  | "followup"
  | "submitting"
  | "success"
  | "already-in";

const L = {
  en: {
    title: "Welcome to TRIO Connect",
    subtitle: "Student Success Platform",
    checkin: "Check In",
    checkout: "Check Out",
    back: "← Back",
    enterID: "Enter Your Student ID",
    enterIDSub: "Type your TRIO student ID number",
    searchName: "Search Your Name",
    searchNameSub: "Type your first or last name",
    idPlaceholder: "e.g. TRIO-2026-001",
    searchPlaceholder: "First or last name…",
    findRecord: "Find My Record",
    isThisYou: "Is this you?",
    yes: "Yes, this is me",
    no: "That's not me",
    selectReason: "Why are you visiting today?",
    whomMeeting: "Who are you meeting?",
    noAdvisor: "— No specific advisor —",
    followup: "Would you like follow-up assistance?",
    followupYes: "Yes, please follow up with me",
    followupNo: "No thank you",
    confirm: "Continue",
    successIn: "You're checked in!",
    successOut: "You're checked out!",
    successSub: "Have a great visit.",
    successSubOut: "Thank you for visiting TRIO.",
    notFound: "Student not found. Please try again or ask staff for help.",
    alreadyIn: "Already Checked In",
    alreadyInSub: "You are already checked in. Please check out before checking in again.",
    apptDetected: "Appointment Detected",
    apptSub: "You have a scheduled appointment today.",
    eventDetected: "Event Today",
    noResults: "No matching students found.",
    home: "Home",
  },
  es: {
    title: "Bienvenido a TRIO Connect",
    subtitle: "Plataforma de Éxito Estudiantil",
    checkin: "Registrarse",
    checkout: "Marcar Salida",
    back: "← Regresar",
    enterID: "Ingresa tu ID Estudiantil",
    enterIDSub: "Escribe tu número de ID TRIO",
    searchName: "Busca tu Nombre",
    searchNameSub: "Escribe tu primer o apellido",
    idPlaceholder: "ej. TRIO-2026-001",
    searchPlaceholder: "Nombre o apellido…",
    findRecord: "Encontrar mi Registro",
    isThisYou: "¿Eres tú?",
    yes: "Sí, soy yo",
    no: "No soy yo",
    selectReason: "¿Por qué visitas hoy?",
    whomMeeting: "¿Con quién te reúnes?",
    noAdvisor: "— Sin consejero específico —",
    followup: "¿Deseas asistencia de seguimiento?",
    followupYes: "Sí, por favor comuníquense conmigo",
    followupNo: "No, gracias",
    confirm: "Continuar",
    successIn: "¡Estás registrado!",
    successOut: "¡Has marcado tu salida!",
    successSub: "Que tengas una excelente visita.",
    successSubOut: "Gracias por visitar TRIO.",
    notFound: "Estudiante no encontrado. Por favor pide ayuda al personal.",
    alreadyIn: "Ya Registrado",
    alreadyInSub: "Ya estás registrado. Por favor marca la salida antes de registrarte nuevamente.",
    apptDetected: "Cita Detectada",
    apptSub: "Tienes una cita programada hoy.",
    eventDetected: "Evento Hoy",
    noResults: "No se encontraron estudiantes.",
    home: "Inicio",
  },
};

const REASONS = {
  en: ["Appointment / Advising Meeting", "Walk-In Advising", "Tutoring", "Workshop or Event", "Study Space", "Computer Lab", "FAFSA Assistance", "Financial Aid Help", "Transfer Planning", "Scholarship Help", "Career Support", "Document Assistance", "General Visit", "Other"],
  es: ["Cita / Reunión de Asesoría", "Asesoría sin Cita", "Tutoría", "Taller o Evento", "Sala de Estudio", "Laboratorio de Computadoras", "Ayuda con FAFSA", "Ayuda con Ayuda Financiera", "Planificación de Transferencia", "Ayuda con Becas", "Apoyo Profesional", "Asistencia con Documentos", "Visita General", "Otro"],
};

const GRAD = "linear-gradient(135deg, #1a0000 0%, #0B0B0B 50%, #000a0f 100%)";

function KBtn({
  children, onClick, variant = "default", large = false, disabled = false, acc = false, fullWidth = false,
}: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "red" | "default" | "ghost" | "green";
  large?: boolean; disabled?: boolean; acc?: boolean; fullWidth?: boolean;
}) {
  const fs = acc ? (large ? 24 : 18) : (large ? 20 : 16);
  const pad = acc ? (large ? "30px 40px" : "18px 28px") : (large ? "24px 32px" : "14px 22px");
  const styles: Record<string, React.CSSProperties> = {
    red:     { background: "#D72638", border: "none",    color: "#fff",      boxShadow: "0 6px 28px rgba(215,38,56,0.35)" },
    default: { background: "#1A1A1A", border: "1.5px solid rgba(255,255,255,0.09)", color: "#F8FAFC" },
    ghost:   { background: "rgba(255,255,255,0.05)", border: "none", color: "#94A3B8" },
    green:   { background: "#15803D", border: "none",    color: "#fff",      boxShadow: "0 6px 28px rgba(21,128,61,0.35)" },
  };
  return (
    <button style={{
      ...styles[variant],
      borderRadius: 18, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: fs,
      padding: pad, lineHeight: 1, transition: "all 0.15s",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: disabled ? 0.5 : 1, width: fullWidth ? "100%" : undefined,
    }} onClick={onClick} disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = "0.88"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
      {children}
    </button>
  );
}

export default function KioskPage() {
  const [lang, setLang]         = useState<Lang>("en");
  const [mode, setMode]         = useState<Mode>("normal");
  const [flow, setFlow]         = useState<Flow>("checkin");
  const [step, setStep]         = useState<Step>("home");
  const [students, setStudents] = useState<TRIOStudent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [advisors, setAdvisors] = useState<Profile[]>([]);
  const [todayMeetings, setTodayMeetings] = useState<Meeting[]>([]);
  const [todayEvents, setTodayEvents]     = useState<TRIOEvent[]>([]);
  const [idInput, setIdInput]   = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<TRIOStudent[]>([]);
  const [found, setFound]       = useState<TRIOStudent | null>(null);
  const [activeSession, setActiveSession] = useState<Activity | null>(null);
  const [detectedAppt, setDetectedAppt]   = useState<Meeting | null>(null);
  const [detectedEvent, setDetectedEvent] = useState<TRIOEvent | null>(null);
  const [reason, setReason]     = useState("");
  const [advisorMet, setAdvisorMet] = useState<Profile | null>(null);
  const [followUp, setFollowUp] = useState<boolean | null>(null);
  const [clock, setClock]       = useState(new Date());
  const [error, setError]       = useState("");

  const idRef     = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const t   = L[lang];
  const acc = mode === "accessible";
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      const [s, a, adv, mtgs, evts] = await Promise.all([
        getStudents(), getActivities(), getAdvisors(), getMeetings(), getEvents(),
      ]);
      setStudents(s);
      setActivities(a.filter((x) => x.check_in_time.startsWith(today)));
      setAdvisors(adv);
      setTodayMeetings(mtgs.filter((m) => m.meeting_date === today && m.status === "Scheduled"));
      setTodayEvents(evts.filter((e) => e.event_date === today && e.is_active));
    };
    load();
  }, []);

  useEffect(() => { const timer = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (step === "id-entry")     setTimeout(() => idRef.current?.focus(), 100); }, [step]);
  useEffect(() => { if (step === "search-entry") setTimeout(() => searchRef.current?.focus(), 100); }, [step]);

  function reset() {
    setStep("home"); setIdInput(""); setSearchInput(""); setSearchResults([]);
    setFound(null); setActiveSession(null); setDetectedAppt(null); setDetectedEvent(null);
    setReason(""); setAdvisorMet(null); setFollowUp(null); setError("");
  }

  function afterStudentFound(s: TRIOStudent) {
    setFound(s);
    const sess = activities.find((a) => a.student_id === s.id && !a.check_out_time) ?? null;
    setActiveSession(sess);
    const appt = todayMeetings.find((m) => m.student_id === s.id) ?? null;
    const evt  = todayEvents[0] ?? null;
    setDetectedAppt(appt);
    setDetectedEvent(appt ? null : evt);
    if (flow === "checkout") { setStep("confirm"); return; }
    if (sess) { setStep("already-in"); return; }
    setStep("confirm");
  }

  function handleIdLookup() {
    setError("");
    const q = idInput.trim().toLowerCase();
    const s = students.find((st) => st.student_number.toLowerCase() === q || st.id === idInput.trim());
    if (!s) { setError(t.notFound); return; }
    afterStudentFound(s);
  }

  function handleSearch(q: string) {
    setSearchInput(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const lower = q.toLowerCase();
    setSearchResults(students.filter((s) =>
      s.full_name.toLowerCase().includes(lower) || s.student_number.toLowerCase().includes(lower)
    ).slice(0, 5));
  }

  function handleConfirm() {
    if (flow === "checkout") { handleSubmitCheckOut(); return; }
    if (detectedAppt) { setStep("appointment-detected"); } else { setStep("reason"); }
  }

  function handleApptConfirm() {
    setReason("Appointment / Advising Meeting");
    if (detectedAppt?.advisor_id) {
      const adv = advisors.find((a) => a.id === detectedAppt.advisor_id);
      setAdvisorMet(adv ?? null);
    }
    setStep("advisor");
  }

  async function handleSubmitCheckIn() {
    if (!found) return;
    setStep("submitting");
    await createActivity({
      student_id:          found.id,
      student_name:        found.full_name,
      activity_type:       "Walk-In Advising",
      check_in_time:       new Date().toISOString(),
      location:            "TRIO Office (Kiosk)",
      notes:               reason,
      advisor_met_id:      advisorMet?.id,
      advisor_met_name:    advisorMet?.full_name,
      follow_up_requested: followUp === true || undefined,
      meeting_id:          detectedAppt?.id,
      event_id:            detectedEvent?.id,
    });
    setStep("success");
    setTimeout(() => reset(), 6000);
  }

  async function handleSubmitCheckOut() {
    setStep("submitting");
    if (activeSession) {
      const mins = differenceInMinutes(new Date(), new Date(activeSession.check_in_time));
      await updateActivity(activeSession.id, { check_out_time: new Date().toISOString(), duration_minutes: mins });
    }
    setStep("success");
    setTimeout(() => reset(), 5000);
  }

  const fs  = (n: number) => acc ? Math.round(n * 1.22) : n;
  const txt = (size: number, weight: number, color: string): React.CSSProperties => ({
    fontSize: fs(size), fontWeight: weight, color, margin: 0, lineHeight: 1.2,
  });
  const reasons = REASONS[lang];

  return (
    <div style={{ minHeight: "100vh", background: GRAD, display: "flex", flexDirection: "column", fontFamily: "'Inter', -apple-system, sans-serif", userSelect: "none", overflow: "hidden", position: "relative" }}>

      {/* Ambient glow */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 900, height: 700, background: "rgba(215,38,56,0.035)", borderRadius: "50%", filter: "blur(120px)", pointerEvents: "none", zIndex: 0 }} />

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: acc ? "26px 52px" : "16px 40px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div>
          <p style={txt(acc ? 24 : 19, 900, "#F8FAFC")}>TRIO Connect</p>
          <p style={{ ...txt(acc ? 11 : 9, 500, "#475569"), marginTop: 2 }}>CT State · {t.subtitle}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={txt(acc ? 22 : 17, 800, "#F8FAFC")}>{clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          <p style={{ ...txt(acc ? 10 : 8, 500, "#2D3748"), marginTop: 2 }}>{clock.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setLang((l) => l === "en" ? "es" : "en")} style={{ padding: acc ? "9px 16px" : "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8", fontSize: acc ? 14 : 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            {lang === "en" ? "🇺🇸 EN" : "🇲🇽 ES"}
          </button>
          <button onClick={() => setMode((m) => m === "normal" ? "accessible" : "normal")} style={{ padding: acc ? "9px 16px" : "6px 12px", borderRadius: 8, background: mode === "accessible" ? "rgba(215,38,56,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${mode === "accessible" ? "rgba(215,38,56,0.3)" : "rgba(255,255,255,0.08)"}`, color: mode === "accessible" ? "#D72638" : "#94A3B8", fontSize: acc ? 14 : 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>A+</button>
          {step !== "home" && (
            <button onClick={reset} style={{ padding: acc ? "9px 16px" : "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8", fontSize: acc ? 14 : 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              {t.home}
            </button>
          )}
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 740 }}>

          {/* HOME */}
          {step === "home" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: acc ? 48 : 38 }}>
                <div style={{ width: acc ? 64 : 52, height: acc ? 64 : 52, borderRadius: 15, background: "rgba(215,38,56,0.1)", border: "1px solid rgba(215,38,56,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                  <div style={{ width: acc ? 24 : 18, height: acc ? 24 : 18, borderRadius: 4, background: "#D72638" }} />
                </div>
                <p style={txt(acc ? 42 : 34, 900, "#F8FAFC")}>{t.title}</p>
                <p style={{ ...txt(acc ? 16 : 13, 400, "#475569"), marginTop: 10 }}>{t.subtitle}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 12 }}>
                {([
                  { label: t.checkin, f: "checkin" as Flow, color: "#D72638", glow: "rgba(215,38,56,0.4)", icon: "✓" },
                  { label: t.checkout, f: "checkout" as Flow, color: "#151515", glow: undefined, icon: "→", brd: "1.5px solid rgba(255,255,255,0.09)" },
                ]).map(({ label, f, color, glow, icon, brd }) => (
                  <button key={f} onClick={() => { setFlow(f); setStep("method"); }} style={{
                    padding: acc ? "46px 20px" : "38px 16px", borderRadius: 22,
                    background: color, border: brd ?? "none", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                    transition: "all 0.15s", fontFamily: "'Inter', sans-serif",
                    boxShadow: glow ? `0 8px 40px ${glow}` : undefined,
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
                    <span style={{ fontSize: acc ? 36 : 30, fontWeight: 300, color: "#fff" }}>{icon}</span>
                    <p style={{ fontSize: acc ? 24 : 20, fontWeight: 900, color: "#F8FAFC" }}>{label}</p>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: acc ? 11 : 9, color: "#2D3748", marginTop: 8 }}>Need help? Ask a TRIO staff member at the front desk.</p>
            </div>
          )}

          {/* METHOD */}
          {step === "method" && (
            <div style={{ textAlign: "center" }}>
              <p style={txt(acc ? 32 : 26, 900, "#F8FAFC")}>{flow === "checkin" ? t.checkin : t.checkout}</p>
              <p style={{ ...txt(acc ? 15 : 12, 400, "#475569"), marginTop: 8, marginBottom: acc ? 36 : 28 }}>
                {lang === "en" ? "How would you like to identify yourself?" : "¿Cómo te identificarás?"}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: lang === "en" ? "Student ID" : "ID Estudiantil", icon: "🪪", to: "id-entry" as Step },
                  { label: lang === "en" ? "Search Name" : "Buscar Nombre",  icon: "🔍", to: "search-entry" as Step },
                  { label: lang === "en" ? "QR / Barcode"  : "QR / Código",  icon: "📱", to: "id-entry" as Step },
                ].map(({ label, icon, to }) => (
                  <button key={label} onClick={() => setStep(to)} style={{
                    padding: acc ? "36px 12px" : "28px 10px", borderRadius: 20,
                    background: "#151515", border: "1.5px solid rgba(255,255,255,0.08)",
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 10, transition: "all 0.15s",
                    fontFamily: "'Inter', sans-serif",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(215,38,56,0.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                    <span style={{ fontSize: acc ? 40 : 32 }}>{icon}</span>
                    <p style={{ fontSize: acc ? 16 : 13, fontWeight: 700, color: "#F8FAFC" }}>{label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ID ENTRY */}
          {step === "id-entry" && (
            <div style={{ textAlign: "center" }}>
              <p style={txt(acc ? 32 : 26, 900, "#F8FAFC")}>{t.enterID}</p>
              <p style={{ ...txt(acc ? 14 : 12, 400, "#475569"), marginTop: 8, marginBottom: acc ? 32 : 24 }}>{t.enterIDSub}</p>
              <input ref={idRef} type="text" value={idInput}
                onChange={(e) => { setIdInput(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleIdLookup()}
                placeholder={t.idPlaceholder}
                style={{
                  display: "block", width: "100%", padding: acc ? "22px 24px" : "18px 20px",
                  background: "#151515", border: "2px solid rgba(255,255,255,0.1)", borderRadius: 16,
                  color: "#F8FAFC", fontSize: acc ? 24 : 20, fontWeight: 700, textAlign: "center",
                  outline: "none", fontFamily: "'Inter', sans-serif", marginBottom: 14,
                  letterSpacing: "0.04em", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#D72638"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              {error && <p style={{ color: "#D72638", fontSize: acc ? 14 : 12, marginBottom: 14 }}>{error}</p>}
              <KBtn variant="red" large onClick={handleIdLookup} disabled={!idInput.trim()} acc={acc} fullWidth>{t.findRecord}</KBtn>
            </div>
          )}

          {/* SEARCH ENTRY */}
          {step === "search-entry" && (
            <div>
              <p style={{ ...txt(acc ? 32 : 26, 900, "#F8FAFC"), textAlign: "center" }}>{t.searchName}</p>
              <p style={{ ...txt(acc ? 14 : 12, 400, "#475569"), marginTop: 8, marginBottom: acc ? 28 : 22, textAlign: "center" }}>{t.searchNameSub}</p>
              <input ref={searchRef} type="text" value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                style={{
                  display: "block", width: "100%", padding: acc ? "18px 22px" : "14px 18px",
                  background: "#151515", border: "2px solid rgba(255,255,255,0.1)", borderRadius: 16,
                  color: "#F8FAFC", fontSize: acc ? 22 : 18, fontWeight: 600,
                  outline: "none", fontFamily: "'Inter', sans-serif", marginBottom: 14,
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#D72638"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              {error && <p style={{ color: "#D72638", fontSize: acc ? 13 : 11, marginBottom: 12 }}>{error}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {searchInput.trim() && searchResults.length === 0 && (
                  <p style={{ textAlign: "center", color: "#475569", fontSize: acc ? 13 : 11, padding: "16px 0" }}>{t.noResults}</p>
                )}
                {searchResults.map((s) => {
                  const appt = todayMeetings.some((m) => m.student_id === s.id);
                  return (
                    <button key={s.id} onClick={() => afterStudentFound(s)} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: acc ? "16px 20px" : "12px 16px",
                      borderRadius: 14, background: "#151515",
                      border: "1.5px solid rgba(255,255,255,0.08)",
                      cursor: "pointer", transition: "all 0.12s", fontFamily: "'Inter', sans-serif",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D72638"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                      <div style={{ width: acc ? 46 : 38, height: acc ? 46 : 38, borderRadius: 10, background: "rgba(215,38,56,0.1)", border: "1px solid rgba(215,38,56,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: acc ? 13 : 11, fontWeight: 900, color: "#D72638" }}>{s.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <div style={{ textAlign: "left", flex: 1 }}>
                        <p style={{ fontSize: acc ? 17 : 14, fontWeight: 700, color: "#F8FAFC" }}>{s.full_name}</p>
                        <p style={{ fontSize: acc ? 11 : 9, color: "#475569", marginTop: 2 }}>{s.student_number} · {s.program}</p>
                      </div>
                      {appt && <span style={{ fontSize: acc ? 10 : 8, fontWeight: 700, color: "#60A5FA", background: "rgba(59,130,246,0.1)", padding: "3px 8px", borderRadius: 20 }}>
                        {lang === "en" ? "Appt" : "Cita"}
                      </span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONFIRM IDENTITY */}
          {step === "confirm" && found && (
            <div style={{ textAlign: "center" }}>
              <p style={txt(acc ? 32 : 26, 900, "#F8FAFC")}>{t.isThisYou}</p>
              <div style={{ background: "#151515", borderRadius: 20, border: "1.5px solid rgba(255,255,255,0.08)", padding: acc ? "32px" : "26px", margin: `${acc ? 28 : 22}px auto`, maxWidth: 420 }}>
                <div style={{ width: acc ? 72 : 60, height: acc ? 72 : 60, borderRadius: 16, background: "rgba(215,38,56,0.1)", border: "2px solid rgba(215,38,56,0.22)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <span style={{ fontSize: acc ? 22 : 18, fontWeight: 900, color: "#D72638" }}>{found.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                </div>
                <p style={txt(acc ? 24 : 20, 900, "#F8FAFC")}>{found.full_name}</p>
                <p style={{ ...txt(acc ? 13 : 11, 500, "#475569"), marginTop: 5 }}>{found.student_number}</p>
                <p style={{ ...txt(acc ? 12 : 10, 400, "#475569"), marginTop: 3 }}>{found.program} · {found.work_location ?? "CT State"}</p>
                <p style={{ ...txt(acc ? 12 : 10, 400, "#475569"), marginTop: 3 }}>Advisor: {found.advisor_name ?? "Unassigned"}</p>

                {flow === "checkout" && !activeSession && (
                  <div style={{ marginTop: 12, padding: "9px 13px", borderRadius: 8, background: "rgba(215,38,56,0.08)", border: "1px solid rgba(215,38,56,0.18)" }}>
                    <p style={{ fontSize: acc ? 12 : 10, color: "#F87171" }}>{lang === "en" ? "No active check-in found." : "No se encontró un registro activo."}</p>
                  </div>
                )}
                {flow === "checkout" && activeSession && (
                  <div style={{ marginTop: 12, padding: "9px 13px", borderRadius: 8, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.14)" }}>
                    <p style={{ fontSize: acc ? 12 : 10, color: "#22C55E", fontWeight: 700 }}>
                      {lang === "en" ? "Checked in" : "Registrado"} · {activeSession.activity_type}
                    </p>
                    <p style={{ fontSize: acc ? 11 : 9, color: "#475569", marginTop: 2 }}>
                      {lang === "en" ? "Since" : "Desde"} {new Date(activeSession.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <KBtn variant="ghost" onClick={reset} acc={acc}>{t.no}</KBtn>
                <KBtn variant="red" onClick={handleConfirm} disabled={flow === "checkout" && !activeSession} acc={acc}>{t.yes}</KBtn>
              </div>
            </div>
          )}

          {/* ALREADY CHECKED IN */}
          {step === "already-in" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: acc ? 52 : 40, marginBottom: 18 }}>⚠️</div>
              <p style={txt(acc ? 28 : 22, 900, "#F8FAFC")}>{t.alreadyIn}</p>
              <p style={{ ...txt(acc ? 14 : 12, 400, "#475569"), marginTop: 10, maxWidth: 420, margin: "10px auto 28px" }}>{t.alreadyInSub}</p>
              <KBtn variant="red" large onClick={reset} acc={acc}>{lang === "en" ? "Return Home" : "Regresar al Inicio"}</KBtn>
            </div>
          )}

          {/* APPOINTMENT DETECTED */}
          {step === "appointment-detected" && detectedAppt && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: acc ? 48 : 38, marginBottom: 14 }}>📅</div>
              <p style={txt(acc ? 28 : 24, 900, "#60A5FA")}>{t.apptDetected}</p>
              <div style={{ background: "#151515", borderRadius: 18, border: "1.5px solid rgba(59,130,246,0.2)", padding: acc ? "28px" : "22px", margin: `${acc ? 24 : 18}px auto`, maxWidth: 430 }}>
                <p style={txt(acc ? 20 : 16, 800, "#F8FAFC")}>{detectedAppt.meeting_type}</p>
                <p style={{ ...txt(acc ? 14 : 12, 500, "#94A3B8"), marginTop: 7 }}>
                  {lang === "en" ? "Advisor" : "Consejero"}: {detectedAppt.advisor_name}
                </p>
                <p style={{ ...txt(acc ? 14 : 12, 500, "#94A3B8"), marginTop: 4 }}>
                  {lang === "en" ? "Time" : "Hora"}: {detectedAppt.meeting_time}
                </p>
              </div>
              <p style={{ ...txt(acc ? 13 : 11, 400, "#475569"), marginBottom: 22 }}>{t.apptSub}</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <KBtn variant="ghost" onClick={() => setStep("reason")} acc={acc}>{lang === "en" ? "Different reason" : "Otra razón"}</KBtn>
                <KBtn variant="red" onClick={handleApptConfirm} acc={acc}>{lang === "en" ? "Check In for Appointment" : "Registrarse para Cita"}</KBtn>
              </div>
            </div>
          )}

          {/* REASON SELECTION */}
          {step === "reason" && (
            <div>
              <p style={{ ...txt(acc ? 28 : 24, 900, "#F8FAFC"), textAlign: "center", marginBottom: acc ? 28 : 20 }}>{t.selectReason}</p>
              {detectedEvent && (
                <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.16)", borderRadius: 11, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
                  <span>📣</span>
                  <p style={{ fontSize: acc ? 13 : 11, color: "#A78BFA" }}>{t.eventDetected}: <strong>{detectedEvent.title}</strong></p>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 22 }}>
                {reasons.map((r) => (
                  <button key={r} onClick={() => setReason(r)} style={{
                    padding: acc ? "18px 14px" : "13px 10px", borderRadius: 13,
                    border: `1.5px solid ${reason === r ? "#D72638" : "rgba(255,255,255,0.08)"}`,
                    background: reason === r ? "rgba(215,38,56,0.1)" : "#151515",
                    color: reason === r ? "#F8FAFC" : "#94A3B8",
                    fontSize: acc ? 15 : 12, fontWeight: reason === r ? 700 : 400,
                    cursor: "pointer", fontFamily: "'Inter', sans-serif", textAlign: "left" as const,
                    transition: "all 0.12s",
                  }}>
                    {reason === r && <span style={{ color: "#D72638", marginRight: 6 }}>✓</span>}
                    {r}
                  </button>
                ))}
              </div>
              <KBtn variant="red" large onClick={() => { if (reason) setStep("advisor"); }} disabled={!reason} acc={acc} fullWidth>
                {t.confirm} →
              </KBtn>
            </div>
          )}

          {/* ADVISOR SELECTION */}
          {step === "advisor" && (
            <div style={{ textAlign: "center" }}>
              <p style={txt(acc ? 28 : 24, 900, "#F8FAFC")}>{t.whomMeeting}</p>
              <p style={{ ...txt(acc ? 13 : 11, 400, "#475569"), marginTop: 7, marginBottom: acc ? 32 : 24 }}>
                {lang === "en" ? "Select the person you are meeting today." : "Selecciona a la persona con quien te reúnes hoy."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 22 }}>
                {[
                  { id: "", full_name: t.noAdvisor, role: "", isNone: true },
                  ...advisors.map((a) => ({ ...a, isNone: false })),
                ].map((a) => (
                  <button key={a.id || "none"} onClick={() => { setAdvisorMet(a.isNone ? null : (a as Profile)); setStep("followup"); }} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: acc ? "16px 20px" : "13px 16px", borderRadius: 13,
                    border: "1.5px solid rgba(255,255,255,0.08)",
                    background: "#151515", cursor: "pointer",
                    transition: "all 0.12s", fontFamily: "'Inter', sans-serif",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(215,38,56,0.4)"; e.currentTarget.style.background = "#1C1C1C"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "#151515"; }}>
                    {!a.isNone && (
                      <div style={{ width: acc ? 42 : 34, height: acc ? 42 : 34, borderRadius: 9, background: "rgba(215,38,56,0.1)", border: "1px solid rgba(215,38,56,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: acc ? 12 : 10, fontWeight: 900, color: "#D72638" }}>{a.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                      </div>
                    )}
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <p style={{ fontSize: acc ? 16 : 13, fontWeight: a.isNone ? 400 : 700, color: a.isNone ? "#94A3B8" : "#F8FAFC" }}>{a.full_name}</p>
                      {!a.isNone && a.role && <p style={{ fontSize: acc ? 10 : 8, color: "#475569", marginTop: 2, textTransform: "capitalize" }}>{a.role}</p>}
                    </div>
                    <span style={{ color: "#475569", fontSize: acc ? 14 : 12 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FOLLOW-UP */}
          {step === "followup" && (
            <div style={{ textAlign: "center" }}>
              <p style={txt(acc ? 28 : 24, 900, "#F8FAFC")}>{t.followup}</p>
              <p style={{ ...txt(acc ? 13 : 11, 400, "#475569"), marginTop: 9, marginBottom: acc ? 36 : 28, maxWidth: 460, margin: "9px auto 28px" }}>
                {lang === "en" ? "A TRIO advisor will reach out to you after your visit." : "Un consejero de TRIO se comunicará contigo después de tu visita."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 460, margin: "0 auto" }}>
                <button onClick={() => { setFollowUp(true); handleSubmitCheckIn(); }} style={{
                  padding: acc ? "22px 30px" : "18px 26px", borderRadius: 16, background: "#15803D",
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                  boxShadow: "0 6px 24px rgba(21,128,61,0.35)", fontFamily: "'Inter', sans-serif",
                }}>
                  <span style={{ fontSize: acc ? 26 : 22 }}>✓</span>
                  <p style={{ fontSize: acc ? 19 : 16, fontWeight: 800, color: "#fff" }}>{t.followupYes}</p>
                </button>
                <button onClick={() => { setFollowUp(false); handleSubmitCheckIn(); }} style={{
                  padding: acc ? "22px 30px" : "18px 26px", borderRadius: 16, background: "#151515",
                  border: "1.5px solid rgba(255,255,255,0.08)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 14, fontFamily: "'Inter', sans-serif",
                }}>
                  <span style={{ fontSize: acc ? 26 : 22, color: "#475569" }}>—</span>
                  <p style={{ fontSize: acc ? 19 : 16, fontWeight: 700, color: "#94A3B8" }}>{t.followupNo}</p>
                </button>
              </div>
            </div>
          )}

          {/* SUBMITTING */}
          {step === "submitting" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 52, height: 52, border: "4px solid rgba(255,255,255,0.06)", borderTopColor: "#D72638", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 22px" }} />
              <p style={txt(acc ? 20 : 16, 700, "#94A3B8")}>Processing…</p>
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: acc ? 90 : 76, height: acc ? 90 : 76, borderRadius: "50%", background: flow === "checkin" ? "rgba(34,197,94,0.1)" : "rgba(59,130,246,0.1)", border: `2px solid ${flow === "checkin" ? "rgba(34,197,94,0.3)" : "rgba(59,130,246,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
                <svg width={acc ? 40 : 34} height={acc ? 40 : 34} fill="none" viewBox="0 0 24 24" stroke={flow === "checkin" ? "#22C55E" : "#3B82F6"} strokeWidth={2.5}>
                  {flow === "checkin"
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  }
                </svg>
              </div>
              <p style={txt(acc ? 36 : 30, 900, "#F8FAFC")}>{flow === "checkin" ? t.successIn : t.successOut}</p>
              <p style={{ ...txt(acc ? 18 : 15, 600, flow === "checkin" ? "#22C55E" : "#3B82F6"), marginTop: 8 }}>{found?.full_name}</p>
              {advisorMet && <p style={{ ...txt(acc ? 13 : 11, 400, "#94A3B8"), marginTop: 5 }}>{lang === "en" ? "Meeting with" : "Reunión con"} {advisorMet.full_name}</p>}
              {followUp && <p style={{ ...txt(acc ? 12 : 10, 400, "#F59E0B"), marginTop: 5 }}>⚡ {lang === "en" ? "Follow-up requested" : "Seguimiento solicitado"}</p>}
              <p style={{ ...txt(acc ? 14 : 12, 400, "#475569"), marginTop: 14 }}>{flow === "checkin" ? t.successSub : t.successSubOut}</p>
              <p style={{ ...txt(acc ? 11 : 9, 400, "#2D3748"), marginTop: 22 }}>{lang === "en" ? "Returning to home screen…" : "Regresando al inicio…"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{ position: "relative", zIndex: 1, padding: acc ? "14px 52px" : "10px 40px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: acc ? 10 : 8, color: "#2D3748" }}>TRIO Connect Kiosk · Powered by Nova Systems</p>
        <p style={{ fontSize: acc ? 10 : 8, color: "#2D3748" }}>Questions? Ask staff for assistance.</p>
      </div>
    </div>
  );
}
