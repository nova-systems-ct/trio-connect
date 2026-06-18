import { useState, useEffect, useRef, useCallback } from "react";
import {
  getStudents, getActivities, createActivity, updateActivity,
  getMeetings, getEvents,
} from "../lib/db";
import type { TRIOStudent, Activity, Meeting, TRIOEvent } from "../lib/types";
import { differenceInMinutes } from "date-fns";

// ─── Palette ────────────────────────────────────────────────────
const BG          = "#050505";
const SURFACE     = "#0A0A0A";
const TEXT        = "#FFFFFF";
const SUB         = "#7A7A7A";
const DIM         = "rgba(255,255,255,0.10)";
const GOLD        = "#D4AF37";
const GOLD_G      = "linear-gradient(135deg, #B8860B 0%, #D4AF37 40%, #F8E7A1 72%, #FFF3C4 100%)";
const GOLD_EDGE   = "rgba(212,175,55,0.30)";
const GOLD_LIT    = "rgba(212,175,55,0.70)";
const GOLD_DIM    = "rgba(212,175,55,0.06)";
const HAIR        = "rgba(255,255,255,0.07)";

// Gradient-border helper: black glass + metallic gold border via background trick
const goldBorder = (bg = BG) =>
  `linear-gradient(${bg}, ${bg}) padding-box, linear-gradient(135deg, #6B4C00 0%, #B8860B 25%, #D4AF37 50%, #F8E7A1 75%, #D4AF37 100%) border-box`;

// ─── Reasons ────────────────────────────────────────────────────
const REASONS_EN = [
  { id: "Academic Advising",  label: "Academic Advising"  },
  { id: "Appointment",        label: "Appointment"        },
  { id: "Workshop or Event",  label: "Workshop"           },
  { id: "Study Session",      label: "Study Session"      },
  { id: "Computer Lab",       label: "Computer Lab"       },
  { id: "Transfer Planning",  label: "Transfer Services"  },
  { id: "FAFSA Assistance",   label: "FAFSA Assistance"   },
  { id: "Career Support",     label: "Career Services"    },
  { id: "Event Attendance",   label: "Event"              },
  { id: "General Visit",      label: "General Visit"      },
  { id: "Other",              label: "Other"              },
];
const REASONS_ES = [
  { id: "Academic Advising",  label: "Asesoría Académica" },
  { id: "Appointment",        label: "Cita Programada"    },
  { id: "Workshop or Event",  label: "Taller"             },
  { id: "Study Session",      label: "Sesión de Estudio"  },
  { id: "Computer Lab",       label: "Lab de Cómputo"     },
  { id: "Transfer Planning",  label: "Transferencia"      },
  { id: "FAFSA Assistance",   label: "Ayuda FAFSA"        },
  { id: "Career Support",     label: "Servicios Carrera"  },
  { id: "Event Attendance",   label: "Evento"             },
  { id: "General Visit",      label: "Visita General"     },
  { id: "Other",              label: "Otro"               },
];

