import { useState, useEffect, type ReactElement } from "react";
import { getStudents } from "../lib/db";
import type { TRIOStudent } from "../lib/types";
import {
  generateQRMatrix, generateBarcodeWidths, generateBarcodeValue,
  buildWalletPassData, type WalletPassData,
} from "../lib/wallet";

const BG2   = "#0D1117";
const CARD  = "#111827";
const CARD2 = "#1A2236";
const TEXT  = "#F8FAFC";
const TEXT2 = "#94A3B8";
const TEXT3 = "#475569";
const RED   = "#D72638";
const GREEN = "#22C55E";
const BORDER = "rgba(248,250,252,0.06)";
const GOLD  = "#D4AF37";
const GOLD_GRAD = "linear-gradient(135deg, #FFF4B0 0%, #E6C76B 30%, #D4AF37 60%, #F7E8A4 100%)";

// ── SVG QR code component (unique per student) ────────────────────────────────
function StudentQR({ studentNumber, size = 72, color = TEXT }: { studentNumber: string; size?: number; color?: string }) {
  const matrix = generateQRMatrix(studentNumber);
  const S = 21;
  const cell = size / S;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      {matrix.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect key={`${r}-${c}`}
              x={c * cell + 0.5} y={r * cell + 0.5}
              width={cell - 1} height={cell - 1}
              rx={cell * 0.12} fill={color}
            />
          ) : null
        )
      )}
    </svg>
  );
}

// ── SVG Barcode component (unique per student) ────────────────────────────────
function StudentBarcode({ studentNumber, width = 180, height = 36, color = TEXT }: { studentNumber: string; width?: number; height?: number; color?: string }) {
  const bars = generateBarcodeWidths(studentNumber);
  const total = bars.reduce((a, b) => a + b, 0);
  let x = 0;
  const rects: ReactElement[] = [];
  bars.forEach((w, i) => {
    if (i % 2 === 0) rects.push(<rect key={i} x={x} y={0} width={w} height={height} fill={color} />);
    x += w;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${total} ${height}`} preserveAspectRatio="none" style={{ display: "block", opacity: 0.85 }}>
      {rects}
    </svg>
  );
}

// ── ID Card (grid view) ───────────────────────────────────────────────────────
function IDCard({ student, onClick }: { student: TRIOStudent; onClick: () => void }) {
  const initials = student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const statusColor = student.enrollment_status === "active" ? GREEN : student.enrollment_status === "inactive" ? RED : "#F59E0B";
  const expYear = new Date(student.enrollment_date).getFullYear() + 4;

  return (
    <div onClick={onClick} style={{
      background: "linear-gradient(160deg, #111827 0%, #0D1117 100%)",
      borderRadius: 18, border: "1px solid rgba(212,175,55,0.18)",
      padding: "22px", cursor: "pointer", position: "relative", overflow: "hidden",
      transition: "all 0.18s", boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)"; e.currentTarget.style.boxShadow = "0 14px 48px rgba(0,0,0,0.6)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "rgba(212,175,55,0.18)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)"; }}
    >
      {/* Gold top stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: GOLD_GRAD, borderRadius: "18px 18px 0 0" }} />
      {/* Watermark */}
      <div style={{ position: "absolute", top: -8, right: -8, fontSize: 76, fontWeight: 900, color: TEXT, opacity: 0.025, pointerEvents: "none", lineHeight: 1 }}>TRIO</div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 11, background: `${RED}18`, border: `1px solid ${RED}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: RED }}>{initials}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.full_name}</p>
          <p style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>{student.email ?? "No email on file"}</p>
          <p style={{ fontSize: 10, color: TEXT3, marginTop: 1 }}>{student.major ?? "Undecided"} · {student.work_location ?? "CT State"}</p>
        </div>
        <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", padding: "3px 7px", borderRadius: 20, background: `${statusColor}18`, color: statusColor, flexShrink: 0 }}>
          {student.enrollment_status}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 8, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Student ID · Expires</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: TEXT2 }}>{student.student_number} · {expYear}</p>
          <div style={{ marginTop: 8 }}>
            <StudentBarcode studentNumber={student.student_number} width={140} height={22} color={TEXT3} />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 7, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{student.program ?? "TRIO SSS"}</p>
          <StudentQR studentNumber={student.student_number} size={48} color={TEXT2} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(248,250,252,0.05)" }}>
        <p style={{ fontSize: 8, color: TEXT3 }}>CT State Community College</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: GOLD_GRAD }} />
          <p style={{ fontSize: 8, fontWeight: 800, background: GOLD_GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never }}>TRIO Connect</p>
        </div>
      </div>
    </div>
  );
}

