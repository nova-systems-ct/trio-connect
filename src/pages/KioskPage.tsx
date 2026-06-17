import { useState, useEffect, useRef } from "react";
import { getStudents, getActivities, createActivity, updateActivity } from "../lib/db";
import type { TRIOStudent, Activity } from "../lib/types";
import { differenceInMinutes } from "date-fns";

type Lang = "en" | "es";
type Mode = "normal" | "accessible";
type Flow = "checkin" | "checkout";
type Step = "home" | "method" | "id-entry" | "search-entry" | "confirm" | "reason" | "submitting" | "success" | "error";

const LABELS = {
  en: {
    title: "Welcome to TRIO Connect",
    subtitle: "Student Support Services",
    checkin: "Check In",
    checkout: "Check Out",
    appointment: "View Appointment",
    scanID: "Scan Student ID",
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
    confirm: "Confirm Check-In",
    submit: "Check In",
    submitOut: "Check Out",
    successIn: "You're checked in!",
    successOut: "You're checked out!",
    successSub: "Have a great visit.",
    successSubOut: "Thank you for visiting TRIO.",
    notFound: "Student not found. Please try again or ask staff for help.",
    alreadyIn: "Already Checked In",
    selectReasonError: "Please select a reason before continuing.",
    noStudents: "Please see staff at the front desk.",
  },
  es: {
    title: "Bienvenido a TRIO Connect",
    subtitle: "Servicios de Apoyo Estudiantil",
    checkin: "Registrarse",
    checkout: "Salir",
    appointment: "Ver Cita",
    scanID: "Escanear ID",
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
    confirm: "Confirmar Registro",
    submit: "Registrarse",
    submitOut: "Marcar Salida",
    successIn: "¡Estás registrado!",
    successOut: "¡Has marcado tu salida!",
    successSub: "Que tengas una excelente visita.",
    successSubOut: "Gracias por visitar TRIO.",
    notFound: "Estudiante no encontrado. Por favor pide ayuda al personal.",
    alreadyIn: "Ya Registrado",
    selectReasonError: "Por favor selecciona una razón antes de continuar.",
    noStudents: "Por favor consulta al personal en la recepción.",
  },
};

const REASONS_EN = ["Advising / Counseling", "Tutoring", "Financial Aid Assistance", "Study Hall", "Workshop or Event", "Computer Lab", "Transfer Planning", "Scholarship Help", "Quick Question", "Other"];
const REASONS_ES = ["Asesoría / Consejería", "Tutoría", "Asistencia de Ayuda Financiera", "Sala de Estudio", "Taller o Evento", "Laboratorio de Computadoras", "Planificación de Transferencia", "Ayuda con Becas", "Pregunta Rápida", "Otro"];

const GRAD = "linear-gradient(135deg, #1a0000 0%, #0B0B0B 50%, #000a0f 100%)";

function KioskBtn({
  children, onClick, variant = "default", large = false, disabled = false, accessible = false,
}: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "default" | "red" | "ghost" | "outline";
  large?: boolean; disabled?: boolean; accessible?: boolean;
}) {
  const base: React.CSSProperties = {
    borderRadius: 18, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'Inter', sans-serif", fontWeight: 800, transition: "all 0.15s",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: accessible ? (large ? 26 : 20) : (large ? 22 : 17),
    padding: accessible ? (large ? "28px 40px" : "18px 30px") : (large ? "22px 32px" : "14px 24px"),
    lineHeight: 1,
  };
  const styles: Record<string, React.CSSProperties> = {
    red: { ...base, background: "#D72638", color: "#fff", boxShadow: "0 6px 30px rgba(215,38,56,0.4)" },
    default: { ...base, background: "#1A1A1A", color: "#F8FAFC", border: "1.5px solid rgba(255,255,255,0.1)" },
    ghost: { ...base, background: "rgba(255,255,255,0.06)", color: "#94A3B8", border: "none" },
    outline: { ...base, background: "transparent", color: "#F8FAFC", border: "1.5px solid rgba(255,255,255,0.15)" },
  };
  return (
    <button style={styles[variant]} onClick={onClick} disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.opacity = "0.92"; } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.opacity = "1"; }}>
      {children}
    </button>
  );
}

