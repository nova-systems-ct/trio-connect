import { useState, useEffect, useRef, useCallback } from "react";
import {
  getStudents, getActivities, createActivity, updateActivity,
  getMeetings, getEvents,
} from "../lib/db";
import type { TRIOStudent, Activity, Meeting, TRIOEvent } from "../lib/types";
import { differenceInMinutes } from "date-fns";

// ─── Palette ─────────────────────────────────────────────────────
const BG      = "#050505";
const SURFACE = "#0C0C0C";
const RED     = "#C1121F";
const TEXT    = "#FFFFFF";
const SUB     = "#606060";
const HAIR    = "rgba(255,255,255,0.07)";
const GOLD    = "#D4AF37";
const GOLD_G  = "linear-gradient(135deg, #B8860B 0%, #D4AF37 45%, #F8E7A1 82%, #FFF4C7 100%)";
const GOLD_E  = "rgba(212,175,55,0.28)";
const GOLD_D  = "rgba(212,175,55,0.06)";

const goldBdr = (bg = BG) =>
  `linear-gradient(${bg}, ${bg}) padding-box, linear-gradient(135deg, #6B4C00 0%, #B8860B 25%, #D4AF37 52%, #F8E7A1 78%, #FFF4C7 100%) border-box`;

// ─── 6 Reasons ───────────────────────────────────────────────────
const REASONS_EN = [
  { id: "Academic Advising", label: "Academic Advising" },
  { id: "Study Session",     label: "Study Session"     },
  { id: "Workshop",          label: "Workshop"          },
  { id: "Appointment",       label: "Appointment"       },
  { id: "Computer Lab",      label: "Computer Lab"      },
  { id: "Other",             label: "Other"             },
];
const REASONS_ES = [
  { id: "Academic Advising", label: "Asesoría Académica" },
  { id: "Study Session",     label: "Sesión de Estudio"  },
  { id: "Workshop",          label: "Taller"             },
  { id: "Appointment",       label: "Cita Programada"    },
  { id: "Computer Lab",      label: "Lab de Cómputo"     },
  { id: "Other",             label: "Otro"               },
];

// ─── i18n ─────────────────────────────────────────────────────────
const COPY = {
  en: {
    tagline:      "STUDENT SUCCESS PLATFORM",
    powered:      "POWERED BY NOVA SYSTEMS",
    hint:         "Scan your student ID card or enter your name below",
    placeholder:  "Enter Name or Student ID",
    whyHere:      "WHY ARE YOU HERE TODAY?",
    welcomeBack:  "WELCOME BACK",
    checkingIn:   "You are checking in for",
    checkIn:      "CHECK IN",
    checkOut:     "CHECK OUT",
    changeReason: "Change Reason",
    noStudent:    "No student found. Try a different name or ID.",
    successTitle: "SUCCESSFULLY CHECKED IN",
    haveGreatDay: "Have a Great Day",
    checkOutDone: "SUCCESSFULLY CHECKED OUT",
    seeYou:       "See You Soon",
    alreadyIn:    "ALREADY CHECKED IN",
    checkedInAt:  "Checked In",
    duration:     "Duration",
    checkOutTime: "Checked Out",
    visitLen:     "Visit Duration",
    returning:    "Returning home in",
    advisor:      "Advisor",
    program:      "Program",
    campus:       "Campus",
  },
  es: {
    tagline:      "PLATAFORMA DE ÉXITO ESTUDIANTIL",
    powered:      "DESARROLLADO POR NOVA SYSTEMS",
    hint:         "Escanee su tarjeta o ingrese su nombre abajo",
    placeholder:  "Nombre o Número de Estudiante",
    whyHere:      "¿POR QUÉ ESTÁ AQUÍ HOY?",
    welcomeBack:  "BIENVENIDO",
    checkingIn:   "Está registrándose para",
    checkIn:      "REGISTRARSE",
    checkOut:     "MARCAR SALIDA",
    changeReason: "Cambiar Razón",
    noStudent:    "Estudiante no encontrado. Intente de nuevo.",
    successTitle: "REGISTRO COMPLETADO",
    haveGreatDay: "Que Tenga un Buen Día",
    checkOutDone: "SALIDA COMPLETADA",
    seeYou:       "Hasta Pronto",
    alreadyIn:    "YA ESTÁ REGISTRADO",
    checkedInAt:  "Entrada",
    duration:     "Duración",
    checkOutTime: "Salida",
    visitLen:     "Duración de Visita",
    returning:    "Regresando en",
    advisor:      "Asesor",
    program:      "Programa",
    campus:       "Campus",
  },
} as const;

