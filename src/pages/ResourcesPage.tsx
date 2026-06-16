import { useState } from "react";

const C = {
  card: "#1B1B1B", card2: "#151515",
  text1: "#FFFFFF", text2: "#A0A0A0", text3: "#606060",
  red: "#C1121F", redDim: "rgba(193,18,31,0.12)",
  gold: "#D4AF37", goldDim: "rgba(212,175,55,0.12)",
  green: "#22C55E", blue: "#3B82F6", purple: "#7C3AED", amber: "#F59E0B",
  border: "rgba(255,255,255,0.07)",
};

const GOLD_GRADIENT = "linear-gradient(135deg,#FFF3B0 0%,#F7D774 15%,#D4AF37 30%,#FFF3B0 45%,#B8860B 60%,#F7D774 75%,#FFF8DC 100%)";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "guide" | "form" | "link" | "video" | "template" | "checklist";
  audience: "student" | "advisor" | "all";
  url?: string;
  featured?: boolean;
}

const RESOURCES: Resource[] = [
  // Financial Aid
  { id: "r01", title: "FAFSA Completion Guide", description: "Step-by-step walkthrough for completing the FAFSA for the current academic year.", category: "Financial Aid", type: "guide", audience: "student", featured: true },
  { id: "r02", title: "Federal Student Aid Glossary", description: "Key terms and definitions for understanding financial aid awards and packages.", category: "Financial Aid", type: "guide", audience: "all" },
  { id: "r03", title: "CT Need-Based Grant Program", description: "Information on Connecticut need-based grant eligibility and application requirements.", category: "Financial Aid", type: "link", audience: "student" },
  { id: "r04", title: "Scholarship Search Database", description: "Curated list of scholarships for first-generation and low-income students in Connecticut.", category: "Financial Aid", type: "link", audience: "student", featured: true },

  // Academic Support
  { id: "r05", title: "Academic Success Plan Template", description: "Fillable template for creating and tracking semester academic goals.", category: "Academic Support", type: "template", audience: "advisor" },
  { id: "r06", title: "Study Skills Workshop Slides", description: "Presentation slides from the most recent study skills and time management workshop.", category: "Academic Support", type: "guide", audience: "all" },
  { id: "r07", title: "Tutoring Referral Form", description: "Form to connect TRIO students with on-campus tutoring services.", category: "Academic Support", type: "form", audience: "advisor" },
  { id: "r08", title: "Course Planning Checklist", description: "Semester-by-semester checklist for degree completion and transfer preparation.", category: "Academic Support", type: "checklist", audience: "student" },

  // Transfer Planning
  { id: "r09", title: "CT Transfer Guide (CAP)", description: "Connecticut's College and University Articulation Plan — guaranteed transfer pathways.", category: "Transfer Planning", type: "guide", audience: "student", featured: true },
  { id: "r10", title: "Transfer Application Checklist", description: "Complete checklist covering applications, transcripts, financial aid, and housing.", category: "Transfer Planning", type: "checklist", audience: "student" },
  { id: "r11", title: "Transfer Essay Tips", description: "Guidance on writing a compelling transfer personal statement.", category: "Transfer Planning", type: "guide", audience: "student" },

  // Career Development
  { id: "r12", title: "Resume Builder Template", description: "Professional resume template tailored for first-generation college students entering the workforce.", category: "Career Development", type: "template", audience: "student" },
  { id: "r13", title: "Career Exploration Worksheet", description: "Self-assessment and career research worksheet for academic and career planning.", category: "Career Development", type: "checklist", audience: "student" },

  // TRIO Program
  { id: "r14", title: "TRIO SSS Program Handbook", description: "Student handbook covering eligibility, services, expectations, and program policies.", category: "TRIO Program", type: "guide", audience: "all" },
  { id: "r15", title: "Program Consent & Data Agreement", description: "Required signed agreement for program participation and data collection.", category: "TRIO Program", type: "form", audience: "advisor" },
  { id: "r16", title: "Annual Progress Report Template", description: "Template advisors use to document student progress toward GPRA performance measures.", category: "TRIO Program", type: "template", audience: "advisor" },

  // Mental Health & Wellness
  { id: "r17", title: "Student Mental Health Resources", description: "On-campus and community mental health services available to CT State students.", category: "Wellness", type: "link", audience: "student" },
  { id: "r18", title: "Crisis Support Contacts", description: "Emergency and crisis support contacts for students in distress.", category: "Wellness", type: "guide", audience: "all" },

  // Federal & Compliance
  { id: "r19", title: "TRIO GPRA Performance Measures", description: "Federal GPRA goals and reporting requirements for TRIO Student Support Services programs.", category: "Compliance", type: "guide", audience: "advisor" },
  { id: "r20", title: "Annual Performance Report (APR) Guide", description: "DOE instructions for completing the TRIO Annual Performance Report.", category: "Compliance", type: "guide", audience: "advisor" },
];

const CATEGORIES = ["All", ...Array.from(new Set(RESOURCES.map((r) => r.category)))];
const TYPES = ["all", "guide", "form", "link", "video", "template", "checklist"] as const;

const TYPE_COLORS: Record<string, string> = {
  guide: C.blue, form: C.purple, link: "#0891B2",
  video: C.red, template: C.amber, checklist: C.green,
};

const TYPE_ICONS: Record<string, string> = {
  guide: "📖", form: "📝", link: "🔗", video: "▶", template: "📄", checklist: "☑",
};

