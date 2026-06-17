import { useState, useEffect } from "react";
import { getMessages, sendMessage, getStudents } from "../lib/db";
import type { Message, TRIOStudent, MessageChannel, MessageRecipientType } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import { format } from "date-fns";

const CARD  = "#111827";
const CARD2 = "#1A2236";
const TEXT  = "#F8FAFC";
const TEXT2 = "#94A3B8";
const TEXT3 = "#475569";
const RED   = "#D72638";
const GOLD  = "#D4AF37";
const BORDER = "rgba(248,250,252,0.06)";


const inp: React.CSSProperties = {
  width: "100%", border: `1px solid rgba(248,250,252,0.1)`, borderRadius: 9,
  padding: "10px 13px", fontSize: 13, outline: "none",
  background: CARD2, color: TEXT, fontFamily: "'Inter', sans-serif",
  boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const,
  letterSpacing: "0.08em", color: TEXT3, marginBottom: 6, display: "block",
};

type TabId = "compose" | "templates" | "history" | "campaigns";

const TEMPLATES = [
  { id: "t1", name: "FAFSA Deadline Reminder", subject: "Action Required: FAFSA Deadline Approaching", channel: "email" as MessageChannel, body: "Dear [Student Name],\n\nThis is a reminder that the FAFSA deadline is approaching. Please complete your application as soon as possible to avoid missing out on financial aid.\n\nContact our office if you need assistance.\n\nBest,\nTRIO Connect Team" },
  { id: "t2", name: "Appointment Reminder", subject: "Reminder: Your Upcoming TRIO Appointment", channel: "email" as MessageChannel, body: "Dear [Student Name],\n\nThis is a reminder of your upcoming appointment with your TRIO advisor on [Date] at [Time].\n\nPlease confirm your attendance or contact us to reschedule.\n\nBest,\nTRIO Connect Team" },
  { id: "t3", name: "Scholarship Alert", subject: "New Scholarship Opportunity Available", channel: "email" as MessageChannel, body: "Dear [Student Name],\n\nA new scholarship opportunity matching your profile is now available. The deadline is [Date].\n\nLog in to TRIO Connect to view details and apply.\n\nBest,\nTRIO Connect Team" },
  { id: "t4", name: "Workshop Invitation", subject: "You're Invited: [Workshop Name]", channel: "email" as MessageChannel, body: "Dear [Student Name],\n\nWe'd like to invite you to our upcoming workshop: [Workshop Name].\n\nDate: [Date]\nTime: [Time]\nLocation: [Location]\n\nPlease RSVP through the TRIO Connect portal.\n\nBest,\nTRIO Connect Team" },
  { id: "t5", name: "Check-In Outreach", subject: "We Haven't Seen You Lately", channel: "email" as MessageChannel, body: "Dear [Student Name],\n\nWe noticed you haven't visited the TRIO office recently. Our services are here to support you.\n\nSchedule an appointment or drop by during office hours. We're here to help.\n\nBest,\nTRIO Connect Team" },
];

const GROUPS = [
  { id: "first_gen", label: "First-Generation Students" },
  { id: "low_income", label: "Low-Income Students" },
  { id: "at_risk", label: "At-Risk Students" },
  { id: "all_active", label: "All Active Students" },
];

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer",
      background: active ? RED : "transparent",
      color: active ? "#fff" : TEXT2, fontSize: 13, fontWeight: active ? 700 : 400,
      fontFamily: "'Inter', sans-serif", transition: "all 0.12s",
    }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = TEXT; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = TEXT2; }}
    >
      {label}
    </button>
  );
}