type Lang = "en" | "es";
type Step = "search" | "found" | "confirm" | "already-in" | "success" | "co-success";

// ─── Global styles ────────────────────────────────────────────────
function KioskStyles() {
  return (
    <style>{`
      @keyframes k-fadeup {
        from { opacity:0; transform:translateY(18px); }
        to   { opacity:1; transform:translateY(0);    }
      }
      @keyframes k-fadein {
        from { opacity:0; }
        to   { opacity:1; }
      }
      @keyframes k-pulse {
        0%,100% { opacity:.28; } 50% { opacity:.55; }
      }
      .k-input { transition: border-color .18s, box-shadow .18s; }
      .k-input:focus {
        border-color: rgba(212,175,55,.75) !important;
        box-shadow: 0 0 0 4px rgba(212,175,55,.10),
                    0 0 48px rgba(212,175,55,.09),
                    0 12px 56px rgba(0,0,0,.8) !important;
        outline: none;
      }
      .k-reason { transition: background .12s, border-color .12s; }
      .k-reason:hover { background: rgba(255,255,255,.03) !important; border-color: rgba(212,175,55,.38) !important; }
      .k-result:hover { background: rgba(255,255,255,.035) !important; }
      .k-ghost:hover { border-color: rgba(212,175,55,.45) !important; color: rgba(212,175,55,.9) !important; }
    `}</style>
  );
}

// ─── Gold particles ───────────────────────────────────────────────
type PData = { x:number; y:number; r:number; vx:number; vy:number; a:number; da:number };

function GoldParticles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const pts: PData[] = Array.from({ length: 55 }, () => ({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      r:  Math.random() * .9 + .25,
      vx: (Math.random() - .5) * .18,
      vy: -(Math.random() * .28 + .06),
      a:  Math.random() * .15 + .03,
      da: (Math.random() - .5) * .0007,
    }));
    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach((p) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(212,175,55,${Math.max(.02, Math.min(.19, p.a))})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy; p.a += p.da;
        if (p.y < -8) { p.y = c.height + 8; p.x = Math.random() * c.width; }
        if (p.x < -8) p.x = c.width + 8;
        if (p.x > c.width + 8) p.x = -8;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:1 }} />;
}

// ─── TRIO luxury logo ─────────────────────────────────────────────
function TrioLogo({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6B4C00" />
          <stop offset="25%"  stopColor="#B8860B" />
          <stop offset="55%"  stopColor="#D4AF37" />
          <stop offset="82%"  stopColor="#F8E7A1" />
          <stop offset="100%" stopColor="#FFF4C7" />
        </linearGradient>
      </defs>
      {/* Outer square */}
      <rect x="13" y="13" width="70" height="70" stroke="url(#lg)" strokeWidth="1.1" />
      {/* Corner registration marks */}
      <line x1="5"  y1="13" x2="13" y2="13" stroke="url(#lg)" strokeWidth=".9" />
      <line x1="13" y1="5"  x2="13" y2="13" stroke="url(#lg)" strokeWidth=".9" />
      <line x1="83" y1="5"  x2="83" y2="13" stroke="url(#lg)" strokeWidth=".9" />
      <line x1="83" y1="13" x2="91" y2="13" stroke="url(#lg)" strokeWidth=".9" />
      <line x1="5"  y1="83" x2="13" y2="83" stroke="url(#lg)" strokeWidth=".9" />
      <line x1="13" y1="83" x2="13" y2="91" stroke="url(#lg)" strokeWidth=".9" />
      <line x1="83" y1="83" x2="91" y2="83" stroke="url(#lg)" strokeWidth=".9" />
      <line x1="83" y1="83" x2="83" y2="91" stroke="url(#lg)" strokeWidth=".9" />
      {/* Three horizontal rule lines — TRIO mark */}
      <line x1="28" y1="36" x2="68" y2="36" stroke="url(#lg)" strokeWidth="1" />
      <line x1="28" y1="48" x2="68" y2="48" stroke="url(#lg)" strokeWidth="1" />
      <line x1="28" y1="60" x2="68" y2="60" stroke="url(#lg)" strokeWidth="1" />
      {/* Left serif ticks */}
      <line x1="28" y1="33" x2="28" y2="39" stroke="url(#lg)" strokeWidth=".7" />
      <line x1="28" y1="45" x2="28" y2="51" stroke="url(#lg)" strokeWidth=".7" />
      <line x1="28" y1="57" x2="28" y2="63" stroke="url(#lg)" strokeWidth=".7" />
    </svg>
  );
}

