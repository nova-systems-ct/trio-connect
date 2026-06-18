import { useState, useEffect, useRef, useCallback } from "react";
import {
  getStudents, getActivities, createActivity, updateActivity,
  getMeetings, getEvents,
} from "../lib/db";
import type { TRIOStudent, Activity, Meeting, TRIOEvent } from "../lib/types";
import { differenceInMinutes } from "date-fns";

// ─── Palette (90% black · 8% white · 2% gold) ────────────────────
const BG      = "#050505";
const CARD    = "#111111";
const CARD2   = "#151515";
const BORDER  = "rgba(255,255,255,0.07)";
const BORDER2 = "rgba(255,255,255,0.12)";
const TEXT    = "#FFFFFF";
const SUB     = "#666666";
const SUB2    = "#999999";
const RED     = "#C1121F";
const RED_DIM = "rgba(193,18,31,0.10)";
const RED_E   = "rgba(193,18,31,0.40)";
const GOLD    = "#D4AF37";
const GOLD_G  = "linear-gradient(135deg,#B8860B 0%,#D4AF37 45%,#F8E7A1 82%,#FFF4C7 100%)";
const GOLD_E  = "rgba(212,175,55,0.28)";

// gradient-border helper
const gBdr = (bg: string) =>
  `linear-gradient(${bg},${bg}) padding-box,linear-gradient(135deg,#6B4C00 0%,#B8860B 25%,#D4AF37 52%,#F8E7A1 78%,#FFF4C7 100%) border-box`;