export default function CommunicationsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("compose");
  const [messages, setMessages] = useState<Message[]>([]);
  const [students, setStudents] = useState<TRIOStudent[]>([]);

  const [channel, setChannel] = useState<MessageChannel>("email");
  const [recipientType, setRecipientType] = useState<MessageRecipientType>("group");
  const [selectedGroup, setSelectedGroup] = useState("all_active");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    Promise.all([getMessages(), getStudents()]).then(([m, s]) => {
      setMessages(m);
      setStudents(s);
    });
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || !user) return;
    setSending(true);
    await sendMessage({
      sender_id: user.id, sender_name: user.full_name,
      recipient_type: recipientType,
      recipient_name: GROUPS.find((g) => g.id === selectedGroup)?.label ?? "Students",
      subject, body, channel,
    });
    const updated = await getMessages();
    setMessages(updated);
    setSubject(""); setBody("");
    setSending(false); setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const handleTemplate = (t: typeof TEMPLATES[0]) => {
    setSubject(t.subject); setBody(t.body); setChannel(t.channel); setTab("compose");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1100, animation: "fadeIn 0.2s ease" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: "-0.5px" }}>Communications</h1>
          <p style={{ fontSize: 13, color: TEXT3, marginTop: 4 }}>Messaging, announcements, campaigns, and templates.</p>
        </div>
        <div style={{ fontSize: 12, color: TEXT3 }}>
          {students.length > 0 ? `${students.length} students enrolled` : "No students enrolled yet"}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: CARD, borderRadius: 11, padding: "4px", width: "fit-content" }}>
        {([["compose", "Compose"], ["templates", "Templates"], ["campaigns", "Campaigns"], ["history", "History"]] as [TabId, string][]).map(([id, label]) => (
          <TabButton key={id} label={label} active={tab === id} onClick={() => setTab(id)} />
        ))}
      </div>

      {/* Compose tab */}
      {tab === "compose" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>New Message</p>
            </div>
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Channel */}
              <div>
                <label style={lbl}>Channel</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["email", "in_app", "sms"] as MessageChannel[]).map((ch) => (
                    <button key={ch} onClick={() => setChannel(ch)}
                      style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${channel === ch ? RED : BORDER}`, background: channel === ch ? `${RED}12` : "transparent", color: channel === ch ? "#fff" : TEXT2, fontSize: 12, fontWeight: channel === ch ? 700 : 400, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                      {ch === "in_app" ? "In-App" : ch.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label style={lbl}>Send To</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {(["group", "student"] as MessageRecipientType[]).map((rt) => (
                    <button key={rt} onClick={() => setRecipientType(rt)}
                      style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${recipientType === rt ? RED : BORDER}`, background: recipientType === rt ? `${RED}12` : "transparent", color: recipientType === rt ? "#fff" : TEXT2, fontSize: 12, fontWeight: recipientType === rt ? 700 : 400, cursor: "pointer", fontFamily: "'Inter', sans-serif", textTransform: "capitalize" }}>
                      {rt === "group" ? "Group" : "Individual"}
                    </button>
                  ))}
                </div>
                {recipientType === "group" ? (
                  <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} style={{ ...inp }}>
                    {GROUPS.map((g) => <option key={g.id} value={g.id} style={{ background: "#1a2236" }}>{g.label}</option>)}
                  </select>
                ) : (
                  <select style={{ ...inp }}>
                    <option style={{ background: "#1a2236" }}>Select student…</option>
                    {students.map((s) => <option key={s.id} value={s.id} style={{ background: "#1a2236" }}>{s.full_name}</option>)}
                  </select>
                )}
              </div>

              {/* Subject */}
              <div>
                <label style={lbl}>Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Message subject…" style={inp} />
              </div>

              {/* Body */}
              <div>
                <label style={lbl}>Message Body</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Write your message…" style={{ ...inp, resize: "vertical" }} />
              </div>

              {/* AI Generator hint */}
              <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 9, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14 }}>✦</span>
                <p style={{ fontSize: 12, color: GOLD }}>Nova AI can draft this message for you — coming soon.</p>
              </div>

              <button
                onClick={handleSend}
                disabled={!subject.trim() || !body.trim() || sending || sent}
                style={{ padding: "11px 0", borderRadius: 10, background: sent ? "#22C55E" : !subject.trim() || !body.trim() || sending ? "#1f2f47" : RED, border: "none", color: sent || (!subject.trim() && !body.trim()) ? "#fff" : "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}>
                {sending ? "Sending…" : sent ? "✓ Sent Successfully" : `Send ${channel === "email" ? "Email" : channel === "sms" ? "SMS" : "Message"}`}
              </button>
            </div>
          </div>

          {/* Quick groups panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>Quick Groups</p>
              </div>
              {GROUPS.map((g) => (
                <button key={g.id} onClick={() => { setRecipientType("group"); setSelectedGroup(g.id); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", border: "none", background: "transparent", cursor: "pointer", borderBottom: `1px solid ${BORDER}`, transition: "background 0.1s", fontFamily: "'Inter', sans-serif" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(248,250,252,0.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: 12, color: TEXT2 }}>{g.label}</span>
                  <span style={{ fontSize: 10, color: TEXT3 }}>→</span>
                </button>
              ))}
            </div>

            <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "14px 18px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: TEXT, marginBottom: 10 }}>History</p>
              <p style={{ fontSize: 12, color: TEXT3 }}>{messages.length} messages sent</p>
              <button onClick={() => setTab("history")} style={{ marginTop: 10, fontSize: 11, color: RED, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>View history →</button>
            </div>
          </div>
        </div>
      )}

      {/* Templates tab */}
      {tab === "templates" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
          {TEMPLATES.map((t) => (
            <div key={t.id} style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{t.name}</p>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 20, background: "rgba(59,130,246,0.12)", color: "#3B82F6", textTransform: "uppercase" }}>{t.channel}</span>
              </div>
              <p style={{ fontSize: 12, color: TEXT3, marginBottom: 4, fontStyle: "italic" }}>{t.subject}</p>
              <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5, marginBottom: 16, maxHeight: 60, overflow: "hidden" }}>
                {t.body.slice(0, 100)}…
              </p>
              <button onClick={() => handleTemplate(t)}
                style={{ width: "100%", padding: "9px 0", borderRadius: 9, background: `${RED}12`, border: `1px solid ${RED}25`, color: RED, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Campaigns tab */}
      {tab === "campaigns" && (
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "48px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 14, opacity: 0.2 }}>📣</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Automated Campaigns</p>
          <p style={{ fontSize: 13, color: TEXT3, marginBottom: 24, maxWidth: 420, margin: "0 auto 24px" }}>
            Set up automated message sequences for FAFSA deadlines, appointment reminders, and engagement campaigns.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 9, background: `rgba(212,175,55,0.08)`, border: "1px solid rgba(212,175,55,0.2)" }}>
            <span style={{ fontSize: 12 }}>✦</span>
            <span style={{ fontSize: 12, color: GOLD, fontWeight: 600 }}>Coming soon with Nova AI</span>
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "15px 20px", borderBottom: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Message History</p>
          </div>
          {messages.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: TEXT3 }}>No messages sent yet.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>
                  {m.channel === "email" ? "✉" : m.channel === "sms" ? "💬" : "🔔"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 2 }}>{m.subject}</p>
                  <p style={{ fontSize: 11, color: TEXT3 }}>To: {m.recipient_name} · From: {m.sender_name}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "rgba(34,197,94,0.1)", color: "#22C55E", textTransform: "uppercase" }}>Sent</span>
                  <p style={{ fontSize: 10, color: TEXT3, marginTop: 4 }}>{format(new Date(m.created_at), "MMM d, h:mm a")}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
