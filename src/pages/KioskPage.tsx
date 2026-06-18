import { useState, useEffect, useRef, useCallback } from "react";
import {
  getStudents, getActivities, createActivity, updateActivity,
  getMeetings, getEvents,
} from "../lib/db";
import type { TRIOStudent, Activity, Meeting, TRIOEvent } from "../lib/types";
import { differenceInMinutes } from "date-fns";

// ─── Tokens ───────────────────────────────────────────────────────
const BG      = "#050505";
const CARD    = "#0E0E0E";
const CARD2   = "#141414";
const BORDER  = "rgba(255,255,255,0.08)";
const TEXT    = "#FFFFFF";
const GRAY    = "#999999";
const GRAY2   = "#666666";
const RED     = "#C1121F";
const RED_DIM = "rgba(193,18,31,0.12)";
const RED_BDR = "rgba(193,18,31,0.45)";
const GOLD    = "#D4AF37";
const GOLD_G  = "linear-gradient(135deg,#B8860B 0%,#D4AF37 42%,#F8E7A1 78%,#FFF4C7 100%)";
const GOLD_E  = "rgba(212,175,55,0.26)";

// ─── Reasons ──────────────────────────────────────────────────────
interface Reason { id: string; label: string; icon: string }
const R_EN: Reason[] = [
  {id:"Academic Advising",  label:"Academic\nAdvising",   icon:"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"},
  {id:"Appointment",        label:"Appointment",          icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"},
  {id:"Study Session",      label:"Study\nSession",       icon:"M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"},
  {id:"Workshop",           label:"Workshop",             icon:"M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"},
  {id:"FAFSA Assistance",   label:"FAFSA\nAssistance",    icon:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"},
  {id:"Transfer Services",  label:"Transfer\nServices",   icon:"M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"},
  {id:"Career Services",    label:"Career\nServices",     icon:"M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"},
  {id:"Computer Lab",       label:"Computer\nLab",        icon:"M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"},
  {id:"Event",              label:"Event",                icon:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"},
  {id:"General Visit",      label:"General\nVisit",       icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"},
  {id:"Other",              label:"Other",                icon:"M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"},
];
const R_ES: Reason[] = [
  {id:"Academic Advising",  label:"Asesoría\nAcadémica",  icon:R_EN[0].icon},
  {id:"Appointment",        label:"Cita\nProgramada",     icon:R_EN[1].icon},
  {id:"Study Session",      label:"Sesión de\nEstudio",   icon:R_EN[2].icon},
  {id:"Workshop",           label:"Taller",               icon:R_EN[3].icon},
  {id:"FAFSA Assistance",   label:"Ayuda\nFAFSA",         icon:R_EN[4].icon},
  {id:"Transfer Services",  label:"Servicios de\nTransferencia", icon:R_EN[5].icon},
  {id:"Career Services",    label:"Servicios de\nCarrera", icon:R_EN[6].icon},
  {id:"Computer Lab",       label:"Lab de\nCómputo",      icon:R_EN[7].icon},
  {id:"Event",              label:"Evento",               icon:R_EN[8].icon},
  {id:"General Visit",      label:"Visita\nGeneral",      icon:R_EN[9].icon},
  {id:"Other",              label:"Otro",                 icon:R_EN[10].icon},
];

// ─── Copy ─────────────────────────────────────────────────────────
const T = {
  en: {
    tagline:"Student Success Platform", powered:"POWERED BY NOVA SYSTEMS",
    placeholder:"Enter Name or Student ID", scanHint:"Scan Student ID",
    whyHere:"WHY ARE YOU HERE TODAY?",
    checkingFor:"YOU ARE CHECKING IN FOR",
    checkIn:"CHECK IN", checkOut:"CHECK OUT", cancel:"cancel",
    noResult:"No student found.",
    successA:"SUCCESSFULLY", successB:"CHECKED IN",
    coA:"SUCCESSFULLY", coB:"CHECKED OUT",
    haveGreat:"Have a Great Day", seeYou:"See You Soon",
    checkingOut:"YOU ARE CHECKING OUT",
    advisor:"ADVISOR", program:"PROGRAM", campus:"CAMPUS",
    checkedInAt:"CHECKED IN", visit:"VISIT", duration:"DURATION",
    checkOutAt:"CHECKED OUT", visitLen:"VISIT DURATION",
    returning:"Returning in",
  },
  es: {
    tagline:"Plataforma para el Éxito Estudiantil", powered:"DESARROLLADO POR NOVA SYSTEMS",
    placeholder:"Nombre o Número de Estudiante", scanHint:"Escanear Tarjeta",
    whyHere:"¿POR QUÉ ESTÁ AQUÍ HOY?",
    checkingFor:"ESTÁ REGISTRÁNDOSE PARA",
    checkIn:"REGISTRARSE", checkOut:"MARCAR SALIDA", cancel:"cancelar",
    noResult:"Estudiante no encontrado.",
    successA:"REGISTRO", successB:"COMPLETADO",
    coA:"SALIDA", coB:"COMPLETADA",
    haveGreat:"Que Tenga un Buen Día", seeYou:"Hasta Pronto",
    checkingOut:"ESTÁ MARCANDO SALIDA",
    advisor:"ASESOR", program:"PROGRAMA", campus:"CAMPUS",
    checkedInAt:"ENTRADA", visit:"VISITA", duration:"DURACIÓN",
    checkOutAt:"SALIDA", visitLen:"DURACIÓN DE VISITA",
    returning:"Regresando en",
  },
} as const;

type Lang = "en"|"es";
type Step = "search"|"found"|"confirm"|"already-in"|"success"|"co-success";

// ─── Styles ───────────────────────────────────────────────────────
function KS() {
  return (
    <style>{`
      @keyframes ks-up  { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
      @keyframes ks-in  { from{opacity:0}to{opacity:1} }
      @keyframes ks-logo{ 0%,100%{filter:drop-shadow(0 0 8px rgba(212,175,55,.25))} 50%{filter:drop-shadow(0 0 18px rgba(212,175,55,.45))} }
      .ks-up   { animation:ks-up .36s ease both }
      .ks-in   { animation:ks-in .28s ease both }
      .ks-logo { animation:ks-logo 4s ease-in-out infinite }
      .ks-inp  { transition:border-color .15s,box-shadow .15s; border:1px solid rgba(212,175,55,.22)!important; }
      .ks-inp:focus { border-color:rgba(212,175,55,.6)!important; box-shadow:0 0 0 3px rgba(212,175,55,.08),0 6px 32px rgba(0,0,0,.7)!important; outline:none; }
      .ks-row:hover  { background:${CARD2}!important; }
      .ks-card:hover { background:${CARD2}!important; border-color:rgba(255,255,255,.14)!important; }
      .ks-ghost:hover{ border-color:rgba(212,175,55,.5)!important; color:${GOLD}!important; }
    `}</style>
  );
}

// ─── Particles ────────────────────────────────────────────────────
type PD={x:number;y:number;r:number;vx:number;vy:number;a:number;da:number};
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const cv=ref.current; if(!cv) return;
    const ctx=cv.getContext("2d"); if(!ctx) return;
    const rz=()=>{cv.width=window.innerWidth;cv.height=window.innerHeight;};
    rz(); window.addEventListener("resize",rz);
    const pts:PD[]=Array.from({length:38},()=>({
      x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,
      r:Math.random()*.7+.2,vx:(Math.random()-.5)*.12,vy:-(Math.random()*.2+.04),
      a:Math.random()*.1+.02,da:(Math.random()-.5)*.0004,
    }));
    let raf:number;
    const tick=()=>{
      ctx.clearRect(0,0,cv.width,cv.height);
      pts.forEach(p=>{
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(212,175,55,${Math.max(.01,Math.min(.12,p.a))})`;
        ctx.fill();
        p.x+=p.vx;p.y+=p.vy;p.a+=p.da;
        if(p.y<-5){p.y=cv.height+5;p.x=Math.random()*cv.width;}
        if(p.x<-5)p.x=cv.width+5; if(p.x>cv.width+5)p.x=-5;
      });
      raf=requestAnimationFrame(tick);
    };
    tick();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",rz);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1}}/>;
}

// ─── Logo ─────────────────────────────────────────────────────────
function Logo({size=72}:{size?:number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" className="ks-logo">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6B4C00"/>
          <stop offset="30%"  stopColor="#B8860B"/>
          <stop offset="58%"  stopColor="#D4AF37"/>
          <stop offset="84%"  stopColor="#F8E7A1"/>
          <stop offset="100%" stopColor="#FFF4C7"/>
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="52" height="52" stroke="url(#lg)" strokeWidth="1.1"/>
      {/* corner marks */}
      <line x1="3"  y1="10" x2="10" y2="10" stroke="url(#lg)" strokeWidth=".8"/>
      <line x1="10" y1="3"  x2="10" y2="10" stroke="url(#lg)" strokeWidth=".8"/>
      <line x1="62" y1="3"  x2="62" y2="10" stroke="url(#lg)" strokeWidth=".8"/>
      <line x1="62" y1="10" x2="69" y2="10" stroke="url(#lg)" strokeWidth=".8"/>
      <line x1="3"  y1="62" x2="10" y2="62" stroke="url(#lg)" strokeWidth=".8"/>
      <line x1="10" y1="62" x2="10" y2="69" stroke="url(#lg)" strokeWidth=".8"/>
      <line x1="62" y1="62" x2="69" y2="62" stroke="url(#lg)" strokeWidth=".8"/>
      <line x1="62" y1="62" x2="62" y2="69" stroke="url(#lg)" strokeWidth=".8"/>
      {/* TRIO three-line mark */}
      <line x1="20" y1="28" x2="52" y2="28" stroke="url(#lg)" strokeWidth=".95"/>
      <line x1="20" y1="36" x2="52" y2="36" stroke="url(#lg)" strokeWidth=".95"/>
      <line x1="20" y1="44" x2="52" y2="44" stroke="url(#lg)" strokeWidth=".95"/>
      <line x1="20" y1="25" x2="20" y2="31" stroke="url(#lg)" strokeWidth=".7"/>
      <line x1="20" y1="33" x2="20" y2="39" stroke="url(#lg)" strokeWidth=".7"/>
      <line x1="20" y1="41" x2="20" y2="47" stroke="url(#lg)" strokeWidth=".7"/>
    </svg>
  );
}

// ─── Gold checkmark ───────────────────────────────────────────────
function Check() {
  return (
    <svg width={88} height={88} viewBox="0 0 88 88" fill="none">
      <defs>
        <linearGradient id="ck" x1="0" y1="0" x2="88" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#B8860B"/>
          <stop offset="50%"  stopColor="#D4AF37"/>
          <stop offset="100%" stopColor="#F8E7A1"/>
        </linearGradient>
      </defs>
      <circle cx="44" cy="44" r="40" stroke="url(#ck)" strokeWidth="1.2"/>
      <path d="M28 44 L38 54 L60 32" stroke="url(#ck)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────
function Av({name,sz=68}:{name:string;sz?:number}) {
  const ini=name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const hs=[0,215,265,155,25];
  return (
    <div style={{width:sz,height:sz,borderRadius:"50%",background:`hsl(${hs[name.charCodeAt(0)%hs.length]},32%,18%)`,border:`1.5px solid rgba(255,255,255,0.1)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <span style={{fontSize:sz*.28,fontWeight:600,color:"rgba(255,255,255,.82)"}}>{ini}</span>
    </div>
  );
}

// ─── Clock ────────────────────────────────────────────────────────
function Clock({lang}:{lang:Lang}) {
  const [n,sn]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>sn(new Date()),1000);return()=>clearInterval(t);},[]);
  const lc=lang==="es"?"es-US":"en-US";
  return (
    <div>
      <p style={{fontSize:32,fontWeight:300,color:TEXT,letterSpacing:".01em",margin:"0 0 4px",fontVariantNumeric:"tabular-nums",lineHeight:1}}>
        {n.toLocaleTimeString(lc,{hour:"numeric",minute:"2-digit",hour12:true})}
      </p>
      <p style={{fontSize:11,color:GRAY2,letterSpacing:".03em",margin:0}}>
        {n.toLocaleDateString(lc,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
      </p>
    </div>
  );
}

// ─── Lang toggle ──────────────────────────────────────────────────
function Lang({lang,set}:{lang:Lang;set:(l:Lang)=>void}) {
  return (
    <div style={{display:"flex",border:`1px solid ${BORDER}`,borderRadius:7,overflow:"hidden"}}>
      {(["en","es"] as const).map((l,i)=>(
        <button key={l} onClick={()=>set(l)}
          style={{background:lang===l?"rgba(255,255,255,.07)":"transparent",border:"none",borderLeft:i>0?`1px solid ${BORDER}`:"none",color:lang===l?TEXT:GRAY2,fontSize:11,fontWeight:lang===l?600:400,letterSpacing:".1em",cursor:"pointer",padding:"6px 13px",fontFamily:"inherit",transition:"all .13s"}}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ─── SVG icon ─────────────────────────────────────────────────────
function Ic({d,sz=18,c="currentColor"}:{d:string;sz?:number;c?:string}) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      <path d={d}/>
    </svg>
  );
}

// ─── Divider ──────────────────────────────────────────────────────
function HR({my=0}:{my?:number}) {
  return <div style={{height:1,background:BORDER,margin:`${my}px 0`}}/>;
}

// ══════════════════════════════════════════════════════════════════
export default function KioskPage() {
  const [lang,sLang]=useState<Lang>("en");
  const [step,sStep]=useState<Step>("search");
  const [students,sSts]=useState<TRIOStudent[]>([]);
  const [acts,sActs]   =useState<Activity[]>([]);
  const [mtgs,sMtgs]   =useState<Meeting[]>([]);
  const [evts,sEvts]   =useState<TRIOEvent[]>([]);
  const [q,sQ]         =useState("");
  const [res,sRes]     =useState<TRIOStudent[]>([]);
  const [found,sFound] =useState<TRIOStudent|null>(null);
  const [reason,sReason]=useState("");
  const [sess,sSess]   =useState<Activity|null>(null);
  const [cd,sCd]       =useState(5);
  const [ciTime,sCiTime]=useState("");
  const [noRes,sNoRes] =useState(false);

  const inp=useRef<HTMLInputElement>(null);
  const today=new Date().toISOString().split("T")[0];
  const c=T[lang];
  const reasons=lang==="es"?R_ES:R_EN;

  useEffect(()=>{
    Promise.all([getStudents(),getActivities(),getMeetings(),getEvents()]).then(([s,a,m,e])=>{
      sSts(s);
      sActs(a.filter(x=>x.check_in_time.startsWith(today)));
      sMtgs(m.filter(x=>x.meeting_date===today&&x.status==="Scheduled"));
      sEvts(e.filter(x=>x.event_date===today&&x.is_active));
    });
  },[today]);

  useEffect(()=>{
    if(step==="search"){sQ("");sRes([]);sFound(null);sNoRes(false);sReason("");setTimeout(()=>inp.current?.focus(),80);}
  },[step]);

  useEffect(()=>{
    if(step!=="search") return;
    const h=(e:KeyboardEvent)=>{if(e.key.length===1&&document.activeElement!==inp.current)inp.current?.focus();};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[step]);

  useEffect(()=>{
    if(step!=="success"&&step!=="co-success") return;
    sCd(5);
    const iv=setInterval(()=>sCd(n=>{if(n<=1){clearInterval(iv);reset();return 0;}return n-1;}),1000);
    return()=>clearInterval(iv);
  },[step]);

  useEffect(()=>{
    if(found) return;
    const qv=q.trim().toLowerCase();
    if(!qv){sRes([]);sNoRes(false);return;}
    const r=students.filter(s=>
      s.full_name.toLowerCase().includes(qv)||
      s.student_number.toLowerCase().includes(qv)||
      s.student_number.replace(/\D/g,"").includes(qv.replace(/\D/g,""))
    ).slice(0,5);
    sRes(r);sNoRes(qv.length>1&&r.length===0);
  },[q,students,found]);

  function reset(){sStep("search");sQ("");sRes([]);sFound(null);sReason("");sSess(null);sCiTime("");sNoRes(false);}

  function pick(s:TRIOStudent){
    const active=acts.find(a=>a.student_id===s.id&&!a.check_out_time)??null;
    sFound(s);sSess(active);sQ(s.full_name);sRes([]);sNoRes(false);sReason("");
    sStep("found");
  }

  const onKey=useCallback((e:React.KeyboardEvent<HTMLInputElement>)=>{
    if(e.key!=="Enter") return; e.preventDefault();
    if(res.length===1){pick(res[0]);return;}
    if(res.length>1){const ex=res.find(s=>s.student_number.toLowerCase()===q.trim().toLowerCase());if(ex)pick(ex);}
  },[res,q]);

  async function doCI(){
    if(!found||!reason) return;
    const now=new Date();
    sCiTime(now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true}));
    const appt=mtgs.find(m=>m.student_id===found.id);
    const evt=!appt?(evts[0]??null):null;
    await createActivity({student_id:found.id,student_name:found.full_name,activity_type:"Walk-In Advising",check_in_time:now.toISOString(),location:"TRIO Office (Kiosk)",notes:reason,meeting_id:appt?.id,event_id:evt?.id});
    sStep("success");
  }

  async function doCO(){
    if(!found) return;
    if(sess){const m=differenceInMinutes(new Date(),new Date(sess.check_in_time));await updateActivity(sess.id,{check_out_time:new Date().toISOString(),duration_minutes:Math.max(1,m)});}
    sStep("co-success");
  }

  function dur(){
    if(!sess) return "—";
    const m=differenceInMinutes(new Date(),new Date(sess.check_in_time));
    if(m<1) return "<1 min";
    const h=Math.floor(m/60),mn=m%60;
    return h===0?`${m} min`:mn===0?`${h} hr`:`${h} hr ${mn} min`;
  }

  function sessTime(){
    if(!sess) return "—";
    return new Date(sess.check_in_time).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true});
  }

  const pg:React.CSSProperties={minHeight:"100vh",background:BG,fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',system-ui,sans-serif",color:TEXT,position:"relative",overflow:"hidden"};
  const hasD=res.length>0||noRes;

  function TopBar({right}:{right?:React.ReactNode}) {
    return (
      <div style={{position:"absolute",top:0,left:0,right:0,display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"22px 36px",zIndex:10}}>
        <Clock lang={lang}/>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <Lang lang={lang} set={sLang}/>
          {right}
        </div>
      </div>
    );
  }

  const HomeBtn=(
    <button onClick={reset} className="ks-ghost"
      style={{background:"transparent",border:`1px solid ${BORDER}`,borderRadius:7,color:GRAY2,fontSize:10,cursor:"pointer",padding:"6px 13px",fontFamily:"inherit",letterSpacing:".1em",transition:"all .13s"}}>
      HOME
    </button>
  );

  // ── SEARCH ────────────────────────────────────────────────────
  if(step==="search") return (
    <div style={pg}>
      <KS/><Particles/>
      <TopBar/>
      {/* warm ambient glow */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 800px 560px at 50% 42%,rgba(180,110,12,0.07) 0%,transparent 65%)",pointerEvents:"none",zIndex:2}}/>

      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"110px 24px 80px",position:"relative",zIndex:3}}>
        <div style={{width:"100%",maxWidth:440,display:"flex",flexDirection:"column",alignItems:"center"}} className="ks-in">

          <Logo size={72}/>

          <div style={{width:40,height:2,background:RED,borderRadius:1,margin:"18px 0 22px",opacity:.8}}/>

          <h1 style={{fontSize:42,fontWeight:400,color:TEXT,letterSpacing:".2em",margin:"0 0 10px",textAlign:"center",lineHeight:1,textTransform:"uppercase" as const}}>
            TRIO CONNECT
          </h1>
          <p style={{fontSize:11,color:GRAY,letterSpacing:".12em",margin:"0 0 5px",textAlign:"center"}}>{c.tagline}</p>
          <p style={{fontSize:9,color:"rgba(212,175,55,.38)",letterSpacing:".18em",margin:"0 0 48px",textAlign:"center"}}>{c.powered}</p>

          {/* input */}
          <div style={{width:"100%",position:"relative"}}>
            <div style={{position:"absolute",left:16,top:"50%",transform:hasD?"translateY(-200%)":"translateY(-50%)",pointerEvents:"none",zIndex:1,transition:"transform .15s"}}>
              {!hasD&&<Ic d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" sz={18} c="rgba(212,175,55,.5)"/>}
            </div>
            {/* always-visible icon when no dropdown */}
            {!hasD&&<div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",zIndex:1}}>
              <Ic d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" sz={18} c="rgba(212,175,55,.5)"/>
            </div>}
            <input ref={inp} autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
              className="ks-inp"
              value={q}
              onChange={e=>{sQ(e.target.value);if(found){sFound(null);sReason("");}}}
              onKeyDown={onKey}
              placeholder={c.placeholder}
              style={{width:"100%",boxSizing:"border-box" as const,height:64,background:CARD,border:`1px solid ${GOLD_E}`,borderRadius:hasD?"13px 13px 0 0":13,padding:"0 46px 0 48px",fontSize:17,color:TEXT,outline:"none",fontFamily:"inherit",fontWeight:300,letterSpacing:".01em",boxShadow:"0 4px 28px rgba(0,0,0,.55)"}}
            />
            {q.length>0&&(
              <button onClick={()=>{sFound(null);sQ("");sRes([]);sNoRes(false);setTimeout(()=>inp.current?.focus(),50);}}
                style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:GRAY2,fontSize:13,cursor:"pointer",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",transition:"color .12s"}}
                onMouseEnter={e=>{e.currentTarget.style.color=TEXT;}}
                onMouseLeave={e=>{e.currentTarget.style.color=GRAY2;}}>✕</button>
            )}

            {res.length>0&&(
              <div style={{background:CARD,border:`1px solid ${GOLD_E}`,borderTop:"none",borderRadius:"0 0 13px 13px",overflow:"hidden"}}>
                {res.map((s,i)=>(
                  <button key={s.id} className="ks-row" onClick={()=>pick(s)}
                    style={{width:"100%",background:"transparent",border:"none",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",textAlign:"left" as const,borderTop:i>0?`1px solid ${BORDER}`:"none",fontFamily:"inherit",transition:"background .1s"}}>
                    <div>
                      <p style={{fontSize:15,fontWeight:500,color:TEXT,margin:0,letterSpacing:"-.01em"}}>{s.full_name}</p>
                      <p style={{fontSize:11,color:GRAY2,margin:"3px 0 0",letterSpacing:".04em"}}>{s.student_number}</p>
                    </div>
                    <span style={{fontSize:9,fontWeight:700,color:s.enrollment_status==="active"?"#4ADE80":"#F87171",textTransform:"uppercase" as const,letterSpacing:".1em"}}>{s.enrollment_status}</span>
                  </button>
                ))}
              </div>
            )}
            {noRes&&(
              <div style={{background:CARD,border:`1px solid ${GOLD_E}`,borderTop:"none",borderRadius:"0 0 13px 13px",padding:"14px 18px"}}>
                <p style={{color:GRAY,fontSize:14,margin:0}}>{c.noResult}</p>
              </div>
            )}
          </div>

          {/* scan hint */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:14,color:GRAY2,fontSize:12,letterSpacing:".04em"}}>
            <Ic d="M3 10h18M3 14h18m-9-9v18" sz={14} c={GRAY2}/>
            {c.scanHint}
          </div>
        </div>
      </div>
    </div>
  );

  // ── FOUND — student card + reasons ────────────────────────────
  if(step==="found"&&found) return (
    <div style={pg}>
      <KS/><Particles/>
      <TopBar right={HomeBtn}/>

      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"96px 24px 56px",position:"relative",zIndex:3}}>
        <div style={{width:"100%",maxWidth:660}} className="ks-up">

          {/* Student card */}
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:"22px 26px",marginBottom:24}}>
            <div style={{height:1,background:GOLD_G,marginBottom:18}}/>
            <div style={{display:"flex",alignItems:"center",gap:18}}>
              <Av name={found.full_name} sz={72}/>
              <div style={{flex:1,minWidth:0}}>
                <h2 style={{fontSize:28,fontWeight:700,color:TEXT,letterSpacing:"-.02em",margin:"0 0 3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {found.full_name}
                </h2>
                <p style={{fontSize:12,color:GRAY2,letterSpacing:".05em",margin:"0 0 12px"}}>{found.student_number}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px 16px"}}>
                  {[
                    [c.program, found.program??   "TRIO SSS"],
                    [c.campus,  found.work_location??"CT State"],
                    [c.advisor, found.advisor_name??"—"],
                  ].map(([lbl,val])=>(
                    <div key={lbl}>
                      <p style={{fontSize:8,color:GRAY2,letterSpacing:".14em",textTransform:"uppercase" as const,margin:"0 0 1px"}}>{lbl}</p>
                      <p style={{fontSize:12,color:GRAY,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reasons */}
          <p style={{fontSize:9,color:GRAY2,letterSpacing:".22em",textTransform:"uppercase" as const,margin:"0 0 12px"}}>
            {c.whyHere}
          </p>

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:18}}>
            {reasons.map(r=>{
              const on=reason===r.id;
              return (
                <button key={r.id} className={on?"":"ks-card"} onClick={()=>sReason(on?"":r.id)}
                  style={{height:84,background:on?RED_DIM:CARD,border:`1px solid ${on?RED_BDR:BORDER}`,borderRadius:11,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:7,transition:"all .12s",boxShadow:on?`0 0 14px ${RED_DIM}`:"none",padding:"8px 4px"}}>
                  <Ic d={r.icon} sz={18} c={on?"rgba(255,100,100,.9)":"rgba(255,255,255,.3)"}/>
                  <p style={{fontSize:10,fontWeight:on?600:400,color:on?"rgba(255,255,255,.9)":"rgba(255,255,255,.4)",margin:0,textAlign:"center",lineHeight:1.25,whiteSpace:"pre-line"}}>
                    {r.label}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={()=>reason&&sStep("confirm")}
              style={{height:54,background:reason?RED:"rgba(255,255,255,.04)",border:`1px solid ${reason?RED:"rgba(255,255,255,.1)"}`,borderRadius:12,color:reason?TEXT:"rgba(255,255,255,.25)",fontSize:13,fontWeight:700,letterSpacing:".14em",cursor:reason?"pointer":"default",fontFamily:"inherit",transition:"all .18s",boxShadow:reason?`0 6px 28px rgba(193,18,31,.28)`:"none"}}>
              {c.checkIn}
            </button>
            <button onClick={()=>sess&&sStep("already-in")} className={sess?"ks-ghost":""}
              style={{height:54,background:"transparent",border:`1px solid ${sess?GOLD_E:BORDER}`,borderRadius:12,color:sess?GOLD:"rgba(255,255,255,.18)",fontSize:13,fontWeight:sess?600:400,letterSpacing:".14em",cursor:sess?"pointer":"default",fontFamily:"inherit",transition:"all .18s"}}>
              {c.checkOut}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── CONFIRM check-in ──────────────────────────────────────────
  if(step==="confirm"&&found) return (
    <div style={pg}>
      <KS/><Particles/>
      <TopBar right={HomeBtn}/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 600px 400px at 50% 50%,rgba(193,18,31,0.05) 0%,transparent 68%)",pointerEvents:"none",zIndex:2}}/>

      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"96px 24px",position:"relative",zIndex:3}}>
        <div style={{width:"100%",maxWidth:440}} className="ks-up">

          <p style={{fontSize:9,color:GRAY2,letterSpacing:".24em",textTransform:"uppercase" as const,margin:"0 0 14px"}}>{c.checkingFor}</p>

          <h2 style={{fontSize:58,fontWeight:700,color:TEXT,letterSpacing:"-.02em",lineHeight:1.05,margin:"0 0 32px"}}>
            {reason}
          </h2>

          {/* student mini row */}
          <div style={{display:"flex",alignItems:"center",gap:14,background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:"14px 16px",marginBottom:28}}>
            <Av name={found.full_name} sz={40}/>
            <div>
              <p style={{fontSize:15,fontWeight:600,color:TEXT,margin:"0 0 2px",letterSpacing:"-.01em"}}>{found.full_name}</p>
              <p style={{fontSize:11,color:GRAY2,margin:0,letterSpacing:".04em"}}>{found.student_number}</p>
            </div>
          </div>

          <button onClick={doCI}
            style={{width:"100%",height:64,background:RED,border:"none",borderRadius:13,color:TEXT,fontSize:15,fontWeight:700,letterSpacing:".18em",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 8px 32px rgba(193,18,31,.28)",transition:"all .18s"}}
            onMouseEnter={e=>{e.currentTarget.style.opacity=".88";}}
            onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}>
            {c.checkIn}
            <Ic d="M13 7l5 5m0 0l-5 5m5-5H6" sz={18} c={TEXT}/>
          </button>

          <button onClick={()=>sStep("found")}
            style={{display:"block",margin:"14px auto 0",background:"transparent",border:"none",color:GRAY2,fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:".06em",transition:"color .12s"}}
            onMouseEnter={e=>{e.currentTarget.style.color=TEXT;}}
            onMouseLeave={e=>{e.currentTarget.style.color=GRAY2;}}>
            ← {c.cancel}
          </button>
        </div>
      </div>
    </div>
  );

  // ── ALREADY IN → checkout confirmation ────────────────────────
  if(step==="already-in"&&found) return (
    <div style={pg}>
      <KS/><Particles/>
      <TopBar right={HomeBtn}/>

      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"96px 24px",position:"relative",zIndex:3}}>
        <div style={{width:"100%",maxWidth:460}} className="ks-up">

          <p style={{fontSize:9,color:GRAY2,letterSpacing:".24em",textTransform:"uppercase" as const,margin:"0 0 10px"}}>{c.checkingOut}</p>

          <h2 style={{fontSize:44,fontWeight:700,color:TEXT,letterSpacing:"-.02em",margin:"0 0 28px"}}>{found.full_name}</h2>

          <HR/>

          <div style={{padding:"22px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px 32px"}}>
            {[
              [c.checkedInAt,  sessTime()],
              [c.duration,     dur()],
              [c.visit,        sess?.notes??"—"],
            ].map(([lbl,val])=>(
              <div key={lbl}>
                <p style={{fontSize:8.5,color:GRAY2,letterSpacing:".16em",textTransform:"uppercase" as const,margin:"0 0 5px"}}>{lbl}</p>
                <p style={{fontSize:20,fontWeight:500,color:TEXT,margin:0,letterSpacing:"-.01em"}}>{val}</p>
              </div>
            ))}
          </div>

          <HR/>

          <button onClick={doCO} className="ks-ghost"
            style={{width:"100%",height:64,marginTop:24,background:"transparent",border:`1px solid ${GOLD_E}`,borderRadius:13,color:GOLD,fontSize:15,fontWeight:600,letterSpacing:".18em",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"all .18s"}}>
            {c.checkOut}
            <Ic d="M13 7l5 5m0 0l-5 5m5-5H6" sz={18} c={GOLD}/>
          </button>
        </div>
      </div>
    </div>
  );

  // ── SUCCESS ───────────────────────────────────────────────────
  if(step==="success"&&found) return (
    <div style={pg}>
      <KS/><Particles/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 660px 460px at 50% 44%,rgba(180,110,12,0.07) 0%,transparent 65%)",pointerEvents:"none",zIndex:2}}/>

      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative",zIndex:3}}>
        <div style={{width:"100%",maxWidth:400,textAlign:"center" as const}} className="ks-up">

          <div style={{display:"flex",justifyContent:"center",marginBottom:24}}><Check/></div>

          <p style={{fontSize:11,color:GRAY,letterSpacing:".14em",textTransform:"uppercase" as const,margin:"0 0 2px"}}>{c.successA}</p>
          <h2 style={{fontSize:36,fontWeight:700,color:TEXT,letterSpacing:".1em",margin:"0 0 32px"}}>{c.successB}</h2>

          <HR/>

          <div style={{padding:"20px 0",display:"flex",flexDirection:"column",gap:14}}>
            {[
              ["Name",     found.full_name],
              [c.visit,    reason],
              [c.advisor,  found.advisor_name??"—"],
              ["Location", "TRIO Center"],
              ["Time",     ciTime],
            ].map(([lbl,val])=>(
              <div key={lbl} style={{display:"flex",justifyContent:"space-between",gap:16}}>
                <span style={{fontSize:11,color:GRAY2,letterSpacing:".06em",textTransform:"uppercase" as const}}>{lbl}</span>
                <span style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,.75)",textAlign:"right" as const}}>{val}</span>
              </div>
            ))}
          </div>

          <HR/>

          <p style={{fontSize:15,color:GRAY,letterSpacing:".05em",margin:"20px 0 28px"}}>{c.haveGreat}</p>

          <div style={{height:1,background:BORDER,borderRadius:1,overflow:"hidden",marginBottom:8}}>
            <div style={{height:"100%",background:GOLD_G,width:`${(cd/5)*100}%`,transition:"width 1s linear"}}/>
          </div>
          <p style={{fontSize:9,color:"rgba(255,255,255,.14)",letterSpacing:".1em"}}>{c.returning} {cd}s</p>
        </div>
      </div>
    </div>
  );

  // ── CO-SUCCESS ────────────────────────────────────────────────
  if(step==="co-success"&&found) return (
    <div style={pg}>
      <KS/><Particles/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 660px 460px at 50% 44%,rgba(180,110,12,0.07) 0%,transparent 65%)",pointerEvents:"none",zIndex:2}}/>

      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative",zIndex:3}}>
        <div style={{width:"100%",maxWidth:400,textAlign:"center" as const}} className="ks-up">

          <div style={{display:"flex",justifyContent:"center",marginBottom:24}}><Check/></div>

          <p style={{fontSize:11,color:GRAY,letterSpacing:".14em",textTransform:"uppercase" as const,margin:"0 0 2px"}}>{c.coA}</p>
          <h2 style={{fontSize:36,fontWeight:700,color:TEXT,letterSpacing:".1em",margin:"0 0 32px"}}>{c.coB}</h2>

          <HR/>

          <div style={{padding:"20px 0",display:"flex",flexDirection:"column",gap:14}}>
            {[
              ["Name",      found.full_name],
              [c.checkOutAt,new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true})],
              [c.visitLen,  dur()],
            ].map(([lbl,val])=>(
              <div key={lbl} style={{display:"flex",justifyContent:"space-between",gap:16}}>
                <span style={{fontSize:11,color:GRAY2,letterSpacing:".06em",textTransform:"uppercase" as const}}>{lbl}</span>
                <span style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,.75)",textAlign:"right" as const}}>{val}</span>
              </div>
            ))}
          </div>

          <HR/>

          <p style={{fontSize:15,color:GRAY,letterSpacing:".05em",margin:"20px 0 28px"}}>{c.seeYou}</p>

          <div style={{height:1,background:BORDER,borderRadius:1,overflow:"hidden",marginBottom:8}}>
            <div style={{height:"100%",background:GOLD_G,width:`${(cd/5)*100}%`,transition:"width 1s linear"}}/>
          </div>
          <p style={{fontSize:9,color:"rgba(255,255,255,.14)",letterSpacing:".1em"}}>{c.returning} {cd}s</p>
        </div>
      </div>
    </div>
  );

  return null;
}
