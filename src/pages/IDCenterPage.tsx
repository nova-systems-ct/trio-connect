import { useState, useEffect } from "react";
import { getStudents } from "../lib/db";
import type { TRIOStudent } from "../lib/types";

const BG2   = "#0D1117";
const CARD  = "#111827";
const CARD2 = "#1A2236";
const TEXT  = "#F8FAFC";
const TEXT2 = "#94A3B8";
const TEXT3 = "#475569";
const RED   = "#D72638";
const BORDER = "rgba(248,250,252,0.06)";
const GOLD  = "#D4AF37";
const GOLD_GRAD = "linear-gradient(135deg, #FFF4B0 0%, #E6C76B 30%, #D4AF37 60%, #F7E8A4 100%)";

function QRGrid({ size = 80, color = TEXT }: { size?: number; color?: string }) {
  const cells = Array.from({ length: 7 * 7 });
  const pattern = [
    1,1,1,1,1,1,1,
    1,0,0,0,0,0,1,
    1,0,1,0,1,0,1,
    1,0,0,0,0,0,1,
    1,0,1,1,1,0,1,
    1,0,0,0,0,0,1,
    1,1,1,1,1,1,1,
  ];
  const cellSize = size / 7;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity: 0.85 }}>
      {cells.map((_, i) => {
        const row = Math.floor(i / 7);
        const col = i % 7;
        const on = pattern[i] === 1;
        if (!on) return null;
        return <rect key={i} x={col * cellSize + 1} y={row * cellSize + 1} width={cellSize - 2} height={cellSize - 2} rx={1} fill={color} />;
      })}
    </svg>
  );
}

