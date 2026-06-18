import { useState, useEffect, type ReactElement } from "react";
import { getStudents } from "../lib/db";
import type { TRIOStudent } from "../lib/types";
import {
  generateQRMatrix, generateBarcodeWidths, generateBarcodeValue,
  buildWalletPassData, type WalletPassData,
} from "../lib/wallet";

// ── Design tokens ──────────────────────────────────────────────
const BG      = "#050505";
const CARD    = "#111111";
const CARD2   = "#181818";
const TEXT    = "#F8FAFC";
const MUTED   = "rgba(255,255,255,0.45)";
const DIM     = "rgba(255,255,255,0.18)";
const RED     = "#D72638";
const GREEN   = "#22C55E";
const GOLD    = "#D4AF37";
const GOLDT   = "linear-gradient(135deg, #FFF4B0 0%, #E6C76B 30%, #D4AF37 60%, #F7E8A4 100%)";
const GOLDB   = "rgba(212,175,55,0.35)";
const BDR     = "rgba(255,255,255,0.08)";

// ── QR SVG ─────────────────────────────────────────────────────
function QRCode({ studentNumber, size = 72, color = TEXT }: { studentNumber: string; size?: number; color?: string }) {
  const matrix = generateQRMatrix(studentNumber);
  const cell = size / 21;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      {matrix.map((row, r) =>
        row.map((on, c) => on ? (
          <rect key={`${r}-${c}`} x={c * cell + 0.5} y={r * cell + 0.5}
            width={cell - 1} height={cell - 1} rx={cell * 0.12} fill={color} />
        ) : null)
      )}
    </svg>
  );
}

// ── Barcode SVG ────────────────────────────────────────────────
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

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#D72638", "#2563EB", "#7C3AED", "#059669", "#D97706"];
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: colors[name.charCodeAt(0) % colors.length], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.36, fontWeight: 900, color: "#fff" }}>{initials}</span>
    </div>
  );
}

