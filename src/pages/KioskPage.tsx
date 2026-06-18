import { useState, useEffect, useRef } from "react";
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

// ── Types ──────────────────────────────────────────────────────
type Lang = "en" | "es";
type Flow = "in" | "out";
type Step =
  | "home" | "method" | "search" | "confirm"
  | "appt-detected" | "reason"
  | "submitting" | "success"
  | "co-confirm" | "co-success";

const REASONS = [
  { id: "Appointment / Advising Meeting", en: "Appointment",      es: "Cita",              icon: "📅" },
  { id: "Walk-In Advising",              en: "Advisor Meeting",  es: "Reunión Asesor",    icon: "👤" },
  { id: "Workshop or Event",             en: "Workshop / Event", es: "Taller / Evento",   icon: "📚" },
  { id: "Study Space",                   en: "Study Space",      es: "Área de Estudio",   icon: "📖" },
  { id: "Computer Lab",                  en: "Computer Lab",     es: "Lab de Cómputo",    icon: "💻" },
  { id: "FAFSA Assistance",              en: "FAFSA Help",       es: "Ayuda FAFSA",       icon: "📋" },
  { id: "Transfer Planning",             en: "Transfer Help",    es: "Transferencia",     icon: "🎓" },
  { id: "Career Support",                en: "Career Services",  es: "Servicios Carrera", icon: "💼" },
  { id: "General Visit",                 en: "General Visit",    es: "Visita General",    icon: "🏠" },
  { id: "Scholarship Help",              en: "Scholarship",      es: "Becas",             icon: "⭐" },
  { id: "Other",                         en: "Other",            es: "Otro",              icon: "✦"  },
];