// ─── i18n ────────────────────────────────────────────────────────
const COPY = {
  en: {
    tagline:      "STUDENT SUCCESS PLATFORM",
    powered:      "POWERED BY NOVA SYSTEMS",
    placeholder:  "Enter Name or Student ID",
    continue:     "C O N T I N U E",
    whyHere:      "WHY ARE YOU HERE TODAY?",
    checkIn:      "C H E C K   I N",
    checkOut:     "C H E C K   O U T",
    noStudent:    "No student found — try a different name or ID.",
    checkedIn:    "CHECK-IN COMPLETE",
    checkedOut:   "CHECK-OUT COMPLETE",
    welcome:      "WELCOME",
    thankYou:     "THANK YOU",
    seeYou:       "See You Soon",
    time:         "Time",
    reason:       "Reason",
    status:       "Status",
    statusActive: "Checked In",
    visitDuration:"Visit Duration",
    checkOutTime: "Check-Out",
    currentlyIn:  "You are currently checked in.",
    checkInTime:  "Check-In",
    duration:     "Duration",
    notYou:       "Not you?",
    selectReason: "Select a visit reason to continue",
    advisor:      "Advisor",
    returning:    "Returning in",
  },
  es: {
    tagline:      "PLATAFORMA DE ÉXITO ESTUDIANTIL",
    powered:      "DESARROLLADO POR NOVA SYSTEMS",
    placeholder:  "Nombre o Número de Estudiante",
    continue:     "C O N T I N U A R",
    whyHere:      "¿POR QUÉ ESTÁ AQUÍ HOY?",
    checkIn:      "R E G I S T R A R S E",
    checkOut:     "M A R C A R   S A L I D A",
    noStudent:    "Estudiante no encontrado — intente de nuevo.",
    checkedIn:    "REGISTRO COMPLETO",
    checkedOut:   "SALIDA COMPLETA",
    welcome:      "BIENVENIDO",
    thankYou:     "GRACIAS",
    seeYou:       "Hasta Pronto",
    time:         "Hora",
    reason:       "Razón",
    status:       "Estado",
    statusActive: "Registrado",
    visitDuration:"Duración",
    checkOutTime: "Salida",
    currentlyIn:  "Actualmente está registrado.",
    checkInTime:  "Entrada",
    duration:     "Duración",
    notYou:       "¿No es usted?",
    selectReason: "Seleccione una razón para continuar",
    advisor:      "Asesor",
    returning:    "Regresando en",
  },
} as const;

type Lang = "en" | "es";
type Step = "search" | "found" | "already-in" | "success" | "co-success";

// ─── Keyframe injection ──────────────────────────────────────────
function KioskStyles() {
  return (
    <style>{`
      @keyframes kiosk-gold-breathe {
        0%,100% { opacity: 0.35; }
        50%      { opacity: 0.65; }
      }
      @keyframes kiosk-fade-up {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes kiosk-shimmer {
        0%   { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }
      @keyframes kiosk-glow-pulse {
        0%,100% { box-shadow: 0 0 22px rgba(212,175,55,0.06), 0 8px 48px rgba(0,0,0,0.7); }
        50%      { box-shadow: 0 0 38px rgba(212,175,55,0.13), 0 8px 48px rgba(0,0,0,0.7); }
      }
      .kiosk-input:focus {
        border-color: rgba(212,175,55,0.72) !important;
        box-shadow: 0 0 0 4px rgba(212,175,55,0.10), 0 0 40px rgba(212,175,55,0.08), 0 8px 48px rgba(0,0,0,0.7) !important;
        outline: none;
      }
      .kiosk-btn-gold:hover {
        box-shadow: 0 0 32px rgba(212,175,55,0.22), 0 8px 32px rgba(0,0,0,0.6) !important;
        letter-spacing: 0.18em !important;
      }
      .kiosk-reason:hover {
        border-color: rgba(212,175,55,0.35) !important;
        background: rgba(212,175,55,0.04) !important;
      }
      .kiosk-result-row:hover {
        background: rgba(255,255,255,0.03) !important;
      }
    `}</style>
  );
}

// ─── Gold particles ──────────────────────────────────────────────
type Particle = { x: number; y: number; r: number; vx: number; vy: number; a: number; va: number };

