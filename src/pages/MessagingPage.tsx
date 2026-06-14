import { useState, useEffect } from "react";
import { getMessages, sendMessage, getStudents } from "../lib/db";
import type { Message, TRIOStudent, MessageRecipientType, MessageChannel } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import { format } from "date-fns";

const C = {
  card: "#1B1B1B", card2: "#151515", text1: "#FFFFFF", text2: "#A0A0A0", text3: "#606060",
  red: "#C1121F", redDim: "rgba(193,18,31,0.12)", gold: "#D4AF37",
  goldDim: "rgba(212,175,55,0.12)",
  green: "#22C55E", blue: "#3B82F6", amber: "#F59E0B", purple: "#7C3AED",
  border: "rgba(255,255,255,0.07)",
};
const inp: React.CSSProperties = { width: "100%", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#0B0B0B", color: C.text1, fontFamily: "'Inter', sans-serif" };
const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.text3, marginBottom: 6, display: "block" };

const CHANNEL_LABELS: Record<MessageChannel, string> = { in_app: "In-App", email: "Email", sms: "SMS" };
const CHANNEL_STATUS: Record<MessageChannel, string> = { in_app: "Active", email: "Active", sms: "Coming Soon" };

const GROUP_LABELS: Record<string, string> = {
  first_gen: "First-Generation Students",
  low_income: "Low-Income Students",
  at_risk: "At-Risk Students",
  all_active: "All Active Students",
};

function channelColor(ch: MessageChannel) {
  return ch === "in_app" ? C.green : ch === "email" ? C.blue : C.text3;
}

function recipientColor(type: MessageRecipientType) {
  const m: Record<MessageRecipientType, string> = {
    student: C.blue, group: C.purple, program: C.red, parents: C.amber, advisors: C.gold,
  };
  return m[type];
}

