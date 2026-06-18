import { useState, useEffect, type ReactElement } from "react";
import { getStudents } from "../lib/db";
import type { TRIOStudent } from "../lib/types";
import {
  generateQRMatrix, generateBarcodeWidths, generateBarcodeValue,
  buildWalletPassData, type WalletPassData,
} from "../lib/wallet";

// ─── Design tokens ──────────────────────────────────────────────
const BG     = "#050505";
const CARD   = "#111111";
const CARD2  = "#181818";
const TEXT   = "#FFFFFF";
const SUB    = "#A1A1A1";
const DIM    = "rgba(255,255,255,0.18)";
const RED    = "#C1121F";
const GREEN  = "#22C55E";
const GOLD   = "#D4AF37";
const GOLD_G = "linear-gradient(135deg, #B8860B 0%, #D4AF37 38%, #F8E7A1 72%, #FFF3C4 100%)";
const GOLD_B = "rgba(212,175,55,0.30)";
const GOLD_F = "rgba(212,175,55,0.06)";
const BDR    = "#2A2A2A";

// ─── QR SVG ────────────────────────────────────────────────────
function QRCode({ studentNumber, size = 72, color = TEXT }: { studentNumber: string; size?: number; color?: string }) {
  const matrix = generateQRMatrix(studentNumber);
  const cell = size / 21;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      {matrix.map((row, r) =>
        row.map((on, c) => on ? (
          <rect key={`${r}-${c}`} x={c * cell + 0.4} y={r * cell + 0.4}
            width={cell - 0.8} height={cell - 0.8} rx={cell * 0.1} fill={color} />
        ) : null)
      )}
    </svg>
  );
}

// ─── Barcode SVG ───────────────────────────────────────────────
function Barcode({ studentNumber, width = 180, height = 36, color = TEXT }: { studentNumber: string; width?: number; height?: number; color?: string }) {
  const bars = generateBarcodeWidths(studentNumber);
  const total = bars.reduce((a, b) => a + b, 0);
  let x = 0;
  const rects: ReactElement[] = [];
  bars.forEach((w, i) => { if (i % 2 === 0) rects.push(<rect key={i} x={x} y={0} width={w} height={height} fill={color} />); x += w; });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${total} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
      {rects}
    </svg>
  );
}