const AUDIENCE_LABEL: Record<string, string> = { student: "Student", advisor: "Advisor", all: "All" };

function ResourceCard({ resource, onShare }: { resource: Resource; onShare: (r: Resource) => void }) {
  const color = TYPE_COLORS[resource.type] ?? C.text3;
  return (
    <div style={{
      background: C.card, border: `1px solid ${resource.featured ? "rgba(212,175,55,0.2)" : C.border}`,
      borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12,
      transition: "all 0.15s", position: "relative", overflow: "hidden",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = resource.featured ? "rgba(212,175,55,0.2)" : C.border; e.currentTarget.style.transform = ""; }}
    >
      {resource.featured && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: GOLD_GRADIENT }} />
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
          {TYPE_ICONS[resource.type]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${color}14`, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {resource.type}
            </span>
            <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: C.text3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {AUDIENCE_LABEL[resource.audience]}
            </span>
            {resource.featured && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20, background: C.goldDim, color: C.gold, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Featured
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text1, lineHeight: 1.3 }}>{resource.title}</p>
        </div>
      </div>
      <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.55 }}>{resource.description}</p>
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button
          style={{ flex: 1, padding: "8px 0", borderRadius: 9, background: `${color}12`, border: `1px solid ${color}25`, color, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
          onMouseEnter={(e) => e.currentTarget.style.background = `${color}20`}
          onMouseLeave={(e) => e.currentTarget.style.background = `${color}12`}
        >
          {resource.type === "link" ? "Open Link" : "View Resource"}
        </button>
        <button
          onClick={() => onShare(resource)}
          style={{ padding: "8px 14px", borderRadius: 9, background: "transparent", border: `1px solid ${C.border}`, color: C.text3, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.1s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = C.text2; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text3; }}
        >
          Share
        </button>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeType, setActiveType] = useState<typeof TYPES[number]>("all");
  const [search, setSearch] = useState("");
  const [sharedResource, setSharedResource] = useState<Resource | null>(null);

  const filtered = RESOURCES.filter((r) => {
    const matchCat = activeCategory === "All" || r.category === activeCategory;
    const matchType = activeType === "all" || r.type === activeType;
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchType && matchSearch;
  });

  const featured = filtered.filter((r) => r.featured);
  const regular = filtered.filter((r) => !r.featured);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text1, letterSpacing: "-0.5px" }}>Resource Center</h1>
        <p style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>{RESOURCES.length} resources · Financial aid, academic support, transfer planning & more</p>
      </div>

      {/* AI Recommendation Banner */}
      <div style={{ background: C.goldDim, border: "1px solid rgba(212,175,55,0.2)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: GOLD_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, boxShadow: "0 2px 8px rgba(212,175,55,0.35)" }}>✦</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 3 }}>Nova AI Recommendation</p>
          <p style={{ fontSize: 12, color: "rgba(212,175,55,0.7)" }}>FAFSA deadline is in 14 days — 8 students haven't completed it yet. Share the FAFSA Completion Guide with your at-risk cohort.</p>
        </div>
        <button style={{ padding: "8px 16px", borderRadius: 9, background: GOLD_GRADIENT, border: "none", color: "#000", fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0, fontFamily: "'Inter', sans-serif" }}>
          Share Now
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", flex: "0 0 280px" }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={C.text3} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources…" style={{ background: "none", border: "none", outline: "none", flex: 1, fontSize: 13, color: C.text1, fontFamily: "'Inter', sans-serif" }} />
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {TYPES.map((t) => (
            <button key={t} onClick={() => setActiveType(t)}
              style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: activeType === t ? 700 : 400, border: `1px solid ${activeType === t ? C.red : C.border}`, background: activeType === t ? C.redDim : "transparent", color: activeType === t ? "#fff" : C.text3, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              {t === "all" ? "All Types" : `${TYPE_ICONS[t]} ${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{ padding: "6px 14px", borderRadius: 9, fontSize: 12, fontWeight: activeCategory === cat ? 700 : 400, border: `1px solid ${activeCategory === cat ? C.border : C.border}`, background: activeCategory === cat ? "rgba(255,255,255,0.1)" : "transparent", color: activeCategory === cat ? C.text1 : C.text3, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.1s" }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.text3, marginBottom: 12 }}>Featured Resources</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {featured.map((r) => <ResourceCard key={r.id} resource={r} onShare={setSharedResource} />)}
          </div>
        </div>
      )}

      {/* All Resources */}
      {regular.length > 0 && (
        <div>
          {featured.length > 0 && <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.text3, marginBottom: 12 }}>All Resources</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {regular.map((r) => <ResourceCard key={r.id} resource={r} onShare={setSharedResource} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: 14, color: C.text3 }}>No resources match your filters.</p>
          <button onClick={() => { setSearch(""); setActiveCategory("All"); setActiveType("all"); }} style={{ marginTop: 12, fontSize: 12, color: C.red, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Clear filters</button>
        </div>
      )}

      {/* Share confirmation */}
      {sharedResource && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1E1E1E", border: `1px solid ${C.green}40`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, zIndex: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", maxWidth: 360 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.green, fontSize: 16 }}>✓</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.text1 }}>Shared successfully</p>
            <p style={{ fontSize: 11, color: C.text3 }}>"{sharedResource.title}" sent to student</p>
          </div>
          <button onClick={() => setSharedResource(null)} style={{ color: C.text3, background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
      )}
    </div>
  );
}
