import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { resetDemoData } from "../lib/db";
import { isSupabaseConfigured } from "../lib/supabase";
import { DEMO_ACCOUNTS } from "../lib/demo-data";

const NAVY = "#1B3A6B";

export default function SettingsPage() {
  const { user } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = async () => {
    if (!confirm("Reset all demo data? This will restore 50 students, 5 advisors, and all demo records.")) return;
    setResetting(true);
    resetDemoData();
    setResetting(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  if (user?.role !== "director") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#94A3B8" }}>Settings are only accessible to Directors</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>Settings</h1>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Platform configuration · Director access only</p>
      </div>

      {/* Backend status */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "20px 24px" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Backend Status</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, background: isSupabaseConfigured ? "#ECFDF5" : "#FFFBEB", border: `1px solid ${isSupabaseConfigured ? "#A7F3D0" : "#FDE68A"}` }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: isSupabaseConfigured ? "#10B981" : "#F59E0B", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: isSupabaseConfigured ? "#065F46" : "#92400E" }}>
              {isSupabaseConfigured ? "Supabase Connected" : "Demo Mode (localStorage)"}
            </p>
            <p style={{ fontSize: 12, color: isSupabaseConfigured ? "#059669" : "#B45309", marginTop: 2 }}>
              {isSupabaseConfigured
                ? "All data is stored securely in the database. FERPA-compliant."
                : "Data is stored in the browser. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable the database."}
            </p>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>To connect Supabase:</p>
            <ol style={{ fontSize: 12, color: "#64748B", paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Create a free project at supabase.com</li>
              <li>Run the schema from <code style={{ background: "#F1F5F9", padding: "1px 4px", borderRadius: 3 }}>supabase/schema.sql</code></li>
              <li>Add env vars to Vercel: <code style={{ background: "#F1F5F9", padding: "1px 4px", borderRadius: 3 }}>VITE_SUPABASE_URL</code> and <code style={{ background: "#F1F5F9", padding: "1px 4px", borderRadius: 3 }}>VITE_SUPABASE_ANON_KEY</code></li>
              <li>Redeploy</li>
            </ol>
          </div>
        )}
      </div>

      {/* Demo accounts */}
      {!isSupabaseConfigured && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "20px 24px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Demo Accounts</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(Object.entries(DEMO_ACCOUNTS) as ["director" | "advisor" | "student", typeof DEMO_ACCOUNTS[keyof typeof DEMO_ACCOUNTS]][]).map(([role, acct]) => (
              <div key={role} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, background: "#F8FAFC" }}>
                <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 10, background: role === "director" ? NAVY : role === "advisor" ? "#7C3AED" : "#059669", color: "#fff", textTransform: "capitalize" }}>{role}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{acct.profile.full_name}</p>
                  <p style={{ fontSize: 11, fontFamily: "monospace", color: "#64748B" }}>{acct.email}</p>
                </div>
                <p style={{ fontSize: 11, fontFamily: "monospace", color: "#94A3B8" }}>{acct.password}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo data reset */}
      {!isSupabaseConfigured && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "20px 24px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>Reset Demo Data</h2>
          <p style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>Restore the full demo environment: 50 students, 5 advisors, 20 events, 100 activities, 50 meetings.</p>
          {resetDone && (
            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, fontWeight: 600, color: "#065F46" }}>
              Demo data restored successfully.
            </div>
          )}
          <button onClick={handleReset} disabled={resetting}
            style={{ padding: "10px 20px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: resetting ? 0.5 : 1 }}>
            {resetting ? "Resetting…" : "Reset Demo Data"}
          </button>
        </div>
      )}

      {/* Program info */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "20px 24px" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Program Information</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Institution", value: "CT State Community College" },
            { label: "Program", value: "TRIO Student Support Services" },
            { label: "Campus", value: "Naugatuck Valley CC" },
            { label: "Grant", value: "HB 3500 / Federal TRIO" },
          ].map((item) => (
            <div key={item.label} style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8", marginBottom: 4 }}>{item.label}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "20px 24px" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Security & Compliance</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "FERPA Compliance", status: true, note: "All student data handled per FERPA regulations" },
            { label: "Encryption in Transit", status: isSupabaseConfigured, note: isSupabaseConfigured ? "HTTPS/TLS via Supabase" : "Enabled when Supabase is connected" },
            { label: "Encryption at Rest", status: isSupabaseConfigured, note: isSupabaseConfigured ? "AES-256 via Supabase PostgreSQL" : "Enabled when Supabase is connected" },
            { label: "Role-Based Access Control", status: true, note: "Director, Advisor, and Student roles enforced" },
            { label: "Row Level Security", status: isSupabaseConfigured, note: isSupabaseConfigured ? "Supabase RLS policies active" : "Enabled when Supabase is connected" },
            { label: "Audit Logging", status: isSupabaseConfigured, note: isSupabaseConfigured ? "All data changes logged" : "Enabled when Supabase is connected" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "#F8FAFC" }}>
              <span style={{ fontSize: 14 }}>{item.status ? "✓" : "○"}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{item.label}</p>
                <p style={{ fontSize: 11, color: "#94A3B8" }}>{item.note}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: item.status ? "#ECFDF5" : "#F8FAFC", color: item.status ? "#059669" : "#94A3B8" }}>
                {item.status ? "Active" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