export default function MessagingPage() {
  const { user } = useAuth();
  const [messages, setMessages]       = useState<Message[]>([]);
  const [students, setStudents]       = useState<TRIOStudent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [composing, setComposing]     = useState(false);
  const [selected, setSelected]       = useState<Message | null>(null);
  const [searchMsg, setSearchMsg]     = useState("");

  const [form, setForm] = useState({
    recipientType: "program" as MessageRecipientType,
    recipientId: "",
    recipientName: "All TRIO Students",
    groupKey: "all_active",
    subject: "",
    body: "",
    channel: "in_app" as MessageChannel,
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  useEffect(() => {
    Promise.all([getMessages(), getStudents()]).then(([m, s]) => {
      setMessages(m); setStudents(s); setLoading(false);
    });
  }, []);

  async function handleSend() {
    if (!user || !form.subject.trim() || !form.body.trim()) return;
    setSending(true);
    const msg = await sendMessage({
      sender_id: user.id,
      sender_name: user.full_name,
      recipient_type: form.recipientType,
      recipient_id: form.recipientType === "student" ? form.recipientId : undefined,
      recipient_name: form.recipientType === "program" ? "All TRIO Students" :
                      form.recipientType === "group" ? GROUP_LABELS[form.groupKey] :
                      form.recipientType === "advisors" ? "All Advisors" :
                      form.recipientType === "parents" ? "Parent/Guardian Contacts" :
                      form.recipientName,
      subject: form.subject,
      body: form.body,
      channel: form.channel,
    });
    setMessages((p) => [msg, ...p]);
    setSending(false);
    setSent(true);
    setTimeout(() => { setSent(false); setComposing(false); setForm({ recipientType: "program", recipientId: "", recipientName: "All TRIO Students", groupKey: "all_active", subject: "", body: "", channel: "in_app" }); }, 1500);
  }

  const filtered = messages.filter((m) => {
    const q = searchMsg.toLowerCase();
    return !q || m.subject.toLowerCase().includes(q) || m.body.toLowerCase().includes(q) || m.recipient_name.toLowerCase().includes(q) || m.sender_name.toLowerCase().includes(q);
  });

  if (loading) return <div style={{ color: C.text3, padding: 40, textAlign: "center" }}>Loading messages…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.25s ease both" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text1, letterSpacing: "-0.5px" }}>Messaging Center</h1>
          <p style={{ fontSize: 13, color: C.text3, marginTop: 3 }}>Send announcements, reminders, and outreach — replace scattered communication</p>
        </div>
        <button onClick={() => setComposing(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: C.red, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", boxShadow: "0 2px 8px rgba(193,18,31,0.3)" }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Compose Message
        </button>
      </div>

      {/* Channel status */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {(["in_app", "email", "sms"] as MessageChannel[]).map((ch) => (
          <div key={ch} style={{ background: C.card, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${channelColor(ch)}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16 }}>{ch === "in_app" ? "🔔" : ch === "email" ? "✉️" : "💬"}</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>{CHANNEL_LABELS[ch]}</p>
              <p style={{ fontSize: 11, color: CHANNEL_STATUS[ch] === "Active" ? C.green : C.text3 }}>
                {CHANNEL_STATUS[ch] === "Active" ? "● " : "○ "}{CHANNEL_STATUS[ch]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
        {/* Message list */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
            <input value={searchMsg} onChange={(e) => setSearchMsg(e.target.value)} placeholder="Search messages…" style={{ ...inp, fontSize: 12, padding: "8px 12px" }} />
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <p style={{ color: C.text3, fontSize: 13, padding: 20, textAlign: "center" }}>No messages</p>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelected(m)}
                  style={{
                    padding: "14px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                    background: selected?.id === m.id ? "rgba(255,255,255,0.04)" : "transparent",
                    borderLeft: selected?.id === m.id ? `3px solid ${C.red}` : "3px solid transparent",
                    transition: "all 0.1s",
                  }}
                  onMouseEnter={(e) => { if (selected?.id !== m.id) e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                  onMouseLeave={(e) => { if (selected?.id !== m.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: C.text1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{m.subject}</p>
                    {!m.is_read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, flexShrink: 0, marginLeft: 6, marginTop: 2 }} />}
                  </div>
                  <p style={{ fontSize: 11, color: C.text3, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>To: {m.recipient_name}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 8, background: `${channelColor(m.channel)}12`, color: channelColor(m.channel) }}>{CHANNEL_LABELS[m.channel]}</span>
                    <span style={{ fontSize: 10, color: C.text3 }}>{format(new Date(m.created_at), "MMM d")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message detail or empty */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selected ? (
            <>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text1, marginBottom: 8 }}>{selected.subject}</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: C.text3 }}>
                  <span>From: <strong style={{ color: C.text2 }}>{selected.sender_name}</strong></span>
                  <span>To: <span style={{ color: recipientColor(selected.recipient_type), fontWeight: 600 }}>{selected.recipient_name}</span></span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: `${channelColor(selected.channel)}12`, color: channelColor(selected.channel), alignSelf: "center" }}>{CHANNEL_LABELS[selected.channel]}</span>
                  <span style={{ marginLeft: "auto" }}>{format(new Date(selected.created_at), "EEEE, MMMM d, yyyy · h:mm a")}</span>
                </div>
              </div>
              <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
                <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{selected.body}</p>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 40 }}>✉️</span>
              <p style={{ fontSize: 14, color: C.text3 }}>Select a message to read</p>
              <button onClick={() => setComposing(true)} style={{ marginTop: 8, padding: "9px 18px", borderRadius: 10, background: C.red, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Compose New Message</button>
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {composing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={() => setComposing(false)}>
          <div style={{ background: C.card2, borderRadius: 18, padding: 28, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text1 }}>Compose Message</h3>
              <button onClick={() => setComposing(false)} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: C.text2, cursor: "pointer", borderRadius: 8, width: 32, height: 32, fontSize: 18 }}>×</button>
            </div>

            {/* Recipient Type */}
            <label style={lbl}>Send To</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {(["student", "group", "program", "parents", "advisors"] as MessageRecipientType[]).map((t) => (
                <button key={t} onClick={() => setForm({ ...form, recipientType: t })} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: form.recipientType === t ? recipientColor(t) : "rgba(255,255,255,0.07)", color: form.recipientType === t ? "#fff" : C.text2, fontSize: 12, fontWeight: 700, fontFamily: "'Inter', sans-serif', transition: 'all 0.1s'" }}>
                  {t === "program" ? "Entire Program" : t === "parents" ? "Parents" : t === "advisors" ? "Advisors" : t === "group" ? "Student Group" : "Single Student"}
                </button>
              ))}
            </div>

            {/* Recipient detail */}
            {form.recipientType === "student" && (
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Select Student</label>
                <select value={form.recipientId} onChange={(e) => { const s = students.find((x) => x.id === e.target.value); setForm({ ...form, recipientId: e.target.value, recipientName: s?.full_name ?? "" }); }} style={inp}>
                  <option value="">— Select a student —</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
            )}
            {form.recipientType === "group" && (
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Student Group</label>
                <select value={form.groupKey} onChange={(e) => setForm({ ...form, groupKey: e.target.value })} style={inp}>
                  {Object.entries(GROUP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            )}

            {/* Channel */}
            <label style={lbl}>Channel</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {(["in_app", "email", "sms"] as MessageChannel[]).map((ch) => (
                <button key={ch} onClick={() => ch !== "sms" && setForm({ ...form, channel: ch })} style={{ padding: "7px 14px", borderRadius: 8, border: form.channel === ch ? `1px solid ${channelColor(ch)}40` : "1px solid transparent", cursor: ch === "sms" ? "not-allowed" : "pointer", background: form.channel === ch ? channelColor(ch) + "30" : "rgba(255,255,255,0.07)", color: ch === "sms" ? C.text3 : form.channel === ch ? channelColor(ch) : C.text2, fontSize: 12, fontWeight: 700, fontFamily: "'Inter', sans-serif", opacity: ch === "sms" ? 0.5 : 1 }}>
                  {CHANNEL_LABELS[ch]} {ch === "sms" ? "(Coming Soon)" : ""}
                </button>
              ))}
            </div>

            {/* Subject */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Subject</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Message subject…" style={inp} />
            </div>

            {/* Body */}
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Message Body</label>
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={6} placeholder="Write your message here…" style={{ ...inp, resize: "vertical" }} />
            </div>

            {/* AI Templates */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.text3, marginBottom: 8 }}>✦ AI Templates</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: "Appointment Reminder", body: "Dear Student,\n\nThis is a friendly reminder that you have an upcoming advising appointment with your TRIO advisor. Please arrive on time or contact us if you need to reschedule.\n\nWe look forward to seeing you!\n\nTRIO Connect Team" },
                  { label: "FAFSA Outreach", body: "Dear Student,\n\nFAFSA renewal is now open. As a TRIO student, completing your FAFSA is essential to maintaining your financial aid. Our advisors are available to assist you.\n\nPlease schedule an appointment or drop in during office hours.\n\nBest,\nTRIO Connect Team" },
                  { label: "Check-In Reminder", body: "Dear Student,\n\nWe've noticed you haven't visited TRIO recently. We're here to support your academic journey. Please stop by or schedule a meeting — even a brief check-in can make a difference.\n\nWarm regards,\nYour TRIO Team" },
                ].map((t) => (
                  <button key={t.label} onClick={() => setForm({ ...form, subject: t.label, body: t.body })} style={{ padding: "6px 12px", borderRadius: 8, background: C.goldDim, border: `1px solid rgba(212,175,55,0.2)`, color: C.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setComposing(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${C.border}`, background: "none", color: C.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
              <button onClick={handleSend} disabled={sending || !form.subject.trim() || !form.body.trim()} style={{ flex: 2, padding: "11px", borderRadius: 10, background: sent ? "#22C55E" : C.red, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "background 0.2s" }}>
                {sent ? "✓ Sent!" : sending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