// ─── Gold checkmark ───────────────────────────────────────────────
function GoldCheckmark() {
  return (
    <svg width={92} height={92} viewBox="0 0 92 92" fill="none">
      <defs>
        <linearGradient id="ck" x1="0" y1="0" x2="92" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#B8860B" />
          <stop offset="45%"  stopColor="#D4AF37" />
          <stop offset="82%"  stopColor="#F8E7A1" />
          <stop offset="100%" stopColor="#FFF4C7" />
        </linearGradient>
      </defs>
      <circle cx="46" cy="46" r="42" stroke="url(#ck)" strokeWidth="1.2" />
      <path d="M30 46 L40 56 L62 34" stroke="url(#ck)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────
function Avatar({ name, size = 72 }: { name:string; size?:number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hs = [0,220,270,160,28];
  const h = hs[name.charCodeAt(0) % hs.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`hsl(${h},38%,16%)`, border:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <span style={{ fontSize:size*.31, fontWeight:600, color:"rgba(255,255,255,.82)", letterSpacing:"-.01em" }}>{initials}</span>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────
function HR() { return <div style={{ height:1, background:HAIR }} />; }

// ─── Clock ────────────────────────────────────────────────────────
function LiveClock({ lang }: { lang:Lang }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const lc = lang === "es" ? "es-US" : "en-US";
  return (
    <div>
      <p style={{ fontSize:12, color:SUB, letterSpacing:".04em", margin:"0 0 3px" }}>
        {now.toLocaleDateString(lc, { weekday:"long", month:"long", day:"numeric", year:"numeric" })}
      </p>
      <p style={{ fontSize:24, fontWeight:200, color:TEXT, letterSpacing:".04em", margin:0, fontVariantNumeric:"tabular-nums" }}>
        {now.toLocaleTimeString(lc, { hour:"numeric", minute:"2-digit", hour12:true })}
      </p>
    </div>
  );
}

// ─── Lang toggle ──────────────────────────────────────────────────
function LangToggle({ lang, set }: { lang:Lang; set:(l:Lang)=>void }) {
  return (
    <div style={{ display:"flex", border:`1px solid ${HAIR}`, borderRadius:8, overflow:"hidden" }}>
      {(["en","es"] as const).map((l,i) => (
        <button key={l} onClick={() => set(l)}
          style={{ background:lang===l ? GOLD_D : "transparent", border:"none", borderLeft:i>0?`1px solid ${HAIR}`:"none", color:lang===l ? GOLD : SUB, fontSize:10, fontWeight:lang===l?700:400, letterSpacing:".12em", cursor:"pointer", padding:"7px 16px", fontFamily:"inherit", transition:"all .14s" }}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ─── Search icon ──────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="si" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor="#B8860B" />
          <stop offset="60%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#F8E7A1" />
        </linearGradient>
      </defs>
      <circle cx="10.5" cy="10.5" r="6.2" stroke="url(#si)" strokeWidth="1.4" />
      <line x1="15.2" y1="15.2" x2="20.5" y2="20.5" stroke="url(#si)" strokeWidth="1.4" strokeLinecap="round" />
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
  const [focused, setFocused]         = useState(false);
  const [showNone, setShowNone]       = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const today    = new Date().toISOString().split("T")[0];
  const c        = COPY[lang];
  const reasons  = lang === "es" ? REASONS_ES : REASONS_EN;

  useEffect(() => {
    Promise.all([getStudents(), getActivities(), getMeetings(), getEvents()]).then(([s, a, m, e]) => {
      setStudents(s);
      setActivities(a.filter((x) => x.check_in_time.startsWith(today)));
      setMeetings(m.filter((x) => x.meeting_date === today && x.status === "Scheduled"));
      setEvents(e.filter((x) => x.event_date === today && x.is_active));
    });
  }, [today]);

  useEffect(() => {
    if (step === "search") {
      setQuery(""); setResults([]); setFound(null); setShowNone(false); setReason("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [step]);

  useEffect(() => {
    if (step !== "search") return;
    const h = (e: KeyboardEvent) => { if (e.key.length === 1 && document.activeElement !== inputRef.current) inputRef.current?.focus(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [step]);

  useEffect(() => {
    if (step !== "success" && step !== "co-success") return;
    setCountdown(5);
    const iv = setInterval(() => setCountdown((n) => { if (n <= 1) { clearInterval(iv); reset(); return 0; } return n - 1; }), 1000);
    return () => clearInterval(iv);
  }, [step]);

  useEffect(() => {
    if (found) return;
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); setShowNone(false); return; }
    const r = students.filter((s) =>
      s.full_name.toLowerCase().includes(q) ||
      s.student_number.toLowerCase().includes(q) ||
      s.student_number.replace(/\D/g,"").includes(q.replace(/\D/g,""))
    ).slice(0, 5);
    setResults(r);
    setShowNone(q.length > 1 && r.length === 0);
  }, [query, students, found]);

  function reset() { setStep("search"); setQuery(""); setResults([]); setFound(null); setReason(""); setSession(null); setCheckinTime(""); setShowNone(false); }
  function clearSearch() { setFound(null); setQuery(""); setResults([]); setShowNone(false); setTimeout(() => inputRef.current?.focus(), 60); }

  function selectStudent(s: TRIOStudent) {
    const sess = activities.find((a) => a.student_id === s.id && !a.check_out_time) ?? null;
    setFound(s); setSession(sess); setQuery(s.full_name); setResults([]); setShowNone(false);
    setStep(sess ? "already-in" : "found");
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (results.length === 1) { selectStudent(results[0]); return; }
    if (results.length > 1) { const ex = results.find((s) => s.student_number.toLowerCase() === query.trim().toLowerCase()); if (ex) selectStudent(ex); }
  }, [results, query]);

  async function doCheckIn() {
    if (!found || !reason) return;
    const now = new Date();
    setCheckinTime(now.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit", hour12:true }));
    const appt = meetings.find((m) => m.student_id === found.id);
    const evt  = !appt ? (events[0] ?? null) : null;
    await createActivity({ student_id:found.id, student_name:found.full_name, activity_type:"Walk-In Advising", check_in_time:now.toISOString(), location:"TRIO Office (Kiosk)", notes:reason, meeting_id:appt?.id, event_id:evt?.id });
    setStep("success");
  }

  async function doCheckOut() {
    if (!found) return;
    if (session) { const mins = differenceInMinutes(new Date(), new Date(session.check_in_time)); await updateActivity(session.id, { check_out_time:new Date().toISOString(), duration_minutes:Math.max(1,mins) }); }
    setStep("co-success");
  }

  function getDuration() {
    if (!session) return "—";
    const m = differenceInMinutes(new Date(), new Date(session.check_in_time));
    if (m < 1) return "< 1 min";
    const h = Math.floor(m/60), mn = m%60;
    if (h===0) return `${m} min`;
    if (mn===0) return `${h} hr`;
    return `${h} hr ${mn} min`;
  }

  function getSessionTime() {
    if (!session) return "—";
    return new Date(session.check_in_time).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit", hour12:true });
  }

  // Shared page shell
  const page: React.CSSProperties = { minHeight:"100vh", background:BG, fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',system-ui,sans-serif", color:TEXT, position:"relative", overflow:"hidden" };

  // Shared top bar
  const topBar = (extra?: React.ReactNode) => (
    <div style={{ position:"absolute", top:0, left:0, right:0, display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"28px 44px", zIndex:10 }}>
      <LiveClock lang={lang} />
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <LangToggle lang={lang} set={setLang} />
        {extra}
      </div>
    </div>
  );

  const homeBtn = (
    <button onClick={reset} className="k-ghost"
      style={{ background:"transparent", border:`1px solid ${HAIR}`, borderRadius:8, color:SUB, fontSize:10, cursor:"pointer", padding:"7px 16px", fontFamily:"inherit", letterSpacing:".1em", transition:"all .14s" }}>
      HOME
    </button>
  );

  const hasDropdown = results.length > 0 || showNone;

  // ══════════════════════════════════════════════════════════════
  // SCREEN 1 — SEARCH
  // ══════════════════════════════════════════════════════════════
  if (step === "search") return (
    <div style={page}>
      <KioskStyles />
      <GoldParticles />
      {topBar()}
      {/* Center radial glow */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 700px 500px at 50% 52%, rgba(212,175,55,0.045) 0%, transparent 68%)", pointerEvents:"none", zIndex:2 }} />

      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"120px 24px 80px", position:"relative", zIndex:3 }}>
        <div style={{ width:"100%", maxWidth:520, display:"flex", flexDirection:"column", alignItems:"center" }}>

          {/* Logo */}
          <div style={{ marginBottom:20, animation:"k-pulse 5s ease-in-out infinite" }}>
            <TrioLogo size={96} />
          </div>

          {/* Red accent line */}
          <div style={{ width:48, height:2, background:RED, borderRadius:1, marginBottom:28, opacity:.85 }} />

          {/* Wordmark */}
          <h1 style={{ fontSize:60, fontWeight:100, color:TEXT, letterSpacing:".28em", margin:"0 0 14px", textAlign:"center", lineHeight:1, textTransform:"uppercase" as const }}>
            TRIO CONNECT
          </h1>
          <p style={{ fontSize:10, background:GOLD_G, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" as never, letterSpacing:".24em", margin:"0 0 6px", textAlign:"center", fontWeight:500 }}>
            {c.tagline}
          </p>
          <p style={{ fontSize:9, color:"rgba(212,175,55,.36)", letterSpacing:".2em", margin:"0 0 56px", textAlign:"center" }}>
            {c.powered}
          </p>

          {/* Hero input */}
          <div style={{ width:"100%", position:"relative" }}>
            <input
              ref={inputRef}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="k-input"
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (found) clearSearch(); }}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={c.placeholder}
              style={{
                width:"100%", boxSizing:"border-box" as const, height:88,
                background: SURFACE,
                border: `1.5px solid ${focused ? "rgba(212,175,55,.72)" : found ? "rgba(212,175,55,.65)" : GOLD_E}`,
                borderRadius: hasDropdown ? "18px 18px 0 0" : 18,
                padding:"0 56px 0 60px",
                fontSize:21, color:TEXT, outline:"none",
                fontFamily:"inherit", fontWeight:300, letterSpacing:".01em",
                boxShadow: focused
                  ? "0 0 0 4px rgba(212,175,55,.10), 0 0 48px rgba(212,175,55,.09), 0 12px 56px rgba(0,0,0,.8)"
                  : "0 6px 40px rgba(0,0,0,.65)",
              }}
            />
            {/* Search icon */}
            <div style={{ position:"absolute", left:20, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
              <SearchIcon />
            </div>
            {/* Clear */}
            {query.length > 0 && (
              <button onClick={clearSearch}
                style={{ position:"absolute", right:20, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:SUB, fontSize:13, cursor:"pointer", width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"50%", fontFamily:"inherit", transition:"color .12s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = SUB; }}>
                ✕
              </button>
            )}

            {/* Dropdown */}
            {results.length > 0 && (
              <div style={{ background:SURFACE, border:`1.5px solid ${GOLD_E}`, borderTop:"none", borderRadius:"0 0 18px 18px", overflow:"hidden" }}>
                {results.map((s, i) => (
                  <button key={s.id} className="k-result" onClick={() => selectStudent(s)}
                    style={{ width:"100%", background:"transparent", border:"none", padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", textAlign:"left" as const, borderTop:i>0?`1px solid ${HAIR}`:"none", fontFamily:"inherit", transition:"background .1s" }}>
                    <div>
                      <p style={{ fontSize:17, fontWeight:400, color:TEXT, margin:0, letterSpacing:"-.01em" }}>{s.full_name}</p>
                      <p style={{ fontSize:12, color:SUB, margin:"4px 0 0", letterSpacing:".04em" }}>{s.student_number}</p>
                    </div>
                    <span style={{ fontSize:9, fontWeight:700, color:s.enrollment_status==="active"?"#4ADE80":"#F87171", textTransform:"uppercase" as const, letterSpacing:".1em" }}>
                      {s.enrollment_status}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {showNone && (
              <div style={{ background:SURFACE, border:`1.5px solid ${GOLD_E}`, borderTop:"none", borderRadius:"0 0 18px 18px", padding:"18px 24px" }}>
                <p style={{ color:SUB, fontSize:15, margin:0 }}>{c.noStudent}</p>
              </div>
            )}
          </div>

          {/* Hint */}
          <p style={{ fontSize:12, color:SUB, marginTop:20, textAlign:"center", letterSpacing:".03em", lineHeight:1.6 }}>
            {c.hint}
          </p>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // SCREEN 2 — STUDENT + 6 REASONS
  // ══════════════════════════════════════════════════════════════
  if (step === "found" && found) return (
    <div style={page}>
      <KioskStyles />
      <GoldParticles />
      {topBar(homeBtn)}

      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"100px 24px 60px", position:"relative", zIndex:3 }}>
        <div style={{ width:"100%", maxWidth:640, animation:"k-fadeup .4s ease" }}>

          {/* Student card */}
          <div style={{ background:`linear-gradient(135deg, #0E0E0E 0%, #0A0A0A 100%)`, border:`1px solid ${GOLD_E}`, borderRadius:20, padding:"28px 32px", marginBottom:36 }}>
            {/* Gold top rule */}
            <div style={{ height:1, background:GOLD_G, marginBottom:24 }} />
            <div style={{ display:"flex", alignItems:"center", gap:24 }}>
              <Avatar name={found.full_name} size={80} />
              <div style={{ flex:1, minWidth:0 }}>
                <h2 style={{ fontSize:36, fontWeight:200, color:TEXT, letterSpacing:"-.02em", margin:"0 0 6px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {found.full_name}
                </h2>
                <p style={{ fontSize:12, color:SUB, letterSpacing:".06em", margin:"0 0 14px" }}>
                  ID: {found.student_number}
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 24px" }}>
                  {[
                    [c.advisor, found.advisor_name ?? "—"],
                    [c.program, found.program       ?? "TRIO SSS"],
                    [c.campus,  found.work_location ?? "CT State"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p style={{ fontSize:9, color:SUB, letterSpacing:".12em", textTransform:"uppercase" as const, margin:"0 0 2px" }}>{label}</p>
                      <p style={{ fontSize:13, color:"rgba(255,255,255,.75)", margin:0, fontWeight:400 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reason label */}
          <p style={{ fontSize:10, color:SUB, letterSpacing:".24em", textTransform:"uppercase" as const, margin:"0 0 16px" }}>
            {c.whyHere}
          </p>

          {/* 6 reason buttons — 2 columns */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {reasons.map((r) => {
              const active = reason === r.id;
              return (
                <button key={r.id} className={active ? "" : "k-reason"} onClick={() => { setReason(active ? "" : r.id); }}
                  style={{
                    height:88,
                    background: active ? goldBdr(SURFACE) : SURFACE,
                    border: active ? "1.5px solid transparent" : `1px solid ${HAIR}`,
                    borderRadius:14,
                    cursor:"pointer", fontFamily:"inherit",
                    transition:"all .14s",
                    boxShadow: active ? "0 0 24px rgba(212,175,55,.12)" : "none",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                  <p style={{ fontSize:16, fontWeight: active ? 500 : 300, color: active ? GOLD : "rgba(255,255,255,.7)", margin:0, letterSpacing:".01em" }}>
                    {r.label}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Advance */}
          {reason && (
            <button onClick={() => setStep("confirm")}
              style={{ width:"100%", height:64, marginTop:16, background:goldBdr(BG), border:"1.5px solid transparent", borderRadius:14, color:GOLD, fontSize:11, fontWeight:600, letterSpacing:".18em", cursor:"pointer", fontFamily:"inherit", transition:"all .2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 32px rgba(212,175,55,.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
              CONTINUE →
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // SCREEN 3 — CONFIRM CHECK-IN
  // ══════════════════════════════════════════════════════════════
  if (step === "confirm" && found) return (
    <div style={page}>
      <KioskStyles />
      <GoldParticles />
      {topBar(homeBtn)}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 600px 400px at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 68%)", pointerEvents:"none", zIndex:2 }} />

      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"100px 24px", position:"relative", zIndex:3 }}>
        <div style={{ width:"100%", maxWidth:480, animation:"k-fadeup .45s ease" }}>

          {/* Welcome label */}
          <p style={{ fontSize:10, fontWeight:600, background:GOLD_G, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" as never, letterSpacing:".26em", margin:"0 0 8px" }}>
            {c.welcomeBack}
          </p>

          {/* Student name — HERO */}
          <h2 style={{ fontSize:64, fontWeight:100, color:TEXT, letterSpacing:"-.02em", lineHeight:1, margin:"0 0 32px" }}>
            {found.full_name}
          </h2>

          <HR />

          <div style={{ padding:"28px 0 32px", display:"flex", flexDirection:"column", gap:6 }}>
            <p style={{ fontSize:12, color:SUB, letterSpacing:".06em", margin:0 }}>{c.checkingIn}</p>
            <p style={{ fontSize:34, fontWeight:300, background:GOLD_G, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" as never, letterSpacing:"-.01em", margin:0 }}>
              {reason}
            </p>
          </div>

          <HR />

          {/* THE ONE BUTTON */}
          <button onClick={doCheckIn}
            style={{ width:"100%", height:74, marginTop:32, background:RED, border:"none", borderRadius:16, color:TEXT, fontSize:14, fontWeight:700, letterSpacing:".22em", cursor:"pointer", fontFamily:"inherit", transition:"all .2s", boxShadow:`0 8px 40px rgba(193,18,31,.30)` }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = ".88"; e.currentTarget.style.boxShadow = "0 12px 56px rgba(193,18,31,.40)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1";   e.currentTarget.style.boxShadow = "0 8px 40px rgba(193,18,31,.30)"; }}>
            {c.checkIn}
          </button>

          {/* Back link */}
          <button onClick={() => setStep("found")}
            style={{ display:"block", margin:"18px auto 0", background:"transparent", border:"none", color:SUB, fontSize:11, cursor:"pointer", fontFamily:"inherit", letterSpacing:".08em", transition:"color .12s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = SUB; }}>
            ← {c.changeReason}
          </button>
        </div>
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
      {topBar(homeBtn)}

      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"100px 24px", position:"relative", zIndex:3 }}>
        <div style={{ width:"100%", maxWidth:480, animation:"k-fadeup .4s ease" }}>

          <p style={{ fontSize:10, fontWeight:600, background:GOLD_G, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" as never, letterSpacing:".26em", margin:"0 0 10px" }}>
            {c.alreadyIn}
          </p>

          <h2 style={{ fontSize:56, fontWeight:100, color:TEXT, letterSpacing:"-.02em", lineHeight:1, margin:"0 0 32px" }}>
            {found.full_name}
          </h2>

          <HR />

          <div style={{ padding:"32px 0", display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>
            {[
              [c.checkedInAt, getSessionTime()],
              [c.duration,    getDuration()],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ fontSize:9, color:SUB, letterSpacing:".18em", textTransform:"uppercase" as const, margin:"0 0 8px" }}>{label}</p>
                <p style={{ fontSize:40, fontWeight:100, color:TEXT, letterSpacing:"-.01em", margin:0 }}>{value}</p>
              </div>
            ))}
          </div>

          <HR />

          <button onClick={doCheckOut}
            style={{ width:"100%", height:74, marginTop:32, background:goldBdr(BG), border:"1.5px solid transparent", borderRadius:16, color:GOLD, fontSize:14, fontWeight:600, letterSpacing:".22em", cursor:"pointer", fontFamily:"inherit", transition:"all .2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 40px rgba(212,175,55,.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
            {c.checkOut}
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // SUCCESS — CHECK-IN
  // ══════════════════════════════════════════════════════════════
  if (step === "success" && found) return (
    <div style={page}>
      <KioskStyles />
      <GoldParticles />
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 600px 500px at 50% 46%, rgba(212,175,55,0.05) 0%, transparent 68%)", pointerEvents:"none", zIndex:2 }} />

      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px", position:"relative", zIndex:3 }}>
        <div style={{ width:"100%", maxWidth:400, animation:"k-fadeup .5s ease", textAlign:"center" as const }}>

          <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
            <GoldCheckmark />
          </div>

          <p style={{ fontSize:10, fontWeight:600, background:GOLD_G, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" as never, letterSpacing:".26em", margin:"0 0 28px" }}>
            {c.successTitle}
          </p>

          <h2 style={{ fontSize:52, fontWeight:100, color:TEXT, letterSpacing:"-.02em", lineHeight:1, margin:"0 0 8px" }}>
            {found.full_name}
          </h2>
          <p style={{ fontSize:18, color:SUB, fontWeight:300, margin:"0 0 36px" }}>{reason}</p>

          <HR />

          <p style={{ fontSize:20, fontWeight:200, color:TEXT, letterSpacing:".06em", margin:"28px 0 8px" }}>
            {checkinTime}
          </p>

          <HR />

          <p style={{ fontSize:13, color:SUB, letterSpacing:".06em", margin:"24px 0 36px" }}>
            {c.haveGreatDay}
          </p>

          {/* Countdown bar */}
          <div style={{ height:1, background:HAIR, borderRadius:1, overflow:"hidden", marginBottom:10 }}>
            <div style={{ height:"100%", background:GOLD_G, width:`${(countdown/5)*100}%`, transition:"width 1s linear" }} />
          </div>
          <p style={{ fontSize:9, color:"rgba(255,255,255,.15)", letterSpacing:".12em" }}>
            {c.returning} {countdown}s
          </p>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CO-SUCCESS — CHECK-OUT
  // ══════════════════════════════════════════════════════════════
  if (step === "co-success" && found) return (
    <div style={page}>
      <KioskStyles />
      <GoldParticles />
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 600px 500px at 50% 46%, rgba(212,175,55,0.05) 0%, transparent 68%)", pointerEvents:"none", zIndex:2 }} />

      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px", position:"relative", zIndex:3 }}>
        <div style={{ width:"100%", maxWidth:400, animation:"k-fadeup .5s ease", textAlign:"center" as const }}>

          <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
            <GoldCheckmark />
          </div>

          <p style={{ fontSize:10, fontWeight:600, background:GOLD_G, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" as never, letterSpacing:".26em", margin:"0 0 28px" }}>
            {c.checkOutDone}
          </p>

          <h2 style={{ fontSize:52, fontWeight:100, color:TEXT, letterSpacing:"-.02em", lineHeight:1, margin:"0 0 8px" }}>
            {found.full_name}
          </h2>
          <p style={{ fontSize:16, color:SUB, fontWeight:300, margin:"0 0 36px" }}>{c.seeYou}</p>

          <HR />

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, padding:"28px 0" }}>
            {[
              [c.checkOutTime, new Date().toLocaleTimeString("en-US",{ hour:"numeric", minute:"2-digit", hour12:true })],
              [c.visitLen,     getDuration()],
            ].map(([label, value]) => (
              <div key={label} style={{ textAlign:"center" as const }}>
                <p style={{ fontSize:9, color:SUB, letterSpacing:".16em", textTransform:"uppercase" as const, margin:"0 0 6px" }}>{label}</p>
                <p style={{ fontSize:26, fontWeight:200, color:TEXT, margin:0 }}>{value}</p>
              </div>
            ))}
          </div>

          <HR />

          <div style={{ marginTop:24 }}>
            <div style={{ height:1, background:HAIR, borderRadius:1, overflow:"hidden", marginBottom:10 }}>
              <div style={{ height:"100%", background:GOLD_G, width:`${(countdown/5)*100}%`, transition:"width 1s linear" }} />
            </div>
            <p style={{ fontSize:9, color:"rgba(255,255,255,.15)", letterSpacing:".12em" }}>
              {c.returning} {countdown}s
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}
