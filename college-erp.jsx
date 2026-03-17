
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ============================================================
// UTILITIES
// ============================================================
const generateId = (prefix = "ID") =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

const generatePassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const sanitize = (str) =>
  String(str).replace(/[<>"'&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "&": "&amp;" }[c]));

const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const gradeFromMarks = (m) => {
  if (m >= 90) return "A+";
  if (m >= 80) return "A";
  if (m >= 70) return "B+";
  if (m >= 60) return "B";
  if (m >= 50) return "C";
  if (m >= 40) return "D";
  return "F";
};

// ============================================================
// INITIAL STATE
// ============================================================
const INITIAL_STATE = {
  college: { name: "", logo: "", address: "", phone: "", email: "", description: "" },
  theme: { primary: "#2563EB", bg: "#F8FAFC", accent: "#0EA5E9", sidebar: "#1E3A5F", text: "#0F172A" },
  labels: { appTitle: "ERP Portal", studentSection: "Students", teacherSection: "Teachers", feeSection: "Fees" },
  admin: { name: "", photo: "", email: "", password: "" },
  students: [],
  teachers: [],
  classes: [],
  subjects: [],
  attendance: [],
  assignments: [],
  submissions: [],
  announcements: [],
  fees: [],
  documents: [],
  storeItems: [],
  timetable: [],
  grades: [],
  currentUser: null,
  currentRole: null,
};

// ============================================================
// STORAGE HELPERS
// ============================================================
const loadState = () => {
  try {
    const raw = sessionStorage.getItem("erp_state");
    return raw ? { ...INITIAL_STATE, ...JSON.parse(raw) } : { ...INITIAL_STATE };
  } catch { return { ...INITIAL_STATE }; }
};

const saveState = (state) => {
  try { sessionStorage.setItem("erp_state", JSON.stringify(state)); } catch {}
};

// ============================================================
// ICONS (inline SVG components)
// ============================================================
const Icon = ({ name, size = 18, className = "" }) => {
  const icons = {
    home: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    file: <><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    print: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
    whatsapp: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    check: <polyline points="20 6 9 11 4 16"/>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    id: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>,
    store: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    menu: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    award: <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
    clipboard: <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>,
    palette: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>,
    upload: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    refresh: <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {icons[name] || null}
    </svg>
  );
};

// ============================================================
// CHART COMPONENTS
// ============================================================
const BarChart = ({ data, color = "#2563EB" }) => {
  if (!data.length) return <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, padding: "0 8px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", background: color, borderRadius: "4px 4px 0 0", height: `${(d.value / max) * 100}px`, transition: "height 0.5s", opacity: 0.85 }} />
          <span style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const PieChart = ({ data }) => {
  if (!data.length) return <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>No data</div>;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const colors = ["#2563EB", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  let offset = 0;
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg viewBox="0 0 100 100" width={100} height={100}>
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = pct * circ;
          const el = (
            <circle key={i} r={r} cx={cx} cy={cy} fill="none" stroke={colors[i % colors.length]}
              strokeWidth="20" strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset * circ} transform="rotate(-90 50 50)" />
          );
          offset += pct;
          return el;
        })}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length] }} />
            <span style={{ color: "#475569" }}>{d.label}: {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// MODAL COMPONENT
// ============================================================
const Modal = ({ title, onClose, children, size = "md" }) => {
  const widths = { sm: 400, md: 560, lg: 720, xl: 900 };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: widths[size], maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1, borderRadius: "16px 16px 0 0" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#64748b" }}>
            <Icon name="close" size={16} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

// ============================================================
// FORM HELPERS
// ============================================================
const Field = ({ label, children, required }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
    </label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", background: "#f8fafc", color: "#0F172A", boxSizing: "border-box", ...props.style }}
    onFocus={e => (e.target.style.borderColor = "#2563EB")}
    onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
);

const Select = ({ children, ...props }) => (
  <select {...props} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", background: "#f8fafc", color: "#0F172A", boxSizing: "border-box", ...props.style }}>
    {children}
  </select>
);

const Textarea = ({ ...props }) => (
  <textarea {...props} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", background: "#f8fafc", color: "#0F172A", boxSizing: "border-box", resize: "vertical", minHeight: 80, ...props.style }}
    onFocus={e => (e.target.style.borderColor = "#2563EB")}
    onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
);

const Btn = ({ children, variant = "primary", onClick, style = {}, icon, size = "md", disabled = false }) => {
  const base = { border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.2s", opacity: disabled ? 0.6 : 1 };
  const sizes = { sm: { padding: "6px 12px", fontSize: 12 }, md: { padding: "10px 16px", fontSize: 14 }, lg: { padding: "12px 24px", fontSize: 15 } };
  const variants = {
    primary: { background: "#2563EB", color: "#fff" },
    secondary: { background: "#f1f5f9", color: "#374151" },
    danger: { background: "#FEE2E2", color: "#DC2626" },
    success: { background: "#D1FAE5", color: "#059669" },
    ghost: { background: "transparent", color: "#64748b" },
    whatsapp: { background: "#25D366", color: "#fff" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {icon && <Icon name={icon} size={14} />}{children}
    </button>
  );
};

const Badge = ({ children, color = "#2563EB" }) => (
  <span style={{ background: color + "20", color, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{children}</span>
);

// ============================================================
// STAT CARD
// ============================================================
const StatCard = ({ label, value, icon, color = "#2563EB", sub }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", display: "flex", gap: 16, alignItems: "flex-start" }}>
    <div style={{ width: 44, height: 44, borderRadius: 10, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
      <Icon name={icon} size={20} />
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

// ============================================================
// TABLE COMPONENT
// ============================================================
const Table = ({ cols, rows, actions }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ background: "#f8fafc" }}>
          {cols.map(c => <th key={c} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "2px solid #e2e8f0" }}>{c}</th>)}
          {actions && <th style={{ padding: "10px 14px", textAlign: "right", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "2px solid #e2e8f0" }}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={cols.length + (actions ? 1 : 0)} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No records found</td></tr>
        ) : rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            {row.cells.map((c, j) => <td key={j} style={{ padding: "12px 14px", color: "#374151" }}>{c}</td>)}
            {actions && <td style={{ padding: "12px 14px", textAlign: "right" }}>{actions(row.data)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ============================================================
// SEARCH WITH SUGGESTIONS
// ============================================================
const SmartSearch = ({ placeholder, suggestions, onSelect, value, onChange }) => {
  const [show, setShow] = useState(false);
  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && value.length > 0).slice(0, 6);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Icon name="search" size={14} className="" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        <Input placeholder={placeholder} value={value} onChange={e => { onChange(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)} onBlur={() => setTimeout(() => setShow(false), 150)}
          style={{ paddingLeft: 32 }} />
      </div>
      {show && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, border: "1px solid #e2e8f0", marginTop: 4 }}>
          {filtered.map((s, i) => (
            <div key={i} onMouseDown={() => { onSelect(s); setShow(false); }}
              style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, color: "#374151", borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// IMAGE UPLOAD HELPER
// ============================================================
const ImageUpload = ({ value, onChange, label = "Upload Image" }) => {
  const ref = useRef();
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      {value && <img src={value} alt="preview" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: "2px solid #e2e8f0" }} />}
      <Btn variant="secondary" onClick={() => ref.current.click()} icon="upload" size="sm">{label}</Btn>
      <input type="file" ref={ref} accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
};

// ============================================================
// WHATSAPP SENDER
// ============================================================
const sendWhatsApp = (phone, message) => {
  const clean = phone.replace(/\D/g, "");
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
};

// ============================================================
// PRINT HELPER
// ============================================================
const printContent = (html, title = "Print") => {
  const w = window.open("", "_blank");
  w.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}@media print{button{display:none}}</style></head><body>${html}<br/><button onclick="window.print()">Print</button></body></html>`);
  w.document.close();
};

// ============================================================
// SECTION WRAPPER
// ============================================================
const Section = ({ title, actions, children }) => (
  <div>
    {(title || actions) && (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        {title && <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0F172A" }}>{title}</h2>}
        {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", padding: 20, ...style }}>
    {children}
  </div>
);

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [state, setState] = useState(loadState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  const update = useCallback((patch) => {
    setState(prev => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }, []);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const logout = () => update({ currentUser: null, currentRole: null });

  // ---- DYNAMIC CSS VARS ----
  const cssVars = {
    "--primary": state.theme.primary,
    "--bg": state.theme.bg,
    "--accent": state.theme.accent,
    "--sidebar": state.theme.sidebar,
    "--text": state.theme.text,
  };

  // ---- LOGIN SCREEN ----
  if (!state.currentRole) {
    return <LoginScreen state={state} update={update} setActiveSection={setActiveSection} cssVars={cssVars} />;
  }

  const navItems = getNavItems(state.currentRole, state.labels);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: state.theme.bg, fontFamily: "'Segoe UI', system-ui, sans-serif", ...cssVars }}>
      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "error" ? "#FEE2E2" : "#D1FAE5", color: toast.type === "error" ? "#DC2626" : "#059669", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8, maxWidth: 320 }}>
          <Icon name={toast.type === "error" ? "x" : "check"} size={16} />
          {toast.msg}
        </div>
      )}

      {/* SIDEBAR (desktop) */}
      <aside style={{ width: 240, background: state.theme.sidebar, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: sidebarOpen ? 0 : -240, height: "100vh", zIndex: 200, transition: "left 0.3s ease" }} className="sidebar-desktop">
        <SidebarContent state={state} navItems={navItems} activeSection={activeSection} setActiveSection={(s) => { setActiveSection(s); setSidebarOpen(false); }} logout={logout} />
      </aside>

      {/* OVERLAY */}
      {sidebarOpen && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 199 }} onClick={() => setSidebarOpen(false)} />}

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* TOP BAR */}
        <TopBar state={state} setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} />

        {/* CONTENT */}
        <main style={{ flex: 1, padding: "24px 20px 80px", maxWidth: 1200, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          <PanelRouter
            section={activeSection}
            state={state}
            update={update}
            showToast={showToast}
            setModal={setModal}
            setActiveSection={setActiveSection}
          />
        </main>

        {/* BOTTOM NAV (mobile) */}
        <BottomNav navItems={navItems.slice(0, 5)} activeSection={activeSection} setActiveSection={setActiveSection} primary={state.theme.primary} />
      </div>

      {/* MODAL */}
      {modal && <Modal title={modal.title} onClose={() => setModal(null)} size={modal.size}>{modal.content}</Modal>}

      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { left: 0 !important; }
          main { padding-left: 260px !important; padding-bottom: 24px !important; }
          .bottom-nav { display: none !important; }
          .top-hamburger { display: none !important; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        input, select, textarea { font-family: inherit; }
      `}</style>
    </div>
  );
}

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ state, update, setActiveSection, cssVars }) {
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleLogin = () => {
    setErr("");
    if (!email || !password) { setErr("Please enter email and password."); return; }
    if (role === "admin") {
      if (!state.admin.email || !state.admin.password) {
        // First time setup
        update({ admin: { ...state.admin, email, password }, currentUser: { email, name: "Admin", role: "admin" }, currentRole: "admin" });
        setActiveSection("dashboard");
        return;
      }
      if (state.admin.email === email && state.admin.password === password) {
        update({ currentUser: { email, name: state.admin.name || "Admin", role: "admin" }, currentRole: "admin" });
        setActiveSection("dashboard");
      } else setErr("Invalid credentials.");
    } else if (role === "teacher") {
      const t = state.teachers.find(t => t.email === email && t.password === password);
      if (t) { update({ currentUser: { ...t, role: "teacher" }, currentRole: "teacher" }); setActiveSection("dashboard"); }
      else setErr("Invalid credentials.");
    } else {
      const s = state.students.find(s => s.email === email && s.password === password);
      if (s) { update({ currentUser: { ...s, role: "student" }, currentRole: "student" }); setActiveSection("dashboard"); }
      else setErr("Invalid credentials.");
    }
  };

  const primary = state.theme?.primary || "#2563EB";

  return (
    <div style={{ minHeight: "100vh", background: state.theme?.bg || "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Segoe UI', system-ui, sans-serif", ...cssVars }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* College Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {state.college?.logo ? <img src={state.college.logo} alt="logo" style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", marginBottom: 12 }} /> : <div style={{ width: 72, height: 72, borderRadius: 16, background: primary + "20", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: primary }}><Icon name="book" size={32} /></div>}
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>{state.college?.name || state.labels?.appTitle || "College ERP"}</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Sign in to continue</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: 32 }}>
          {/* Role Tabs */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["admin", "teacher", "student"].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: "8px 4px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12, transition: "all 0.2s", background: role === r ? "#fff" : "transparent", color: role === r ? primary : "#64748b", boxShadow: role === r ? "0 1px 4px rgba(0,0,0,0.1)" : "none", textTransform: "capitalize" }}>
                {r}
              </button>
            ))}
          </div>

          {role === "admin" && !state.admin?.email && (
            <div style={{ background: "#EFF6FF", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: "#1D4ED8" }}>
              <strong>First time setup:</strong> Enter your email &amp; password to create the admin account.
            </div>
          )}

          <Field label="Email" required><Input type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
          <Field label="Password" required>
            <div style={{ position: "relative" }}>
              <Input type={showPw ? "text" : "password"} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ paddingRight: 40 }} />
              <button onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <Icon name="eye" size={16} />
              </button>
            </div>
          </Field>

          {err && <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{err}</div>}

          <Btn onClick={handleLogin} style={{ width: "100%", justifyContent: "center" }}>Sign In</Btn>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NAV ITEMS
// ============================================================
function getNavItems(role, labels) {
  const all = [
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "students", label: labels?.studentSection || "Students", icon: "users", roles: ["admin"] },
    { id: "teachers", label: labels?.teacherSection || "Teachers", icon: "user", roles: ["admin"] },
    { id: "classes", label: "Classes", icon: "book", roles: ["admin"] },
    { id: "attendance", label: "Attendance", icon: "clipboard", roles: ["admin", "teacher"] },
    { id: "assignments", label: "Assignments", icon: "file", roles: ["admin", "teacher", "student"] },
    { id: "announcements", label: "Announcements", icon: "bell", roles: ["admin", "teacher", "student"] },
    { id: "fees", label: labels?.feeSection || "Fees", icon: "dollar", roles: ["admin", "student"] },
    { id: "whatsapp", label: "WhatsApp", icon: "whatsapp", roles: ["admin", "teacher"] },
    { id: "analytics", label: "Analytics", icon: "chart", roles: ["admin"] },
    { id: "documents", label: "Documents", icon: "file", roles: ["admin", "student"] },
    { id: "store", label: "Store", icon: "store", roles: ["admin", "student"] },
    { id: "idcard", label: "ID Cards", icon: "id", roles: ["admin", "student"] },
    { id: "reportcard", label: "Report Card", icon: "award", roles: ["admin", "teacher", "student"] },
    { id: "timetable", label: "Timetable", icon: "clock", roles: ["admin", "teacher", "student"] },
    { id: "profile", label: "Profile", icon: "user" },
    { id: "settings", label: "Settings", icon: "settings", roles: ["admin"] },
  ];
  return all.filter(n => !n.roles || n.roles.includes(role));
}

// ============================================================
// SIDEBAR CONTENT
// ============================================================
function SidebarContent({ state, navItems, activeSection, setActiveSection, logout }) {
  const primary = state.theme.primary;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {state.college.logo ? <img src={state.college.logo} alt="logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon name="book" size={18} /></div>}
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{state.college.name || state.labels.appTitle}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>ERP System</div>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setActiveSection(n.id)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: activeSection === n.id ? "rgba(255,255,255,0.15)" : "transparent", color: activeSection === n.id ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: activeSection === n.id ? 600 : 400, fontSize: 13, textAlign: "left", transition: "all 0.2s" }}
            onMouseEnter={e => { if (activeSection !== n.id) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={e => { if (activeSection !== n.id) e.currentTarget.style.background = "transparent"; }}>
            <Icon name={n.icon} size={16} />{n.label}
          </button>
        ))}
      </nav>
      {/* User */}
      <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {state.currentUser?.photo ? <img src={state.currentUser.photo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} /> : <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{(state.currentUser?.name || "U")[0]}</div>}
          <div>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{state.currentUser?.name || state.currentUser?.email}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "capitalize" }}>{state.currentRole}</div>
          </div>
        </div>
        <button onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "none", borderRadius: 8, cursor: "pointer", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500 }}>
          <Icon name="logout" size={14} />Sign Out
        </button>
      </div>
    </div>
  );
}