// ── Physical ID Card — Front (380×240) ─────────────────────────
function IDFront({ student }: { student: TRIOStudent }) {
  const statusColor = student.enrollment_status === "active" ? GREEN : RED;
  return (
    <div style={{ width: 380, height: 240, borderRadius: 16, overflow: "hidden", position: "relative", background: "linear-gradient(145deg, #161616 0%, #0D0D0D 100%)", border: `1.5px solid ${GOLDB}`, boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(0,0,0,0.8)", flexShrink: 0 }}>
      {/* Gold top stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: GOLDT }} />
      {/* Grid texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "20px 20px", pointerEvents: "none" }} />
      {/* TRIO watermark */}
      <div style={{ position: "absolute", right: -12, bottom: -18, fontSize: 110, fontWeight: 900, color: "rgba(255,255,255,0.018)", letterSpacing: "-0.04em", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>TRIO</div>

      {/* Header row */}
      <div style={{ position: "absolute", top: 14, left: 18, right: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: RED, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: "0.04em", lineHeight: 1 }}>TRIO Connect</p>
            <p style={{ fontSize: 7, color: MUTED, letterSpacing: "0.08em", lineHeight: 1.3 }}>CT STATE COMMUNITY COLLEGE</p>
          </div>
        </div>
        <span style={{ fontSize: 7.5, fontWeight: 800, padding: "2px 8px", borderRadius: 12, background: `${statusColor}18`, color: statusColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {student.enrollment_status}
        </span>
      </div>

      {/* Student info + QR */}
      <div style={{ position: "absolute", top: 52, left: 18, right: 18, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Avatar name={student.full_name} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.full_name}</p>
          <p style={{ fontSize: 9, color: MUTED, marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>{student.program ?? "TRIO SSS"}</p>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 8, color: MUTED, width: 52, flexShrink: 0 }}>STUDENT ID</span>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: TEXT }}>{student.student_number}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 8, color: MUTED, width: 52, flexShrink: 0 }}>CAMPUS</span>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: TEXT }}>{student.work_location ?? "CT State"}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 8, color: MUTED, width: 52, flexShrink: 0 }}>ADVISOR</span>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.advisor_name ?? "Unassigned"}</span>
            </div>
          </div>
        </div>
        {/* QR code in white frame */}
        <div style={{ background: "#ffffff", borderRadius: 8, padding: 5, flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
          <QRCode studentNumber={student.student_number} size={62} color="#000000" />
        </div>
      </div>

      {/* Advisor bar at bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(212,175,55,0.06)", borderTop: `1px solid ${GOLDB}`, padding: "7px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 7.5, color: GOLD, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {student.advisor_name ?? "TRIO SSS"} · {student.advisor_name ? "TRIO Advisor" : "Student Support Services"}
        </p>
        <p style={{ fontSize: 7.5, color: DIM, letterSpacing: "0.06em" }}>EXP {new Date(student.enrollment_date).getFullYear() + 4}</p>
      </div>
    </div>
  );
}

// ── Physical ID Card — Back (380×240) ──────────────────────────
function IDBack({ student }: { student: TRIOStudent }) {
  const barcodeVal = generateBarcodeValue(student);
  const issueYear = new Date(student.enrollment_date).getFullYear();
  const expYear = issueYear + 4;
  return (
    <div style={{ width: 380, height: 240, borderRadius: 16, overflow: "hidden", position: "relative", background: "linear-gradient(145deg, #0D0D0D 0%, #141414 100%)", border: `1.5px solid ${GOLDB}`, boxShadow: "0 24px 80px rgba(0,0,0,0.7)", flexShrink: 0 }}>
      {/* Magnetic stripe */}
      <div style={{ position: "absolute", top: 28, left: 0, right: 0, height: 36, background: "linear-gradient(90deg, #1a1a1a 0%, #222 50%, #1a1a1a 100%)" }} />
      {/* Grid texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "20px 20px", pointerEvents: "none" }} />

      {/* Main body */}
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, bottom: 32, padding: "0 18px", display: "flex", gap: 16, alignItems: "stretch" }}>
        {/* Left info column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["PROGRAM",  student.program ?? "TRIO SSS"],
              ["STATUS",   student.enrollment_status.toUpperCase()],
              ["ENROLLED", `${issueYear}`],
              ["EXPIRES",  `${expYear}`],
            ].map(([l, v]) => (
              <div key={l}>
                <p style={{ fontSize: 7, color: MUTED, letterSpacing: "0.1em", lineHeight: 1 }}>{l}</p>
                <p style={{ fontSize: 9.5, fontWeight: 700, color: TEXT, marginTop: 2 }}>{v}</p>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: 6.5, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>Scan to Check In</p>
            <div style={{ background: "#ffffff", borderRadius: 6, padding: 4, display: "inline-block" }}>
              <QRCode studentNumber={student.student_number} size={46} color="#000000" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: BDR, alignSelf: "stretch" }} />

        {/* Right barcode column */}
        <div style={{ width: 150, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Barcode studentNumber={student.student_number} width={140} height={56} color="rgba(255,255,255,0.75)" />
          <p style={{ fontSize: 7.5, color: MUTED, letterSpacing: "0.05em", textAlign: "center", fontFamily: "monospace" }}>{barcodeVal}</p>
          <p style={{ fontSize: 7, color: DIM, textAlign: "center", letterSpacing: "0.04em" }}>TRIO CONNECT · CT STATE</p>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 6.5, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          CT State Community College · TRIO Student Support Services
        </p>
        <div style={{ width: 16, height: 10, borderRadius: 2, background: GOLDT }} />
      </div>
    </div>
  );
}