function Barcode({ width = 180, height = 36, color = TEXT }: { width?: number; height?: number; color?: string }) {
  const bars = [3,1,2,1,3,2,1,2,3,1,1,2,3,1,2,1,3,2,1,3,2,1,2,1,3,2,1,2,3,1];
  const total = bars.reduce((a, b) => a + b, 0);
  let x = 0;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${total} ${height}`} preserveAspectRatio="none" style={{ opacity: 0.8 }}>
      {bars.map((w, i) => {
        const rect = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={height} fill={color} /> : null;
        x += w;
        return rect;
      })}
    </svg>
  );
}

function DigitalIDCard({ student, onClick }: { student: TRIOStudent; onClick: () => void }) {
  const initials = student.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const expYear = new Date().getFullYear() + 1;
  const statusColor = student.enrollment_status === "active" ? "#22C55E" : student.enrollment_status === "inactive" ? RED : "#F59E0B";

  return (
    <div onClick={onClick} style={{
      background: `linear-gradient(160deg, #111827 0%, #0D1117 100%)`,
      borderRadius: 16, border: `1px solid rgba(212,175,55,0.2)`,
      padding: "22px", cursor: "pointer", position: "relative", overflow: "hidden",
      transition: "all 0.18s",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.6)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)"; }}
    >
      {/* Watermark */}
      <div style={{ position: "absolute", top: -10, right: -10, fontSize: 80, opacity: 0.025, fontWeight: 900, color: TEXT, pointerEvents: "none" }}>TRIO</div>

      {/* Gold top stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: GOLD_GRAD, borderRadius: "16px 16px 0 0" }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
        {/* Avatar */}
        <div style={{ width: 52, height: 52, borderRadius: 12, background: `${RED}18`, border: `1px solid ${RED}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: RED }}>{initials}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: TEXT, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.full_name}</p>
          <p style={{ fontSize: 11, color: TEXT3 }}>{student.email ?? "No email on file"}</p>
          <p style={{ fontSize: 10, color: TEXT3, marginTop: 2 }}>
            {student.major ?? "Undecided"} · {student.work_location ?? "CT State"}
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase" as const, padding: "3px 7px", borderRadius: 20, background: `${statusColor}15`, color: statusColor }}>
            {student.enrollment_status ?? "Unknown"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 8, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 3 }}>ID / Expires</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: TEXT2 }}>{student.id.slice(0, 8).toUpperCase()} · {expYear}</p>
          <div style={{ marginTop: 8 }}>
            <Barcode width={140} height={22} color={TEXT3} />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 7, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>TRIO SSS</p>
          <QRGrid size={48} color={TEXT2} />
        </div>
      </div>

      {/* Bottom logo strip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: `1px solid rgba(248,250,252,0.05)` }}>
        <p style={{ fontSize: 8, color: TEXT3 }}>CT State Community College</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: GOLD_GRAD }} />
          <p style={{ fontSize: 8, fontWeight: 800, background: GOLD_GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as any }}>TRIO Connect</p>
        </div>
      </div>
    </div>
  );
}

function FullIDModal({ student, onClose }: { student: TRIOStudent; onClose: () => void }) {
  const initials = student.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const expYear = new Date().getFullYear() + 1;
  const statusColor = student.enrollment_status === "active" ? "#22C55E" : RED;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#111827", borderRadius: 20, border: `1px solid rgba(212,175,55,0.3)`, padding: 32, maxWidth: 440, width: "90%", position: "relative", boxShadow: "0 40px 120px rgba(0,0,0,0.8)" }}>
        {/* Gold top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: GOLD_GRAD, borderRadius: "20px 20px 0 0" }} />

        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: TEXT3, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>

        {/* Avatar */}
        <div style={{ textAlign: "center", marginBottom: 20, marginTop: 8 }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: `${RED}18`, border: `2px solid ${RED}35`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: RED }}>{initials}</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: TEXT, marginBottom: 4 }}>{student.full_name}</h2>
          <p style={{ fontSize: 12, color: TEXT3 }}>{student.email ?? "No email"}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "rgba(212,175,55,0.1)", color: GOLD }}>TRIO SSS</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: `${statusColor}15`, color: statusColor }}>{student.enrollment_status ?? "Unknown"}</span>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            ["Student ID", student.id.slice(0, 8).toUpperCase()],
            ["Advisor", student.advisor_name ?? "Unassigned"],
            ["Location", student.work_location ?? "CT State"],
            ["Major", student.major ?? "Undecided"],
            ["Program", student.program ?? "TRIO SSS"],
            ["Expires", `${expYear}`],
          ].map(([label, value]) => (
            <div key={label} style={{ background: BG2, borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: TEXT3, marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: TEXT2 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* QR + Barcode */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "18px 0", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, marginBottom: 20 }}>
          <div style={{ textAlign: "center" }}>
            <QRGrid size={80} color={TEXT} />
            <p style={{ fontSize: 9, color: TEXT3, marginTop: 6 }}>QR Code</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <Barcode width={160} height={44} color={TEXT2} />
            <p style={{ fontSize: 9, color: TEXT3, marginTop: 6 }}>{student.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => window.print()} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: RED, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            Print ID
          </button>
          <button style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "rgba(212,175,55,0.1)", border: `1px solid rgba(212,175,55,0.2)`, color: GOLD, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            Add to Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IDCenterPage() {
  const [students, setStudents] = useState<TRIOStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TRIOStudent | null>(null);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<TRIOStudent | null | "not_found">(null);
  const [tab, setTab] = useState<"directory" | "verify">("directory");

  useEffect(() => {
    getStudents().then((s) => { setStudents(s); setLoading(false); });
  }, []);

  const filtered = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  function handleVerify() {
    if (!verifyInput.trim()) return;
    const match = students.find(
      (s) => s.id.toLowerCase().includes(verifyInput.toLowerCase()) ||
             s.full_name.toLowerCase().includes(verifyInput.toLowerCase())
    );
    setVerifyResult(match ?? "not_found");
  }

  const TABS: [typeof tab, string][] = [["directory", "ID Directory"], ["verify", "Verify ID"]];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1100, animation: "fadeIn 0.2s ease" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: "-0.5px" }}>Digital ID Center</h1>
          <p style={{ fontSize: 13, color: TEXT3, marginTop: 4 }}>TRIOStudent digital identification cards with QR verification.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: TEXT3 }}>{students.filter((s) => s.enrollment_status === "active").length} active</p>
          <p style={{ fontSize: 10, color: TEXT3, marginTop: 2 }}>of {students.length} enrolled</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, background: CARD, borderRadius: 11, padding: "4px", width: "fit-content" }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer",
            background: tab === id ? CARD2 : "transparent",
            color: tab === id ? TEXT : TEXT2, fontSize: 13, fontWeight: tab === id ? 600 : 400,
            fontFamily: "'Inter', sans-serif", transition: "all 0.12s",
          }}>{label}</button>
        ))}
      </div>

      {/* Directory tab */}
      {tab === "directory" && (
        <>
          {/* Search */}
          <div style={{ position: "relative", maxWidth: 400 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: TEXT3, pointerEvents: "none" }}>⌕</span>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID…"
              style={{ width: "100%", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "9px 12px 9px 34px", fontSize: 13, color: TEXT, outline: "none", fontFamily: "'Inter', sans-serif", boxSizing: "border-box" as const }}
            />
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: TEXT3, fontSize: 13 }}>Loading student IDs…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ fontSize: 32, marginBottom: 12, opacity: 0.2 }}>🪪</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: TEXT2, marginBottom: 6 }}>
                {students.length === 0 ? "No Students Enrolled" : "No Students Found"}
              </p>
              <p style={{ fontSize: 13, color: TEXT3 }}>
                {students.length === 0 ? "Add students to generate digital ID cards." : "Try a different name or ID number."}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {filtered.map((s) => (
                <DigitalIDCard key={s.id} student={s} onClick={() => setSelected(s)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Verify tab */}
      {tab === "verify" && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "28px 28px" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 6 }}>ID Verification Portal</p>
            <p style={{ fontSize: 12, color: TEXT3, marginBottom: 22 }}>Enter a student ID number or name to verify TRIO enrollment status.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={verifyInput} onChange={(e) => setVerifyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="TRIOStudent ID or full name…"
                style={{ flex: 1, background: BG2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: TEXT, outline: "none", fontFamily: "'Inter', sans-serif" }}
              />
              <button onClick={handleVerify} style={{ padding: "10px 22px", borderRadius: 10, background: RED, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                Verify
              </button>
            </div>

            {verifyResult && (
              <div style={{ marginTop: 22 }}>
                {verifyResult === "not_found" ? (
                  <div style={{ background: "rgba(215,38,56,0.08)", border: "1px solid rgba(215,38,56,0.2)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>✕</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#F87171" }}>Not Found</p>
                      <p style={{ fontSize: 12, color: TEXT3 }}>No matching student in the TRIO program database.</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 20 }}>✓</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#22C55E" }}>Verified — TRIO Enrolled</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        ["Name", verifyResult.full_name],
                        ["Status", verifyResult.enrollment_status ?? "—"],
                        ["Location", verifyResult.work_location ?? "CT State"],
                        ["Advisor", verifyResult.advisor_name ?? "Unassigned"],
                        ["Major", verifyResult.major ?? "Undecided"],
                        ["ID", verifyResult.id.slice(0, 8).toUpperCase()],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: TEXT3, marginBottom: 2 }}>{label}</p>
                          <p style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setSelected(verifyResult as TRIOStudent)} style={{ marginTop: 14, padding: "8px 18px", borderRadius: 9, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                      View Full ID Card →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info banner */}
          <div style={{ marginTop: 14, background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ</span>
            <p style={{ fontSize: 12, color: TEXT3 }}>
              This portal is for authorized staff and program administrators. All verification events are logged in the system audit trail.
            </p>
          </div>
        </div>
      )}

      {/* Full ID modal */}
      {selected && <FullIDModal student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