// ── Clock component ────────────────────────────────────────────
function Clock({ lang }: { lang: Lang }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: "center", marginBottom: 36 }}>
      <p style={{ fontSize: 68, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1, margin: 0 }}>
        {now.toLocaleTimeString(lang === "es" ? "es" : "en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
      </p>
      <p style={{ fontSize: 15, color: MUTED, marginTop: 8, letterSpacing: "0.04em" }}>
        {now.toLocaleDateString(lang === "es" ? "es" : "en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      </p>
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name, size = 96 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const palette = ["#D72638", "#2563EB", "#7C3AED", "#059669", "#D97706"];
  const bg = palette[name.charCodeAt(0) % palette.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, border: `3px solid ${GOLDB}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.35, fontWeight: 900, color: "#fff" }}>{initials}</span>
    </div>
  );
}

// ── Button helpers ─────────────────────────────────────────────
function RedBtn({ children, onClick, disabled, style: s }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: disabled ? "#2a2a2a" : RED, border: "none", borderRadius: 16, color: disabled ? MUTED : "#fff", fontWeight: 800, fontSize: 18, cursor: disabled ? "not-allowed" : "pointer", transform: h && !disabled ? "scale(1.02)" : "scale(1)", boxShadow: h && !disabled ? "0 0 40px rgba(215,38,56,0.4)" : "none", transition: "all 0.2s", ...s }}>
      {children}
    </button>
  );
}

function GoldBtn({ children, onClick, style: s }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: GOLDT, border: "none", borderRadius: 16, color: "#000", fontWeight: 800, fontSize: 18, cursor: "pointer", transform: h ? "scale(1.02)" : "scale(1)", boxShadow: h ? "0 0 40px rgba(212,175,55,0.35)" : "none", transition: "all 0.2s", ...s }}>
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, style: s }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: h ? "rgba(255,255,255,0.05)" : "transparent", border: `1px solid ${BDR}`, borderRadius: 14, color: h ? "#fff" : MUTED, fontWeight: 500, fontSize: 15, cursor: "pointer", transition: "all 0.18s", ...s }}>
      {children}
    </button>
  );
}

// ── Main Kiosk ─────────────────────────────────────────────────
export default function KioskPage() {
  const [lang, setLang]               = useState<Lang>("en");
  const [flow, setFlow]               = useState<Flow>("in");
  const [step, setStep]               = useState<Step>("home");
  const [students, setStudents]       = useState<TRIOStudent[]>([]);
  const [activities, setActivities]   = useState<Activity[]>([]);
  const [todayMeetings, setMeetings]  = useState<Meeting[]>([]);
  const [todayEvents, setEvents]      = useState<TRIOEvent[]>([]);
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<TRIOStudent[]>([]);
  const [found, setFound]             = useState<TRIOStudent | null>(null);
  const [activeSession, setSession]   = useState<Activity | null>(null);
  const [detectedAppt, setAppt]       = useState<Meeting | null>(null);
  const [detectedEvent, setEvent]     = useState<TRIOEvent | null>(null);
  const [reason, setReason]           = useState("");
  const [countdown, setCountdown]     = useState(5);
  const inputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().split("T")[0];

  const T = {
    en: {
      welcome: "Welcome to TRIO Connect", sub: "Student Check-In System",
      checkIn: "Check In", checkOut: "Check Out",
      howIn: "How would you like to check in?", howOut: "How would you like to check out?",
      typeName: "Type Your Name", typeId: "Enter Student ID", scanQR: "Scan QR Code",
      findStudent: "Find Student", searchPlh: "Name or student ID number…",
      typeToSearch: "Start typing to search…", noResults: "No results. Try a different term.",
      isThisYou: "Is this you?", yesMe: "Yes, that's me", notMe: "Not me",
      whyHere: "Why are you visiting today?", selectOne: "Select one option",
      checkedIn: "Checked In!", checkedOut: "See You Later!",
      resetting: "Resetting in", back: "Back",
      activeVisit: "Active Visit", checkedInAt: "Checked in at",
      visitReason: "Reason", duration: "Duration", checkOutNow: "Check Out Now",
      apptDetected: "Appointment Detected", apptSub: "You have a scheduled appointment today.",
      differentReason: "Different reason", checkInForAppt: "Check In for Appointment",
      noActiveVisit: "No active visit found for today.",
      powered: "Powered by Nova Systems",
    },
    es: {
      welcome: "Bienvenido a TRIO Connect", sub: "Sistema de Registro de Estudiantes",
      checkIn: "Registrarse", checkOut: "Marcar Salida",
      howIn: "¿Cómo desea registrarse?", howOut: "¿Cómo desea marcar su salida?",
      typeName: "Escribir Nombre", typeId: "Ingresar Número de ID", scanQR: "Escanear Código QR",
      findStudent: "Buscar Estudiante", searchPlh: "Nombre o número de ID…",
      typeToSearch: "Escriba para buscar…", noResults: "Ningún resultado. Intente otro término.",
      isThisYou: "¿Es usted?", yesMe: "Sí, soy yo", notMe: "No soy yo",
      whyHere: "¿Por qué visita hoy?", selectOne: "Seleccione una opción",
      checkedIn: "¡Registrado!", checkedOut: "¡Hasta Pronto!",
      resetting: "Reiniciando en", back: "Regresar",
      activeVisit: "Visita Activa", checkedInAt: "Registrado a las",
      visitReason: "Razón", duration: "Duración", checkOutNow: "Confirmar Salida",
      apptDetected: "Cita Detectada", apptSub: "Tienes una cita programada hoy.",
      differentReason: "Otra razón", checkInForAppt: "Registrarse para Cita",
      noActiveVisit: "No se encontró una visita activa hoy.",
      powered: "Desarrollado por Nova Systems",
    },
  }[lang];

  // Load data
  useEffect(() => {
    const load = async () => {
      const [s, a, m, e] = await Promise.all([getStudents(), getActivities(), getMeetings(), getEvents()]);
      setStudents(s);
      setActivities(a.filter((x) => x.check_in_time.startsWith(today)));
      setMeetings(m.filter((x) => x.meeting_date === today && x.status === "Scheduled"));
      setEvents(e.filter((x) => x.event_date === today && x.is_active));
    };
    load();
  }, [today]);

  // Live search
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); return; }
    setResults(
      students.filter((s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.student_number.toLowerCase().includes(q)
      ).slice(0, 6)
    );
  }, [query, students]);

  // Auto-focus
  useEffect(() => {
    if (step === "search") setTimeout(() => inputRef.current?.focus(), 80);
  }, [step]);

  // Success countdown
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

  function reset() {
    setStep("home"); setQuery(""); setResults([]); setFound(null);
    setSession(null); setAppt(null); setEvent(null); setReason(""); setCountdown(5);
  }

  function selectStudent(s: TRIOStudent) {
    setFound(s);
    const sess = activities.find((a) => a.student_id === s.id && !a.check_out_time) ?? null;
    setSession(sess);
    const appt = todayMeetings.find((m) => m.student_id === s.id) ?? null;
    const evt  = todayEvents[0] ?? null;
    setAppt(appt);
    setEvent(appt ? null : evt);
    if (flow === "out") { setStep("co-confirm"); return; }
    setStep("confirm");
  }

  function handleConfirm() {
    if (detectedAppt) { setStep("appt-detected"); }
    else { setStep("reason"); }
  }

  function handleApptConfirm() {
    setReason("Appointment / Advising Meeting");
    setTimeout(() => doCheckIn("Appointment / Advising Meeting"), 60);
  }

  async function doCheckIn(r: string) {
    if (!found) return;
    setStep("submitting");
    await createActivity({
      student_id:    found.id,
      student_name:  found.full_name,
      activity_type: "Walk-In Advising",
      check_in_time: new Date().toISOString(),
      location:      "TRIO Office (Kiosk)",
      notes:         r,
      event_id:      detectedEvent?.id,
    });
    setStep("success");
  }

  async function doCheckOut() {
    setStep("submitting");
    if (activeSession) {
      const mins = differenceInMinutes(new Date(), new Date(activeSession.check_in_time));
      await updateActivity(activeSession.id, {
        check_out_time:   new Date().toISOString(),
        duration_minutes: mins,
      });
    }
    setStep("co-success");
  }

  function getDuration(): string {
    if (!activeSession) return "—";
    const mins = differenceInMinutes(new Date(), new Date(activeSession.check_in_time));
    if (mins < 1) return "< 1 min";
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  // ── Shared layout shells ───────────────────────────────────────
  const bg = (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)", backgroundSize: "72px 72px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 1200, height: 1200, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,175,55,0.03) 0%,transparent 60%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "15%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(215,38,56,0.035) 0%,transparent 65%)", pointerEvents: "none" }} />
    </>
  );

  const header = (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: RED, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>TRIO Connect</p>
          <p style={{ fontSize: 10, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>Student Check-In System</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {step !== "home" && (
          <GhostBtn onClick={reset} style={{ padding: "6px 16px", fontSize: 12, fontWeight: 700 }}>
            {lang === "es" ? "Inicio" : "Home"}
          </GhostBtn>
        )}
        {(["en", "es"] as const).map((l) => (
          <button key={l} onClick={() => setLang(l)}
            style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${lang === l ? GOLDB : BDR}`, background: lang === l ? "rgba(212,175,55,0.1)" : "transparent", color: lang === l ? GOLD : MUTED, fontSize: 12, fontWeight: lang === l ? 800 : 400, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );

  const footer = (
    <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {T.powered} · CT State Community College
      </p>
    </div>
  );

  const wrap: React.CSSProperties = {
    minHeight: "100vh", background: "#050505",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative", overflow: "hidden", padding: "96px 24px 60px",
  };

  const center: React.CSSProperties = {
    position: "relative", zIndex: 1, width: "100%",
    display: "flex", flexDirection: "column", alignItems: "center",
  };

  // ══════════════════════════════════════════════════════════════
  // HOME
  // ══════════════════════════════════════════════════════════════
  if (step === "home") return (
    <div style={wrap}>
      {bg}{header}{footer}
      <div style={{ ...center, maxWidth: 520, textAlign: "center" }}>
        <Clock lang={lang} />
        <div style={{ width: 72, height: 72, borderRadius: 20, background: RED, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 0 60px rgba(215,38,56,0.22)" }}>
          <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
          </svg>
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 10px" }}>{T.welcome}</h1>
        <p style={{ fontSize: 17, color: MUTED, marginBottom: 48 }}>{T.sub}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 400 }}>
          <RedBtn onClick={() => { setFlow("in"); setStep("method"); }}
            style={{ width: "100%", height: 72, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {T.checkIn}
          </RedBtn>
          <button onClick={() => { setFlow("out"); setStep("method"); }}
            style={{ width: "100%", height: 72, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: "transparent", border: `1px solid ${GOLDB}`, borderRadius: 16, color: GOLD, fontSize: 18, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {T.checkOut}
          </button>
        </div>
        <p style={{ marginTop: 28, fontSize: 12, color: "rgba(255,255,255,0.18)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {lang === "es" ? "Toca un botón para comenzar" : "Tap a button to begin"}
        </p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // METHOD
  // ══════════════════════════════════════════════════════════════
  if (step === "method") return (
    <div style={wrap}>
      {bg}{header}{footer}
      <div style={{ ...center, maxWidth: 540 }}>
        <p style={{ fontSize: 12, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>
          {flow === "in" ? T.checkIn : T.checkOut}
        </p>
        <h2 style={{ fontSize: 34, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginBottom: 36, textAlign: "center" }}>
          {flow === "in" ? T.howIn : T.howOut}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          {[
            { icon: "⌨", label: T.typeName,  desc: lang === "es" ? "Escriba su nombre completo" : "Type your full name" },
            { icon: "#",  label: T.typeId,    desc: lang === "es" ? "Ingrese su número de ID" : "Enter your student ID number" },
            { icon: "◻",  label: T.scanQR,   desc: lang === "es" ? "Escanee el QR en su ID" : "Scan the QR code on your ID card" },
          ].map((opt) => (
            <button key={opt.label} onClick={() => setStep("search")}
              style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 16, padding: "22px 24px", display: "flex", alignItems: "center", gap: 18, cursor: "pointer", textAlign: "left", transition: "all 0.18s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLDB; e.currentTarget.style.background = CARD2; e.currentTarget.style.transform = "translateX(4px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BDR; e.currentTarget.style.background = CARD; e.currentTarget.style.transform = "translateX(0)"; }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1e1e1e", border: `1px solid ${BDR}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {opt.icon}
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{opt.label}</p>
                <p style={{ fontSize: 13, color: MUTED, margin: "4px 0 0" }}>{opt.desc}</p>
              </div>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth={2} style={{ marginLeft: "auto", flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ))}
        </div>
        <GhostBtn onClick={reset} style={{ marginTop: 24, padding: "12px 32px" }}>{T.back}</GhostBtn>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // SEARCH
  // ══════════════════════════════════════════════════════════════
  if (step === "search") return (
    <div style={wrap}>
      {bg}{header}{footer}
      <div style={{ ...center, maxWidth: 540 }}>
        <p style={{ fontSize: 12, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>
          {flow === "in" ? T.checkIn : T.checkOut}
        </p>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginBottom: 24, textAlign: "center" }}>{T.findStudent}</h2>

        <div style={{ position: "relative", width: "100%", marginBottom: 16 }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth={2}
            style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input ref={inputRef} autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={T.searchPlh}
            style={{ width: "100%", boxSizing: "border-box", background: CARD, border: `2px solid ${BDR}`, borderRadius: 16, padding: "20px 20px 20px 50px", fontSize: 18, color: "#fff", outline: "none", transition: "border-color 0.2s" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = GOLDB; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = BDR; }}
          />
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          {query.trim() === "" && (
            <p style={{ textAlign: "center", color: MUTED, fontSize: 14, padding: "20px 0" }}>{T.typeToSearch}</p>
          )}
          {query.trim() !== "" && results.length === 0 && (
            <p style={{ textAlign: "center", color: MUTED, fontSize: 14, padding: "20px 0" }}>{T.noResults}</p>
          )}
          {results.map((s) => (
            <button key={s.id} onClick={() => selectStudent(s)}
              style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLDB; e.currentTarget.style.background = CARD2; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BDR; e.currentTarget.style.background = CARD; }}>
              <Avatar name={s.full_name} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>{s.full_name}</p>
                <p style={{ fontSize: 12, color: MUTED, margin: "3px 0 0" }}>{s.student_number} · {s.work_location ?? "CT State"}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 11, color: s.enrollment_status === "active" ? "#22c55e" : RED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{s.enrollment_status}</p>
                <p style={{ fontSize: 11, color: MUTED, margin: "3px 0 0" }}>{s.advisor_name ?? "Unassigned"}</p>
              </div>
            </button>
          ))}
        </div>
        <GhostBtn onClick={() => setStep("method")} style={{ marginTop: 24, padding: "12px 32px" }}>{T.back}</GhostBtn>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CONFIRM (check-in)
  // ══════════════════════════════════════════════════════════════
  if (step === "confirm" && found) return (
    <div style={wrap}>
      {bg}{header}{footer}
      <div style={{ ...center, maxWidth: 440, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>{T.isThisYou}</p>
        <Avatar name={found.full_name} size={108} />
        <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", margin: "18px 0 6px" }}>{found.full_name}</h2>
        <p style={{ fontSize: 15, color: MUTED, marginBottom: 4 }}>{found.student_number}</p>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>{found.work_location ?? "CT State"}</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(212,175,55,0.08)", border: `1px solid ${GOLDB}`, borderRadius: 20, padding: "6px 14px", marginBottom: 32 }}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span style={{ fontSize: 13, color: GOLD, fontWeight: 600 }}>{found.advisor_name ?? "Unassigned"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          <RedBtn onClick={handleConfirm} style={{ width: "100%", height: 68, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {T.yesMe} →
          </RedBtn>
          <GhostBtn onClick={() => { setFound(null); setStep("search"); setQuery(""); }}
            style={{ width: "100%", height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {T.notMe}
          </GhostBtn>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // APPOINTMENT DETECTED
  // ══════════════════════════════════════════════════════════════
  if (step === "appt-detected" && detectedAppt) return (
    <div style={wrap}>
      {bg}{header}{footer}
      <div style={{ ...center, maxWidth: 480, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 34 }}>
          📅
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: "#60A5FA", marginBottom: 8 }}>{T.apptDetected}</h2>
        <p style={{ fontSize: 15, color: MUTED, marginBottom: 24 }}>{T.apptSub}</p>
        <div style={{ background: CARD, border: "1px solid rgba(59,130,246,0.2)", borderRadius: 16, padding: "20px 24px", width: "100%", marginBottom: 24, textAlign: "left" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>{detectedAppt.meeting_type}</p>
          <p style={{ fontSize: 13, color: MUTED, margin: "0 0 4px" }}>Advisor: {detectedAppt.advisor_name}</p>
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>Time: {detectedAppt.meeting_time}</p>
        </div>
        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <GhostBtn onClick={() => setStep("reason")} style={{ flex: 1, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {T.differentReason}
          </GhostBtn>
          <RedBtn onClick={handleApptConfirm} style={{ flex: 2, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {T.checkInForAppt}
          </RedBtn>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // REASON
  // ══════════════════════════════════════════════════════════════
  if (step === "reason") return (
    <div style={wrap}>
      {bg}{header}{footer}
      <div style={{ ...center, maxWidth: 680 }}>
        <h2 style={{ fontSize: 34, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginBottom: 8, textAlign: "center" }}>{T.whyHere}</h2>
        <p style={{ fontSize: 15, color: MUTED, marginBottom: 32, textAlign: "center" }}>{T.selectOne}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, width: "100%" }}>
          {REASONS.map((r) => (
            <button key={r.id}
              onClick={() => { setReason(r.id); setTimeout(() => doCheckIn(r.id), 100); }}
              style={{ background: reason === r.id ? "rgba(215,38,56,0.12)" : CARD, border: `2px solid ${reason === r.id ? RED : BDR}`, borderRadius: 16, padding: "20px 10px", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
              onMouseEnter={(e) => { if (reason !== r.id) { e.currentTarget.style.borderColor = GOLDB; e.currentTarget.style.background = CARD2; e.currentTarget.style.transform = "scale(1.03)"; } }}
              onMouseLeave={(e) => { if (reason !== r.id) { e.currentTarget.style.borderColor = BDR; e.currentTarget.style.background = CARD; e.currentTarget.style.transform = "scale(1)"; } }}>
              <span style={{ fontSize: 26, display: "block", marginBottom: 8 }}>{r.icon}</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: reason === r.id ? RED : "#fff", margin: 0, lineHeight: 1.3 }}>
                {lang === "es" ? r.es : r.en}
              </p>
            </button>
          ))}
        </div>
        <GhostBtn onClick={() => setStep("confirm")} style={{ marginTop: 24, padding: "12px 32px" }}>{T.back}</GhostBtn>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // SUBMITTING
  // ══════════════════════════════════════════════════════════════
  if (step === "submitting") return (
    <div style={wrap}>
      {bg}{header}{footer}
      <div style={{ ...center, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, border: "4px solid rgba(255,255,255,0.06)", borderTopColor: RED, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 22px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: MUTED, fontSize: 16 }}>Processing…</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CHECK-IN SUCCESS
  // ══════════════════════════════════════════════════════════════
  if (step === "success" && found) return (
    <div style={wrap}>
      {bg}{header}{footer}
      <div style={{ ...center, maxWidth: 460, textAlign: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <svg width="46" height="46" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p style={{ fontSize: 12, color: "#22c55e", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>{T.checkedIn}</p>
        <h2 style={{ fontSize: 46, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 12px" }}>
          {lang === "es" ? `¡Bienvenido,` : "Welcome,"}<br />{found.full_name.split(" ")[0]}!
        </h2>
        <p style={{ fontSize: 16, color: MUTED, marginBottom: 36 }}>
          {reason} · {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
        </p>
        <div style={{ width: "100%", height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "#22c55e", width: `${(countdown / 5) * 100}%`, transition: "width 1s linear", borderRadius: 2 }} />
        </div>
        <p style={{ fontSize: 13, color: MUTED, marginTop: 10 }}>{T.resetting} {countdown}…</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CHECK-OUT CONFIRM
  // ══════════════════════════════════════════════════════════════
  if (step === "co-confirm" && found) return (
    <div style={wrap}>
      {bg}{header}{footer}
      <div style={{ ...center, maxWidth: 460, textAlign: "center" }}>
        <Avatar name={found.full_name} size={90} />
        <h2 style={{ fontSize: 34, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", margin: "18px 0 6px" }}>{found.full_name}</h2>
        <p style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>{found.student_number} · {found.work_location ?? "CT State"}</p>

        {activeSession ? (
          <div style={{ background: CARD, border: `1px solid ${GOLDB}`, borderRadius: 16, padding: "20px 24px", width: "100%", marginBottom: 24, textAlign: "left" }}>
            <p style={{ fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 800, margin: "0 0 12px" }}>{T.activeVisit}</p>
            {[
              [T.visitReason, activeSession.notes || activeSession.activity_type],
              [T.checkedInAt, new Date(activeSession.check_in_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })],
              [T.duration,    getDuration()],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BDR}` }}>
                <span style={{ fontSize: 13, color: MUTED }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{val}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: CARD, border: "1px solid rgba(215,38,56,0.25)", borderRadius: 16, padding: "16px 20px", marginBottom: 24, width: "100%" }}>
            <p style={{ fontSize: 13, color: MUTED, textAlign: "center" }}>{T.noActiveVisit}</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          {activeSession && (
            <GoldBtn onClick={doCheckOut} style={{ width: "100%", height: 68, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {T.checkOutNow}
            </GoldBtn>
          )}
          <GhostBtn onClick={reset} style={{ width: "100%", height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>{T.back}</GhostBtn>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CHECK-OUT SUCCESS
  // ══════════════════════════════════════════════════════════════
  if (step === "co-success" && found) return (
    <div style={wrap}>
      {bg}{header}{footer}
      <div style={{ ...center, maxWidth: 460, textAlign: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(212,175,55,0.1)", border: `2px solid ${GOLDB}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <svg width="46" height="46" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p style={{ fontSize: 12, color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>{T.checkedOut}</p>
        <h2 style={{ fontSize: 46, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 12px" }}>
          {lang === "es" ? "¡Hasta Luego," : "Goodbye,"}<br />{found.full_name.split(" ")[0]}!
        </h2>
        <p style={{ fontSize: 16, color: MUTED, marginBottom: 36 }}>
          {lang === "es" ? "Su visita ha sido registrada." : "Your visit has been recorded."} · {getDuration()}
        </p>
        <div style={{ width: "100%", height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", background: GOLD, width: `${(countdown / 5) * 100}%`, transition: "width 1s linear", borderRadius: 2 }} />
        </div>
        <p style={{ fontSize: 13, color: MUTED, marginTop: 10 }}>{T.resetting} {countdown}…</p>
      </div>
    </div>
  );

  return null;
}