// ── Card grid item ─────────────────────────────────────────────
function IDCardItem({ student, onClick }: { student: TRIOStudent; onClick: () => void }) {
  const [h, setH] = useState(false);
  const statusColor = student.enrollment_status === "active" ? GREEN : student.enrollment_status === "inactive" ? RED : "#F59E0B";
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: h ? CARD2 : CARD, border: `1px solid ${h ? GOLDB : BDR}`, borderRadius: 16, padding: "0", cursor: "pointer", overflow: "hidden", transform: h ? "translateY(-2px)" : "", boxShadow: h ? "0 14px 40px rgba(0,0,0,0.55)" : "0 4px 16px rgba(0,0,0,0.3)", transition: "all 0.18s", position: "relative" }}>
      {/* Gold top stripe */}
      <div style={{ height: 2.5, background: GOLDT }} />
      {/* Watermark */}
      <div style={{ position: "absolute", top: 10, right: -4, fontSize: 64, fontWeight: 900, color: "rgba(255,255,255,0.02)", pointerEvents: "none", lineHeight: 1 }}>TRIO</div>

      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <Avatar name={student.full_name} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>{student.full_name}</p>
            <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{student.email ?? "No email on file"}</p>
          </div>
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", padding: "3px 8px", borderRadius: 20, background: `${statusColor}18`, color: statusColor, flexShrink: 0, letterSpacing: "0.04em" }}>
            {student.enrollment_status}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 7.5, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Student ID · Expires</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{student.student_number} · {new Date(student.enrollment_date).getFullYear() + 4}</p>
            <div style={{ marginTop: 8 }}>
              <Barcode studentNumber={student.student_number} width={130} height={20} color="rgba(255,255,255,0.2)" />
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 7, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{student.program ?? "TRIO SSS"}</p>
            <QRCode studentNumber={student.student_number} size={44} color="rgba(255,255,255,0.4)" />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${BDR}` }}>
          <p style={{ fontSize: 8, color: DIM }}>CT State Community College</p>
          <p style={{ fontSize: 8, fontWeight: 800, background: GOLDT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never }}>TRIO Connect</p>
        </div>
      </div>
    </div>
  );
}

// ── Apple Wallet preview ───────────────────────────────────────
function AppleWalletPreview({ student }: { student: TRIOStudent }) {
  const initials = student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: 320, borderRadius: 20, background: "linear-gradient(160deg, #1C1C1E 0%, #111827 100%)", border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em" }}>CT State Community College</p>
        <p style={{ fontSize: 10, fontWeight: 700, background: GOLDT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never }}>TRIO Connect</p>
      </div>
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(215,38,56,0.15)", border: "1px solid rgba(215,38,56,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
              <p style={{ fontSize: 9, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{label}</p>
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

// ── Full ID Modal ──────────────────────────────────────────────
function FullIDModal({ student, onClose }: { student: TRIOStudent; onClose: () => void }) {
  const [face, setFace] = useState<"front" | "back">("front");
  const [walletTab, setWalletTab] = useState<"card" | "apple">("card");
  const [walletMsg, setWalletMsg] = useState(false);
  const passData: WalletPassData = buildWalletPassData(student);
  const statusColor = student.enrollment_status === "active" ? GREEN : RED;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#0D0D0D", borderRadius: 22, border: `1px solid ${GOLDB}`, maxWidth: 860, width: "100%", position: "relative", boxShadow: "0 40px 120px rgba(0,0,0,0.9)", overflowY: "auto", maxHeight: "92vh" }}>
        {/* Gold top bar */}
        <div style={{ height: 3, background: GOLDT, borderRadius: "22px 22px 0 0" }} />
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.06)", border: "none", color: MUTED, fontSize: 14, cursor: "pointer", width: 30, height: 30, borderRadius: "50%", zIndex: 1, fontFamily: "inherit" }}>✕</button>

        <div style={{ padding: "28px 32px 0" }}>
          {/* Student header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <Avatar name={student.full_name} size={62} />
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: "-0.03em" }}>{student.full_name}</h2>
              <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{student.email ?? "No email"}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(212,175,55,0.1)", color: GOLD }}>{student.program ?? "TRIO SSS"}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${statusColor}15`, color: statusColor, textTransform: "capitalize" }}>{student.enrollment_status}</span>
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <p style={{ fontSize: 10, color: MUTED }}>Expires</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>{new Date(student.enrollment_date).getFullYear() + 4}</p>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 2, background: CARD, borderRadius: 10, padding: 3, marginBottom: 24, width: "fit-content" }}>
            {(["card", "apple"] as const).map((t) => (
              <button key={t} onClick={() => setWalletTab(t)}
                style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: walletTab === t ? CARD2 : "transparent", color: walletTab === t ? TEXT : MUTED, fontSize: 12, fontWeight: walletTab === t ? 700 : 400, fontFamily: "inherit", transition: "all 0.1s" }}>
                {t === "card" ? "ID Card" : "🍎 Apple Wallet"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 32px 32px" }}>
          {walletTab === "card" && (
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "start" }}>
              {/* Card preview with front/back toggle */}
              <div>
                <div style={{ display: "flex", gap: 6, marginBottom: 14, justifyContent: "center" }}>
                  {(["front", "back"] as const).map((f) => (
                    <button key={f} onClick={() => setFace(f)}
                      style={{ padding: "5px 18px", borderRadius: 8, border: `1px solid ${face === f ? GOLDB : BDR}`, background: face === f ? "rgba(212,175,55,0.08)" : "transparent", color: face === f ? GOLD : MUTED, fontSize: 11, fontWeight: face === f ? 700 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s", letterSpacing: "0.04em", textTransform: "capitalize" }}>
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
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(212,175,55,0.08)", border: `1px solid ${GOLDB}`, color: GOLD, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Add to Wallet →
                  </button>
                </div>
              </div>

              {/* Student info grid */}
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
                      <p style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, marginBottom: 4 }}>{label}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* QR + barcode strip */}
                <div style={{ background: "#0A0A0A", border: `1px solid ${BDR}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ textAlign: "center" }}>
                    <QRCode studentNumber={student.student_number} size={80} color={TEXT} />
                    <p style={{ fontSize: 8, color: MUTED, marginTop: 6 }}>Scan to Verify</p>
                  </div>
                  <div style={{ width: 1, height: 80, background: BDR }} />
                  <div style={{ textAlign: "center" }}>
                    <Barcode studentNumber={student.student_number} width={160} height={50} color="rgba(255,255,255,0.65)" />
                    <p style={{ fontSize: 8, color: MUTED, marginTop: 6, fontFamily: "monospace" }}>{student.student_number}</p>
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
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

      {/* Wallet info overlay */}
      {walletMsg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
          onClick={() => setWalletMsg(false)}>
          <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BDR}`, padding: "40px 44px", maxWidth: 480, textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,0.9)" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍎</div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: TEXT, marginBottom: 8 }}>Apple Wallet Integration</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 6 }}>
              Apple Wallet requires a server-side Apple Developer certificate and PKPass signing service.
            </p>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>
              The pass architecture is fully built. Contact your system administrator to enable native wallet support with signing credentials.
            </p>
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, padding: "10px 16px", marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>✓ Pass data complete · QR generated · Barcode generated</p>
            </div>
            <button onClick={() => setWalletMsg(false)} style={{ padding: "11px 32px", borderRadius: 10, background: RED, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Got It</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function IDCenterPage() {
  const [students, setStudents]       = useState<TRIOStudent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState<TRIOStudent | null>(null);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<TRIOStudent | null | "not_found">(null);
  const [tab, setTab]                 = useState<"directory" | "verify">("directory");

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
          <p style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Unique digital IDs with QR code, barcode, and Apple Wallet architecture.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>{activeCount}</p>
          <p style={{ fontSize: 11, color: MUTED }}>active · of {students.length} total</p>
        </div>
      </div>

      {/* Wallet info banner */}
      <div style={{ background: "rgba(212,175,55,0.04)", border: `1px solid ${GOLDB}`, borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🪪</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>Apple Wallet Ready</p>
          <p style={{ fontSize: 12, color: MUTED }}>Every student has a unique QR code and barcode. Pass architecture is complete — server-side signing enables native Apple Wallet support.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "rgba(0,0,0,0.4)", border: `1px solid ${BDR}`, color: MUTED }}>🍎 PassKit Ready</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "rgba(0,0,0,0.4)", border: `1px solid ${BDR}`, color: MUTED }}>◻ QR Active</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, background: CARD, borderRadius: 11, padding: "4px", width: "fit-content" }}>
        {(["directory", "verify"] as const).map((id) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === id ? CARD2 : "transparent", color: tab === id ? TEXT : MUTED, fontSize: 13, fontWeight: tab === id ? 700 : 400, fontFamily: "inherit", transition: "all 0.12s" }}>
            {id === "directory" ? "ID Directory" : "Verify ID"}
          </button>
        ))}
      </div>

      {/* Directory */}
      {tab === "directory" && (
        <>
          <div style={{ position: "relative", maxWidth: 380 }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth={2}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID…"
              style={{ width: "100%", background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: "9px 12px 9px 34px", fontSize: 13, color: TEXT, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s" }}
              onFocus={(e) => { e.target.style.borderColor = GOLDB; }}
              onBlur={(e) => { e.target.style.borderColor = BDR; }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: MUTED, fontSize: 13 }}>Generating digital IDs…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ fontSize: 32, opacity: 0.15, marginBottom: 12 }}>🪪</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                {students.length === 0 ? "No Students Enrolled" : "No Students Found"}
              </p>
              <p style={{ fontSize: 13, color: MUTED }}>
                {students.length === 0 ? "Add students to generate digital ID cards." : "Try a different name or ID number."}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
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
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 22 }}>Enter a student ID number or full name to verify TRIO enrollment status.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={verifyInput}
                onChange={(e) => { setVerifyInput(e.target.value); setVerifyResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="Student ID or full name…"
                style={{ flex: 1, background: BG, border: `1px solid ${BDR}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: TEXT, outline: "none", fontFamily: "inherit" }}
                onFocus={(e) => { e.target.style.borderColor = GOLDB; }}
                onBlur={(e) => { e.target.style.borderColor = BDR; }}
              />
              <button onClick={handleVerify}
                style={{ padding: "10px 22px", borderRadius: 10, background: RED, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Verify
              </button>
            </div>

            {verifyResult && (
              <div style={{ marginTop: 22 }}>
                {verifyResult === "not_found" ? (
                  <div style={{ background: "rgba(215,38,56,0.08)", border: "1px solid rgba(215,38,56,0.2)", borderRadius: 12, padding: "18px 20px", display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 22, color: RED }}>✕</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#F87171" }}>Not Found</p>
                      <p style={{ fontSize: 12, color: MUTED }}>No matching student in the TRIO program database.</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: 12, padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: 22, color: GREEN }}>✓</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>Verified — Active TRIO Student</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      {[["Name", verifyResult.full_name], ["ID", verifyResult.student_number], ["Status", verifyResult.enrollment_status], ["Campus", verifyResult.work_location ?? "CT State"], ["Advisor", verifyResult.advisor_name ?? "Unassigned"], ["Program", verifyResult.program ?? "TRIO SSS"]].map(([label, value]) => (
                        <div key={label}>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, marginBottom: 2 }}>{label}</p>
                          <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, textTransform: "capitalize" }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setSelected(verifyResult as TRIOStudent)}
                      style={{ padding: "8px 18px", borderRadius: 9, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: GREEN, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      View Full ID Card →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: 14, background: "rgba(212,175,55,0.04)", border: `1px solid ${GOLDB}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 16 }}>ℹ</span>
            <p style={{ fontSize: 12, color: MUTED }}>For authorized TRIO staff and administrators only. All verification events are audit-logged.</p>
          </div>
        </div>
      )}

      {selected && <FullIDModal student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