export default function KioskPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [mode, setMode] = useState<Mode>("normal");
  const [flow, setFlow] = useState<Flow>("checkin");
  const [step, setStep] = useState<Step>("home");
  const [students, setStudents] = useState<TRIOStudent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [idInput, setIdInput] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<TRIOStudent[]>([]);
  const [found, setFound] = useState<TRIOStudent | null>(null);
  const [activeSession, setActiveSession] = useState<Activity | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [clock, setClock] = useState(new Date());

  const idRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const L = LABELS[lang];
  const reasons = lang === "en" ? REASONS_EN : REASONS_ES;
  const acc = mode === "accessible";

  useEffect(() => {
    getStudents().then(setStudents);
    const today = new Date().toISOString().split("T")[0];
    getActivities().then((a) => setActivities(a.filter((x) => x.check_in_time.startsWith(today))));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (step === "id-entry") setTimeout(() => idRef.current?.focus(), 100);
    if (step === "search-entry") setTimeout(() => searchRef.current?.focus(), 100);
  }, [step]);

  function reset() {
    setStep("home");
    setIdInput("");
    setSearchInput("");
    setSearchResults([]);
    setFound(null);
    setActiveSession(null);
    setReason("");
    setError("");
  }

  function handleIdLookup() {
    setError("");
    const s = students.find((s) => s.student_number.toLowerCase() === idInput.trim().toLowerCase() || s.id === idInput.trim());
    if (!s) { setError(L.notFound); return; }
    setFound(s);
    if (flow === "checkout") {
      const sess = activities.find((a) => a.student_id === s.id && !a.check_out_time);
      setActiveSession(sess ?? null);
    }
    setStep("confirm");
  }

  function handleSearch(q: string) {
    setSearchInput(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const lower = q.toLowerCase();
    setSearchResults(students.filter((s) =>
      s.full_name.toLowerCase().includes(lower) ||
      s.student_number.toLowerCase().includes(lower)
    ).slice(0, 5));
  }

  function handleSelectStudent(s: TRIOStudent) {
    setFound(s);
    if (flow === "checkout") {
      const sess = activities.find((a) => a.student_id === s.id && !a.check_out_time);
      setActiveSession(sess ?? null);
    }
    setStep("confirm");
  }

  async function handleSubmitCheckIn() {
    if (!found || !reason) { setError(L.selectReasonError); return; }
    setStep("submitting");
    await createActivity({
      student_id: found.id,
      student_name: found.full_name,
      activity_type: reason as never,
      check_in_time: new Date().toISOString(),
      location: "TRIO Office (Kiosk)",
    });
    const today = new Date().toISOString().split("T")[0];
    getActivities().then((a) => setActivities(a.filter((x) => x.check_in_time.startsWith(today))));
    setStep("success");
    setTimeout(() => reset(), 5000);
  }

  async function handleSubmitCheckOut() {
    setStep("submitting");
    if (activeSession) {
      const mins = differenceInMinutes(new Date(), new Date(activeSession.check_in_time));
      await updateActivity(activeSession.id, { check_out_time: new Date().toISOString(), duration_minutes: mins });
      const today = new Date().toISOString().split("T")[0];
      getActivities().then((a) => setActivities(a.filter((x) => x.check_in_time.startsWith(today))));
    }
    setStep("success");
    setTimeout(() => reset(), 5000);
  }

  const fontSize = (n: number) => acc ? n * 1.25 : n;
  const textStyle = (size: number, weight: number, color: string): React.CSSProperties => ({
    fontSize: fontSize(size), fontWeight: weight, color, margin: 0, lineHeight: 1.2,
  });

  const alreadyCheckedIn = found && activities.some((a) => a.student_id === found.id && !a.check_out_time);

  return (
    <div style={{
      minHeight: "100vh", background: GRAD,
      display: "flex", flexDirection: "column",
      fontFamily: "'Inter', -apple-system, sans-serif",
      userSelect: "none", overflow: "hidden", position: "relative",
    }}>
      {/* Ambient red glow */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 800, height: 600, background: "rgba(215,38,56,0.04)", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none", zIndex: 0 }} />

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: acc ? "28px 48px" : "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div>
          <p style={textStyle(acc ? 28 : 22, 900, "#F8FAFC")}>TRIO Connect</p>
          <p style={{ ...textStyle(acc ? 14 : 11, 500, "#475569"), marginTop: 3 }}>CT State · {L.subtitle}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={textStyle(acc ? 26 : 20, 800, "#F8FAFC")}>{clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          <p style={{ ...textStyle(acc ? 12 : 10, 500, "#475569"), marginTop: 2 }}>{clock.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Language */}
          <button onClick={() => setLang((l) => l === "en" ? "es" : "en")} style={{ padding: acc ? "10px 18px" : "7px 14px", borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", fontSize: acc ? 15 : 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            {lang === "en" ? "🇺🇸 EN" : "🇲🇽 ES"}
          </button>
          {/* Accessibility */}
          <button onClick={() => setMode((m) => m === "normal" ? "accessible" : "normal")} style={{ padding: acc ? "10px 18px" : "7px 14px", borderRadius: 9, background: mode === "accessible" ? "rgba(215,38,56,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${mode === "accessible" ? "rgba(215,38,56,0.3)" : "rgba(255,255,255,0.1)"}`, color: mode === "accessible" ? "#D72638" : "#94A3B8", fontSize: acc ? 15 : 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            {acc ? "A+" : "A"}
          </button>
          {step !== "home" && (
            <button onClick={reset} style={{ padding: acc ? "10px 18px" : "7px 14px", borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", fontSize: acc ? 15 : 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              {L.back}
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 720, animation: "fadeIn 0.25s ease both" }}>

          {/* ── HOME ─────────────────────────────────────────────────────────── */}
          {step === "home" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: acc ? 48 : 36 }}>
                <div style={{ width: acc ? 72 : 56, height: acc ? 72 : 56, borderRadius: 16, background: "rgba(215,38,56,0.1)", border: "1px solid rgba(215,38,56,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <div style={{ width: acc ? 28 : 22, height: acc ? 28 : 22, borderRadius: 5, background: "#D72638" }} />
                </div>
                <p style={textStyle(acc ? 46 : 38, 900, "#F8FAFC")}>{L.title}</p>
                <p style={{ ...textStyle(acc ? 18 : 15, 400, "#475569"), marginTop: 10 }}>{L.subtitle}</p>
              </div>

              {/* Primary actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <button
                  onClick={() => { setFlow("checkin"); setStep("method"); }}
                  style={{
                    padding: acc ? "48px 32px" : "40px 28px", borderRadius: 24,
                    background: "#D72638", border: "none", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
                    boxShadow: "0 8px 40px rgba(215,38,56,0.4)", transition: "all 0.15s",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 60px rgba(215,38,56,0.5)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 40px rgba(215,38,56,0.4)"; }}>
                  <svg width={acc ? 44 : 36} height={acc ? 44 : 36} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ fontSize: acc ? 28 : 22, fontWeight: 900, color: "#fff" }}>{L.checkin}</p>
                </button>

                <button
                  onClick={() => { setFlow("checkout"); setStep("method"); }}
                  style={{
                    padding: acc ? "48px 32px" : "40px 28px", borderRadius: 24,
                    background: "#151515", border: "1.5px solid rgba(255,255,255,0.1)", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
                    transition: "all 0.15s", fontFamily: "'Inter', sans-serif",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(215,38,56,0.4)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = ""; }}>
                  <svg width={acc ? 44 : 36} height={acc ? 44 : 36} fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  <p style={{ fontSize: acc ? 28 : 22, fontWeight: 900, color: "#F8FAFC" }}>{L.checkout}</p>
                </button>
              </div>

              <p style={{ fontSize: acc ? 13 : 11, color: "#2D3748", marginTop: 12 }}>
                Need help? Ask a TRIO staff member at the front desk.
              </p>
            </div>
          )}

          {/* ── METHOD SELECTION ─────────────────────────────────────────────── */}
          {step === "method" && (
            <div style={{ textAlign: "center" }}>
              <p style={textStyle(acc ? 36 : 30, 900, "#F8FAFC")}>{flow === "checkin" ? L.checkin : L.checkout}</p>
              <p style={{ ...textStyle(acc ? 16 : 13, 400, "#475569"), marginTop: 8, marginBottom: acc ? 40 : 32 }}>How would you like to identify yourself?</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {[
                  { label: lang === "en" ? "Student ID" : "ID Estudiantil", icon: "🪪", to: "id-entry" as Step },
                  { label: lang === "en" ? "Search Name" : "Buscar Nombre", icon: "🔍", to: "search-entry" as Step },
                  { label: lang === "en" ? "QR / Barcode" : "QR / Código", icon: "📱", to: "id-entry" as Step },
                ].map(({ label, icon, to }) => (
                  <button key={label} onClick={() => setStep(to)} style={{
                    padding: acc ? "40px 20px" : "32px 16px", borderRadius: 20,
                    background: "#151515", border: "1.5px solid rgba(255,255,255,0.09)",
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 12, transition: "all 0.15s",
                    fontFamily: "'Inter', sans-serif",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(215,38,56,0.3)"; e.currentTarget.style.background = "#1C1C1C"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.background = "#151515"; }}>
                    <span style={{ fontSize: acc ? 48 : 38 }}>{icon}</span>
                    <p style={{ fontSize: acc ? 18 : 15, fontWeight: 700, color: "#F8FAFC" }}>{label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── ID ENTRY ─────────────────────────────────────────────────────── */}
          {step === "id-entry" && (
            <div style={{ textAlign: "center" }}>
              <p style={textStyle(acc ? 36 : 28, 900, "#F8FAFC")}>{L.enterID}</p>
              <p style={{ ...textStyle(acc ? 16 : 13, 400, "#475569"), marginTop: 8, marginBottom: acc ? 40 : 32 }}>{L.enterIDSub}</p>
              <input ref={idRef} type="text" value={idInput}
                onChange={(e) => { setIdInput(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleIdLookup()}
                placeholder={L.idPlaceholder} autoFocus
                style={{
                  display: "block", width: "100%", padding: acc ? "24px 28px" : "20px 24px",
                  background: "#151515", border: "2px solid rgba(255,255,255,0.1)", borderRadius: 18,
                  color: "#F8FAFC", fontSize: acc ? 28 : 22, fontWeight: 700, textAlign: "center",
                  outline: "none", fontFamily: "'Inter', sans-serif", marginBottom: 16,
                  letterSpacing: "0.04em", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#D72638"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              {error && <p style={{ color: "#D72638", fontSize: acc ? 15 : 13, marginBottom: 16 }}>{error}</p>}
              <KioskBtn variant="red" large onClick={handleIdLookup} disabled={!idInput.trim()} accessible={acc}>
                {L.findRecord}
              </KioskBtn>
            </div>
          )}

          {/* ── SEARCH ───────────────────────────────────────────────────────── */}
          {step === "search-entry" && (
            <div>
              <p style={{ ...textStyle(acc ? 36 : 28, 900, "#F8FAFC"), textAlign: "center" }}>{L.searchName}</p>
              <p style={{ ...textStyle(acc ? 16 : 13, 400, "#475569"), marginTop: 8, marginBottom: acc ? 32 : 24, textAlign: "center" }}>{L.searchNameSub}</p>
              <input ref={searchRef} type="text" value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={L.searchPlaceholder} autoFocus
                style={{
                  display: "block", width: "100%", padding: acc ? "22px 26px" : "18px 22px",
                  background: "#151515", border: "2px solid rgba(255,255,255,0.1)", borderRadius: 18,
                  color: "#F8FAFC", fontSize: acc ? 26 : 20, fontWeight: 600,
                  outline: "none", fontFamily: "'Inter', sans-serif", marginBottom: 16,
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#D72638"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              {error && <p style={{ color: "#D72638", fontSize: acc ? 15 : 13, marginBottom: 12 }}>{error}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {searchInput.trim() && searchResults.length === 0 && (
                  <p style={{ textAlign: "center", color: "#475569", fontSize: acc ? 15 : 13, padding: "20px 0" }}>{L.notFound}</p>
                )}
                {searchResults.map((s) => (
                  <button key={s.id} onClick={() => handleSelectStudent(s)} style={{
                    display: "flex", alignItems: "center", gap: 16, padding: acc ? "18px 22px" : "14px 18px",
                    borderRadius: 14, background: "#151515", border: "1.5px solid rgba(255,255,255,0.09)",
                    cursor: "pointer", transition: "all 0.12s", fontFamily: "'Inter', sans-serif",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D72638"; e.currentTarget.style.background = "#1C1C1C"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.background = "#151515"; }}>
                    <div style={{ width: acc ? 50 : 40, height: acc ? 50 : 40, borderRadius: 11, background: "rgba(215,38,56,0.1)", border: "1px solid rgba(215,38,56,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: acc ? 16 : 13, fontWeight: 900, color: "#D72638" }}>{s.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: acc ? 20 : 16, fontWeight: 700, color: "#F8FAFC" }}>{s.full_name}</p>
                      <p style={{ fontSize: acc ? 13 : 11, color: "#475569", marginTop: 2 }}>{s.student_number} · {s.program}</p>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <span style={{ fontSize: acc ? 14 : 11, color: "#475569" }}>→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CONFIRM IDENTITY ─────────────────────────────────────────────── */}
          {step === "confirm" && found && (
            <div style={{ textAlign: "center" }}>
              <p style={textStyle(acc ? 36 : 28, 900, "#F8FAFC")}>{L.isThisYou}</p>
              <div style={{ background: "#151515", borderRadius: 20, border: "1.5px solid rgba(255,255,255,0.09)", padding: acc ? "36px" : "28px", margin: `${acc ? 32 : 24}px auto`, maxWidth: 400 }}>
                <div style={{ width: acc ? 80 : 64, height: acc ? 80 : 64, borderRadius: 18, background: "rgba(215,38,56,0.1)", border: "2px solid rgba(215,38,56,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <span style={{ fontSize: acc ? 26 : 20, fontWeight: 900, color: "#D72638" }}>{found.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                </div>
                <p style={textStyle(acc ? 26 : 22, 900, "#F8FAFC")}>{found.full_name}</p>
                <p style={{ ...textStyle(acc ? 15 : 12, 500, "#475569"), marginTop: 8 }}>{found.student_number}</p>
                <p style={{ ...textStyle(acc ? 14 : 11, 400, "#475569"), marginTop: 4 }}>{found.program} · {found.work_location}</p>
                {alreadyCheckedIn && flow === "checkin" && (
                  <div style={{ marginTop: 14, padding: "8px 14px", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <p style={{ fontSize: acc ? 14 : 11, fontWeight: 700, color: "#22C55E" }}>✓ {L.alreadyIn}</p>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <KioskBtn variant="ghost" onClick={reset} accessible={acc}>{L.no}</KioskBtn>
                <KioskBtn variant="red" onClick={() => flow === "checkin" && !alreadyCheckedIn ? setStep("reason") : flow === "checkout" ? handleSubmitCheckOut() : reset()} accessible={acc}>
                  {L.yes}
                </KioskBtn>
              </div>
            </div>
          )}

          {/* ── REASON ───────────────────────────────────────────────────────── */}
          {step === "reason" && (
            <div>
              <p style={{ ...textStyle(acc ? 32 : 26, 900, "#F8FAFC"), textAlign: "center", marginBottom: acc ? 32 : 24 }}>{L.selectReason}</p>
              {error && <p style={{ color: "#D72638", fontSize: acc ? 15 : 13, marginBottom: 12, textAlign: "center" }}>{error}</p>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                {reasons.map((r) => (
                  <button key={r} onClick={() => setReason(r)} style={{
                    padding: acc ? "22px 18px" : "16px 14px", borderRadius: 14, border: `1.5px solid ${reason === r ? "#D72638" : "rgba(255,255,255,0.09)"}`,
                    background: reason === r ? "rgba(215,38,56,0.12)" : "#151515",
                    color: reason === r ? "#F8FAFC" : "#94A3B8",
                    fontSize: acc ? 18 : 14, fontWeight: reason === r ? 700 : 400,
                    cursor: "pointer", fontFamily: "'Inter', sans-serif", textAlign: "left",
                    transition: "all 0.12s",
                  }}>
                    {reason === r && <span style={{ color: "#D72638", marginRight: 8 }}>✓</span>}
                    {r}
                  </button>
                ))}
              </div>
              <KioskBtn variant="red" large onClick={handleSubmitCheckIn} disabled={!reason} accessible={acc}>
                {L.submit}
              </KioskBtn>
            </div>
          )}

          {/* ── SUBMITTING ───────────────────────────────────────────────────── */}
          {step === "submitting" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 60, height: 60, border: "4px solid rgba(255,255,255,0.06)", borderTopColor: "#D72638", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 24px" }} />
              <p style={textStyle(acc ? 24 : 20, 700, "#94A3B8")}>Processing…</p>
            </div>
          )}

          {/* ── SUCCESS ──────────────────────────────────────────────────────── */}
          {step === "success" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: acc ? 96 : 80, height: acc ? 96 : 80, borderRadius: "50%", background: flow === "checkin" ? "rgba(34,197,94,0.1)" : "rgba(59,130,246,0.1)", border: `2px solid ${flow === "checkin" ? "rgba(34,197,94,0.3)" : "rgba(59,130,246,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <svg width={acc ? 44 : 36} height={acc ? 44 : 36} fill="none" viewBox="0 0 24 24" stroke={flow === "checkin" ? "#22C55E" : "#3B82F6"} strokeWidth={2.5}>
                  {flow === "checkin"
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  }
                </svg>
              </div>
              <p style={textStyle(acc ? 40 : 32, 900, "#F8FAFC")}>{flow === "checkin" ? L.successIn : L.successOut}</p>
              <p style={{ ...textStyle(acc ? 20 : 16, 500, "#22C55E"), marginTop: 8 }}>{found?.full_name}</p>
              <p style={{ ...textStyle(acc ? 16 : 13, 400, "#475569"), marginTop: 12 }}>{flow === "checkin" ? L.successSub : L.successSubOut}</p>
              <p style={{ ...textStyle(acc ? 13 : 11, 400, "#2D3748"), marginTop: 24 }}>Returning to home screen…</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{ position: "relative", zIndex: 1, padding: acc ? "18px 48px" : "12px 40px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: acc ? 12 : 10, color: "#2D3748" }}>TRIO Connect Kiosk · Powered by Nova Systems</p>
        <p style={{ fontSize: acc ? 12 : 10, color: "#2D3748" }}>Questions? Ask staff for assistance.</p>
      </div>
    </div>
  );
}