// ─── Avatar ────────────────────────────────────────────────────
function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hues = [0, 220, 270, 155, 28];
  const h = hues[name.charCodeAt(0) % hues.length];
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: `hsl(${h},55%,26%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)" }}>
      <span style={{ fontSize: size * 0.36, fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>{initials}</span>
    </div>
  );
}

// ─── ID Card Front — Portrait 240×380 ─────────────────────────
function IDFront({ student }: { student: TRIOStudent }) {
  const statusColor = student.enrollment_status === "active" ? GREEN : RED;
  const issueYear   = new Date(student.enrollment_date).getFullYear();
  const expYear     = issueYear + 4;
  return (
    <div style={{
      width: 240, height: 380, borderRadius: 18, overflow: "hidden", position: "relative",
      background: "linear-gradient(175deg, #111111 0%, #0A0A0A 100%)",
      border: `1.5px solid ${GOLD_B}`,
      boxShadow: "0 0 0 0.5px rgba(0,0,0,0.8), 0 28px 80px rgba(0,0,0,0.75)",
      flexShrink: 0,
    }}>
      {/* Gold border line — top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2.5, background: GOLD_G }} />
      {/* Gold border line — left */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 2.5, background: GOLD_G }} />
      {/* Gold border line — bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2.5, background: GOLD_G }} />
      {/* Gold border line — right */}
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 2.5, background: GOLD_G }} />

      {/* Subtle red accent — top right */}
      <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(193,18,31,0.07)", pointerEvents: "none" }} />

      {/* Grid texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize: "18px 18px", pointerEvents: "none" }} />

      {/* Content */}
      <div style={{ position: "absolute", inset: "12px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

        {/* Header: TRIO mark + program name */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: RED, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <p style={{ fontSize: 8.5, fontWeight: 800, color: TEXT, letterSpacing: "0.04em", lineHeight: 1 }}>TRIO CONNECT</p>
          </div>
          <span style={{ fontSize: 7, fontWeight: 700, color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}40`, borderRadius: 10, padding: "2px 7px", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
            {student.enrollment_status}
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: BDR, marginBottom: 14 }} />

        {/* Photo area */}
        <div style={{ marginBottom: 12 }}>
          <Avatar name={student.full_name} size={68} />
        </div>

        {/* Name */}
        <p style={{ fontSize: 14, fontWeight: 900, color: TEXT, letterSpacing: "-0.02em", textAlign: "center", lineHeight: 1.2, marginBottom: 3, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {student.full_name}
        </p>
        <p style={{ fontSize: 8, color: SUB, letterSpacing: "0.12em", textTransform: "uppercase" as const, textAlign: "center", marginBottom: 14 }}>
          Student ID Card
        </p>

        {/* Info rows */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {[
            ["ID", student.student_number],
            ["Advisor", student.advisor_name ?? "Unassigned"],
            ["Campus", student.work_location ?? "CT State"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 7.5, color: SUB, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{label}</span>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: "rgba(255,255,255,0.82)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ width: "100%", height: 1, background: BDR, marginBottom: 14 }} />

        {/* QR code */}
        <div style={{ background: "#ffffff", borderRadius: 8, padding: 5, boxShadow: "0 4px 16px rgba(0,0,0,0.5)", marginBottom: 10 }}>
          <QRCode studentNumber={student.student_number} size={60} color="#000000" />
        </div>

        {/* Powered by + expiry */}
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
          <p style={{ fontSize: 6.5, fontWeight: 600, background: GOLD_G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never, letterSpacing: "0.08em" }}>
            Powered by Nova Systems
          </p>
          <p style={{ fontSize: 6.5, color: DIM, letterSpacing: "0.06em" }}>
            EXP {expYear}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── ID Card Back — Portrait 240×380 ──────────────────────────
function IDBack({ student }: { student: TRIOStudent }) {
  const barcodeVal = generateBarcodeValue(student);
  const issueYear  = new Date(student.enrollment_date).getFullYear();
  const expYear    = issueYear + 4;
  return (
    <div style={{
      width: 240, height: 380, borderRadius: 18, overflow: "hidden", position: "relative",
      background: "linear-gradient(175deg, #0D0D0D 0%, #121212 100%)",
      border: `1.5px solid ${GOLD_B}`,
      boxShadow: "0 0 0 0.5px rgba(0,0,0,0.8), 0 28px 80px rgba(0,0,0,0.75)",
      flexShrink: 0,
    }}>
      {/* Gold border */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2.5, background: GOLD_G }} />
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 2.5, background: GOLD_G }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2.5, background: GOLD_G }} />
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 2.5, background: GOLD_G }} />

      {/* Magnetic stripe */}
      <div style={{ position: "absolute", top: 30, left: 0, right: 0, height: 30, background: "linear-gradient(90deg, #1c1c1c 0%, #222 50%, #1c1c1c 100%)" }} />

      <div style={{ position: "absolute", inset: "12px 12px", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 44 }}>

        {/* Large QR */}
        <div style={{ background: "#ffffff", borderRadius: 10, padding: 7, boxShadow: "0 8px 24px rgba(0,0,0,0.6)", marginBottom: 16 }}>
          <QRCode studentNumber={student.student_number} size={88} color="#000000" />
        </div>

        <p style={{ fontSize: 7, fontWeight: 700, color: GOLD, letterSpacing: "0.18em", textTransform: "uppercase" as const, marginBottom: 16 }}>
          Scan For Attendance
        </p>

        {/* Info */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
          {[
            ["Student ID", student.student_number],
            ["Program Status", student.enrollment_status],
            ["Issue Date", `${issueYear}`],
            ["Expiration", `${expYear}`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 7, color: SUB, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{label}</span>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: "rgba(255,255,255,0.78)", textTransform: "capitalize" as const }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ width: "100%", height: 1, background: BDR, marginBottom: 12 }} />

        {/* Barcode */}
        <Barcode studentNumber={student.student_number} width={190} height={40} color="rgba(255,255,255,0.65)" />
        <p style={{ fontSize: 7, color: DIM, letterSpacing: "0.06em", fontFamily: "monospace", marginTop: 4, marginBottom: "auto" }}>
          {barcodeVal}
        </p>

        {/* Footer */}
        <p style={{ fontSize: 6.5, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase" as const, textAlign: "center", marginTop: 10 }}>
          Property of TRIO Connect
        </p>
      </div>
    </div>
  );
}

// ─── Card grid item ────────────────────────────────────────────
function IDCardItem({ student, onClick }: { student: TRIOStudent; onClick: () => void }) {
  const [h, setH] = useState(false);
  const statusColor = student.enrollment_status === "active" ? GREEN : student.enrollment_status === "inactive" ? RED : "#F59E0B";
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: h ? CARD2 : CARD, border: `1px solid ${h ? GOLD_B : BDR}`, borderRadius: 14, overflow: "hidden", cursor: "pointer", transform: h ? "translateY(-2px)" : "", boxShadow: h ? "0 16px 48px rgba(0,0,0,0.55)" : "0 4px 16px rgba(0,0,0,0.3)", transition: "all 0.18s" }}>
      <div style={{ height: 2, background: GOLD_G }} />
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Avatar name={student.full_name} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>{student.full_name}</p>
            <p style={{ fontSize: 11, color: SUB, marginTop: 2 }}>{student.student_number}</p>
          </div>
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase" as const, padding: "3px 8px", borderRadius: 20, background: `${statusColor}18`, color: statusColor, flexShrink: 0, letterSpacing: "0.05em" }}>
            {student.enrollment_status}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ fontSize: 7.5, color: DIM, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 4 }}>
              {student.program ?? "TRIO SSS"} · Exp {new Date(student.enrollment_date).getFullYear() + 4}
            </p>
            <Barcode studentNumber={student.student_number} width={120} height={18} color="rgba(255,255,255,0.18)" />
          </div>
          <QRCode studentNumber={student.student_number} size={42} color="rgba(255,255,255,0.35)" />
        </div>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BDR}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 8, color: DIM }}>CT State Community College</p>
          <p style={{ fontSize: 8, fontWeight: 700, background: GOLD_G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never }}>
            TRIO Connect
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Apple Wallet preview ──────────────────────────────────────
function AppleWalletPreview({ student }: { student: TRIOStudent }) {
  const initials = student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: 320, borderRadius: 20, background: "linear-gradient(160deg, #1C1C1E 0%, #111827 100%)", border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>CT State Community College</p>
        <p style={{ fontSize: 10, fontWeight: 700, background: GOLD_G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never }}>TRIO Connect</p>
      </div>
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(193,18,31,0.15)", border: "1px solid rgba(193,18,31,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: RED }}>{initials}</span>
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>{student.full_name}</p>
            <p style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>Student ID</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 0", marginBottom: 18 }}>
          {[["Student ID", student.student_number], ["Advisor", student.advisor_name ?? "Unassigned"], ["Program", student.program ?? "TRIO SSS"], ["Campus", student.work_location ?? "CT State"]].map(([label, val]) => (
            <div key={label}>
              <p style={{ fontSize: 9, color: "#8E8E93", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#EBEBF5" }}>{val}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <Barcode studentNumber={student.student_number} width={140} height={36} color="rgba(255,255,255,0.7)" />
            <p style={{ fontSize: 9, color: "#8E8E93", marginTop: 4 }}>{generateBarcodeValue(student)}</p>
          </div>
          <QRCode studentNumber={student.student_number} size={60} color="rgba(255,255,255,0.85)" />
        </div>
      </div>
      <div style={{ padding: "8px 20px 14px" }}>
        <p style={{ fontSize: 9, color: "#48484A", textAlign: "center" }}>Exp. {new Date(student.enrollment_date).getFullYear() + 4} · TRIO SSS</p>
      </div>
    </div>
  );
}

// ─── Full ID Modal ─────────────────────────────────────────────
function FullIDModal({ student, onClose }: { student: TRIOStudent; onClose: () => void }) {
  const [face, setFace] = useState<"front" | "back">("front");
  const [walletTab, setWalletTab] = useState<"card" | "apple">("card");
  const [walletMsg, setWalletMsg] = useState(false);
  const passData: WalletPassData = buildWalletPassData(student);
  const statusColor = student.enrollment_status === "active" ? GREEN : RED;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#0D0D0D", borderRadius: 22, border: `1px solid ${GOLD_B}`, maxWidth: 820, width: "100%", position: "relative", boxShadow: "0 40px 120px rgba(0,0,0,0.9)", overflowY: "auto", maxHeight: "92vh" }}>
        <div style={{ height: 3, background: GOLD_G, borderRadius: "22px 22px 0 0" }} />
        <button onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.06)", border: "none", color: SUB, fontSize: 14, cursor: "pointer", width: 30, height: 30, borderRadius: "50%", zIndex: 1, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ✕
        </button>

        <div style={{ padding: "28px 32px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <Avatar name={student.full_name} size={60} />
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: "-0.03em" }}>{student.full_name}</h2>
              <p style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{student.email ?? "No email on file"}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: GOLD_F, color: GOLD, border: `1px solid ${GOLD_B}` }}>{student.program ?? "TRIO SSS"}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${statusColor}15`, color: statusColor, textTransform: "capitalize" as const }}>{student.enrollment_status}</span>
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <p style={{ fontSize: 10, color: SUB }}>Expires</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>{new Date(student.enrollment_date).getFullYear() + 4}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 2, background: CARD, borderRadius: 10, padding: 3, marginBottom: 24, width: "fit-content" }}>
            {(["card", "apple"] as const).map((t) => (
              <button key={t} onClick={() => setWalletTab(t)}
                style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: walletTab === t ? CARD2 : "transparent", color: walletTab === t ? TEXT : SUB, fontSize: 12, fontWeight: walletTab === t ? 700 : 400, fontFamily: "inherit", transition: "all 0.1s" }}>
                {t === "card" ? "ID Card" : "Apple Wallet"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 32px 32px" }}>
          {walletTab === "card" && (
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "start" }}>
              <div>
                <div style={{ display: "flex", gap: 6, marginBottom: 14, justifyContent: "center" }}>
                  {(["front", "back"] as const).map((f) => (
                    <button key={f} onClick={() => setFace(f)}
                      style={{ padding: "5px 18px", borderRadius: 8, border: `1px solid ${face === f ? GOLD_B : BDR}`, background: face === f ? GOLD_F : "transparent", color: face === f ? GOLD : SUB, fontSize: 11, fontWeight: face === f ? 700 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s", letterSpacing: "0.04em", textTransform: "capitalize" as const }}>
                      {f}
                    </button>
                  ))}
                </div>
                {face === "front" ? <IDFront student={student} /> : <IDBack student={student} />}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => window.print()}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: RED, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Print ID
                  </button>
                  <button onClick={() => setWalletTab("apple")}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: GOLD_F, border: `1px solid ${GOLD_B}`, color: GOLD, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Add to Wallet
                  </button>
                </div>
              </div>

              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {[
                    ["Student ID", student.student_number],
                    ["Advisor", student.advisor_name ?? "Unassigned"],
                    ["Campus", student.work_location ?? "CT State"],
                    ["Major", student.major ?? "Undecided"],
                    ["Enrolled", student.enrollment_date],
                    ["Expires", `${new Date(student.enrollment_date).getFullYear() + 4}`],
                    ["Program", student.program ?? "TRIO SSS"],
                    ["Status", student.enrollment_status],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: "#0A0A0A", borderRadius: 10, padding: "10px 14px", border: `1px solid ${BDR}` }}>
                      <p style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: SUB, marginBottom: 4 }}>{label}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#0A0A0A", border: `1px solid ${BDR}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ textAlign: "center" }}>
                    <QRCode studentNumber={student.student_number} size={80} color={TEXT} />
                    <p style={{ fontSize: 8, color: SUB, marginTop: 6 }}>Scan to Verify</p>
                  </div>
                  <div style={{ width: 1, height: 80, background: BDR }} />
                  <div style={{ textAlign: "center" }}>
                    <Barcode studentNumber={student.student_number} width={160} height={50} color="rgba(255,255,255,0.65)" />
                    <p style={{ fontSize: 8, color: SUB, marginTop: 6, fontFamily: "monospace" }}>{student.student_number}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {walletTab === "apple" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
              <div>
                <AppleWalletPreview student={student} />
                <button onClick={() => setWalletMsg(true)}
                  style={{ width: "100%", marginTop: 14, padding: "14px", borderRadius: 12, background: "#000", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Add to Apple Wallet
                </button>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 10 }}>Pass Architecture</p>
                <div style={{ background: "#050505", borderRadius: 12, padding: "16px", fontFamily: "monospace", fontSize: 11, color: "#4ADE80", lineHeight: 1.7, maxHeight: 360, overflowY: "auto", border: `1px solid ${BDR}` }}>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {JSON.stringify(passData.apple, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {walletMsg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
          onClick={() => setWalletMsg(false)}>
          <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BDR}`, padding: "40px 44px", maxWidth: 480, textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,0.9)" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: TEXT, marginBottom: 12 }}>Apple Wallet Integration</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 6 }}>
              Apple Wallet requires a server-side Apple Developer certificate and PKPass signing service.
            </p>
            <p style={{ fontSize: 13, color: SUB, lineHeight: 1.6, marginBottom: 24 }}>
              The pass architecture is fully built. Contact your system administrator to enable native wallet support with signing credentials.
            </p>
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, padding: "10px 16px", marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>Pass data complete · QR generated · Barcode generated</p>
            </div>
            <button onClick={() => setWalletMsg(false)}
              style={{ padding: "11px 32px", borderRadius: 10, background: RED, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────
export default function IDCenterPage() {
  const [students, setStudents]         = useState<TRIOStudent[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [selected, setSelected]         = useState<TRIOStudent | null>(null);
  const [verifyInput, setVerifyInput]   = useState("");
  const [verifyResult, setVerifyResult] = useState<TRIOStudent | null | "not_found">(null);
  const [tab, setTab]                   = useState<"directory" | "verify">("directory");

  useEffect(() => { getStudents().then((s) => { setStudents(s); setLoading(false); }); }, []);

  const filtered = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_number.toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleVerify() {
    if (!verifyInput.trim()) return;
    const lower = verifyInput.toLowerCase();
    const match = students.find((s) =>
      s.student_number.toLowerCase().includes(lower) ||
      s.full_name.toLowerCase().includes(lower) ||
      s.id.toLowerCase().includes(lower)
    );
    setVerifyResult(match ?? "not_found");
  }

  const activeCount = students.filter((s) => s.enrollment_status === "active").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: "-0.03em" }}>Digital IDs</h1>
          <p style={{ fontSize: 13, color: SUB, marginTop: 4 }}>Student ID cards with QR code, barcode, and Apple Wallet architecture.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>{activeCount}</p>
          <p style={{ fontSize: 11, color: SUB }}>active · of {students.length} total</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, background: CARD, borderRadius: 11, padding: "4px", width: "fit-content" }}>
        {(["directory", "verify"] as const).map((id) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === id ? CARD2 : "transparent", color: tab === id ? TEXT : SUB, fontSize: 13, fontWeight: tab === id ? 700 : 400, fontFamily: "inherit", transition: "all 0.12s" }}>
            {id === "directory" ? "ID Directory" : "Verify ID"}
          </button>
        ))}
      </div>

      {/* Directory */}
      {tab === "directory" && (
        <>
          <div style={{ position: "relative", maxWidth: 380 }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={SUB} strokeWidth={2}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID…"
              style={{ width: "100%", background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: "9px 12px 9px 34px", fontSize: 13, color: TEXT, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s" }}
              onFocus={(e) => { e.target.style.borderColor = GOLD_B; }}
              onBlur={(e)  => { e.target.style.borderColor = BDR; }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: SUB, fontSize: 13 }}>Generating digital IDs…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                {students.length === 0 ? "No Students Enrolled" : "No Students Found"}
              </p>
              <p style={{ fontSize: 13, color: SUB }}>
                {students.length === 0 ? "Add students to generate digital ID cards." : "Try a different name or ID number."}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {filtered.map((s) => <IDCardItem key={s.id} student={s} onClick={() => setSelected(s)} />)}
            </div>
          )}
        </>
      )}

      {/* Verify */}
      {tab === "verify" && (
        <div style={{ maxWidth: 540 }}>
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BDR}`, padding: "28px" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 6 }}>ID Verification Portal</p>
            <p style={{ fontSize: 12, color: SUB, marginBottom: 22 }}>Enter a student ID number or full name to verify TRIO enrollment status.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={verifyInput}
                onChange={(e) => { setVerifyInput(e.target.value); setVerifyResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="Student ID or full name…"
                style={{ flex: 1, background: BG, border: `1px solid ${BDR}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: TEXT, outline: "none", fontFamily: "inherit" }}
                onFocus={(e) => { e.target.style.borderColor = GOLD_B; }}
                onBlur={(e)  => { e.target.style.borderColor = BDR; }}
              />
              <button onClick={handleVerify}
                style={{ padding: "10px 22px", borderRadius: 10, background: RED, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Verify
              </button>
            </div>

            {verifyResult && (
              <div style={{ marginTop: 22 }}>
                {verifyResult === "not_found" ? (
                  <div style={{ background: "rgba(193,18,31,0.08)", border: "1px solid rgba(193,18,31,0.2)", borderRadius: 12, padding: "18px 20px", display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 20, color: RED, fontWeight: 700 }}>✕</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#F87171" }}>Not Found</p>
                      <p style={{ fontSize: 12, color: SUB }}>No matching student in the TRIO program database.</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: 12, padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: 20, color: GREEN, fontWeight: 700 }}>✓</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>Verified — Active TRIO Student</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      {[["Name", verifyResult.full_name], ["ID", verifyResult.student_number], ["Status", verifyResult.enrollment_status], ["Campus", verifyResult.work_location ?? "CT State"], ["Advisor", verifyResult.advisor_name ?? "Unassigned"], ["Program", verifyResult.program ?? "TRIO SSS"]].map(([label, value]) => (
                        <div key={label}>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: SUB, marginBottom: 2 }}>{label}</p>
                          <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, textTransform: "capitalize" as const }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setSelected(verifyResult as TRIOStudent)}
                      style={{ padding: "8px 18px", borderRadius: 9, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: GREEN, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      View Full ID Card
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: 14, background: GOLD_F, border: `1px solid ${GOLD_B}`, borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ fontSize: 12, color: SUB }}>For authorized TRIO staff and administrators only. All verification events are audit-logged.</p>
          </div>
        </div>
      )}

      {selected && <FullIDModal student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