// ============================================================
// TOP BAR
// ============================================================
function TopBar({ state, setSidebarOpen, sidebarOpen }) {
  return (
    <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="top-hamburger" onClick={() => setSidebarOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4, display: "flex" }}>
          <Icon name={sidebarOpen ? "close" : "menu"} size={20} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{state.college.name || state.labels.appTitle || "ERP Portal"}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 12, color: "#64748b", textAlign: "right" }}>
          <div style={{ fontWeight: 600, color: "#374151" }}>{state.currentUser?.name || state.currentUser?.email}</div>
          <div style={{ textTransform: "capitalize" }}>{state.currentRole}</div>
        </div>
        {state.currentUser?.photo ? <img src={state.currentUser.photo} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover" }} /> : <div style={{ width: 34, height: 34, borderRadius: 8, background: state.theme.primary + "20", display: "flex", alignItems: "center", justifyContent: "center", color: state.theme.primary, fontWeight: 700, fontSize: 14 }}>{(state.currentUser?.name || state.currentUser?.email || "U")[0].toUpperCase()}</div>}
      </div>
    </header>
  );
}

// ============================================================
// BOTTOM NAV
// ============================================================
function BottomNav({ navItems, activeSection, setActiveSection, primary }) {
  return (
    <nav className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", zIndex: 100, height: 60 }}>
      {navItems.map(n => (
        <button key={n.id} onClick={() => setActiveSection(n.id)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, border: "none", background: "transparent", cursor: "pointer", color: activeSection === n.id ? primary : "#94a3b8", fontSize: 9, fontWeight: activeSection === n.id ? 700 : 400, padding: 4, transition: "color 0.2s" }}>
          <Icon name={n.icon} size={18} />
          <span>{n.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ============================================================
// PANEL ROUTER
// ============================================================
function PanelRouter({ section, state, update, showToast, setModal, setActiveSection }) {
  const props = { state, update, showToast, setModal, setActiveSection };
  const map = {
    dashboard: <DashboardPanel {...props} />,
    students: <StudentsPanel {...props} />,
    teachers: <TeachersPanel {...props} />,
    classes: <ClassesPanel {...props} />,
    attendance: <AttendancePanel {...props} />,
    assignments: <AssignmentsPanel {...props} />,
    announcements: <AnnouncementsPanel {...props} />,
    fees: <FeesPanel {...props} />,
    whatsapp: <WhatsAppPanel {...props} />,
    analytics: <AnalyticsPanel {...props} />,
    documents: <DocumentsPanel {...props} />,
    store: <StorePanel {...props} />,
    idcard: <IDCardPanel {...props} />,
    reportcard: <ReportCardPanel {...props} />,
    timetable: <TimetablePanel {...props} />,
    profile: <ProfilePanel {...props} />,
    settings: <SettingsPanel {...props} />,
  };
  return map[section] || map.dashboard;
}

// ============================================================
// DASHBOARD
// ============================================================
function DashboardPanel({ state, update, showToast, setActiveSection }) {
  const role = state.currentRole;
  const totalStudents = state.students.length;
  const totalTeachers = state.teachers.length;
  const pendingFees = state.fees.filter(f => f.status === "pending").length;
  const recentAnnouncements = state.announcements.slice(-3).reverse();
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAtt = state.attendance.filter(a => a.date === todayStr);
  const presentToday = todayAtt.filter(a => a.status === "present").length;

  return (
    <Section title={`Welcome${state.currentUser?.name ? ", " + state.currentUser.name : ""}!`}>
      {(role === "admin" || role === "teacher") && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
          {role === "admin" && <StatCard label="Total Students" value={totalStudents} icon="users" color="#2563EB" />}
          {role === "admin" && <StatCard label="Total Teachers" value={totalTeachers} icon="user" color="#0EA5E9" />}
          {role === "admin" && <StatCard label="Pending Fees" value={pendingFees} icon="dollar" color="#F59E0B" />}
          <StatCard label="Present Today" value={presentToday} icon="check" color="#10B981" />
          <StatCard label="Announcements" value={state.announcements.length} icon="bell" color="#8B5CF6" />
        </div>
      )}

      {role === "student" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
          {(() => {
            const myAtt = state.attendance.filter(a => a.studentId === state.currentUser?.id);
            const pct = myAtt.length ? Math.round(myAtt.filter(a => a.status === "present").length / myAtt.length * 100) : 0;
            const myFees = state.fees.filter(f => f.studentId === state.currentUser?.id);
            const due = myFees.filter(f => f.status === "pending").reduce((s, f) => s + Number(f.amount), 0);
            const mySubs = state.submissions.filter(s => s.studentId === state.currentUser?.id);
            return <>
              <StatCard label="My Attendance" value={`${pct}%`} icon="clipboard" color={pct < 75 ? "#EF4444" : "#10B981"} sub={pct < 75 ? "⚠ Low attendance" : "Good standing"} />
              <StatCard label="Fee Due" value={`₹${due}`} icon="dollar" color="#F59E0B" />
              <StatCard label="Assignments" value={mySubs.length} icon="file" color="#8B5CF6" />
              <StatCard label="Announcements" value={state.announcements.length} icon="bell" color="#2563EB" />
            </>;
          })()}
        </div>
      )}

      {/* Announcements */}
      {recentAnnouncements.length > 0 && (
        <Card>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#374151" }}>Recent Announcements</h3>
          {recentAnnouncements.map((a, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: i < recentAnnouncements.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{a.title}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{a.message}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{formatDate(a.date)} · {a.postedBy}</div>
            </div>
          ))}
        </Card>
      )}

      {totalStudents === 0 && role === "admin" && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <Icon name="book" size={40} style={{ color: "#cbd5e1", marginBottom: 12 }} />
          <h3 style={{ color: "#374151", margin: "0 0 8px" }}>Get Started</h3>
          <p style={{ color: "#64748b", margin: "0 0 16px", fontSize: 14 }}>Set up your college profile and start adding students and teachers.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn onClick={() => setActiveSection("settings")} icon="settings">College Settings</Btn>
            <Btn variant="secondary" onClick={() => setActiveSection("students")} icon="users">Add Students</Btn>
          </div>
        </Card>
      )}
    </Section>
  );
}

// ============================================================
// STUDENTS PANEL
// ============================================================
function StudentsPanel({ state, update, showToast }) {
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [form, setForm] = useState(null);
  const [viewStu, setViewStu] = useState(null);

  const filtered = state.students.filter(s =>
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterClass || s.classId === filterClass)
  );

  const suggestions = state.students.map(s => `${s.name} (${s.id})`);

  const saveStudent = () => {
    if (!form.name || !form.email) { showToast("Name and email are required", "error"); return; }
    if (state.students.some(s => s.email === form.email && s.id !== form.id)) { showToast("Email already exists", "error"); return; }
    update(prev => {
      const students = form.id && form._existing
        ? prev.students.map(s => s.id === form.id ? { ...form } : s)
        : [...prev.students, { ...form, id: generateId("STU"), password: form.password || generatePassword(), createdAt: new Date().toISOString() }];
      return { ...prev, students };
    });
    showToast(form._existing ? "Student updated" : "Student added");
    setForm(null);
  };

  const deleteStudent = (id) => {
    if (!window.confirm("Delete this student?")) return;
    update(prev => ({ ...prev, students: prev.students.filter(s => s.id !== id) }));
    showToast("Student deleted");
  };

  const openAdd = () => setForm({ name: "", email: "", phone: "", parentPhone: "", classId: "", photo: "", address: "", dob: "", gender: "" });
  const openEdit = (s) => setForm({ ...s, _existing: true });

  return (
    <Section title="Student Management" actions={<Btn icon="plus" onClick={openAdd}>Add Student</Btn>}>
      <Card>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SmartSearch placeholder="Search students..." suggestions={suggestions} value={search} onChange={setSearch} onSelect={v => setSearch(v.split(" (")[0])} />
          </div>
          <Select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ width: 160 }}>
            <option value="">All Classes</option>
            {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>

        <Table
          cols={["Photo", "ID", "Name", "Email", "Class", "Parent Phone", "Status"]}
          rows={filtered.map(s => ({
            data: s,
            cells: [
              s.photo ? <img src={s.photo} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} alt="" /> : <div style={{ width: 32, height: 32, borderRadius: 6, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontWeight: 700, fontSize: 12 }}>{s.name[0]}</div>,
              <Badge color="#2563EB">{s.id}</Badge>,
              s.name,
              s.email,
              state.classes.find(c => c.id === s.classId)?.name || "-",
              s.parentPhone || "-",
              <Badge color="#10B981">Active</Badge>
            ]
          }))}
          actions={(s) => (
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
              <Btn size="sm" variant="secondary" icon="eye" onClick={() => setViewStu(s)}>View</Btn>
              <Btn size="sm" variant="secondary" icon="edit" onClick={() => openEdit(s)}>Edit</Btn>
              <Btn size="sm" variant="danger" icon="trash" onClick={() => deleteStudent(s.id)}>Del</Btn>
            </div>
          )}
        />
      </Card>

      {/* Add/Edit Modal */}
      {form && (
        <Modal title={form._existing ? "Edit Student" : "Add Student"} onClose={() => setForm(null)} size="lg">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Full Name" required><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Student name" /></Field>
            <Field label="Email" required><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" /></Field>
            <Field label="Parent Phone"><Input value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} placeholder="Parent phone" /></Field>
            <Field label="Class">
              <Select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
                <option value="">Select class</option>
                {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Date of Birth"><Input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} /></Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Password">
              <div style={{ display: "flex", gap: 8 }}>
                <Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Auto-generated if empty" />
                <Btn size="sm" variant="secondary" onClick={() => setForm(f => ({ ...f, password: generatePassword() }))} icon="refresh">Gen</Btn>
              </div>
            </Field>
          </div>
          <Field label="Address"><Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Address" /></Field>
          <Field label="Photo"><ImageUpload value={form.photo} onChange={v => setForm(f => ({ ...f, photo: v }))} /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={saveStudent}>{form._existing ? "Update" : "Add Student"}</Btn>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewStu && (
        <Modal title="Student Profile" onClose={() => setViewStu(null)}>
          <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
            {viewStu.photo ? <img src={viewStu.photo} style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover" }} alt="" /> : <div style={{ width: 80, height: 80, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 28, fontWeight: 800 }}>{viewStu.name[0]}</div>}
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>{viewStu.name}</h2>
              <Badge color="#2563EB">{viewStu.id}</Badge>
              <div style={{ marginTop: 8, color: "#64748b", fontSize: 13 }}>{viewStu.email}</div>
            </div>
          </div>
          {[["Class", state.classes.find(c => c.id === viewStu.classId)?.name || "-"], ["Phone", viewStu.phone || "-"], ["Parent Phone", viewStu.parentPhone || "-"], ["DOB", viewStu.dob || "-"], ["Gender", viewStu.gender || "-"], ["Address", viewStu.address || "-"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 14 }}>
              <span style={{ color: "#64748b", width: 120, flexShrink: 0 }}>{k}</span>
              <span style={{ color: "#0F172A" }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="whatsapp" icon="whatsapp" onClick={() => sendWhatsApp(viewStu.parentPhone || viewStu.phone, `Hello, this is a message from ${state.college.name}. Regarding student ${viewStu.name}.`)}>Message Parent</Btn>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ============================================================
// TEACHERS PANEL
// ============================================================
function TeachersPanel({ state, update, showToast }) {
  const [form, setForm] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = state.teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()));

  const save = () => {
    if (!form.name || !form.email) { showToast("Name and email required", "error"); return; }
    if (state.teachers.some(t => t.email === form.email && t.id !== form.id)) { showToast("Email exists", "error"); return; }
    update(prev => {
      const teachers = form._existing
        ? prev.teachers.map(t => t.id === form.id ? form : t)
        : [...prev.teachers, { ...form, id: generateId("TCH"), password: form.password || generatePassword(), createdAt: new Date().toISOString() }];
      return { ...prev, teachers };
    });
    showToast(form._existing ? "Updated" : "Teacher added");
    setForm(null);
  };

  return (
    <Section title="Teacher Management" actions={<Btn icon="plus" onClick={() => setForm({ name: "", email: "", phone: "", subjects: [], photo: "", qualification: "" })}>Add Teacher</Btn>}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <SmartSearch placeholder="Search teachers..." suggestions={state.teachers.map(t => t.name)} value={search} onChange={setSearch} onSelect={setSearch} />
        </div>
        <Table
          cols={["Photo", "ID", "Name", "Email", "Phone", "Subjects"]}
          rows={filtered.map(t => ({
            data: t,
            cells: [
              t.photo ? <img src={t.photo} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} alt="" /> : <div style={{ width: 32, height: 32, borderRadius: 6, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", fontWeight: 700, fontSize: 12 }}>{t.name[0]}</div>,
              <Badge color="#059669">{t.id}</Badge>,
              t.name,
              t.email,
              t.phone || "-",
              (t.subjects || []).map(s => <Badge key={s} color="#8B5CF6" style={{ marginRight: 4 }}>{s}</Badge>)
            ]
          }))}
          actions={(t) => (
            <div style={{ display: "flex", gap: 4 }}>
              <Btn size="sm" variant="secondary" icon="edit" onClick={() => setForm({ ...t, _existing: true })}>Edit</Btn>
              <Btn size="sm" variant="danger" icon="trash" onClick={() => { if (window.confirm("Delete?")) { update(p => ({ ...p, teachers: p.teachers.filter(x => x.id !== t.id) })); showToast("Deleted"); } }}>Del</Btn>
            </div>
          )}
        />
      </Card>

      {form && (
        <Modal title={form._existing ? "Edit Teacher" : "Add Teacher"} onClose={() => setForm(null)} size="lg">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Full Name" required><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="Email" required><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
            <Field label="Qualification"><Input value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} /></Field>
            <Field label="Password">
              <div style={{ display: "flex", gap: 8 }}>
                <Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Auto-generated if empty" />
                <Btn size="sm" variant="secondary" onClick={() => setForm(f => ({ ...f, password: generatePassword() }))} icon="refresh">Gen</Btn>
              </div>
            </Field>
          </div>
          <Field label="Subjects (comma-separated)">
            <Input value={(form.subjects || []).join(", ")} onChange={e => setForm(f => ({ ...f, subjects: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} placeholder="Math, Science, English" />
          </Field>
          <Field label="Photo"><ImageUpload value={form.photo} onChange={v => setForm(f => ({ ...f, photo: v }))} /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>{form._existing ? "Update" : "Add"}</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ============================================================
// CLASSES PANEL
// ============================================================
function ClassesPanel({ state, update, showToast }) {
  const [form, setForm] = useState(null);

  const save = () => {
    if (!form.name) { showToast("Class name required", "error"); return; }
    update(prev => {
      const classes = form._existing ? prev.classes.map(c => c.id === form.id ? form : c) : [...prev.classes, { ...form, id: generateId("CLS") }];
      return { ...prev, classes };
    });
    showToast("Saved"); setForm(null);
  };

  return (
    <Section title="Classes & Sections" actions={<Btn icon="plus" onClick={() => setForm({ name: "", section: "", teacherId: "", subjects: [] })}>Add Class</Btn>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {state.classes.length === 0 ? (
          <Card><div style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>No classes yet. Add your first class.</div></Card>
        ) : state.classes.map(c => (
          <Card key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>{c.name}</div>
                {c.section && <div style={{ color: "#64748b", fontSize: 13 }}>Section: {c.section}</div>}
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Teacher: {state.teachers.find(t => t.id === c.teacherId)?.name || "Unassigned"}</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>Students: {state.students.filter(s => s.classId === c.id).length}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Btn size="sm" variant="secondary" icon="edit" onClick={() => setForm({ ...c, _existing: true })} />
                <Btn size="sm" variant="danger" icon="trash" onClick={() => { if (window.confirm("Delete?")) { update(p => ({ ...p, classes: p.classes.filter(x => x.id !== c.id) })); showToast("Deleted"); } }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {form && (
        <Modal title={form._existing ? "Edit Class" : "Add Class"} onClose={() => setForm(null)}>
          <Field label="Class Name" required><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Class 10" /></Field>
          <Field label="Section"><Input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="e.g. A" /></Field>
          <Field label="Class Teacher">
            <Select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
              <option value="">Select teacher</option>
              {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </Field>
          <Field label="Subjects (comma-separated)"><Input value={(form.subjects || []).join(", ")} onChange={e => setForm(f => ({ ...f, subjects: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} placeholder="Math, Science, English" /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>Save</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ============================================================
// ATTENDANCE PANEL
// ============================================================
function AttendancePanel({ state, update, showToast }) {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attMap, setAttMap] = useState({});
  const [viewMode, setViewMode] = useState("mark");

  const classStudents = state.students.filter(s => s.classId === selectedClass);

  useEffect(() => {
    if (!selectedClass || !selectedDate) return;
    const existing = {};
    state.attendance.filter(a => a.classId === selectedClass && a.date === selectedDate).forEach(a => { existing[a.studentId] = a.status; });
    setAttMap(existing);
  }, [selectedClass, selectedDate, state.attendance]);

  const toggleAll = (status) => {
    const m = {};
    classStudents.forEach(s => m[s.id] = status);
    setAttMap(m);
  };

  const save = () => {
    if (!selectedClass || !selectedDate) { showToast("Select class and date", "error"); return; }
    update(prev => {
      const filtered = prev.attendance.filter(a => !(a.classId === selectedClass && a.date === selectedDate));
      const newRecs = classStudents.map(s => ({
        id: generateId("ATT"), studentId: s.id, classId: selectedClass, date: selectedDate, status: attMap[s.id] || "absent"
      }));
      return { ...prev, attendance: [...filtered, ...newRecs] };
    });
    showToast("Attendance saved");
  };

  const getAttPct = (studentId) => {
    const all = state.attendance.filter(a => a.studentId === studentId);
    if (!all.length) return null;
    return Math.round(all.filter(a => a.status === "present").length / all.length * 100);
  };

  return (
    <Section title="Attendance System">
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Btn variant={viewMode === "mark" ? "primary" : "secondary"} onClick={() => setViewMode("mark")}>Mark Attendance</Btn>
        <Btn variant={viewMode === "report" ? "primary" : "secondary"} onClick={() => setViewMode("report")}>View Report</Btn>
      </div>

      {viewMode === "mark" && (
        <Card>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ flex: 1, minWidth: 150 }}>
              <option value="">Select Class</option>
              {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ flex: 1, minWidth: 150 }} />
          </div>

          {selectedClass && classStudents.length > 0 && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <Btn size="sm" variant="success" onClick={() => toggleAll("present")}>All Present</Btn>
                <Btn size="sm" variant="danger" onClick={() => toggleAll("absent")}>All Absent</Btn>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {classStudents.map(s => {
                  const pct = getAttPct(s.id);
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                        {s.photo ? <img src={s.photo} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} alt="" /> : <div style={{ width: 32, height: 32, borderRadius: 6, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontWeight: 700 }}>{s.name[0]}</div>}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                          {pct !== null && <div style={{ fontSize: 11, color: pct < 75 ? "#DC2626" : "#059669" }}>{pct}% attendance {pct < 75 && "⚠ Low"}</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["present", "absent", "late"].map(status => (
                          <button key={status} onClick={() => setAttMap(m => ({ ...m, [s.id]: status }))}
                            style={{ padding: "5px 12px", borderRadius: 6, border: "1.5px solid", cursor: "pointer", fontSize: 12, fontWeight: 600, textTransform: "capitalize", transition: "all 0.15s",
                              background: attMap[s.id] === status ? (status === "present" ? "#D1FAE5" : status === "late" ? "#FEF3C7" : "#FEE2E2") : "#fff",
                              borderColor: attMap[s.id] === status ? (status === "present" ? "#059669" : status === "late" ? "#D97706" : "#DC2626") : "#e2e8f0",
                              color: attMap[s.id] === status ? (status === "present" ? "#059669" : status === "late" ? "#D97706" : "#DC2626") : "#64748b" }}>
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16 }}>
                <Btn onClick={save}>Save Attendance</Btn>
              </div>
            </>
          )}
          {selectedClass && classStudents.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>No students in this class.</div>}
          {!selectedClass && <div style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>Select a class to mark attendance.</div>}
        </Card>
      )}

      {viewMode === "report" && (
        <Card>
          <Table
            cols={["Student", "Class", "Present", "Absent", "Late", "Percentage", "Status"]}
            rows={state.students.map(s => {
              const att = state.attendance.filter(a => a.studentId === s.id);
              const present = att.filter(a => a.status === "present").length;
              const absent = att.filter(a => a.status === "absent").length;
              const late = att.filter(a => a.status === "late").length;
              const pct = att.length ? Math.round(present / att.length * 100) : 0;
              return {
                data: s,
                cells: [
                  s.name,
                  state.classes.find(c => c.id === s.classId)?.name || "-",
                  present, absent, late,
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ height: 6, width: 80, background: "#e2e8f0", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct < 75 ? "#EF4444" : "#10B981", borderRadius: 3 }} />
                    </div>
                    {pct}%
                  </div>,
                  <Badge color={pct < 75 ? "#EF4444" : "#10B981"}>{pct < 75 ? "Low" : "Good"}</Badge>
                ]
              };
            })}
          />
        </Card>
      )}
    </Section>
  );
}

// ============================================================
// ASSIGNMENTS PANEL
// ============================================================
function AssignmentsPanel({ state, update, showToast }) {
  const role = state.currentRole;
  const [form, setForm] = useState(null);
  const [viewAssign, setViewAssign] = useState(null);

  const myAssignments = role === "student"
    ? state.assignments.filter(a => a.classId === state.currentUser?.classId)
    : role === "teacher"
    ? state.assignments.filter(a => a.teacherId === state.currentUser?.id)
    : state.assignments;

  const save = () => {
    if (!form.title || !form.classId) { showToast("Title and class required", "error"); return; }
    update(prev => {
      const assignments = form._existing
        ? prev.assignments.map(a => a.id === form.id ? form : a)
        : [...prev.assignments, { ...form, id: generateId("ASN"), teacherId: prev.currentUser?.id, teacherName: prev.currentUser?.name, createdAt: new Date().toISOString() }];
      return { ...prev, assignments };
    });
    showToast("Saved"); setForm(null);
  };

  const submitAssignment = (assignmentId, text, file) => {
    const existing = state.submissions.find(s => s.assignmentId === assignmentId && s.studentId === state.currentUser?.id);
    if (existing) { showToast("Already submitted", "error"); return; }
    update(prev => ({ ...prev, submissions: [...prev.submissions, { id: generateId("SUB"), assignmentId, studentId: prev.currentUser?.id, studentName: prev.currentUser?.name, text, file, submittedAt: new Date().toISOString(), status: "submitted" }] }));
    showToast("Assignment submitted!");
  };

  return (
    <Section title="Assignments"
      actions={(role === "admin" || role === "teacher") && <Btn icon="plus" onClick={() => setForm({ title: "", description: "", classId: "", dueDate: "", maxMarks: 100 })}>Create Assignment</Btn>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {myAssignments.length === 0 ? (
          <Card><div style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No assignments found.</div></Card>
        ) : myAssignments.map(a => {
          const subs = state.submissions.filter(s => s.assignmentId === a.id);
          const mySub = state.submissions.find(s => s.assignmentId === a.id && s.studentId === state.currentUser?.id);
          const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();
          return (
            <Card key={a.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{a.title}</h3>
                    {isOverdue && <Badge color="#EF4444">Overdue</Badge>}
                    {mySub && <Badge color="#10B981">Submitted</Badge>}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{a.description}</div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "#94a3b8", flexWrap: "wrap" }}>
                    <span>Class: {state.classes.find(c => c.id === a.classId)?.name || a.classId}</span>
                    {a.dueDate && <span>Due: {formatDate(a.dueDate)}</span>}
                    {a.maxMarks && <span>Max Marks: {a.maxMarks}</span>}
                    {(role === "admin" || role === "teacher") && <span>Submissions: {subs.length}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(role === "admin" || role === "teacher") && (
                    <>
                      <Btn size="sm" variant="secondary" icon="eye" onClick={() => setViewAssign(a)}>Submissions</Btn>
                      <Btn size="sm" variant="danger" icon="trash" onClick={() => { if (window.confirm("Delete?")) { update(p => ({ ...p, assignments: p.assignments.filter(x => x.id !== a.id) })); showToast("Deleted"); } }} />
                    </>
                  )}
                  {role === "student" && !mySub && (
                    <SubmitAssignmentBtn assignment={a} onSubmit={submitAssignment} />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {form && (
        <Modal title="Create Assignment" onClose={() => setForm(null)}>
          <Field label="Title" required><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Description"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
          <Field label="Class" required>
            <Select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
              <option value="">Select class</option>
              {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Due Date"><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></Field>
            <Field label="Max Marks"><Input type="number" value={form.maxMarks} onChange={e => setForm(f => ({ ...f, maxMarks: e.target.value }))} /></Field>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>Create</Btn>
          </div>
        </Modal>
      )}

      {viewAssign && (
        <Modal title={`Submissions: ${viewAssign.title}`} onClose={() => setViewAssign(null)} size="lg">
          <Table
            cols={["Student", "Submitted At", "Text", "Status"]}
            rows={state.submissions.filter(s => s.assignmentId === viewAssign.id).map(sub => ({
              data: sub,
              cells: [sub.studentName, formatDate(sub.submittedAt), sub.text?.substring(0, 60) || "-", <Badge color="#10B981">{sub.status}</Badge>]
            }))}
          />
          {state.submissions.filter(s => s.assignmentId === viewAssign.id).length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>No submissions yet.</div>}
        </Modal>
      )}
    </Section>
  );
}

function SubmitAssignmentBtn({ assignment, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <>
      <Btn size="sm" onClick={() => setOpen(true)}>Submit</Btn>
      {open && (
        <Modal title="Submit Assignment" onClose={() => setOpen(false)}>
          <Field label="Your Answer / Notes"><Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type your answer here..." /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn onClick={() => { onSubmit(assignment.id, text); setOpen(false); }}>Submit</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}

// ============================================================
// ANNOUNCEMENTS PANEL
// ============================================================
function AnnouncementsPanel({ state, update, showToast }) {
  const role = state.currentRole;
  const [form, setForm] = useState(null);

  const save = () => {
    if (!form.title || !form.message) { showToast("Title and message required", "error"); return; }
    update(prev => ({ ...prev, announcements: [...prev.announcements, { ...form, id: generateId("ANN"), postedBy: prev.currentUser?.name || "Admin", date: new Date().toISOString() }] }));
    showToast("Posted"); setForm(null);
  };

  return (
    <Section title="Announcements"
      actions={(role === "admin" || role === "teacher") && <Btn icon="plus" onClick={() => setForm({ title: "", message: "", priority: "normal", targetClass: "" })}>Post Announcement</Btn>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {state.announcements.length === 0 ? (
          <Card><div style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No announcements yet.</div></Card>
        ) : [...state.announcements].reverse().map(a => (
          <Card key={a.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{a.title}</h3>
                  {a.priority === "urgent" && <Badge color="#EF4444">Urgent</Badge>}
                  {a.targetClass && <Badge color="#8B5CF6">{state.classes.find(c => c.id === a.targetClass)?.name}</Badge>}
                </div>
                <p style={{ color: "#374151", fontSize: 14, margin: "8px 0" }}>{a.message}</p>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{formatDate(a.date)} · Posted by {a.postedBy}</div>
              </div>
              {(role === "admin") && (
                <Btn size="sm" variant="danger" icon="trash" onClick={() => { update(p => ({ ...p, announcements: p.announcements.filter(x => x.id !== a.id) })); showToast("Deleted"); }} />
              )}
            </div>
          </Card>
        ))}
      </div>

      {form && (
        <Modal title="Post Announcement" onClose={() => setForm(null)}>
          <Field label="Title" required><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Message" required><Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Priority">
              <Select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </Select>
            </Field>
            <Field label="Target Class (optional)">
              <Select value={form.targetClass} onChange={e => setForm(f => ({ ...f, targetClass: e.target.value }))}>
                <option value="">All Classes</option>
                {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>Post</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ============================================================
// FEES PANEL
// ============================================================
function FeesPanel({ state, update, showToast }) {
  const role = state.currentRole;
  const [form, setForm] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [receiptFee, setReceiptFee] = useState(null);

  const myFees = role === "student" ? state.fees.filter(f => f.studentId === state.currentUser?.id) : state.fees;
  const filtered = myFees.filter(f => !filterStatus || f.status === filterStatus);

  const save = () => {
    if (!form.studentId || !form.amount || !form.feeType) { showToast("Fill required fields", "error"); return; }
    update(prev => {
      const fees = form._existing ? prev.fees.map(f => f.id === form.id ? form : f) : [...prev.fees, { ...form, id: generateId("FEE"), createdAt: new Date().toISOString() }];
      return { ...prev, fees };
    });
    showToast("Saved"); setForm(null);
  };

  const printReceipt = (fee) => {
    const stu = state.students.find(s => s.id === fee.studentId);
    const html = `
      <div style="max-width:400px;margin:auto;border:2px solid #2563EB;border-radius:12px;padding:24px;font-family:Arial">
        <div style="text-align:center;border-bottom:1px solid #e2e8f0;padding-bottom:16px;margin-bottom:16px">
          <h2 style="color:#2563EB;margin:0">${state.college.name || "College"}</h2>
          <div style="color:#64748b;font-size:13px">${state.college.address || ""}</div>
          <h3 style="margin:8px 0 0;color:#0F172A">FEE RECEIPT</h3>
        </div>
        <table style="width:100%;border-collapse:collapse">
          ${[["Receipt No", fee.id], ["Date", formatDate(fee.createdAt)], ["Student Name", stu?.name || "-"], ["Student ID", fee.studentId], ["Fee Type", fee.feeType], ["Amount", "₹" + fee.amount], ["Status", fee.status], ["Remarks", fee.remarks || "-"]].map(([k, v]) => `<tr><td style="padding:6px;color:#64748b;font-size:13px">${k}</td><td style="padding:6px;font-weight:600;font-size:13px">${v}</td></tr>`).join("")}
        </table>
        <div style="margin-top:24px;text-align:center;color:#94a3b8;font-size:12px">Thank you for your payment. This is a computer-generated receipt.</div>
      </div>
    `;
    printContent(html, "Fee Receipt");
  };

  return (
    <Section title="Fee Management"
      actions={role === "admin" && <Btn icon="plus" onClick={() => setForm({ studentId: "", amount: "", feeType: "", status: "pending", dueDate: "", remarks: "" })}>Add Fee Record</Btn>}>
      <Card>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 160 }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
          </Select>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, fontSize: 13, color: "#64748b", flexWrap: "wrap", alignItems: "center" }}>
            <span>Total Collected: <strong style={{ color: "#059669" }}>₹{state.fees.filter(f => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0)}</strong></span>
            <span>Pending: <strong style={{ color: "#EF4444" }}>₹{state.fees.filter(f => f.status === "pending").reduce((s, f) => s + Number(f.amount), 0)}</strong></span>
          </div>
        </div>
        <Table
          cols={["Student", "Fee Type", "Amount", "Due Date", "Status", "Receipt"]}
          rows={filtered.map(f => {
            const stu = state.students.find(s => s.id === f.studentId);
            return {
              data: f,
              cells: [
                stu?.name || f.studentId,
                f.feeType,
                `₹${f.amount}`,
                f.dueDate ? formatDate(f.dueDate) : "-",
                <Badge color={f.status === "paid" ? "#10B981" : f.status === "partial" ? "#F59E0B" : "#EF4444"}>{f.status}</Badge>,
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn size="sm" variant="secondary" icon="print" onClick={() => printReceipt(f)}>Print</Btn>
                  {stu?.parentPhone && <Btn size="sm" variant="whatsapp" icon="whatsapp" onClick={() => sendWhatsApp(stu.parentPhone, `Dear Parent, Fee reminder for ${stu.name}. Amount: ₹${f.amount} (${f.feeType}). Status: ${f.status}. - ${state.college.name}`)}>WA</Btn>}
                </div>
              ]
            };
          })}
          actions={role === "admin" ? (f) => (
            <div style={{ display: "flex", gap: 4 }}>
              <Btn size="sm" variant="secondary" icon="edit" onClick={() => setForm({ ...f, _existing: true })}>Edit</Btn>
              <Btn size="sm" variant="danger" icon="trash" onClick={() => { if (window.confirm("Delete?")) { update(p => ({ ...p, fees: p.fees.filter(x => x.id !== f.id) })); } }} />
            </div>
          ) : undefined}
        />
      </Card>

      {form && (
        <Modal title={form._existing ? "Edit Fee" : "Add Fee Record"} onClose={() => setForm(null)}>
          <Field label="Student" required>
            <Select value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
              <option value="">Select student</option>
              {state.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
            </Select>
          </Field>
          <Field label="Fee Type" required><Input value={form.feeType} onChange={e => setForm(f => ({ ...f, feeType: e.target.value }))} placeholder="e.g. Tuition, Exam, Library" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Amount (₹)" required><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></Field>
            <Field label="Due Date"><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></Field>
          </div>
          <Field label="Status">
            <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </Select>
          </Field>
          <Field label="Remarks"><Textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>Save</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ============================================================
// WHATSAPP PANEL
// ============================================================
function WhatsAppPanel({ state }) {
  const [tab, setTab] = useState("individual");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [msgTemplate, setMsgTemplate] = useState("");
  const [customMsg, setCustomMsg] = useState("");

  const templates = {
    fee_reminder: (name) => `Dear Parent, this is a gentle reminder that the fee for ${name} is due. Please clear it at the earliest. Thank you. - ${state.college.name}`,
    absent_alert: (name) => `Dear Parent, your child ${name} was absent today (${new Date().toLocaleDateString()}). Please ensure their attendance. - ${state.college.name}`,
    announcement: (name) => `Dear Parent of ${name}, we have an important announcement. Please check the ERP portal for details. - ${state.college.name}`,
  };

  const getMsg = (name) => msgTemplate && templates[msgTemplate] ? templates[msgTemplate](name) : customMsg;

  const sendIndividual = () => {
    const stu = state.students.find(s => s.id === selectedStudent);
    if (!stu) return;
    const phone = stu.parentPhone || stu.phone;
    if (!phone) { alert("No phone number for this student"); return; }
    sendWhatsApp(phone, getMsg(stu.name));
  };

  const sendToClass = () => {
    const students = state.students.filter(s => s.classId === selectedClass);
    students.forEach(stu => {
      const phone = stu.parentPhone || stu.phone;
      if (phone) sendWhatsApp(phone, getMsg(stu.name));
    });
  };

  return (
    <Section title="WhatsApp Messaging">
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["individual", "class", "bulk"].map(t => (
          <Btn key={t} variant={tab === t ? "primary" : "secondary"} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</Btn>
        ))}
      </div>

      <Card>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#374151" }}>Message Template</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
          {[["fee_reminder", "💳 Fee Reminder"], ["absent_alert", "🚫 Absent Alert"], ["announcement", "📢 Announcement"]].map(([key, label]) => (
            <button key={key} onClick={() => { setMsgTemplate(key); setCustomMsg(templates[key]("{{Student Name}}")); }}
              style={{ padding: "12px 16px", borderRadius: 8, border: `1.5px solid ${msgTemplate === key ? "#25D366" : "#e2e8f0"}`, background: msgTemplate === key ? "#F0FDF4" : "#fff", cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 600, color: msgTemplate === key ? "#059669" : "#374151" }}>
              {label}
            </button>
          ))}
        </div>

        <Field label="Message">
          <Textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder="Type your message here..." style={{ minHeight: 100 }} />
        </Field>

        {tab === "individual" && (
          <div style={{ marginTop: 12 }}>
            <Field label="Select Student">
              <Select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                <option value="">Choose student</option>
                {state.students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.parentPhone || s.phone || "No phone"}</option>)}
              </Select>
            </Field>
            <Btn variant="whatsapp" icon="whatsapp" onClick={sendIndividual} disabled={!selectedStudent || !customMsg}>Send via WhatsApp</Btn>
          </div>
        )}

        {tab === "class" && (
          <div style={{ marginTop: 12 }}>
            <Field label="Select Class">
              <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="">Choose class</option>
                {state.classes.map(c => <option key={c.id} value={c.id}>{c.name} ({state.students.filter(s => s.classId === c.id).length} students)</option>)}
              </Select>
            </Field>
            <Btn variant="whatsapp" icon="whatsapp" onClick={sendToClass} disabled={!selectedClass || !customMsg}>
              Send to {selectedClass ? state.students.filter(s => s.classId === selectedClass).length : 0} Students
            </Btn>
          </div>
        )}

        {tab === "bulk" && (
          <div style={{ marginTop: 12 }}>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 12 }}>Sends message to all {state.students.filter(s => s.parentPhone || s.phone).length} students with a phone number.</p>
            <Btn variant="whatsapp" icon="whatsapp" onClick={() => state.students.forEach(s => { const p = s.parentPhone || s.phone; if (p) sendWhatsApp(p, getMsg(s.name)); })} disabled={!customMsg}>
              Bulk Send to All
            </Btn>
          </div>
        )}
      </Card>
    </Section>
  );
}

// ============================================================
// ANALYTICS PANEL
// ============================================================
function AnalyticsPanel({ state }) {
  const totalFees = state.fees.reduce((s, f) => s + Number(f.amount), 0);
  const paidFees = state.fees.filter(f => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0);
  const pendingFees = state.fees.filter(f => f.status === "pending").reduce((s, f) => s + Number(f.amount), 0);

  const classData = state.classes.map(c => ({ label: c.name, value: state.students.filter(s => s.classId === c.id).length })).filter(d => d.value > 0);
  const attData = [
    { label: "Present", value: state.attendance.filter(a => a.status === "present").length },
    { label: "Absent", value: state.attendance.filter(a => a.status === "absent").length },
    { label: "Late", value: state.attendance.filter(a => a.status === "late").length },
  ];
  const feeData = [
    { label: "Paid", value: paidFees },
    { label: "Pending", value: pendingFees },
  ];

  return (
    <Section title="Analytics Dashboard">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Students" value={state.students.length} icon="users" color="#2563EB" />
        <StatCard label="Total Teachers" value={state.teachers.length} icon="user" color="#0EA5E9" />
        <StatCard label="Total Classes" value={state.classes.length} icon="book" color="#8B5CF6" />
        <StatCard label="Fee Collected" value={`₹${paidFees}`} icon="dollar" color="#10B981" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <Card>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#374151" }}>Students per Class</h3>
          {classData.length ? <BarChart data={classData} color="#2563EB" /> : <div style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>No data</div>}
        </Card>
        <Card>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#374151" }}>Attendance Overview</h3>
          <PieChart data={attData.filter(d => d.value > 0)} />
        </Card>
        <Card>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#374151" }}>Fee Status</h3>
          <PieChart data={feeData.filter(d => d.value > 0)} />
        </Card>
        <Card>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#374151" }}>Assignment Stats</h3>
          <PieChart data={[
            { label: "Assignments", value: state.assignments.length },
            { label: "Submissions", value: state.submissions.length },
          ].filter(d => d.value > 0)} />
        </Card>
      </div>
    </Section>
  );
}

// ============================================================
// DOCUMENTS PANEL
// ============================================================
function DocumentsPanel({ state, update, showToast }) {
  const role = state.currentRole;
  const [form, setForm] = useState(null);

  const myDocs = role === "student" ? state.documents.filter(d => d.studentId === state.currentUser?.id) : state.documents;

  const upload = () => {
    if (!form.title || !form.file) { showToast("Title and file required", "error"); return; }
    update(prev => ({
      ...prev,
      documents: [...prev.documents, { ...form, id: generateId("DOC"), studentId: prev.currentUser?.id, studentName: prev.currentUser?.name, uploadedAt: new Date().toISOString(), verified: false }]
    }));
    showToast("Document uploaded"); setForm(null);
  };

  return (
    <Section title="Documents"
      actions={role === "student" && <Btn icon="upload" onClick={() => setForm({ title: "", docType: "id_proof", file: null })}>Upload Document</Btn>}>
      <Table
        cols={["Student", "Document", "Type", "Uploaded", "Status"]}
        rows={myDocs.map(d => ({
          data: d,
          cells: [
            d.studentName || d.studentId,
            d.title,
            <Badge color="#8B5CF6">{d.docType?.replace("_", " ")}</Badge>,
            formatDate(d.uploadedAt),
            <Badge color={d.verified ? "#10B981" : "#F59E0B"}>{d.verified ? "Verified" : "Pending"}</Badge>
          ]
        }))}
        actions={role === "admin" ? (d) => (
          <div style={{ display: "flex", gap: 4 }}>
            {!d.verified && <Btn size="sm" variant="success" onClick={() => { update(p => ({ ...p, documents: p.documents.map(x => x.id === d.id ? { ...x, verified: true } : x) })); showToast("Verified"); }}>Verify</Btn>}
            <Btn size="sm" variant="danger" icon="trash" onClick={() => { update(p => ({ ...p, documents: p.documents.filter(x => x.id !== d.id) })); }} />
          </div>
        ) : undefined}
      />

      {form && (
        <Modal title="Upload Document" onClose={() => setForm(null)}>
          <Field label="Document Title" required><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Document Type">
            <Select value={form.docType} onChange={e => setForm(f => ({ ...f, docType: e.target.value }))}>
              <option value="id_proof">ID Proof</option>
              <option value="certificate">Certificate</option>
              <option value="marksheet">Marksheet</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Document Image"><ImageUpload value={form.file} onChange={v => setForm(f => ({ ...f, file: v }))} label="Upload Document" /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={upload}>Upload</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ============================================================
// STORE PANEL
// ============================================================
function StorePanel({ state, update, showToast }) {
  const role = state.currentRole;
  const [form, setForm] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = state.storeItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  const save = () => {
    if (!form.name || !form.price) { showToast("Name and price required", "error"); return; }
    update(prev => {
      const storeItems = form._existing ? prev.storeItems.map(i => i.id === form.id ? form : i) : [...prev.storeItems, { ...form, id: generateId("ITM") }];
      return { ...prev, storeItems };
    });
    showToast("Saved"); setForm(null);
  };

  return (
    <Section title="Store — Uniforms & Books"
      actions={role === "admin" && <Btn icon="plus" onClick={() => setForm({ name: "", category: "uniform", price: "", stock: 0, description: "", image: "" })}>Add Item</Btn>}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <SmartSearch placeholder="Search store..." suggestions={state.storeItems.map(i => i.name)} value={search} onChange={setSearch} onSelect={setSearch} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {filtered.length === 0 && <div style={{ color: "#94a3b8", padding: 24, gridColumn: "1/-1", textAlign: "center" }}>No items yet.</div>}
          {filtered.map(item => (
            <div key={item.id} style={{ background: "#f8fafc", borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
              {item.image ? <img src={item.image} alt="" style={{ width: "100%", height: 120, objectFit: "cover" }} /> : <div style={{ width: "100%", height: 80, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}><Icon name="store" size={28} /></div>}
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, alignItems: "center" }}>
                  <Badge color="#2563EB">{item.category}</Badge>
                  <span style={{ fontWeight: 700, color: "#059669" }}>₹{item.price}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  Stock: <Badge color={item.stock > 0 ? "#10B981" : "#EF4444"}>{item.stock > 0 ? item.stock + " available" : "Out of stock"}</Badge>
                </div>
                {role === "admin" && (
                  <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                    <Btn size="sm" variant="secondary" icon="edit" onClick={() => setForm({ ...item, _existing: true })}>Edit</Btn>
                    <Btn size="sm" variant="danger" icon="trash" onClick={() => { update(p => ({ ...p, storeItems: p.storeItems.filter(x => x.id !== item.id) })); }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {form && (
        <Modal title={form._existing ? "Edit Item" : "Add Item"} onClose={() => setForm(null)}>
          <Field label="Item Name" required><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Category">
            <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="uniform">Uniform</option>
              <option value="book">Book</option>
              <option value="stationery">Stationery</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Price (₹)" required><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></Field>
            <Field label="Stock"><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></Field>
          </div>
          <Field label="Description"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
          <Field label="Image"><ImageUpload value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>Save</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ============================================================
// ID CARD PANEL
// ============================================================
function IDCardPanel({ state }) {
  const role = state.currentRole;
  const [selectedStudent, setSelectedStudent] = useState(role === "student" ? state.currentUser?.id : "");
  const stu = state.students.find(s => s.id === selectedStudent);
  const cls = state.classes.find(c => c.id === stu?.classId);
  const primary = state.theme.primary;

  const printCard = () => {
    if (!stu) return;
    const html = `
      <div style="width:340px;border:3px solid ${primary};border-radius:16px;overflow:hidden;font-family:Arial;margin:auto">
        <div style="background:${primary};padding:16px;text-align:center;color:#fff">
          ${state.college.logo ? `<img src="${state.college.logo}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;margin-bottom:8px">` : ""}
          <div style="font-weight:800;font-size:16px">${state.college.name || "College"}</div>
          <div style="font-size:11px;opacity:0.8">STUDENT ID CARD</div>
        </div>
        <div style="padding:20px;display:flex;gap:16px;align-items:flex-start">
          ${stu.photo ? `<img src="${stu.photo}" style="width:80px;height:80px;border-radius:8px;object-fit:cover;flex-shrink:0">` : `<div style="width:80px;height:80px;border-radius:8px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:${primary};flex-shrink:0">${stu.name[0]}</div>`}
          <div>
            <div style="font-weight:800;font-size:17px;color:#0F172A">${stu.name}</div>
            <div style="font-size:13px;color:#64748b;margin-top:4px">ID: ${stu.id}</div>
            <div style="font-size:13px;color:#64748b">Class: ${cls?.name || "-"}</div>
            <div style="font-size:13px;color:#64748b">Phone: ${stu.phone || "-"}</div>
          </div>
        </div>
        <div style="background:#f8fafc;padding:10px 20px;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0">
          ${state.college.address || ""} | ${state.college.phone || ""}
        </div>
      </div>
    `;
    printContent(html, "Student ID Card");
  };

  return (
    <Section title="ID Card Generator">
      {role === "admin" && (
        <Card style={{ marginBottom: 20 }}>
          <Field label="Select Student">
            <Select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">Choose student</option>
              {state.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
            </Select>
          </Field>
        </Card>
      )}

      {stu && (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Card Preview */}
          <div style={{ width: 320, border: `3px solid ${primary}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 24px rgba(37,99,235,0.15)", flexShrink: 0 }}>
            <div style={{ background: primary, padding: 20, textAlign: "center", color: "#fff" }}>
              {state.college.logo ? <img src={state.college.logo} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", marginBottom: 8 }} /> : null}
              <div style={{ fontWeight: 800, fontSize: 15 }}>{state.college.name || "College"}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>STUDENT ID CARD</div>
            </div>
            <div style={{ padding: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
              {stu.photo ? <img src={stu.photo} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 72, height: 72, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: primary, flexShrink: 0 }}>{stu.name[0]}</div>}
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{stu.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>ID: <strong>{stu.id}</strong></div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Class: {cls?.name || "-"}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Phone: {stu.phone || "-"}</div>
              </div>
            </div>
            <div style={{ background: "#f8fafc", padding: "8px 16px", fontSize: 11, color: "#94a3b8", textAlign: "center", borderTop: "1px solid #e2e8f0" }}>
              {state.college.address || ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignSelf: "flex-end" }}>
            <Btn icon="print" onClick={printCard}>Print ID Card</Btn>
          </div>
        </div>
      )}
      {!stu && <Card><div style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>{role === "admin" ? "Select a student to generate ID card." : "Your profile information not found."}</div></Card>}
    </Section>
  );
}

// ============================================================
// REPORT CARD PANEL
// ============================================================
function ReportCardPanel({ state, update, showToast }) {
  const role = state.currentRole;
  const [selectedStudent, setSelectedStudent] = useState(role === "student" ? state.currentUser?.id : "");
  const [gradeForm, setGradeForm] = useState(null);
  const stu = state.students.find(s => s.id === selectedStudent);
  const cls = state.classes.find(c => c.id === stu?.classId);
  const studentGrades = state.grades.filter(g => g.studentId === selectedStudent);

  const saveGrade = () => {
    if (!gradeForm.subject || gradeForm.marks === "") { showToast("Subject and marks required", "error"); return; }
    update(prev => {
      const existing = prev.grades.findIndex(g => g.studentId === selectedStudent && g.subject === gradeForm.subject);
      const grades = existing >= 0 ? prev.grades.map((g, i) => i === existing ? { ...g, ...gradeForm } : g) : [...prev.grades, { ...gradeForm, id: generateId("GRD"), studentId: selectedStudent }];
      return { ...prev, grades };
    });
    showToast("Saved"); setGradeForm(null);
  };

  const printReport = () => {
    if (!stu || !studentGrades.length) return;
    const total = studentGrades.reduce((s, g) => s + Number(g.marks), 0);
    const avg = Math.round(total / studentGrades.length);
    const html = `
      <div style="max-width:600px;margin:auto;font-family:Arial;padding:20px">
        <div style="text-align:center;border-bottom:2px solid #2563EB;padding-bottom:16px;margin-bottom:16px">
          ${state.college.logo ? `<img src="${state.college.logo}" style="width:60px;height:60px;border-radius:8px;object-fit:cover">` : ""}
          <h2 style="color:#2563EB;margin:8px 0 0">${state.college.name || "College"}</h2>
          <h3 style="margin:4px 0">PROGRESS REPORT CARD</h3>
        </div>
        <table style="width:100%;margin-bottom:16px">
          <tr><td><b>Name:</b> ${stu.name}</td><td><b>ID:</b> ${stu.id}</td></tr>
          <tr><td><b>Class:</b> ${cls?.name || "-"}</td><td><b>Date:</b> ${formatDate(new Date())}</td></tr>
        </table>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#EFF6FF"><th style="padding:10px;text-align:left;border:1px solid #e2e8f0">Subject</th><th style="padding:10px;text-align:center;border:1px solid #e2e8f0">Marks</th><th style="padding:10px;text-align:center;border:1px solid #e2e8f0">Max</th><th style="padding:10px;text-align:center;border:1px solid #e2e8f0">Grade</th></tr></thead>
          <tbody>${studentGrades.map(g => `<tr><td style="padding:8px;border:1px solid #e2e8f0">${g.subject}</td><td style="padding:8px;text-align:center;border:1px solid #e2e8f0">${g.marks}</td><td style="padding:8px;text-align:center;border:1px solid #e2e8f0">${g.maxMarks || 100}</td><td style="padding:8px;text-align:center;border:1px solid #e2e8f0;font-weight:bold;color:#2563EB">${gradeFromMarks(Number(g.marks) / (Number(g.maxMarks) || 100) * 100)}</td></tr>`).join("")}</tbody>
        </table>
        <div style="margin-top:16px;text-align:right;font-weight:bold;font-size:16px">Overall: ${avg}% — ${gradeFromMarks(avg)}</div>
      </div>
    `;
    printContent(html, "Report Card");
  };

  const subjects = cls?.subjects || state.subjects || [];

  return (
    <Section title="Report Card">
      {role === "admin" && (
        <Card style={{ marginBottom: 20 }}>
          <Field label="Select Student">
            <Select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">Choose student</option>
              {state.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
            </Select>
          </Field>
        </Card>
      )}
      {role === "teacher" && (
        <Card style={{ marginBottom: 20 }}>
          <Field label="Select Student">
            <Select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">Choose student</option>
              {state.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
            </Select>
          </Field>
        </Card>
      )}

      {stu && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{stu.name}</h3>
              <div style={{ color: "#64748b", fontSize: 13 }}>{stu.id} · {cls?.name || "-"}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(role === "admin" || role === "teacher") && <Btn icon="plus" size="sm" onClick={() => setGradeForm({ subject: "", marks: "", maxMarks: 100 })}>Add Marks</Btn>}
              {studentGrades.length > 0 && <Btn icon="print" size="sm" variant="secondary" onClick={printReport}>Print Report</Btn>}
            </div>
          </div>

          <Table
            cols={["Subject", "Marks", "Max", "Percentage", "Grade"]}
            rows={studentGrades.map(g => {
              const pct = Math.round(Number(g.marks) / (Number(g.maxMarks) || 100) * 100);
              return {
                data: g,
                cells: [g.subject, g.marks, g.maxMarks || 100,
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 6, background: "#e2e8f0", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct < 50 ? "#EF4444" : pct < 75 ? "#F59E0B" : "#10B981", borderRadius: 3 }} />
                    </div>
                    {pct}%
                  </div>,
                  <Badge color={pct >= 90 ? "#10B981" : pct >= 60 ? "#2563EB" : "#EF4444"}>{gradeFromMarks(pct)}</Badge>
                ]
              };
            })}
            actions={(role === "admin" || role === "teacher") ? (g) => (
              <div style={{ display: "flex", gap: 4 }}>
                <Btn size="sm" variant="secondary" icon="edit" onClick={() => setGradeForm({ ...g })} />
                <Btn size="sm" variant="danger" icon="trash" onClick={() => { update(p => ({ ...p, grades: p.grades.filter(x => x.id !== g.id) })); }} />
              </div>
            ) : undefined}
          />
          {studentGrades.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>No marks entered yet.</div>}

          {studentGrades.length > 0 && (
            <div style={{ marginTop: 16, padding: 16, background: "#f8fafc", borderRadius: 8, display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div>Total Subjects: <strong>{studentGrades.length}</strong></div>
              <div>Average: <strong>{Math.round(studentGrades.reduce((s, g) => s + Number(g.marks) / (Number(g.maxMarks) || 100) * 100, 0) / studentGrades.length)}%</strong></div>
              <div>Overall Grade: <strong>{gradeFromMarks(studentGrades.reduce((s, g) => s + Number(g.marks) / (Number(g.maxMarks) || 100) * 100, 0) / studentGrades.length)}</strong></div>
            </div>
          )}
        </Card>
      )}
      {!stu && <Card><div style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>Select a student to view report card.</div></Card>}

      {gradeForm && (
        <Modal title="Add/Edit Marks" onClose={() => setGradeForm(null)}>
          <Field label="Subject" required><Input value={gradeForm.subject} onChange={e => setGradeForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Marks Obtained" required><Input type="number" value={gradeForm.marks} onChange={e => setGradeForm(f => ({ ...f, marks: e.target.value }))} /></Field>
            <Field label="Maximum Marks"><Input type="number" value={gradeForm.maxMarks} onChange={e => setGradeForm(f => ({ ...f, maxMarks: e.target.value }))} /></Field>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setGradeForm(null)}>Cancel</Btn>
            <Btn onClick={saveGrade}>Save</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ============================================================
// TIMETABLE PANEL
// ============================================================
function TimetablePanel({ state, update, showToast }) {
  const role = state.currentRole;
  const [selectedClass, setSelectedClass] = useState("");
  const [form, setForm] = useState(null);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];

  const slots = state.timetable.filter(t => t.classId === selectedClass);
  const getSlot = (day, period) => slots.find(s => s.day === day && s.period === period);

  const save = () => {
    if (!form.subject || !form.day || !form.period) { showToast("Fill required fields", "error"); return; }
    update(prev => {
      const filtered = prev.timetable.filter(t => !(t.classId === selectedClass && t.day === form.day && t.period === form.period));
      return { ...prev, timetable: [...filtered, { ...form, id: generateId("TT"), classId: selectedClass }] };
    });
    showToast("Saved"); setForm(null);
  };

  return (
    <Section title="Timetable">
      <Card style={{ marginBottom: 20 }}>
        <Field label="Select Class">
          <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Choose class</option>
            {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
      </Card>

      {selectedClass && (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 12px", background: "#f8fafc", fontWeight: 700, color: "#374151", border: "1px solid #e2e8f0", minWidth: 80 }}>Day / Period</th>
                  {periods.map(p => <th key={p} style={{ padding: "10px 12px", background: "#f8fafc", fontWeight: 700, color: "#374151", border: "1px solid #e2e8f0", minWidth: 90 }}>{p}</th>)}
                </tr>
              </thead>
              <tbody>
                {days.map(day => (
                  <tr key={day}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#374151", border: "1px solid #e2e8f0", background: "#f8fafc" }}>{day}</td>
                    {periods.map(period => {
                      const slot = getSlot(day, period);
                      return (
                        <td key={period} style={{ padding: "8px", border: "1px solid #e2e8f0", verticalAlign: "top" }}
                          onClick={role === "admin" ? () => setForm({ day, period, subject: slot?.subject || "", teacherId: slot?.teacherId || "", time: slot?.time || "" }) : undefined}
                          style={{ padding: "8px", border: "1px solid #e2e8f0", cursor: role === "admin" ? "pointer" : "default", transition: "background 0.15s" }}
                          onMouseEnter={e => { if (role === "admin") e.currentTarget.style.background = "#f0f9ff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          {slot ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 12, color: "#1E3A5F" }}>{slot.subject}</div>
                              {slot.teacherId && <div style={{ fontSize: 10, color: "#94a3b8" }}>{state.teachers.find(t => t.id === slot.teacherId)?.name}</div>}
                              {slot.time && <div style={{ fontSize: 10, color: "#94a3b8" }}>{slot.time}</div>}
                            </div>
                          ) : role === "admin" ? <div style={{ color: "#cbd5e1", fontSize: 11, textAlign: "center" }}>+</div> : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {role === "admin" && <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 12 }}>Click any cell to add/edit a slot.</p>}
        </Card>
      )}

      {form && (
        <Modal title={`Set Slot: ${form.day} ${form.period}`} onClose={() => setForm(null)}>
          <Field label="Subject" required><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></Field>
          <Field label="Teacher">
            <Select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
              <option value="">Unassigned</option>
              {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </Field>
          <Field label="Time (e.g. 9:00–10:00)"><Input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => { update(p => ({ ...p, timetable: p.timetable.filter(t => !(t.classId === selectedClass && t.day === form.day && t.period === form.period)) })); setForm(null); showToast("Cleared"); }}>Clear Slot</Btn>
            <Btn variant="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>Save</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ============================================================
// PROFILE PANEL
// ============================================================
function ProfilePanel({ state, update, showToast }) {
  const role = state.currentRole;
  const user = state.currentUser;
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    photo: user?.photo || "",
    password: "",
    newPassword: "",
  });

  const save = () => {
    if (role === "admin") {
      update(prev => ({
        ...prev,
        admin: { ...prev.admin, name: form.name, email: form.email, photo: form.photo, ...(form.newPassword ? { password: form.newPassword } : {}) },
        currentUser: { ...prev.currentUser, name: form.name, email: form.email, photo: form.photo }
      }));
    } else if (role === "teacher") {
      update(prev => ({
        ...prev,
        teachers: prev.teachers.map(t => t.id === user.id ? { ...t, name: form.name, email: form.email, photo: form.photo, ...(form.newPassword ? { password: form.newPassword } : {}) } : t),
        currentUser: { ...prev.currentUser, name: form.name, email: form.email, photo: form.photo }
      }));
    } else {
      update(prev => ({
        ...prev,
        students: prev.students.map(s => s.id === user.id ? { ...s, name: form.name, email: form.email, photo: form.photo, ...(form.newPassword ? { password: form.newPassword } : {}) } : s),
        currentUser: { ...prev.currentUser, name: form.name, email: form.email, photo: form.photo }
      }));
    }
    showToast("Profile updated");
  };

  return (
    <Section title="My Profile">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
            {form.photo ? <img src={form.photo} alt="" style={{ width: 88, height: 88, borderRadius: 16, objectFit: "cover", marginBottom: 12 }} /> : <div style={{ width: 88, height: 88, borderRadius: 16, background: state.theme.primary + "20", display: "flex", alignItems: "center", justifyContent: "center", color: state.theme.primary, fontSize: 32, fontWeight: 800, marginBottom: 12 }}>{(form.name || "U")[0]}</div>}
            <ImageUpload value={form.photo} onChange={v => setForm(f => ({ ...f, photo: v }))} label="Change Photo" />
          </div>
          <Field label="Full Name"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
          <Btn onClick={save} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>Update Profile</Btn>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Change Password</h3>
          <Field label="New Password"><Input type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Leave blank to keep current" /></Field>
          <Btn onClick={save} variant="secondary" style={{ width: "100%", justifyContent: "center" }}>Update Password</Btn>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Account Info</div>
            <div style={{ fontSize: 13, color: "#374151" }}>Role: <Badge color={role === "admin" ? "#2563EB" : role === "teacher" ? "#059669" : "#8B5CF6"}>{role}</Badge></div>
            {user?.id && <div style={{ fontSize: 13, color: "#374151", marginTop: 6 }}>ID: <strong>{user.id}</strong></div>}
          </div>
        </Card>
      </div>
    </Section>
  );
}

// ============================================================
// SETTINGS PANEL
// ============================================================
function SettingsPanel({ state, update, showToast }) {
  const [tab, setTab] = useState("college");
  const [college, setCollege] = useState({ ...state.college });
  const [theme, setTheme] = useState({ ...state.theme });
  const [labels, setLabels] = useState({ ...state.labels });

  const saveCollege = () => { update({ college }); showToast("College profile updated"); };
  const saveTheme = () => { update({ theme }); showToast("Theme updated"); };
  const saveLabels = () => { update({ labels }); showToast("Labels updated"); };

  const tabs = [
    { id: "college", label: "College Profile", icon: "book" },
    { id: "theme", label: "Theme & Colors", icon: "palette" },
    { id: "labels", label: "Labels & Text", icon: "edit" },
  ];

  return (
    <Section title="Settings">
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <Btn key={t.id} variant={tab === t.id ? "primary" : "secondary"} icon={t.icon} onClick={() => setTab(t.id)}>{t.label}</Btn>
        ))}
      </div>

      {tab === "college" && (
        <Card>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>College Profile</h3>
          <Field label="College Name"><Input value={college.name} onChange={e => setCollege(c => ({ ...c, name: e.target.value }))} placeholder="College Name" /></Field>
          <Field label="Logo">
            <ImageUpload value={college.logo} onChange={v => setCollege(c => ({ ...c, logo: v }))} label="Upload Logo" />
          </Field>
          <Field label="Address"><Textarea value={college.address} onChange={e => setCollege(c => ({ ...c, address: e.target.value }))} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Phone"><Input value={college.phone} onChange={e => setCollege(c => ({ ...c, phone: e.target.value }))} /></Field>
            <Field label="Email"><Input type="email" value={college.email} onChange={e => setCollege(c => ({ ...c, email: e.target.value }))} /></Field>
          </div>
          <Field label="Description"><Textarea value={college.description} onChange={e => setCollege(c => ({ ...c, description: e.target.value }))} /></Field>
          <Btn onClick={saveCollege}>Save College Profile</Btn>

          {college.name && (
            <div style={{ marginTop: 20, padding: 16, background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Live Preview:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {college.logo ? <img src={college.logo} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} /> : null}
                <div>
                  <div style={{ fontWeight: 700 }}>{college.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{college.address}</div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === "theme" && (
        <Card>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Theme & Colors</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[["primary", "Primary Color"], ["bg", "Background Color"], ["accent", "Accent Color"], ["sidebar", "Sidebar Color"], ["text", "Text Color"]].map(([key, label]) => (
              <Field key={key} label={label}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="color" value={theme[key]} onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))}
                    style={{ width: 44, height: 36, borderRadius: 6, border: "1.5px solid #e2e8f0", padding: 2, cursor: "pointer" }} />
                  <Input value={theme[key]} onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))} style={{ flex: 1 }} />
                </div>
              </Field>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: theme.bg, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Preview:</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ padding: "8px 16px", background: theme.primary, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Primary</div>
              <div style={{ padding: "8px 16px", background: theme.accent, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Accent</div>
              <div style={{ padding: "8px 16px", background: theme.sidebar, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Sidebar</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}><Btn onClick={saveTheme}>Apply Theme</Btn></div>
        </Card>
      )}

      {tab === "labels" && (
        <Card>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>UI Labels & Text</h3>
          <Field label="App Title"><Input value={labels.appTitle} onChange={e => setLabels(l => ({ ...l, appTitle: e.target.value }))} /></Field>
          <Field label="Students Section Label"><Input value={labels.studentSection} onChange={e => setLabels(l => ({ ...l, studentSection: e.target.value }))} /></Field>
          <Field label="Teachers Section Label"><Input value={labels.teacherSection} onChange={e => setLabels(l => ({ ...l, teacherSection: e.target.value }))} /></Field>
          <Field label="Fees Section Label"><Input value={labels.feeSection} onChange={e => setLabels(l => ({ ...l, feeSection: e.target.value }))} /></Field>
          <Btn onClick={saveLabels}>Save Labels</Btn>
        </Card>
      )}
    </Section>
  );
}