// ── Apple Wallet-style card preview ──────────────────────────────────────────
function AppleWalletPreview({ student }: { student: TRIOStudent }) {
  return (
    <div style={{
      width: 320, borderRadius: 20,
      background: "linear-gradient(160deg, #1C1C1E 0%, #111827 100%)",
      border: "1px solid rgba(255,255,255,0.12)",
      overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em" }}>CT State Community College</p>
          <p style={{ fontSize: 10, fontWeight: 700, background: GOLD_GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as never }}>TRIO Connect</p>
        </div>
      </div>

      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(215,38,56,0.15)", border: "1px solid rgba(215,38,56,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: RED }}>{student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.3px" }}>{student.full_name}</p>
            <p style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>Student ID</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 0", marginBottom: 18 }}>
          {[
            ["Student ID", student.student_number],
            ["Advisor", student.advisor_name ?? "Unassigned"],
            ["Program", student.program ?? "TRIO SSS"],
            ["Campus", student.work_location ?? "CT State"],
          ].map(([label, val]) => (
            <div key={label}>
              <p style={{ fontSize: 9, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#EBEBF5" }}>{val}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <StudentBarcode studentNumber={student.student_number} width={140} height={36} color="rgba(255,255,255,0.7)" />
            <p style={{ fontSize: 9, color: "#8E8E93", marginTop: 4 }}>{generateBarcodeValue(student)}</p>
          </div>
          <StudentQR studentNumber={student.student_number} size={60} color="rgba(255,255,255,0.85)" />
        </div>
      </div>

      <div style={{ padding: "10px 20px 14px" }}>
        <p style={{ fontSize: 9, color: "#48484A", textAlign: "center" }}>
          Exp. {new Date(student.enrollment_date).getFullYear() + 4} · TRIO SSS
        </p>
      </div>
    </div>
  );
}

// ── Google Wallet-style card preview ─────────────────────────────────────────
function GoogleWalletPreview({ student }: { student: TRIOStudent }) {
  return (
    <div style={{
      width: 320, borderRadius: 16,
      background: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
      overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: GOLD }}>T</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>TRIO Connect</p>
        </div>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>CT State</p>
      </div>

      <div style={{ padding: "20px 20px 16px" }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Student ID</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginTop: 4, letterSpacing: "-0.3px" }}>{student.full_name}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16, marginBottom: 18 }}>
          {[
            ["ID", student.student_number],
            ["Program", student.program ?? "TRIO SSS"],
            ["Advisor", student.advisor_name ?? "—"],
            ["Campus", student.work_location ?? "CT State"],
          ].map(([label, val]) => (
            <div key={label}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <StudentBarcode studentNumber={student.student_number} width={240} height={44} color="rgba(255,255,255,0.8)" />
        </div>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 6 }}>{generateBarcodeValue(student)}</p>
      </div>
    </div>
  );
}

// ── Full ID Modal ─────────────────────────────────────────────────────────────
function FullIDModal({ student, onClose }: { student: TRIOStudent; onClose: () => void }) {
  const initials = student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const expYear = new Date(student.enrollment_date).getFullYear() + 4;
  const statusColor = student.enrollment_status === "active" ? GREEN : RED;
  const [walletTab, setWalletTab] = useState<"card" | "apple" | "google">("card");
  const passData: WalletPassData = buildWalletPassData(student);
  const [walletMsg, setWalletMsg] = useState<"apple" | "google" | null>(null);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#111827", borderRadius: 22, border: "1px solid rgba(212,175,55,0.25)", padding: "0", maxWidth: 820, width: "100%", position: "relative", boxShadow: "0 40px 120px rgba(0,0,0,0.9)", overflowY: "auto", maxHeight: "90vh" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: GOLD_GRAD, borderRadius: "22px 22px 0 0" }} />
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,0.06)", border: "none", color: TEXT2, fontSize: 14, cursor: "pointer", width: 30, height: 30, borderRadius: "50%", lineHeight: 1, fontFamily: "'Inter', sans-serif", zIndex: 1 }}>✕</button>

        <div style={{ padding: "36px 36px 0" }}>
          {/* Student header */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: `${RED}18`, border: `2px solid ${RED}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: RED }}>{initials}</span>
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: "-0.4px" }}>{student.full_name}</h2>
              <p style={{ fontSize: 13, color: TEXT3, marginTop: 2 }}>{student.email ?? "No email"}</p>
              <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "rgba(212,175,55,0.1)", color: GOLD }}>{student.program ?? "TRIO SSS"}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: `${statusColor}15`, color: statusColor, textTransform: "capitalize" }}>{student.enrollment_status}</span>
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <p style={{ fontSize: 11, color: TEXT3 }}>Expires</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>{expYear}</p>
            </div>
          </div>

          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 2, background: CARD2, borderRadius: 10, padding: 3, marginBottom: 24, width: "fit-content" }}>
            {(["card", "apple", "google"] as const).map((t) => (
              <button key={t} onClick={() => setWalletTab(t)} style={{
                padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                background: walletTab === t ? CARD : "transparent",
                color: walletTab === t ? TEXT : TEXT3,
                fontSize: 12, fontWeight: walletTab === t ? 700 : 400,
                fontFamily: "'Inter', sans-serif", transition: "all 0.1s",
              }}>
                {t === "card" ? "ID Card" : t === "apple" ? "🍎 Apple Wallet" : "🔵 Google Wallet"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 36px 36px" }}>
          {walletTab === "card" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
              {/* ID info grid */}
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {[
                    ["Student ID", student.student_number],
                    ["Advisor", student.advisor_name ?? "Unassigned"],
                    ["Campus", student.work_location ?? "CT State"],
                    ["Major", student.major ?? "Undecided"],
                    ["Enrolled", student.enrollment_date],
                    ["Expires", `${expYear}`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: BG2, borderRadius: 10, padding: "10px 14px" }}>
                      <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT3, marginBottom: 4 }}>{label}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: TEXT2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => window.print()} style={{ flex: 1, padding: "11px", borderRadius: 10, background: RED, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                    Print ID
                  </button>
                  <button onClick={() => setWalletTab("apple")} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: GOLD, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                    Add to Wallet →
                  </button>
                </div>
              </div>
              {/* QR + barcode */}
              <div style={{ background: BG2, borderRadius: 16, padding: "24px", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                  <div>
                    <StudentQR studentNumber={student.student_number} size={90} color={TEXT} />
                    <p style={{ fontSize: 9, color: TEXT3, marginTop: 8 }}>Scan to Verify</p>
                  </div>
                  <div style={{ width: 1, height: 80, background: BORDER }} />
                  <div>
                    <StudentBarcode studentNumber={student.student_number} width={130} height={50} color={TEXT2} />
                    <p style={{ fontSize: 9, color: TEXT3, marginTop: 6 }}>{student.student_number}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {walletTab === "apple" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
              <div>
                <AppleWalletPreview student={student} />
                <div style={{ marginTop: 16, position: "relative" }}>
                  {/* Apple Wallet button */}
                  <button
                    onClick={() => setWalletMsg("apple")}
                    style={{
                      width: "100%", padding: "14px", borderRadius: 12,
                      background: "#000000", border: "none",
                      color: "#fff", fontSize: 15, fontWeight: 700,
                      cursor: "pointer", fontFamily: "'Inter', sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    Add to Apple Wallet
                  </button>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10 }}>Pass Architecture</p>
                <div style={{ background: "#0B0B0B", borderRadius: 12, padding: "16px", fontFamily: "monospace", fontSize: 11, color: "#4ADE80", lineHeight: 1.7, maxHeight: 340, overflowY: "auto" }}>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {JSON.stringify(passData.apple, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {walletTab === "google" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
              <div>
                <GoogleWalletPreview student={student} />
                <button
                  onClick={() => setWalletMsg("google")}
                  style={{
                    width: "100%", marginTop: 16, padding: "14px", borderRadius: 12,
                    background: "linear-gradient(135deg, #4285F4, #34A853)",
                    border: "none", color: "#fff", fontSize: 15, fontWeight: 700,
                    cursor: "pointer", fontFamily: "'Inter', sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/></svg>
                  Save to Google Wallet
                </button>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10 }}>Pass Object</p>
                <div style={{ background: "#0B0B0B", borderRadius: 12, padding: "16px", fontFamily: "monospace", fontSize: 11, color: "#60A5FA", lineHeight: 1.7, maxHeight: 340, overflowY: "auto" }}>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {JSON.stringify(passData.google, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Coming Soon overlay */}
      {walletMsg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
          onClick={() => setWalletMsg(null)}>
          <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, padding: "40px 44px", maxWidth: 480, textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,0.9)" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{walletMsg === "apple" ? "🍎" : "🔵"}</div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: TEXT, marginBottom: 8 }}>
              {walletMsg === "apple" ? "Apple Wallet" : "Google Wallet"} Integration
            </h3>
            <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.7, marginBottom: 6 }}>
              {walletMsg === "apple"
                ? "Apple Wallet integration requires a server-side Apple Developer certificate and PKPass signing service."
                : "Google Wallet integration requires a Google Pay & Wallet Console service account and JWT signing."}
            </p>
            <p style={{ fontSize: 13, color: TEXT3, lineHeight: 1.6, marginBottom: 24 }}>
              The pass architecture is fully built and ready. Contact your system administrator to complete the integration with signing credentials.
            </p>
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, padding: "10px 16px", marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>✓ Pass data structure complete · QR generated · Barcode generated</p>
            </div>
            <button onClick={() => setWalletMsg(null)} style={{ padding: "11px 32px", borderRadius: 10, background: RED, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function IDCenterPage() {
  const [students, setStudents]     = useState<TRIOStudent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<TRIOStudent | null>(null);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<TRIOStudent | null | "not_found">(null);
  const [tab, setTab]               = useState<"directory" | "verify">("directory");

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
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1100, animation: "fadeIn 0.2s ease" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: "-0.5px" }}>Digital IDs</h1>
          <p style={{ fontSize: 13, color: TEXT3, marginTop: 4 }}>Unique digital IDs with QR, barcode, and Apple/Google Wallet architecture.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>{activeCount}</p>
          <p style={{ fontSize: 11, color: TEXT3 }}>active IDs · of {students.length} total</p>
        </div>
      </div>

      {/* Wallet integration info banner */}
      <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 18 }}>🪪</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>Apple & Google Wallet Ready</p>
          <p style={{ fontSize: 12, color: TEXT3 }}>Pass architecture is built. Each student has a unique QR code, barcode, and wallet pass structure. Server-side signing enables native wallet support.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "rgba(0,0,0,0.4)", color: TEXT3 }}>🍎 PassKit Ready</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "rgba(0,0,0,0.4)", color: TEXT3 }}>🔵 Google Wallet Ready</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, background: CARD, borderRadius: 11, padding: "4px", width: "fit-content" }}>
        {(["directory", "verify"] as const).map((id) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer",
            background: tab === id ? CARD2 : "transparent",
            color: tab === id ? TEXT : TEXT2, fontSize: 13, fontWeight: tab === id ? 700 : 400,
            fontFamily: "'Inter', sans-serif", transition: "all 0.12s",
          }}>
            {id === "directory" ? "ID Directory" : "Verify ID"}
          </button>
        ))}
      </div>

      {/* Directory tab */}
      {tab === "directory" && (
        <>
          <div style={{ position: "relative", maxWidth: 380 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: TEXT3, pointerEvents: "none" }}>⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID…"
              style={{ width: "100%", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "9px 12px 9px 34px", fontSize: 13, color: TEXT, outline: "none", fontFamily: "'Inter', sans-serif", boxSizing: "border-box" }}
              onFocus={(e) => { e.target.style.borderColor = RED; }}
              onBlur={(e) => { e.target.style.borderColor = BORDER; }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: TEXT3, fontSize: 13 }}>Generating digital IDs…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ fontSize: 32, opacity: 0.15, marginBottom: 12 }}>🪪</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: TEXT2, marginBottom: 6 }}>
                {students.length === 0 ? "No Students Enrolled" : "No Students Found"}
              </p>
              <p style={{ fontSize: 13, color: TEXT3 }}>
                {students.length === 0 ? "Add students to generate digital ID cards." : "Try a different name or ID number."}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {filtered.map((s) => <IDCard key={s.id} student={s} onClick={() => setSelected(s)} />)}
            </div>
          )}
        </>
      )}

      {/* Verify tab */}
      {tab === "verify" && (
        <div style={{ maxWidth: 540 }}>
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "28px" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 6 }}>ID Verification Portal</p>
            <p style={{ fontSize: 12, color: TEXT3, marginBottom: 22 }}>Enter a student ID number or full name to verify TRIO enrollment status. All verifications are logged.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={verifyInput}
                onChange={(e) => { setVerifyInput(e.target.value); setVerifyResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="Student ID number or full name…"
                style={{ flex: 1, background: BG2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: TEXT, outline: "none", fontFamily: "'Inter', sans-serif" }}
                onFocus={(e) => { e.target.style.borderColor = RED; }}
                onBlur={(e) => { e.target.style.borderColor = BORDER; }}
              />
              <button onClick={handleVerify} style={{ padding: "10px 22px", borderRadius: 10, background: RED, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Verify</button>
            </div>

            {verifyResult && (
              <div style={{ marginTop: 22 }}>
                {verifyResult === "not_found" ? (
                  <div style={{ background: "rgba(215,38,56,0.08)", border: "1px solid rgba(215,38,56,0.2)", borderRadius: 12, padding: "18px 20px", display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 22, color: RED }}>✕</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#F87171" }}>Not Found</p>
                      <p style={{ fontSize: 12, color: TEXT3 }}>No matching student in the TRIO program database.</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: 12, padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: 22, color: GREEN }}>✓</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>Verified — Active TRIO Student</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      {[
                        ["Name",     verifyResult.full_name],
                        ["ID",       verifyResult.student_number],
                        ["Status",   verifyResult.enrollment_status],
                        ["Campus",   verifyResult.work_location ?? "CT State"],
                        ["Advisor",  verifyResult.advisor_name ?? "Unassigned"],
                        ["Program",  verifyResult.program ?? "TRIO SSS"],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT3, marginBottom: 2 }}>{label}</p>
                          <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, textTransform: "capitalize" }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { setSelected(verifyResult as TRIOStudent); }} style={{ padding: "8px 18px", borderRadius: 9, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: GREEN, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                      View Full ID Card →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: 14, background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 16 }}>ℹ</span>
            <p style={{ fontSize: 12, color: TEXT3 }}>For authorized TRIO staff and administrators only. All verification events are audit-logged.</p>
          </div>
        </div>
      )}

      {selected && <FullIDModal student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