function GoldParticles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      r:  Math.random() * 1.0 + 0.3,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -(Math.random() * 0.30 + 0.06),
      a:  Math.random() * 0.16 + 0.03,
      va: (Math.random() - 0.5) * 0.0008,
    }));
    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${Math.max(0.02, Math.min(0.20, p.a))})`;
        ctx.fill();
        p.x  += p.vx;
        p.y  += p.vy;
        p.a  += p.va;
        if (p.y < -8)                  { p.y = canvas.height + 8; p.x = Math.random() * canvas.width; }
        if (p.x < -8)                  p.x = canvas.width + 8;
        if (p.x > canvas.width  + 8)   p.x = -8;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }} />;
}

// ─── Luxury TRIO logo ────────────────────────────────────────────
function TrioLogo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6B4C00" />
          <stop offset="25%"  stopColor="#B8860B" />
          <stop offset="55%"  stopColor="#D4AF37" />
          <stop offset="80%"  stopColor="#F8E7A1" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      {/* Outer square frame */}
      <rect x="11" y="11" width="58" height="58" stroke="url(#lg)" strokeWidth="1.1" />
      {/* Corner registration marks — luxury detail */}
      <line x1="4"  y1="11" x2="11" y2="11" stroke="url(#lg)" strokeWidth="1" />
      <line x1="11" y1="4"  x2="11" y2="11" stroke="url(#lg)" strokeWidth="1" />
      <line x1="69" y1="4"  x2="69" y2="11" stroke="url(#lg)" strokeWidth="1" />
      <line x1="69" y1="11" x2="76" y2="11" stroke="url(#lg)" strokeWidth="1" />
      <line x1="4"  y1="69" x2="11" y2="69" stroke="url(#lg)" strokeWidth="1" />
      <line x1="11" y1="69" x2="11" y2="76" stroke="url(#lg)" strokeWidth="1" />
      <line x1="69" y1="69" x2="76" y2="69" stroke="url(#lg)" strokeWidth="1" />
      <line x1="69" y1="69" x2="69" y2="76" stroke="url(#lg)" strokeWidth="1" />
      {/* Three thin horizontal lines — TRIO mark */}
      <line x1="24" y1="30" x2="56" y2="30" stroke="url(#lg)" strokeWidth="1.0" />
      <line x1="24" y1="40" x2="56" y2="40" stroke="url(#lg)" strokeWidth="1.0" />
      <line x1="24" y1="50" x2="56" y2="50" stroke="url(#lg)" strokeWidth="1.0" />
      {/* Small horizontal serif ticks on left end of each line */}
      <line x1="24" y1="27" x2="24" y2="33" stroke="url(#lg)" strokeWidth="0.8" />
      <line x1="24" y1="37" x2="24" y2="43" stroke="url(#lg)" strokeWidth="0.8" />
      <line x1="24" y1="47" x2="24" y2="53" stroke="url(#lg)" strokeWidth="0.8" />
    </svg>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────
function Avatar({ name, size = 64 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hues = [0, 220, 270, 160, 30];
  const h = hues[name.charCodeAt(0) % hues.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${h},40%,18%)`, border: `1px solid rgba(255,255,255,0.08)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.32, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.01em" }}>
        {initials}
      </span>
    </div>
  );
}

// ─── Hairline divider ─────────────────────────────────────────────
function HR({ my = 0 }: { my?: number }) {
  return <div style={{ height: 1, background: HAIR, margin: `${my}px 0` }} />;
}

// ─── Live clock ───────────────────────────────────────────────────
function LiveClock({ lang }: { lang: Lang }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const locale = lang === "es" ? "es-US" : "en-US";
  return (
    <div>
      <p style={{ fontSize: 11, color: SUB, letterSpacing: "0.05em", margin: "0 0 2px" }}>
        {now.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })}
      </p>
      <p style={{ fontSize: 20, fontWeight: 300, color: TEXT, letterSpacing: "0.06em", margin: 0, fontVariantNumeric: "tabular-nums" }}>
        {now.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true })}
      </p>
    </div>
  );
}

// ─── Language toggle ──────────────────────────────────────────────
function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, border: `1px solid ${HAIR}`, borderRadius: 8, overflow: "hidden" }}>
      {(["en", "es"] as const).map((l, i) => (
        <button key={l} onClick={() => setLang(l)}
          style={{ background: lang === l ? "rgba(212,175,55,0.08)" : "transparent", border: "none", borderLeft: i > 0 ? `1px solid ${HAIR}` : "none", color: lang === l ? GOLD : SUB, fontSize: 10, fontWeight: lang === l ? 700 : 400, letterSpacing: "0.12em", cursor: "pointer", padding: "6px 14px", fontFamily: "inherit", transition: "all 0.15s" }}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ─── Gold search icon ─────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="si" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#B8860B" />
          <stop offset="60%"  stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#F8E7A1" />
        </linearGradient>
      </defs>
      <circle cx="10.5" cy="10.5" r="6" stroke="url(#si)" strokeWidth="1.3" />
      <line x1="15.5" y1="15.5" x2="20" y2="20" stroke="url(#si)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════
export default function KioskPage() {
  const [lang, setLang]               = useState<Lang>("en");
  const [step, setStep]               = useState<Step>("search");
  const [students, setStudents]       = useState<TRIOStudent[]>([]);
  const [activities, setActivities]   = useState<Activity[]>([]);
  const [meetings, setMeetings]       = useState<Meeting[]>([]);
  const [events, setEvents]           = useState<TRIOEvent[]>([]);
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<TRIOStudent[]>([]);
  const [found, setFound]             = useState<TRIOStudent | null>(null);
  const [reason, setReason]           = useState("");
  const [session, setSession]         = useState<Activity | null>(null);
  const [countdown, setCountdown]     = useState(5);
  const [checkinTime, setCheckinTime] = useState("");
  const [showNoResult, setShowNoResult] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const today    = new Date().toISOString().split("T")[0];
  const c        = COPY[lang];
  const reasons  = lang === "es" ? REASONS_ES : REASONS_EN;

  // ── Load ────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getStudents(), getActivities(), getMeetings(), getEvents()]).then(([s, a, m, e]) => {
      setStudents(s);
      setActivities(a.filter((x) => x.check_in_time.startsWith(today)));
      setMeetings(m.filter((x) => x.meeting_date === today && x.status === "Scheduled"));
      setEvents(e.filter((x) => x.event_date === today && x.is_active));
    });
  }, [today]);

  // ── Auto-focus ──────────────────────────────────────────────────
  useEffect(() => {
    if (step === "search") {
      setQuery(""); setResults([]); setFound(null); setShowNoResult(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [step]);

  // ── Global key → re-focus ───────────────────────────────────────
  useEffect(() => {
    if (step !== "search") return;
    const h = (e: KeyboardEvent) => { if (e.key.length === 1 && document.activeElement !== inputRef.current) inputRef.current?.focus(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [step]);

  // ── Countdown ───────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "success" && step !== "co-success") return;
    setCountdown(5);
    const iv = setInterval(() => setCountdown((n) => { if (n <= 1) { clearInterval(iv); reset(); return 0; } return n - 1; }), 1000);
    return () => clearInterval(iv);
  }, [step]);

  // ── Live search ─────────────────────────────────────────────────
  useEffect(() => {
    if (found) return;
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); setShowNoResult(false); return; }
    const r = students.filter((s) =>
      s.full_name.toLowerCase().includes(q) ||
      s.student_number.toLowerCase().includes(q) ||
      s.student_number.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
    ).slice(0, 6);
    setResults(r);
    setShowNoResult(q.length > 1 && r.length === 0);
  }, [query, students, found]);

  function reset() { setStep("search"); setQuery(""); setResults([]); setFound(null); setReason(""); setSession(null); setCheckinTime(""); setShowNoResult(false); }
  function clearSearch() { setFound(null); setQuery(""); setResults([]); setReason(""); setSession(null); setShowNoResult(false); setTimeout(() => inputRef.current?.focus(), 60); }

  function selectStudent(s: TRIOStudent) {
    const sess = activities.find((a) => a.student_id === s.id && !a.check_out_time) ?? null;
    setFound(s); setSession(sess); setQuery(s.full_name); setResults([]); setShowNoResult(false); setReason("");
  }

  function handleContinue() { if (!found) return; setStep(session ? "already-in" : "found"); }

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (found) { handleContinue(); return; }
    if (results.length === 1) { selectStudent(results[0]); return; }
    if (results.length > 1) { const exact = results.find((s) => s.student_number.toLowerCase() === query.trim().toLowerCase()); if (exact) selectStudent(exact); }
  }, [results, query, found, session]);

  async function doCheckIn() {
    if (!found || !reason) return;
    const now = new Date();
    setCheckinTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    const appt = meetings.find((m) => m.student_id === found.id);
    const evt  = !appt ? (events[0] ?? null) : null;
    await createActivity({ student_id: found.id, student_name: found.full_name, activity_type: "Walk-In Advising", check_in_time: now.toISOString(), location: "TRIO Office (Kiosk)", notes: reason, meeting_id: appt?.id, event_id: evt?.id });
    setStep("success");
  }

  async function doCheckOut() {
    if (!found) return;
    if (session) { const mins = differenceInMinutes(new Date(), new Date(session.check_in_time)); await updateActivity(session.id, { check_out_time: new Date().toISOString(), duration_minutes: Math.max(1, mins) }); }
    setStep("co-success");
  }

  function getDuration(): string {
    if (!session) return "—";
    const mins = differenceInMinutes(new Date(), new Date(session.check_in_time));
    if (mins < 1) return "< 1 min";
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} hr`;
    return `${h} hr ${m} min`;
  }

  function getSessionTime(): string {
    if (!session) return "—";
    return new Date(session.check_in_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  // ── Page shell ─────────────────────────────────────────────────
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: BG,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif",
    color: TEXT,
    position: "relative",
    overflow: "hidden",
  };

  // ── Top bar ─────────────────────────────────────────────────────
  const topBar = (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "28px 40px", zIndex: 10 }}>
      <LiveClock lang={lang} />
      <LangToggle lang={lang} setLang={setLang} />
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // SCREEN 1 — SEARCH
  // ══════════════════════════════════════════════════════════════
  const hasDropdown = results.length > 0 || showNoResult;
  const inputBorder = found ? GOLD_LIT : inputFocused ? GOLD_LIT : GOLD_EDGE;
  const inputShadow = inputFocused
    ? `0 0 0 4px rgba(212,175,55,0.10), 0 0 40px rgba(212,175,55,0.08), 0 8px 48px rgba(0,0,0,0.7)`
    : `0 4px 32px rgba(0,0,0,0.6)`;

  if (step === "search") return (
    <div style={page}>
      <KioskStyles />
      <GoldParticles />
      {topBar}

      {/* Radial center glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 680px 460px at 50% 52%, rgba(212,175,55,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 2 }} />

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", position: "relative", zIndex: 3 }}>
        <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Logo */}
          <div style={{ marginBottom: 28, animation: "kiosk-glow-pulse 4s ease-in-out infinite" }}>
            <TrioLogo size={80} />
          </div>

          {/* Wordmark */}
          <h1 style={{ fontSize: 44, fontWeight: 200, color: TEXT, letterSpacing: "0.22em", margin: "0 0 12px", textAlign: "center", textTransform: "uppercase" as const, lineHeight: 1 }}>
            TRIO CONNECT
          </h1>
          <p style={{ fontSize: 10, background: GOLD_G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never, letterSpacing: "0.22em", margin: "0 0 8px", textAlign: "center", fontWeight: 500 }}>
            {c.tagline}
          </p>
          <p style={{ fontSize: 9, color: "rgba(212,175,55,0.38)", letterSpacing: "0.2em", margin: "0 0 52px", textAlign: "center" }}>
            {c.powered}
          </p>

          {/* Hero input */}
          <div style={{ width: "100%", position: "relative" }}>
            <div style={{ position: "relative", width: "100%" }}>
              {/* Gold border via background trick */}
              <div style={{ position: "absolute", inset: 0, borderRadius: hasDropdown ? "16px 16px 0 0" : 16, background: goldBorder(SURFACE), border: "1.5px solid transparent", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 0, position: "relative" }}>
                <div style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", zIndex: 1, pointerEvents: "none" }}>
                  <SearchIcon />
                </div>
                <input
                  ref={inputRef}
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="kiosk-input"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); if (found) clearSearch(); }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={c.placeholder}
                  style={{
                    width: "100%",
                    boxSizing: "border-box" as const,
                    height: 72,
                    background: SURFACE,
                    border: `1.5px solid ${inputBorder}`,
                    borderRadius: hasDropdown ? "16px 16px 0 0" : 16,
                    padding: "0 52px 0 54px",
                    fontSize: 17,
                    color: TEXT,
                    outline: "none",
                    fontFamily: "inherit",
                    fontWeight: 300,
                    letterSpacing: "0.02em",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: inputShadow,
                  }}
                />
                {(found || query.length > 0) && (
                  <button onClick={clearSearch}
                    style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: SUB, fontSize: 13, cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontFamily: "inherit", transition: "color 0.12s", zIndex: 1 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = SUB; }}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Results dropdown */}
            {results.length > 0 && (
              <div style={{ background: SURFACE, border: `1.5px solid ${GOLD_EDGE}`, borderTop: "none", borderRadius: "0 0 16px 16px", overflow: "hidden", position: "relative", zIndex: 5 }}>
                {results.map((s, i) => (
                  <button key={s.id} className="kiosk-result-row" onClick={() => selectStudent(s)}
                    style={{ width: "100%", background: "transparent", border: "none", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" as const, borderTop: i > 0 ? `1px solid ${HAIR}` : "none", fontFamily: "inherit", transition: "background 0.1s" }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 500, color: TEXT, margin: 0, letterSpacing: "-0.01em" }}>{s.full_name}</p>
                      <p style={{ fontSize: 11, color: SUB, margin: "3px 0 0", letterSpacing: "0.04em" }}>{s.student_number}</p>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: s.enrollment_status === "active" ? "#4ADE80" : "#F87171", textTransform: "uppercase" as const, letterSpacing: "0.1em", flexShrink: 0 }}>
                      {s.enrollment_status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showNoResult && (
              <div style={{ background: SURFACE, border: `1.5px solid ${GOLD_EDGE}`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: "16px 22px" }}>
                <p style={{ color: SUB, fontSize: 13, margin: 0, letterSpacing: "0.01em" }}>{c.noStudent}</p>
              </div>
            )}
          </div>

          {/* CONTINUE button */}
          <button
            onClick={handleContinue}
            disabled={!found}
            className={found ? "kiosk-btn-gold" : ""}
            style={{
              width: "100%",
              height: 60,
              marginTop: 14,
              background: found ? goldBorder(BG) : "transparent",
              border: found ? "1.5px solid transparent" : `1.5px solid ${HAIR}`,
              borderRadius: 14,
              color: found ? GOLD : SUB,
              fontSize: 11,
              fontWeight: found ? 600 : 400,
              letterSpacing: "0.18em",
              cursor: found ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "all 0.22s",
              boxShadow: found ? "0 4px 28px rgba(0,0,0,0.5)" : "none",
            }}>
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
      <KioskStyles />
      <GoldParticles />

      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "28px 40px", zIndex: 10 }}>
        <LiveClock lang={lang} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <LangToggle lang={lang} setLang={setLang} />
          <button onClick={reset}
            style={{ background: "transparent", border: `1px solid ${HAIR}`, borderRadius: 8, color: SUB, fontSize: 10, cursor: "pointer", padding: "6px 14px", fontFamily: "inherit", letterSpacing: "0.1em", transition: "color 0.12s, border-color 0.12s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; e.currentTarget.style.borderColor = DIM; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = SUB; e.currentTarget.style.borderColor = HAIR; }}>
            HOME
          </button>
        </div>
      </div>

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "100px 24px 130px", position: "relative", zIndex: 3 }}>
        <div style={{ width: "100%", maxWidth: 660, display: "flex", flexDirection: "column" }}>

          {/* Student card */}
          <div style={{ background: SURFACE, border: `1px solid ${GOLD_EDGE}`, borderRadius: 18, padding: "24px 28px", marginBottom: 28, backdropFilter: "blur(12px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Avatar name={found.full_name} size={68} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: 26, fontWeight: 300, color: TEXT, letterSpacing: "-0.01em", margin: "0 0 5px" }}>
                  {found.full_name}
                </h2>
                <p style={{ fontSize: 11, color: SUB, margin: "0 0 12px", letterSpacing: "0.06em" }}>
                  {found.student_number}
                  {found.work_location ? ` · ${found.work_location}` : ""}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  {found.advisor_name && (
                    <span style={{ fontSize: 10, color: GOLD, background: GOLD_DIM, border: `1px solid ${GOLD_EDGE}`, borderRadius: 20, padding: "3px 12px", fontWeight: 500, letterSpacing: "0.04em" }}>
                      {found.advisor_name}
                    </span>
                  )}
                  {found.program && (
                    <span style={{ fontSize: 10, color: SUB, background: "rgba(255,255,255,0.03)", border: `1px solid ${HAIR}`, borderRadius: 20, padding: "3px 12px", letterSpacing: "0.04em" }}>
                      {found.program}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={reset}
                style={{ background: "transparent", border: "none", color: SUB, fontSize: 10, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.06em", flexShrink: 0, transition: "color 0.12s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = SUB; }}>
                {c.notYou}
              </button>
            </div>
          </div>

          {/* Visit reason label */}
          <p style={{ fontSize: 9, color: SUB, letterSpacing: "0.22em", textTransform: "uppercase" as const, margin: "0 0 14px" }}>
            {c.whyHere}
          </p>

          {/* Reason cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 24 }}>
            {reasons.map((r) => {
              const active = reason === r.id;
              return (
                <button key={r.id} className={active ? "" : "kiosk-reason"} onClick={() => setReason(active ? "" : r.id)}
                  style={{
                    background:   active ? goldBorder(SURFACE) : SURFACE,
                    border:       active ? "1px solid transparent" : `1px solid ${HAIR}`,
                    borderRadius: 12,
                    padding:      "16px 8px",
                    cursor:       "pointer",
                    textAlign:    "center" as const,
                    fontFamily:   "inherit",
                    transition:   "all 0.14s",
                    boxShadow:    active ? "0 0 16px rgba(212,175,55,0.10)" : "none",
                  }}>
                  <p style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? GOLD : SUB, margin: 0, lineHeight: 1.3, letterSpacing: "0.01em" }}>
                    {r.label}
                  </p>
                </button>
              );
            })}
          </div>

          <HR />
        </div>
      </div>

      {/* Fixed action bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: `linear-gradient(to top, ${BG} 60%, transparent)`, padding: "16px 24px 30px", zIndex: 20 }}>
        <div style={{ display: "flex", gap: 12, maxWidth: 660, margin: "0 auto" }}>
          <button onClick={doCheckIn} disabled={!reason} className={reason ? "kiosk-btn-gold" : ""}
            style={{ flex: 1, height: 58, background: reason ? goldBorder(BG) : "transparent", border: reason ? "1.5px solid transparent" : `1.5px solid ${HAIR}`, borderRadius: 14, color: reason ? GOLD : SUB, fontSize: 11, fontWeight: reason ? 600 : 400, letterSpacing: "0.18em", cursor: reason ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.2s" }}>
            {c.checkIn}
          </button>
          <button onClick={doCheckOut} className="kiosk-btn-gold"
            style={{ flex: 1, height: 58, background: goldBorder(BG), border: "1.5px solid transparent", borderRadius: 14, color: GOLD, fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
            {c.checkOut}
          </button>
        </div>
        {!reason && (
          <p style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.1)", marginTop: 8, letterSpacing: "0.12em" }}>
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
      <KioskStyles />
      <GoldParticles />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "28px 40px", zIndex: 10 }}>
        <LiveClock lang={lang} />
        <div style={{ display: "flex", gap: 10 }}>
          <LangToggle lang={lang} setLang={setLang} />
          <button onClick={reset}
            style={{ background: "transparent", border: `1px solid ${HAIR}`, borderRadius: 8, color: SUB, fontSize: 10, cursor: "pointer", padding: "6px 14px", fontFamily: "inherit", letterSpacing: "0.1em" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = SUB; }}>
            HOME
          </button>
        </div>
      </div>

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px", position: "relative", zIndex: 3 }}>
        <div style={{ width: "100%", maxWidth: 460, animation: "kiosk-fade-up 0.4s ease" }}>

          <div style={{ background: SURFACE, border: `1px solid ${GOLD_EDGE}`, borderRadius: 18, padding: "32px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
              <Avatar name={found.full_name} size={60} />
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 300, color: TEXT, letterSpacing: "-0.01em", margin: "0 0 4px" }}>{found.full_name}</h2>
                <p style={{ fontSize: 11, color: SUB, margin: 0, letterSpacing: "0.04em" }}>{found.student_number}</p>
              </div>
              <button onClick={reset}
                style={{ marginLeft: "auto", background: "transparent", border: "none", color: SUB, fontSize: 10, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.06em", transition: "color 0.12s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = SUB; }}>
                {c.notYou}
              </button>
            </div>

            <HR />

            <p style={{ fontSize: 11, color: SUB, letterSpacing: "0.04em", margin: "22px 0 24px", lineHeight: 1.7 }}>{c.currentlyIn}</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                [c.checkInTime, getSessionTime()],
                [c.duration,    getDuration()],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={{ fontSize: 9, color: SUB, letterSpacing: "0.16em", textTransform: "uppercase" as const, margin: "0 0 6px" }}>{label}</p>
                  <p style={{ fontSize: 26, fontWeight: 200, color: TEXT, letterSpacing: "0.02em", margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={doCheckOut} className="kiosk-btn-gold"
            style={{ width: "100%", height: 58, background: goldBorder(BG), border: "1.5px solid transparent", borderRadius: 14, color: GOLD, fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
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
      <KioskStyles />
      <GoldParticles />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 600px 400px at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 2 }} />

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", zIndex: 3 }}>
        <div style={{ width: "100%", maxWidth: 400, animation: "kiosk-fade-up 0.5s ease" }}>

          <p style={{ fontSize: 9, fontWeight: 600, background: GOLD_G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never, letterSpacing: "0.28em", margin: "0 0 24px" }}>
            {c.checkedIn}
          </p>

          <p style={{ fontSize: 11, color: SUB, letterSpacing: "0.18em", textTransform: "uppercase" as const, margin: "0 0 6px" }}>{c.welcome}</p>
          <h2 style={{ fontSize: 48, fontWeight: 200, color: TEXT, letterSpacing: "-0.02em", lineHeight: 1, margin: "0 0 40px" }}>
            {found.full_name}
          </h2>

          <HR />

          <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", gap: 18 }}>
            {([
              [c.time,   checkinTime],
              [c.reason, reason],
              [c.status, c.statusActive],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 11, color: SUB, letterSpacing: "0.06em" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: label === c.status ? "#4ADE80" : "rgba(255,255,255,0.75)", textAlign: "right" as const }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <HR />

          <div style={{ marginTop: 22 }}>
            <div style={{ height: 1, background: HAIR, borderRadius: 1, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", background: GOLD_G, width: `${(countdown / 5) * 100}%`, transition: "width 1s linear" }} />
            </div>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.16)", letterSpacing: "0.12em" }}>
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
      <KioskStyles />
      <GoldParticles />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 600px 400px at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 2 }} />

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", zIndex: 3 }}>
        <div style={{ width: "100%", maxWidth: 400, animation: "kiosk-fade-up 0.5s ease" }}>

          <p style={{ fontSize: 9, fontWeight: 600, background: GOLD_G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never, letterSpacing: "0.28em", margin: "0 0 24px" }}>
            {c.checkedOut}
          </p>

          <p style={{ fontSize: 11, color: SUB, letterSpacing: "0.18em", textTransform: "uppercase" as const, margin: "0 0 6px" }}>{c.thankYou}</p>
          <h2 style={{ fontSize: 48, fontWeight: 200, color: TEXT, letterSpacing: "-0.02em", lineHeight: 1, margin: "0 0 8px" }}>
            {found.full_name}
          </h2>
          <p style={{ fontSize: 13, color: SUB, margin: "0 0 40px", letterSpacing: "0.04em" }}>{c.seeYou}</p>

          <HR />

          <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", gap: 18 }}>
            {([
              [c.checkOutTime,  new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })],
              [c.visitDuration, getDuration()],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 11, color: SUB, letterSpacing: "0.06em" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.75)", textAlign: "right" as const }}>{value}</span>
              </div>
            ))}
          </div>

          <HR />

          <div style={{ marginTop: 22 }}>
            <div style={{ height: 1, background: HAIR, borderRadius: 1, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", background: GOLD_G, width: `${(countdown / 5) * 100}%`, transition: "width 1s linear" }} />
            </div>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.16)", letterSpacing: "0.12em" }}>
              {c.returning} {countdown}s
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}