// ─── Reasons with icons ───────────────────────────────────────────
interface Reason { id: string; label: string; icon: string }
const REASONS_EN: Reason[] = [
  { id:"Academic Advising",   label:"Academic Advising",  icon:"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { id:"Appointment",          label:"Appointment",        icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id:"Study Session",        label:"Study Session",      icon:"M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
  { id:"Workshop",             label:"Workshop",           icon:"M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { id:"FAFSA Assistance",     label:"FAFSA Assistance",   icon:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id:"Transfer Services",    label:"Transfer Services",  icon:"M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" },
  { id:"Career Services",      label:"Career Services",    icon:"M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { id:"Computer Lab",         label:"Computer Lab",       icon:"M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { id:"Event",                label:"Event",              icon:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
  { id:"General Visit",        label:"General Visit",      icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id:"Other",                label:"Other",              icon:"M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" },
];
const REASONS_ES: Reason[] = [
  { id:"Academic Advising",   label:"Asesoría Académica",    icon:REASONS_EN[0].icon },
  { id:"Appointment",          label:"Cita Programada",       icon:REASONS_EN[1].icon },
  { id:"Study Session",        label:"Sesión de Estudio",     icon:REASONS_EN[2].icon },
  { id:"Workshop",             label:"Taller",                icon:REASONS_EN[3].icon },
  { id:"FAFSA Assistance",     label:"Ayuda FAFSA",           icon:REASONS_EN[4].icon },
  { id:"Transfer Services",    label:"Transferencia",         icon:REASONS_EN[5].icon },
  { id:"Career Services",      label:"Servicios de Carrera",  icon:REASONS_EN[6].icon },
  { id:"Computer Lab",         label:"Lab de Cómputo",        icon:REASONS_EN[7].icon },
  { id:"Event",                label:"Evento",                icon:REASONS_EN[8].icon },
  { id:"General Visit",        label:"Visita General",        icon:REASONS_EN[9].icon },
  { id:"Other",                label:"Otro",                  icon:REASONS_EN[10].icon },
];

// ─── i18n ─────────────────────────────────────────────────────────
const COPY = {
  en: {
    tagline:     "Student Success Platform",
    powered:     "POWERED BY NOVA SYSTEMS",
    placeholder: "Enter Name or Student ID",
    scanHint:    "Scan Student ID",
    whyHere:     "WHY ARE YOU HERE TODAY?",
    checkingFor: "YOU ARE CHECKING IN FOR",
    checkIn:     "CHECK IN",
    checkOut:    "CHECK OUT",
    cancel:      "Cancel",
    noStudent:   "No student found — try a different name or ID.",
    successLine1:"SUCCESSFULLY",
    successLine2:"CHECKED IN",
    haveGreat:   "Have a Great Day",
    coLine1:     "SUCCESSFULLY",
    coLine2:     "CHECKED OUT",
    seeYou:      "See You Soon",
    alreadyIn:   "YOU ARE CHECKING OUT",
    checkedInAt: "CHECKED IN",
    visit:       "VISIT",
    duration:    "DURATION",
    checkOutAt:  "CHECKED OUT",
    visitLen:    "VISIT DURATION",
    returning:   "Returning in",
    advisor:     "ADVISOR",
    program:     "PROGRAM",
    campus:      "CAMPUS",
    location:    "TRIO Center",
  },
  es: {
    tagline:     "Plataforma para el Éxito Estudiantil",
    powered:     "DESARROLLADO POR NOVA SYSTEMS",
    placeholder: "Nombre o Número de Estudiante",
    scanHint:    "Escanear Tarjeta",
    whyHere:     "¿POR QUÉ ESTÁ AQUÍ HOY?",
    checkingFor: "ESTÁ REGISTRÁNDOSE PARA",
    checkIn:     "REGISTRARSE",
    checkOut:    "MARCAR SALIDA",
    cancel:      "Cancelar",
    noStudent:   "Estudiante no encontrado — intente de nuevo.",
    successLine1:"REGISTRO",
    successLine2:"COMPLETADO",
    haveGreat:   "Que Tenga un Buen Día",
    coLine1:     "SALIDA",
    coLine2:     "COMPLETADA",
    seeYou:      "Hasta Pronto",
    alreadyIn:   "ESTÁ MARCANDO SALIDA",
    checkedInAt: "ENTRADA",
    visit:       "VISITA",
    duration:    "DURACIÓN",
    checkOutAt:  "SALIDA",
    visitLen:    "DURACIÓN DE VISITA",
    returning:   "Regresando en",
    advisor:     "ASESOR",
    program:     "PROGRAMA",
    campus:      "CAMPUS",
    location:    "Centro TRIO",
  },
} as const;

type Lang = "en" | "es";
type Step = "search" | "found" | "confirm" | "already-in" | "success" | "co-success";

// ─── Keyframes ────────────────────────────────────────────────────
function KioskStyles() {
  return (
    <style>{`
      @keyframes ki-up   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      @keyframes ki-in   { from{opacity:0} to{opacity:1} }
      @keyframes ki-logo { 0%,100%{opacity:.7} 50%{opacity:1} }
      .ki-up  { animation: ki-up .38s ease both }
      .ki-in  { animation: ki-in .3s ease both  }
      .ki-input { transition: border-color .15s, box-shadow .15s; }
      .ki-input:focus {
        border-color: ${GOLD_E} !important;
        box-shadow: 0 0 0 3px rgba(212,175,55,.09), 0 8px 40px rgba(0,0,0,.75) !important;
        outline: none;
      }
      .ki-result:hover { background: ${CARD2} !important; }
      .ki-reason:hover { border-color: ${BORDER2} !important; background: ${CARD2} !important; }
    `}</style>
  );
}

// ─── Particles ────────────────────────────────────────────────────
type PData = { x:number;y:number;r:number;vx:number;vy:number;a:number;da:number };

function GoldParticles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const pts: PData[] = Array.from({length:40},()=>({
      x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight,
      r:Math.random()*.8+.2, vx:(Math.random()-.5)*.14, vy:-(Math.random()*.22+.04),
      a:Math.random()*.12+.02, da:(Math.random()-.5)*.0005,
    }));
    let raf: number;
    const tick = () => {
      ctx.clearRect(0,0,cv.width,cv.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(212,175,55,${Math.max(.015,Math.min(.15,p.a))})`;
        ctx.fill();
        p.x+=p.vx; p.y+=p.vy; p.a+=p.da;
        if(p.y<-6){p.y=cv.height+6;p.x=Math.random()*cv.width;}
        if(p.x<-6)p.x=cv.width+6; if(p.x>cv.width+6)p.x=-6;
      });
      raf=requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1}} />;
}

// ─── Logo ─────────────────────────────────────────────────────────
function TrioLogo({size=88}:{size?:number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="88" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6B4C00"/>
          <stop offset="28%"  stopColor="#B8860B"/>
          <stop offset="55%"  stopColor="#D4AF37"/>
          <stop offset="82%"  stopColor="#F8E7A1"/>
          <stop offset="100%" stopColor="#FFF4C7"/>
        </linearGradient>
      </defs>
      {/* Outer square */}
      <rect x="12" y="12" width="64" height="64" stroke="url(#lg)" strokeWidth="1.1"/>
      {/* Corner marks */}
      <line x1="4"  y1="12" x2="12" y2="12" stroke="url(#lg)" strokeWidth=".85"/>
      <line x1="12" y1="4"  x2="12" y2="12" stroke="url(#lg)" strokeWidth=".85"/>
      <line x1="76" y1="4"  x2="76" y2="12" stroke="url(#lg)" strokeWidth=".85"/>
      <line x1="76" y1="12" x2="84" y2="12" stroke="url(#lg)" strokeWidth=".85"/>
      <line x1="4"  y1="76" x2="12" y2="76" stroke="url(#lg)" strokeWidth=".85"/>
      <line x1="12" y1="76" x2="12" y2="84" stroke="url(#lg)" strokeWidth=".85"/>
      <line x1="76" y1="76" x2="84" y2="76" stroke="url(#lg)" strokeWidth=".85"/>
      <line x1="76" y1="76" x2="76" y2="84" stroke="url(#lg)" strokeWidth=".85"/>
      {/* TRIO three-line mark */}
      <line x1="26" y1="34" x2="62" y2="34" stroke="url(#lg)" strokeWidth="1.05"/>
      <line x1="26" y1="44" x2="62" y2="44" stroke="url(#lg)" strokeWidth="1.05"/>
      <line x1="26" y1="54" x2="62" y2="54" stroke="url(#lg)" strokeWidth="1.05"/>
      <line x1="26" y1="31" x2="26" y2="37" stroke="url(#lg)" strokeWidth=".75"/>
      <line x1="26" y1="41" x2="26" y2="47" stroke="url(#lg)" strokeWidth=".75"/>
      <line x1="26" y1="51" x2="26" y2="57" stroke="url(#lg)" strokeWidth=".75"/>
    </svg>
  );
}

// ─── Gold checkmark ───────────────────────────────────────────────
function GoldCheck() {
  return (
    <svg width={80} height={80} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="ck" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#B8860B"/>
          <stop offset="50%"  stopColor="#D4AF37"/>
          <stop offset="100%" stopColor="#F8E7A1"/>
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="36" stroke="url(#ck)" strokeWidth="1.2"/>
      <path d="M26 40 L36 50 L54 30" stroke="url(#ck)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Icon helper ──────────────────────────────────────────────────
function Icon({path,size=18,color="currentColor"}:{path:string;size?:number;color?:string}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={path}/>
    </svg>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────
function Avatar({name,size=64}:{name:string;size?:number}) {
  const ini = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const hs = [0,215,265,155,25];
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:`hsl(${hs[name.charCodeAt(0)%hs.length]},35%,18%)`,border:`1px solid ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <span style={{fontSize:size*.3,fontWeight:600,color:"rgba(255,255,255,.8)"}}>{ini}</span>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────
function HR() { return <div style={{height:1,background:BORDER}}/>; }

// ─── Clock ────────────────────────────────────────────────────────
function LiveClock({lang}:{lang:Lang}) {
  const [now,setNow] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); },[]);
  const lc = lang==="es" ? "es-US" : "en-US";
  return (
    <div>
      <p style={{fontSize:26,fontWeight:300,color:TEXT,letterSpacing:".01em",margin:"0 0 3px",fontVariantNumeric:"tabular-nums"}}>
        {now.toLocaleTimeString(lc,{hour:"numeric",minute:"2-digit",hour12:true})}
      </p>
      <p style={{fontSize:12,color:SUB,letterSpacing:".03em",margin:0}}>
        {now.toLocaleDateString(lc,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
      </p>
    </div>
  );
}

// ─── Language toggle ──────────────────────────────────────────────
function LangToggle({lang,set}:{lang:Lang;set:(l:Lang)=>void}) {
  return (
    <div style={{display:"flex",border:`1px solid ${BORDER}`,borderRadius:8,overflow:"hidden"}}>
      {(["en","es"] as const).map((l,i)=>(
        <button key={l} onClick={()=>set(l)}
          style={{background:lang===l?"rgba(255,255,255,.06)":"transparent",border:"none",borderLeft:i>0?`1px solid ${BORDER}`:"none",color:lang===l?TEXT:SUB,fontSize:11,fontWeight:lang===l?600:400,letterSpacing:".1em",cursor:"pointer",padding:"6px 14px",fontFamily:"inherit",transition:"all .14s"}}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ─── Reason card ──────────────────────────────────────────────────
function ReasonCard({reason,active,onClick}:{reason:Reason;active:boolean;onClick:()=>void}) {
  return (
    <button className={active?"":"ki-reason"} onClick={onClick}
      style={{height:90,background:active?RED_DIM:CARD,border:`1px solid ${active?RED_E:BORDER}`,borderRadius:12,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,transition:"all .12s",boxShadow:active?`0 0 18px ${RED_DIM}`:"none"}}>
      <Icon path={reason.icon} size={18} color={active?"#ff6b7a":"rgba(255,255,255,0.35)"}/>
      <p style={{fontSize:11,fontWeight:active?500:400,color:active?"rgba(255,255,255,.9)":"rgba(255,255,255,.45)",margin:0,textAlign:"center",padding:"0 8px",lineHeight:1.3}}>
        {reason.label}
      </p>
    </button>
  );
}

// ─── Student mini-card (used on confirm screen) ───────────────────
function StudentMini({student}:{student:TRIOStudent}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:14,background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:"14px 18px"}}>
      <Avatar name={student.full_name} size={44}/>
      <div>
        <p style={{fontSize:15,fontWeight:600,color:TEXT,margin:"0 0 3px",letterSpacing:"-.01em"}}>{student.full_name}</p>
        <p style={{fontSize:11,color:SUB,margin:0,letterSpacing:".04em"}}>{student.student_number}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════════
export default function KioskPage() {
  const [lang,setLang]               = useState<Lang>("en");
  const [step,setStep]               = useState<Step>("search");
  const [students,setStudents]       = useState<TRIOStudent[]>([]);
  const [activities,setActivities]   = useState<Activity[]>([]);
  const [meetings,setMeetings]       = useState<Meeting[]>([]);
  const [events,setEvents]           = useState<TRIOEvent[]>([]);
  const [query,setQuery]             = useState("");
  const [results,setResults]         = useState<TRIOStudent[]>([]);
  const [found,setFound]             = useState<TRIOStudent|null>(null);
  const [reason,setReason]           = useState("");
  const [session,setSession]         = useState<Activity|null>(null);
  const [countdown,setCountdown]     = useState(5);
  const [checkinTime,setCheckinTime] = useState("");
  const [showNone,setShowNone]       = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().split("T")[0];
  const c = COPY[lang];
  const reasons = lang==="es" ? REASONS_ES : REASONS_EN;

  useEffect(()=>{
    Promise.all([getStudents(),getActivities(),getMeetings(),getEvents()]).then(([s,a,m,e])=>{
      setStudents(s);
      setActivities(a.filter(x=>x.check_in_time.startsWith(today)));
      setMeetings(m.filter(x=>x.meeting_date===today&&x.status==="Scheduled"));
      setEvents(e.filter(x=>x.event_date===today&&x.is_active));
    });
  },[today]);

  useEffect(()=>{
    if(step==="search"){
      setQuery(""); setResults([]); setFound(null); setShowNone(false); setReason("");
      setTimeout(()=>inputRef.current?.focus(),80);
    }
  },[step]);

  useEffect(()=>{
    if(step!=="search") return;
    const h=(e:KeyboardEvent)=>{ if(e.key.length===1&&document.activeElement!==inputRef.current) inputRef.current?.focus(); };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  },[step]);

  useEffect(()=>{
    if(step!=="success"&&step!=="co-success") return;
    setCountdown(5);
    const iv=setInterval(()=>setCountdown(n=>{ if(n<=1){clearInterval(iv);reset();return 0;} return n-1; }),1000);
    return ()=>clearInterval(iv);
  },[step]);

  useEffect(()=>{
    if(found) return;
    const q=query.trim().toLowerCase();
    if(!q){setResults([]);setShowNone(false);return;}
    const r=students.filter(s=>
      s.full_name.toLowerCase().includes(q)||
      s.student_number.toLowerCase().includes(q)||
      s.student_number.replace(/\D/g,"").includes(q.replace(/\D/g,""))
    ).slice(0,5);
    setResults(r); setShowNone(q.length>1&&r.length===0);
  },[query,students,found]);

  function reset(){setStep("search");setQuery("");setResults([]);setFound(null);setReason("");setSession(null);setCheckinTime("");setShowNone(false);}

  function selectStudent(s:TRIOStudent){
    const sess=activities.find(a=>a.student_id===s.id&&!a.check_out_time)??null;
    setFound(s); setSession(sess); setQuery(s.full_name); setResults([]); setShowNone(false);
    setStep(sess?"already-in":"found");
  }

  const handleKeyDown = useCallback((e:React.KeyboardEvent<HTMLInputElement>)=>{
    if(e.key!=="Enter") return; e.preventDefault();
    if(results.length===1){selectStudent(results[0]);return;}
    if(results.length>1){const ex=results.find(s=>s.student_number.toLowerCase()===query.trim().toLowerCase());if(ex)selectStudent(ex);}
  },[results,query]);

  async function doCheckIn(){
    if(!found||!reason) return;
    const now=new Date();
    setCheckinTime(now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true}));
    const appt=meetings.find(m=>m.student_id===found.id);
    const evt=!appt?(events[0]??null):null;
    await createActivity({student_id:found.id,student_name:found.full_name,activity_type:"Walk-In Advising",check_in_time:now.toISOString(),location:"TRIO Office (Kiosk)",notes:reason,meeting_id:appt?.id,event_id:evt?.id});
    setStep("success");
  }

  async function doCheckOut(){
    if(!found) return;
    if(session){const m=differenceInMinutes(new Date(),new Date(session.check_in_time));await updateActivity(session.id,{check_out_time:new Date().toISOString(),duration_minutes:Math.max(1,m)});}
    setStep("co-success");
  }

  function getDuration(){
    if(!session) return "—";
    const m=differenceInMinutes(new Date(),new Date(session.check_in_time));
    if(m<1) return "<1 min";
    const h=Math.floor(m/60),mn=m%60;
    if(h===0) return `${m} min`;
    if(mn===0) return `${h}h`;
    return `${h}h ${mn}m`;
  }

  function getSessionTime(){
    if(!session) return "—";
    return new Date(session.check_in_time).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true});
  }

  const page: React.CSSProperties = {minHeight:"100vh",background:BG,fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',system-ui,sans-serif",color:TEXT,position:"relative",overflow:"hidden"};
  const hasDropdown = results.length>0||showNone;

  // Shared top bar
  const topBar = (right?: React.ReactNode) => (
    <div style={{position:"absolute",top:0,left:0,right:0,display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"24px 40px",zIndex:10}}>
      <LiveClock lang={lang}/>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <LangToggle lang={lang} set={setLang}/>
        {right}
      </div>
    </div>
  );

  const homeBtn = (
    <button onClick={reset}
      style={{background:"transparent",border:`1px solid ${BORDER}`,borderRadius:8,color:SUB,fontSize:10,cursor:"pointer",padding:"6px 14px",fontFamily:"inherit",letterSpacing:".1em",transition:"all .14s"}}
      onMouseEnter={e=>{e.currentTarget.style.color=TEXT;e.currentTarget.style.borderColor=BORDER2;}}
      onMouseLeave={e=>{e.currentTarget.style.color=SUB;e.currentTarget.style.borderColor=BORDER;}}>
      HOME
    </button>
  );

  // ══════════════════════════════════════════════════════════════
  // SCREEN 1 — SEARCH
  // ══════════════════════════════════════════════════════════════
  if(step==="search") return (
    <div style={page}>
      <KioskStyles/>
      <GoldParticles/>
      {topBar()}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 640px 440px at 50% 50%,rgba(212,175,55,0.035) 0%,transparent 70%)",pointerEvents:"none",zIndex:2}}/>

      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"110px 24px 80px",position:"relative",zIndex:3}}>
        <div style={{width:"100%",maxWidth:480,display:"flex",flexDirection:"column",alignItems:"center"}} className="ki-in">

          {/* Logo */}
          <div style={{marginBottom:20,opacity:.9,animation:"ki-logo 5s ease-in-out infinite"}}>
            <TrioLogo size={88}/>
          </div>

          {/* Red accent rule */}
          <div style={{width:44,height:2,background:RED,borderRadius:1,marginBottom:24,opacity:.8}}/>

          {/* Wordmark */}
          <h1 style={{fontSize:46,fontWeight:300,color:TEXT,letterSpacing:".22em",margin:"0 0 10px",textAlign:"center",lineHeight:1,textTransform:"uppercase" as const}}>
            TRIO CONNECT
          </h1>
          <p style={{fontSize:11,color:SUB2,letterSpacing:".14em",margin:"0 0 4px",textAlign:"center"}}>
            {c.tagline}
          </p>
          <p style={{fontSize:9,color:"rgba(212,175,55,.38)",letterSpacing:".2em",margin:"0 0 52px",textAlign:"center"}}>
            {c.powered}
          </p>

          {/* Input */}
          <div style={{width:"100%",position:"relative"}}>
            {/* person icon */}
            <div style={{position:"absolute",left:18,top:"50%",transform:hasDropdown?"translateY(calc(-50% - 0px))":"translateY(-50%)",pointerEvents:"none",zIndex:1,transition:"transform .1s"}}>
              {hasDropdown
                ? <div style={{position:"absolute",left:0,top:-36,transform:"none"}}>
                    <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" size={18} color="rgba(212,175,55,.55)"/>
                  </div>
                : <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" size={18} color="rgba(212,175,55,.55)"/>
              }
            </div>
            <input
              ref={inputRef}
              autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
              className="ki-input"
              value={query}
              onChange={e=>{setQuery(e.target.value); if(found){setFound(null);setReason("");}}}
              onKeyDown={handleKeyDown}
              placeholder={c.placeholder}
              style={{width:"100%",boxSizing:"border-box" as const,height:72,background:CARD,border:`1px solid ${GOLD_E}`,borderRadius:hasDropdown?"14px 14px 0 0":14,padding:"0 50px 0 50px",fontSize:18,color:TEXT,outline:"none",fontFamily:"inherit",fontWeight:300,letterSpacing:".01em",boxShadow:"0 4px 32px rgba(0,0,0,.6)"}}
            />
            {query.length>0&&(
              <button onClick={()=>{setFound(null);setQuery("");setResults([]);setShowNone(false);setTimeout(()=>inputRef.current?.focus(),60);}}
                style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:SUB,fontSize:13,cursor:"pointer",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",fontFamily:"inherit",transition:"color .12s"}}
                onMouseEnter={e=>{e.currentTarget.style.color=TEXT;}}
                onMouseLeave={e=>{e.currentTarget.style.color=SUB;}}>✕</button>
            )}

            {/* Results */}
            {results.length>0&&(
              <div style={{background:CARD,border:`1px solid ${GOLD_E}`,borderTop:"none",borderRadius:"0 0 14px 14px",overflow:"hidden"}}>
                {results.map((s,i)=>(
                  <button key={s.id} className="ki-result" onClick={()=>selectStudent(s)}
                    style={{width:"100%",background:"transparent",border:"none",padding:"15px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",textAlign:"left" as const,borderTop:i>0?`1px solid ${BORDER}`:"none",fontFamily:"inherit",transition:"background .1s"}}>
                    <div>
                      <p style={{fontSize:16,fontWeight:500,color:TEXT,margin:0,letterSpacing:"-.01em"}}>{s.full_name}</p>
                      <p style={{fontSize:11,color:SUB,margin:"3px 0 0",letterSpacing:".04em"}}>{s.student_number}</p>
                    </div>
                    <span style={{fontSize:9,fontWeight:700,color:s.enrollment_status==="active"?"#4ADE80":"#F87171",textTransform:"uppercase" as const,letterSpacing:".1em"}}>
                      {s.enrollment_status}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {showNone&&(
              <div style={{background:CARD,border:`1px solid ${GOLD_E}`,borderTop:"none",borderRadius:"0 0 14px 14px",padding:"15px 20px"}}>
                <p style={{color:SUB,fontSize:14,margin:0}}>{c.noStudent}</p>
              </div>
            )}
          </div>

          {/* Scan hint */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:16,color:SUB,fontSize:12,letterSpacing:".04em"}}>
            <Icon path="M3 10h18M3 14h18m-9-9v18M5.5 3A2.5 2.5 0 003 5.5v13A2.5 2.5 0 005.5 21h13a2.5 2.5 0 002.5-2.5v-13A2.5 2.5 0 0018.5 3h-13z" size={14} color={SUB}/>
            {c.scanHint}
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // SCREEN 2 — STUDENT + REASONS
  // ══════════════════════════════════════════════════════════════
  if(step==="found"&&found) return (
    <div style={page}>
      <KioskStyles/>
      <GoldParticles/>
      {topBar(homeBtn)}

      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"100px 24px 60px",position:"relative",zIndex:3}}>
        <div style={{width:"100%",maxWidth:660}} className="ki-up">

          {/* Student card */}
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:18,padding:"24px 28px",marginBottom:28}}>
            <div style={{height:1,background:GOLD_G,marginBottom:20}}/>
            <div style={{display:"flex",alignItems:"center",gap:20}}>
              <Avatar name={found.full_name} size={72}/>
              <div style={{flex:1,minWidth:0}}>
                <h2 style={{fontSize:30,fontWeight:600,color:TEXT,letterSpacing:"-.02em",margin:"0 0 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{found.full_name}</h2>
                <p style={{fontSize:12,color:SUB,letterSpacing:".05em",margin:"0 0 14px"}}>{found.student_number}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 20px"}}>
                  {[
                    [c.program, found.program??   "TRIO SSS"],
                    [c.campus,  found.work_location??"CT State"],
                    [c.advisor, found.advisor_name??"—"],
                  ].map(([label,value])=>(
                    <div key={label}>
                      <p style={{fontSize:8.5,color:SUB,letterSpacing:".14em",textTransform:"uppercase" as const,margin:"0 0 2px"}}>{label}</p>
                      <p style={{fontSize:12,color:SUB2,margin:0}}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reason section */}
          <p style={{fontSize:9,color:SUB,letterSpacing:".22em",textTransform:"uppercase" as const,margin:"0 0 14px"}}>
            {c.whyHere}
          </p>

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
            {reasons.map(r=>(
              <ReasonCard key={r.id} reason={r} active={reason===r.id} onClick={()=>setReason(reason===r.id?"":r.id)}/>
            ))}
          </div>

          {/* Action — CHECK IN only (student isn't checked in; already-in handled by separate screen) */}
          {reason&&(
            <button onClick={()=>setStep("confirm")}
              style={{width:"100%",height:58,background:gBdr(BG),border:"1.5px solid transparent",borderRadius:14,color:GOLD,fontSize:11,fontWeight:600,letterSpacing:".16em",cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 0 28px rgba(212,175,55,.15)";}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";}}>
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
  if(step==="confirm"&&found) return (
    <div style={page}>
      <KioskStyles/>
      <GoldParticles/>
      {topBar(homeBtn)}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 560px 380px at 50% 50%,rgba(193,18,31,0.04) 0%,transparent 70%)",pointerEvents:"none",zIndex:2}}/>

      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"100px 24px",position:"relative",zIndex:3}}>
        <div style={{width:"100%",maxWidth:460}} className="ki-up">

          <p style={{fontSize:9,fontWeight:600,color:SUB,letterSpacing:".26em",textTransform:"uppercase" as const,margin:"0 0 18px"}}>
            {c.checkingFor}
          </p>

          {/* Reason — hero */}
          <h2 style={{fontSize:52,fontWeight:600,color:RED,letterSpacing:"-.02em",lineHeight:1,margin:"0 0 36px"}}>
            {reason}
          </h2>

          <StudentMini student={found}/>

          <HR/>
          <div style={{height:8}}/>
          <HR/>

          {/* THE button */}
          <button onClick={doCheckIn}
            style={{width:"100%",height:68,marginTop:28,background:RED,border:"none",borderRadius:14,color:TEXT,fontSize:14,fontWeight:700,letterSpacing:".2em",cursor:"pointer",fontFamily:"inherit",transition:"all .2s",boxShadow:"0 8px 36px rgba(193,18,31,.28)"}}
            onMouseEnter={e=>{e.currentTarget.style.opacity=".88";e.currentTarget.style.boxShadow="0 12px 48px rgba(193,18,31,.38)";}}
            onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.boxShadow="0 8px 36px rgba(193,18,31,.28)";}}>
            {c.checkIn}
          </button>

          <button onClick={()=>setStep("found")}
            style={{display:"block",margin:"16px auto 0",background:"transparent",border:"none",color:SUB,fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:".06em",transition:"color .12s"}}
            onMouseEnter={e=>{e.currentTarget.style.color=TEXT;}}
            onMouseLeave={e=>{e.currentTarget.style.color=SUB;}}>
            ← {c.cancel}
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // ALREADY CHECKED IN → CHECK OUT
  // ══════════════════════════════════════════════════════════════
  if(step==="already-in"&&found) return (
    <div style={page}>
      <KioskStyles/>
      <GoldParticles/>
      {topBar(homeBtn)}

      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"100px 24px",position:"relative",zIndex:3}}>
        <div style={{width:"100%",maxWidth:480}} className="ki-up">

          <p style={{fontSize:9,fontWeight:600,color:SUB,letterSpacing:".26em",textTransform:"uppercase" as const,margin:"0 0 10px"}}>
            {c.alreadyIn}
          </p>

          <h2 style={{fontSize:44,fontWeight:600,color:TEXT,letterSpacing:"-.02em",lineHeight:1,margin:"0 0 28px"}}>
            {found.full_name}
          </h2>

          <HR/>

          {/* Session info */}
          <div style={{padding:"24px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
            {[
              [c.checkedInAt, getSessionTime()],
              [c.duration,    getDuration()],
              [c.visit,       session?.notes??"—"],
            ].map(([label,value])=>(
              <div key={label}>
                <p style={{fontSize:9,color:SUB,letterSpacing:".18em",textTransform:"uppercase" as const,margin:"0 0 6px"}}>{label}</p>
                <p style={{fontSize:22,fontWeight:400,color:TEXT,margin:0,letterSpacing:"-.01em"}}>{value}</p>
              </div>
            ))}
          </div>

          <HR/>

          <button onClick={doCheckOut}
            style={{width:"100%",height:68,marginTop:28,background:gBdr(BG),border:"1.5px solid transparent",borderRadius:14,color:GOLD,fontSize:14,fontWeight:600,letterSpacing:".2em",cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 0 36px rgba(212,175,55,.18)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";}}>
            {c.checkOut}
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // SUCCESS — CHECK-IN
  // ══════════════════════════════════════════════════════════════
  if(step==="success"&&found) return (
    <div style={page}>
      <KioskStyles/>
      <GoldParticles/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 580px 420px at 50% 46%,rgba(212,175,55,0.04) 0%,transparent 68%)",pointerEvents:"none",zIndex:2}}/>

      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative",zIndex:3}}>
        <div style={{width:"100%",maxWidth:400,textAlign:"center" as const}} className="ki-up">

          <div style={{display:"flex",justifyContent:"center",marginBottom:28}}>
            <GoldCheck/>
          </div>

          <h2 style={{fontSize:40,fontWeight:300,color:TEXT,letterSpacing:".12em",textTransform:"uppercase" as const,margin:"0 0 2px"}}>
            {c.successLine1}
          </h2>
          <h2 style={{fontSize:40,fontWeight:700,color:TEXT,letterSpacing:".12em",textTransform:"uppercase" as const,margin:"0 0 36px"}}>
            {c.successLine2}
          </h2>

          <HR/>

          <div style={{padding:"24px 0",display:"flex",flexDirection:"column",gap:16}}>
            {[
              ["Name",      found.full_name],
              [c.visit,     reason],
              [c.advisor,   found.advisor_name??"—"],
              ["Location",  c.location],
              ["Time",      checkinTime],
            ].map(([label,value])=>(
              <div key={label} style={{display:"flex",justifyContent:"space-between",gap:16}}>
                <span style={{fontSize:11,color:SUB,letterSpacing:".06em",textTransform:"uppercase" as const}}>{label}</span>
                <span style={{fontSize:13,fontWeight:500,color:"rgba(255,255,255,.78)",textAlign:"right" as const}}>{value}</span>
              </div>
            ))}
          </div>

          <HR/>

          <p style={{fontSize:16,fontWeight:300,color:SUB2,letterSpacing:".06em",margin:"24px 0 32px"}}>
            {c.haveGreat}
          </p>

          {/* Countdown */}
          <div style={{height:1,background:BORDER,borderRadius:1,overflow:"hidden",marginBottom:8}}>
            <div style={{height:"100%",background:GOLD_G,width:`${(countdown/5)*100}%`,transition:"width 1s linear"}}/>
          </div>
          <p style={{fontSize:9,color:"rgba(255,255,255,.14)",letterSpacing:".1em"}}>
            {c.returning} {countdown}s
          </p>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // CO-SUCCESS — CHECK-OUT
  // ══════════════════════════════════════════════════════════════
  if(step==="co-success"&&found) return (
    <div style={page}>
      <KioskStyles/>
      <GoldParticles/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 580px 420px at 50% 46%,rgba(212,175,55,0.04) 0%,transparent 68%)",pointerEvents:"none",zIndex:2}}/>

      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative",zIndex:3}}>
        <div style={{width:"100%",maxWidth:400,textAlign:"center" as const}} className="ki-up">

          <div style={{display:"flex",justifyContent:"center",marginBottom:28}}>
            <GoldCheck/>
          </div>

          <h2 style={{fontSize:40,fontWeight:300,color:TEXT,letterSpacing:".12em",textTransform:"uppercase" as const,margin:"0 0 2px"}}>
            {c.coLine1}
          </h2>
          <h2 style={{fontSize:40,fontWeight:700,color:TEXT,letterSpacing:".12em",textTransform:"uppercase" as const,margin:"0 0 36px"}}>
            {c.coLine2}
          </h2>

          <HR/>

          <div style={{padding:"24px 0",display:"flex",flexDirection:"column",gap:16}}>
            {[
              ["Name",      found.full_name],
              [c.checkOutAt,new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true})],
              [c.visitLen,  getDuration()],
            ].map(([label,value])=>(
              <div key={label} style={{display:"flex",justifyContent:"space-between",gap:16}}>
                <span style={{fontSize:11,color:SUB,letterSpacing:".06em",textTransform:"uppercase" as const}}>{label}</span>
                <span style={{fontSize:13,fontWeight:500,color:"rgba(255,255,255,.78)",textAlign:"right" as const}}>{value}</span>
              </div>
            ))}
          </div>

          <HR/>

          <p style={{fontSize:16,fontWeight:300,color:SUB2,letterSpacing:".06em",margin:"24px 0 32px"}}>
            {c.seeYou}
          </p>

          <div style={{height:1,background:BORDER,borderRadius:1,overflow:"hidden",marginBottom:8}}>
            <div style={{height:"100%",background:GOLD_G,width:`${(countdown/5)*100}%`,transition:"width 1s linear"}}/>
          </div>
          <p style={{fontSize:9,color:"rgba(255,255,255,.14)",letterSpacing:".1em"}}>
            {c.returning} {countdown}s
          </p>
        </div>
      </div>
    </div>
  );

  return null;
}
