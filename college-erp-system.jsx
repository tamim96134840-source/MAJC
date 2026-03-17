import { useState, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
const genId = (p = "ID") =>
  `${p}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

const genPw = () => {
  const c = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 10 }, () => c[Math.floor(Math.random() * c.length)]).join("");
};

const fmtDate = (d) => {
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "-"; }
};

const grade = (m) =>
  m >= 90 ? "A+" : m >= 80 ? "A" : m >= 70 ? "B+" : m >= 60 ? "B" : m >= 50 ? "C" : m >= 40 ? "D" : "F";

// ─────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────
const INIT = {
  college: { name: "", logo: "", address: "", phone: "", email: "", description: "" },
  theme: { primary: "#2563EB", bg: "#F8FAFC", accent: "#0EA5E9", sidebar: "#1E3A5F", text: "#0F172A" },
  labels: { appTitle: "ERP Portal", studentSection: "Students", teacherSection: "Teachers", feeSection: "Fees" },
  admin: { name: "", photo: "", email: "", password: "" },
  students: [], teachers: [], classes: [], attendance: [], assignments: [],
  submissions: [], announcements: [], fees: [], documents: [], storeItems: [],
  timetable: [], grades: [], currentUser: null, currentRole: null,
};

const loadState = () => {
  try {
    const r = sessionStorage.getItem("erp_v3");
    return r ? { ...INIT, ...JSON.parse(r) } : { ...INIT };
  } catch { return { ...INIT }; }
};

const saveState = (s) => {
  try { sessionStorage.setItem("erp_v3", JSON.stringify(s)); } catch {}
};

// ─────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────
const PATHS = {
  home: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
  users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
  user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></>,
  bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
  dollar: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>,
  file: <><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" /></>,
  chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></>,
  print: <><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
  whatsapp: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  check: <polyline points="20 6 9 11 4 16" />,
  xmark: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  id: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></>,
  store: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  menu: <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>,
  award: <><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></>,
  clipboard: <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></>,
  palette: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />,
  upload: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
  refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></>,
  download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
};

const Ic = ({ n, sz = 18, col }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none"
    stroke={col || "currentColor"} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, display: "block" }}>
    {PATHS[n] || null}
  </svg>
);

// ─────────────────────────────────────────────
// BASE COMPONENTS
// ─────────────────────────────────────────────
const Inp = ({ style: s, ...p }) => (
  <input {...p} style={{
    width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 14, outline: "none", background: "#f8fafc",
    color: "#0F172A", boxSizing: "border-box", fontFamily: "inherit", ...s
  }}
    onFocus={e => (e.target.style.borderColor = "#2563EB")}
    onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
);

const Sel = ({ children, style: s, ...p }) => (
  <select {...p} style={{
    width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 14, outline: "none", background: "#f8fafc",
    color: "#0F172A", boxSizing: "border-box", fontFamily: "inherit", ...s
  }}>
    {children}
  </select>
);

const Txta = ({ style: s, ...p }) => (
  <textarea {...p} style={{
    width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 14, outline: "none", background: "#f8fafc",
    color: "#0F172A", boxSizing: "border-box", resize: "vertical",
    minHeight: 72, fontFamily: "inherit", ...s
  }}
    onFocus={e => (e.target.style.borderColor = "#2563EB")}
    onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
);

const Fld = ({ label, children, req }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
      {label}{req && <span style={{ color: "#EF4444" }}> *</span>}
    </label>
    {children}
  </div>
);

const BTN_VARIANTS = {
  primary: { background: "#2563EB", color: "#fff" },
  secondary: { background: "#f1f5f9", color: "#374151" },
  danger: { background: "#FEE2E2", color: "#DC2626" },
  success: { background: "#D1FAE5", color: "#059669" },
  ghost: { background: "transparent", color: "#64748b" },
  wa: { background: "#25D366", color: "#fff" },
};
const BTN_SIZES = {
  sm: { padding: "5px 11px", fontSize: 12 },
  md: { padding: "9px 15px", fontSize: 13 },
  lg: { padding: "11px 22px", fontSize: 14 },
};

const Btn = ({ children, v = "primary", onClick, icon, sz = "md", disabled, style: s = {} }) => (
  <button onClick={disabled ? undefined : onClick} disabled={disabled}
    style={{
      borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 5, border: "none",
      transition: "opacity .15s", opacity: disabled ? 0.5 : 1,
      fontFamily: "inherit", ...BTN_SIZES[sz], ...BTN_VARIANTS[v], ...s
    }}>
    {icon && <Ic n={icon} sz={13} />}{children}
  </button>
);

const Badge = ({ children, col = "#2563EB" }) => (
  <span style={{
    background: col + "22", color: col, padding: "2px 8px",
    borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap"
  }}>{children}</span>
);

const Card = ({ children, style: s = {} }) => (
  <div style={{
    background: "#fff", borderRadius: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,.06)",
    border: "1px solid #e2e8f0", padding: 20, ...s
  }}>{children}</div>
);

const Stat = ({ label, value, icon, col = "#2563EB", sub }) => (
  <div style={{
    background: "#fff", borderRadius: 12, padding: 18,
    boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e2e8f0",
    display: "flex", gap: 14, alignItems: "flex-start"
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 10, background: col + "18",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
    }}>
      <Ic n={icon} sz={20} col={col} />
    </div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

const Modal = ({ title, onClose, children, sz = "md" }) => {
  const w = { sm: 400, md: 560, lg: 720 }[sz] || 560;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
      zIndex: 2000, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 16
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: w,
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,.25)"
      }}>
        <div style={{
          padding: "18px 22px", borderBottom: "1px solid #e2e8f0",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
          borderRadius: "16px 16px 0 0"
        }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "#f1f5f9", border: "none", borderRadius: 8,
            padding: 7, cursor: "pointer", color: "#64748b", display: "flex"
          }}>
            <Ic n="xmark" sz={15} />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
};

const Tbl = ({ cols, rows, actions }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ background: "#f8fafc" }}>
          {cols.map(c => (
            <th key={c} style={{
              padding: "9px 13px", textAlign: "left", color: "#64748b",
              fontWeight: 600, fontSize: 12, borderBottom: "2px solid #e2e8f0",
              whiteSpace: "nowrap"
            }}>{c}</th>
          ))}
          {actions && <th style={{
            padding: "9px 13px", textAlign: "right", color: "#64748b",
            fontWeight: 600, fontSize: 12, borderBottom: "2px solid #e2e8f0"
          }}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={cols.length + (actions ? 1 : 0)}
            style={{ padding: 28, textAlign: "center", color: "#94a3b8" }}>
            No records found
          </td></tr>
          : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              {row.cells.map((c, j) => (
                <td key={j} style={{ padding: "11px 13px", color: "#374151", verticalAlign: "middle" }}>{c}</td>
              ))}
              {actions && (
                <td style={{ padding: "11px 13px", textAlign: "right" }}>{actions(row.data)}</td>
              )}
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

const SSearch = ({ placeholder, suggestions = [], value, onChange, onSelect }) => {
  const [show, setShow] = useState(false);
  const filtered = suggestions.filter(s => value && s.toLowerCase().includes(value.toLowerCase())).slice(0, 6);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
          color: "#94a3b8", display: "flex", pointerEvents: "none"
        }}><Ic n="search" sz={14} /></span>
        <Inp placeholder={placeholder} value={value}
          onChange={e => { onChange(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 160)}
          style={{ paddingLeft: 30 }} />
      </div>
      {show && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, background: "#fff",
          borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          zIndex: 300, border: "1px solid #e2e8f0", marginTop: 3
        }}>
          {filtered.map((s, i) => (
            <div key={i} onMouseDown={() => { onSelect(s); setShow(false); }}
              style={{
                padding: "9px 13px", cursor: "pointer", fontSize: 13, color: "#374151",
                borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none"
              }}
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

const ImgUp = ({ value, onChange, label = "Upload Image" }) => {
  const ref = useRef();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {value && <img src={value} alt="" style={{ width: 54, height: 54, borderRadius: 8, objectFit: "cover", border: "2px solid #e2e8f0" }} />}
      <Btn v="secondary" sz="sm" icon="upload" onClick={() => ref.current.click()}>{label}</Btn>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => {
          const f = e.target.files[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => onChange(r.result);
          r.readAsDataURL(f);
        }} />
    </div>
  );
};

// ─────────────────────────────────────────────
// CHARTS
// ─────────────────────────────────────────────
const BarChart = ({ data = [], col = "#2563EB" }) => {
  if (!data.length) return <p style={{ color: "#94a3b8", textAlign: "center" }}>No data</p>;
  const mx = Math.max(...data.map(d => d.v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 110, padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{
            width: "100%", background: col, borderRadius: "4px 4px 0 0",
            height: `${(d.v / mx) * 100}px`, opacity: 0.85
          }} />
          <span style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>{d.l}</span>
        </div>
      ))}
    </div>
  );
};

const PieChart = ({ data = [] }) => {
  const data2 = data.filter(d => d.v > 0);
  if (!data2.length) return <p style={{ color: "#94a3b8", textAlign: "center" }}>No data</p>;
  const total = data2.reduce((s, d) => s + d.v, 0) || 1;
  const COLS = ["#2563EB", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  let off = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <svg viewBox="0 0 100 100" width={90} height={90}>
        {data2.map((d, i) => {
          const pct = d.v / total, dash = pct * circ;
          const el = (
            <circle key={i} r={r} cx={cx} cy={cy} fill="none" stroke={COLS[i % COLS.length]}
              strokeWidth="20" strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-off * circ} transform="rotate(-90 50 50)" />
          );
          off += pct;
          return el;
        })}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {data2.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: COLS[i % COLS.length], flexShrink: 0 }} />
            <span style={{ color: "#475569" }}>{d.l}: {d.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const sendWA = (phone, msg) => {
  const n = String(phone || "").replace(/\D/g, "");
  if (!n) { alert("No phone number available."); return; }
  window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`, "_blank");
};

const doPrint = (html, title = "Print") => {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<html><head><title>${title}</title>
    <style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ccc;padding:8px;text-align:left}
    .np{display:none}@media print{.np{display:none}}</style></head>
    <body>${html}<br/><button class="np" onclick="window.print()">🖨 Print</button></body></html>`);
  w.document.close();
};

const Section = ({ title, actions, children }) => (
  <div>
    {(title || actions) && (
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 18, flexWrap: "wrap", gap: 10
      }}>
        {title && <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#0F172A" }}>{title}</h2>}
        {actions && <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

// ─────────────────────────────────────────────
// NAV CONFIG
// ─────────────────────────────────────────────
const NAV_ALL = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "students", label: "Students", icon: "users", roles: ["admin"] },
  { id: "teachers", label: "Teachers", icon: "user", roles: ["admin"] },
  { id: "classes", label: "Classes", icon: "book", roles: ["admin"] },
  { id: "attendance", label: "Attendance", icon: "clipboard", roles: ["admin", "teacher"] },
  { id: "assignments", label: "Assignments", icon: "file", roles: ["admin", "teacher", "student"] },
  { id: "announcements", label: "Announcements", icon: "bell", roles: ["admin", "teacher", "student"] },
  { id: "fees", label: "Fees", icon: "dollar", roles: ["admin", "student"] },
  { id: "whatsapp", label: "WhatsApp", icon: "whatsapp", roles: ["admin", "teacher"] },
  { id: "analytics", label: "Analytics", icon: "chart", roles: ["admin"] },
  { id: "documents", label: "Documents", icon: "file", roles: ["admin", "student"] },
  { id: "store", label: "Store", icon: "store", roles: ["admin", "student"] },
  { id: "idcard", label: "ID Card", icon: "id", roles: ["admin", "student"] },
  { id: "reportcard", label: "Report Card", icon: "award", roles: ["admin", "teacher", "student"] },
  { id: "timetable", label: "Timetable", icon: "clock", roles: ["admin", "teacher", "student"] },
  { id: "profile", label: "Profile", icon: "user" },
  { id: "settings", label: "Settings", icon: "settings", roles: ["admin"] },
];

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function Login({ state, update }) {
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [showPw, setShowPw] = useState(false);
  const pri = state.theme.primary;

  const go = () => {
    setErr("");
    if (!email || !pw) { setErr("Enter email and password."); return; }
    if (role === "admin") {
      if (!state.admin.email) {
        update(p => ({
          ...p, admin: { ...p.admin, email, password: pw, name: "Admin" },
          currentUser: { email, name: "Admin", role: "admin" }, currentRole: "admin"
        }));
        return;
      }
      if (state.admin.email === email && state.admin.password === pw) {
        update(p => ({
          ...p,
          currentUser: { email, name: p.admin.name || "Admin", photo: p.admin.photo, role: "admin" },
          currentRole: "admin"
        }));
      } else setErr("Invalid credentials.");
    } else if (role === "teacher") {
      const t = state.teachers.find(x => x.email === email && x.password === pw);
      if (t) update(p => ({ ...p, currentUser: { ...t, role: "teacher" }, currentRole: "teacher" }));
      else setErr("Invalid credentials.");
    } else {
      const s = state.students.find(x => x.email === email && x.password === pw);
      if (s) update(p => ({ ...p, currentUser: { ...s, role: "student" }, currentRole: "student" }));
      else setErr("Invalid credentials.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: state.theme.bg, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
      fontFamily: "'Segoe UI',system-ui,sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {state.college.logo
            ? <img src={state.college.logo} alt="" style={{ width: 68, height: 68, borderRadius: 14, objectFit: "cover", marginBottom: 10 }} />
            : <div style={{
              width: 68, height: 68, borderRadius: 14, background: pri + "18",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 10px"
            }}><Ic n="book" sz={30} col={pri} /></div>}
          <h1 style={{ fontSize: 21, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>
            {state.college.name || state.labels.appTitle || "College ERP"}
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Sign in to your account</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,.08)", padding: 28 }}>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 9, padding: 3, marginBottom: 22 }}>
            {["admin", "teacher", "student"].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                flex: 1, padding: "7px 4px", border: "none", borderRadius: 7, cursor: "pointer",
                fontWeight: 600, fontSize: 12, textTransform: "capitalize", transition: "all .2s",
                background: role === r ? "#fff" : "transparent", color: role === r ? pri : "#64748b",
                boxShadow: role === r ? "0 1px 4px rgba(0,0,0,.1)" : "none", fontFamily: "inherit"
              }}>{r}</button>
            ))}
          </div>

          {role === "admin" && !state.admin.email && (
            <div style={{ background: "#EFF6FF", borderRadius: 8, padding: 11, marginBottom: 14, fontSize: 13, color: "#1D4ED8" }}>
              <strong>First time?</strong> Enter any email &amp; password to create the admin account.
            </div>
          )}

          <Fld label="Email" req><Inp type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} /></Fld>
          <Fld label="Password" req>
            <div style={{ position: "relative" }}>
              <Inp type={showPw ? "text" : "password"} placeholder="Password" value={pw}
                onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && go()}
                style={{ paddingRight: 38 }} />
              <button onClick={() => setShowPw(v => !v)} style={{
                position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex"
              }}><Ic n="eye" sz={15} /></button>
            </div>
          </Fld>
          {err && <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "9px 13px", borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
          <Btn onClick={go} style={{ width: "100%", justifyContent: "center" }}>Sign In</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState(loadState);
  const [sec, setSec] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  const update = useCallback(patch => {
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

  const logout = () => update({ currentRole: null, currentUser: null });

  if (!state.currentRole) return <Login state={state} update={update} />;

  const navItems = NAV_ALL.filter(n => !n.roles || n.roles.includes(state.currentRole));
  const pri = state.theme.primary;
  const props = { state, update, showToast, setModal, setSec };

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: state.theme.bg,
      fontFamily: "'Segoe UI',system-ui,sans-serif", fontSize: 14
    }}>
      <style>{`
        @media(min-width:768px){
          .erp-sidebar{left:0!important;}
          .erp-main{padding-left:244px!important;}
          .erp-bnav{display:none!important;}
          .erp-hbg{display:none!important;}
        }
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px;}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 9999,
          background: toast.type === "error" ? "#FEE2E2" : "#D1FAE5",
          color: toast.type === "error" ? "#DC2626" : "#059669",
          padding: "11px 18px", borderRadius: 9, fontWeight: 600, fontSize: 13,
          boxShadow: "0 4px 16px rgba(0,0,0,.12)", display: "flex", alignItems: "center",
          gap: 7, maxWidth: 300
        }}>
          <Ic n={toast.type === "error" ? "xmark" : "check"} sz={15} />
          {toast.msg}
        </div>
      )}

      {/* Overlay */}
      {sideOpen && (
        <div onClick={() => setSideOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 199
        }} />
      )}

      {/* Sidebar */}
      <aside className="erp-sidebar" style={{
        width: 240, background: state.theme.sidebar, display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: sideOpen ? 0 : -240,
        height: "100vh", zIndex: 200, transition: "left .28s ease", overflowY: "auto"
      }}>
        {/* Logo */}
        <div style={{ padding: "18px 14px", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {state.college.logo
              ? <img src={state.college.logo} alt="" style={{ width: 34, height: 34, borderRadius: 7, objectFit: "cover" }} />
              : <div style={{
                width: 34, height: 34, borderRadius: 7, background: "rgba(255,255,255,.15)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}><Ic n="book" sz={17} col="#fff" /></div>}
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                {state.college.name || state.labels.appTitle}
              </div>
              <div style={{ color: "rgba(255,255,255,.55)", fontSize: 10 }}>ERP System</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "10px 7px" }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => { setSec(n.id); setSideOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9,
                padding: "9px 11px", border: "none", borderRadius: 7, cursor: "pointer",
                marginBottom: 1, fontFamily: "inherit",
                background: sec === n.id ? "rgba(255,255,255,.15)" : "transparent",
                color: sec === n.id ? "#fff" : "rgba(255,255,255,.65)",
                fontWeight: sec === n.id ? 600 : 400, fontSize: 13, textAlign: "left"
              }}
              onMouseEnter={e => { if (sec !== n.id) e.currentTarget.style.background = "rgba(255,255,255,.07)"; }}
              onMouseLeave={e => { if (sec !== n.id) e.currentTarget.style.background = "transparent"; }}>
              <Ic n={n.icon} sz={15} col={sec === n.id ? "#fff" : "rgba(255,255,255,.65)"} />
              {n.label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: 13, borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
            {state.currentUser?.photo
              ? <img src={state.currentUser.photo} alt="" style={{ width: 30, height: 30, borderRadius: 7, objectFit: "cover" }} />
              : <div style={{
                width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 12, fontWeight: 700
              }}>
                {(state.currentUser?.name || state.currentUser?.email || "U")[0].toUpperCase()}
              </div>}
            <div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
                {state.currentUser?.name || state.currentUser?.email}
              </div>
              <div style={{ color: "rgba(255,255,255,.55)", fontSize: 10, textTransform: "capitalize" }}>
                {state.currentRole}
              </div>
            </div>
          </div>
          <button onClick={logout} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 7,
            padding: "7px 9px", border: "none", borderRadius: 7, cursor: "pointer",
            background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.8)",
            fontSize: 12, fontWeight: 500, fontFamily: "inherit"
          }}>
            <Ic n="logout" sz={13} col="rgba(255,255,255,.8)" />Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="erp-main" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Topbar */}
        <header style={{
          background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 18px",
          height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <button className="erp-hbg" onClick={() => setSideOpen(v => !v)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#64748b", padding: 3, display: "flex"
            }}>
              <Ic n={sideOpen ? "xmark" : "menu"} sz={20} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
              {state.college.name || state.labels.appTitle || "ERP Portal"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ textAlign: "right", fontSize: 11, color: "#64748b" }}>
              <div style={{ fontWeight: 600, color: "#374151", fontSize: 12 }}>
                {state.currentUser?.name || state.currentUser?.email}
              </div>
              <div style={{ textTransform: "capitalize" }}>{state.currentRole}</div>
            </div>
            {state.currentUser?.photo
              ? <img src={state.currentUser.photo} alt="" style={{ width: 32, height: 32, borderRadius: 7, objectFit: "cover" }} />
              : <div style={{
                width: 32, height: 32, borderRadius: 7, background: pri + "18",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: pri, fontWeight: 700, fontSize: 13
              }}>
                {(state.currentUser?.name || state.currentUser?.email || "U")[0].toUpperCase()}
              </div>}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "22px 18px 72px", maxWidth: 1180, width: "100%", margin: "0 auto" }}>
          <PanelRouter sec={sec} {...props} />
        </main>

        {/* Bottom nav (mobile) */}
        <nav className="erp-bnav" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff",
          borderTop: "1px solid #e2e8f0", display: "flex", zIndex: 100, height: 56
        }}>
          {navItems.slice(0, 5).map(n => (
            <button key={n.id} onClick={() => setSec(n.id)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 2, border: "none", background: "transparent",
              cursor: "pointer", color: sec === n.id ? pri : "#94a3b8",
              fontSize: 9, fontWeight: sec === n.id ? 700 : 400, padding: 3, fontFamily: "inherit"
            }}>
              <Ic n={n.icon} sz={17} col={sec === n.id ? pri : "#94a3b8"} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {modal && (
        <Modal title={modal.title} onClose={() => setModal(null)} sz={modal.sz}>
          {modal.content}
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PANEL ROUTER
// ─────────────────────────────────────────────
function PanelRouter({ sec, ...p }) {
  const map = {
    dashboard: <Dashboard {...p} />,
    students: <Students {...p} />,
    teachers: <Teachers {...p} />,
    classes: <Classes {...p} />,
    attendance: <Attendance {...p} />,
    assignments: <Assignments {...p} />,
    announcements: <Announcements {...p} />,
    fees: <Fees {...p} />,
    whatsapp: <WhatsAppPanel {...p} />,
    analytics: <Analytics {...p} />,
    documents: <Documents {...p} />,
    store: <Store {...p} />,
    idcard: <IDCard {...p} />,
    reportcard: <ReportCard {...p} />,
    timetable: <Timetable {...p} />,
    profile: <Profile {...p} />,
    settings: <Settings {...p} />,
  };
  return map[sec] || map.dashboard;
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ state, setSec }) {
  const role = state.currentRole;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAtt = state.attendance.filter(a => a.date === todayStr);
  const myAtt = role === "student" ? state.attendance.filter(a => a.studentId === state.currentUser?.id) : [];
  const myPct = myAtt.length ? Math.round(myAtt.filter(a => a.status === "present").length / myAtt.length * 100) : 0;
  const myDue = role === "student" ? state.fees.filter(f => f.studentId === state.currentUser?.id && f.status === "pending").reduce((s, f) => s + Number(f.amount || 0), 0) : 0;

  return (
    <Section title={`Welcome${state.currentUser?.name ? ", " + state.currentUser.name : ""}!`}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 22 }}>
        {role === "admin" && <>
          <Stat label="Total Students" value={state.students.length} icon="users" col="#2563EB" />
          <Stat label="Total Teachers" value={state.teachers.length} icon="user" col="#0EA5E9" />
          <Stat label="Pending Fees" value={state.fees.filter(f => f.status === "pending").length} icon="dollar" col="#F59E0B" />
          <Stat label="Present Today" value={todayAtt.filter(a => a.status === "present").length} icon="check" col="#10B981" />
        </>}
        {role === "teacher" && <>
          <Stat label="Total Students" value={state.students.length} icon="users" col="#2563EB" />
          <Stat label="Present Today" value={todayAtt.filter(a => a.status === "present").length} icon="check" col="#10B981" />
          <Stat label="My Assignments" value={state.assignments.filter(a => a.teacherId === state.currentUser?.id).length} icon="file" col="#8B5CF6" />
        </>}
        {role === "student" && <>
          <Stat label="My Attendance" value={`${myPct}%`} icon="clipboard" col={myPct < 75 ? "#EF4444" : "#10B981"} sub={myPct < 75 ? "⚠ Low attendance" : "Good standing"} />
          <Stat label="Fee Due" value={`₹${myDue}`} icon="dollar" col="#F59E0B" />
          <Stat label="My Submissions" value={state.submissions.filter(s => s.studentId === state.currentUser?.id).length} icon="file" col="#8B5CF6" />
        </>}
        <Stat label="Announcements" value={state.announcements.length} icon="bell" col="#8B5CF6" />
      </div>

      {state.announcements.length > 0 && (
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#374151" }}>Recent Announcements</h3>
          {[...state.announcements].reverse().slice(0, 4).map((a, i, arr) => (
            <div key={a.id || i} style={{ padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</span>
                {a.priority === "urgent" && <Badge col="#EF4444">Urgent</Badge>}
              </div>
              <p style={{ color: "#64748b", fontSize: 12, margin: "3px 0 0" }}>{a.message}</p>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{fmtDate(a.date)} · {a.postedBy}</div>
            </div>
          ))}
        </Card>
      )}

      {state.students.length === 0 && role === "admin" && (
        <Card style={{ textAlign: "center", padding: 40, marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}><Ic n="book" sz={40} col="#cbd5e1" /></div>
          <h3 style={{ color: "#374151", margin: "0 0 8px" }}>Get Started</h3>
          <p style={{ color: "#64748b", margin: "0 0 16px", fontSize: 13 }}>
            Set up your college profile, add classes, teachers and students.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn onClick={() => setSec("settings")} icon="settings">College Settings</Btn>
            <Btn v="secondary" onClick={() => setSec("students")} icon="users">Add Students</Btn>
          </div>
        </Card>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────
function Students({ state, update, showToast }) {
  const [search, setSearch] = useState("");
  const [fcls, setFcls] = useState("");
  const [form, setForm] = useState(null);
  const [view, setView] = useState(null);

  const filtered = state.students.filter(s =>
    (s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase())) &&
    (!fcls || s.classId === fcls)
  );

  const save = () => {
    if (!form.name || !form.email) { showToast("Name & email required", "error"); return; }
    if (state.students.some(s => s.email === form.email && s.id !== form.id)) { showToast("Email exists", "error"); return; }
    update(prev => {
      const students = form._ex
        ? prev.students.map(s => s.id === form.id ? { ...form } : s)
        : [...prev.students, { ...form, id: genId("STU"), password: form.password || genPw(), createdAt: new Date().toISOString() }];
      return { ...prev, students };
    });
    showToast(form._ex ? "Updated" : "Student added");
    setForm(null);
  };

  const del = (id) => {
    if (!window.confirm("Delete this student?")) return;
    update(p => ({ ...p, students: p.students.filter(s => s.id !== id) }));
    showToast("Deleted");
  };

  return (
    <Section title="Student Management"
      actions={<Btn icon="plus" onClick={() => setForm({ name: "", email: "", phone: "", parentPhone: "", classId: "", photo: "", address: "", dob: "", gender: "", password: "" })}>Add Student</Btn>}>
      <Card>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <SSearch placeholder="Search students…"
              suggestions={state.students.map(s => `${s.name} (${s.id})`)}
              value={search} onChange={setSearch}
              onSelect={v => setSearch(v.split(" (")[0])} />
          </div>
          <Sel value={fcls} onChange={e => setFcls(e.target.value)} style={{ width: 150 }}>
            <option value="">All Classes</option>
            {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Sel>
        </div>
        <Tbl
          cols={["", "ID", "Name", "Email", "Class", "Parent Ph."]}
          rows={filtered.map(s => ({
            data: s,
            cells: [
              s.photo
                ? <img src={s.photo} style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover" }} alt="" />
                : <div style={{ width: 30, height: 30, borderRadius: 6, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontWeight: 700, fontSize: 11 }}>{(s.name || "?")[0]}</div>,
              <Badge col="#2563EB">{s.id}</Badge>,
              s.name, s.email,
              state.classes.find(c => c.id === s.classId)?.name || "-",
              s.parentPhone || s.phone || "-",
            ]
          }))}
          actions={s => (
            <div style={{ display: "flex", gap: 4 }}>
              <Btn sz="sm" v="secondary" icon="eye" onClick={() => setView(s)}>View</Btn>
              <Btn sz="sm" v="secondary" icon="edit" onClick={() => setForm({ ...s, _ex: true })}>Edit</Btn>
              <Btn sz="sm" v="danger" icon="trash" onClick={() => del(s.id)} />
            </div>
          )}
        />
      </Card>

      {form && (
        <Modal title={form._ex ? "Edit Student" : "Add Student"} onClose={() => setForm(null)} sz="lg">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Fld label="Full Name" req><Inp value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></Fld>
            <Fld label="Email" req><Inp type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" /></Fld>
            <Fld label="Phone"><Inp value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" /></Fld>
            <Fld label="Parent Phone"><Inp value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} placeholder="Parent phone" /></Fld>
            <Fld label="Class">
              <Sel value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
                <option value="">Select class</option>
                {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Sel>
            </Fld>
            <Fld label="Date of Birth"><Inp type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} /></Fld>
            <Fld label="Gender">
              <Sel value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Sel>
            </Fld>
            <Fld label="Password">
              <div style={{ display: "flex", gap: 7 }}>
                <Inp value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Auto-generated" />
                <Btn sz="sm" v="secondary" icon="refresh" onClick={() => setForm(f => ({ ...f, password: genPw() }))} />
              </div>
            </Fld>
          </div>
          <Fld label="Address"><Txta value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Address" /></Fld>
          <Fld label="Photo"><ImgUp value={form.photo} onChange={v => setForm(f => ({ ...f, photo: v }))} /></Fld>
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end", marginTop: 6 }}>
            <Btn v="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>{form._ex ? "Update" : "Add Student"}</Btn>
          </div>
        </Modal>
      )}

      {view && (
        <Modal title="Student Profile" onClose={() => setView(null)}>
          <div style={{ display: "flex", gap: 18, marginBottom: 18, flexWrap: "wrap" }}>
            {view.photo
              ? <img src={view.photo} style={{ width: 76, height: 76, borderRadius: 12, objectFit: "cover" }} alt="" />
              : <div style={{ width: 76, height: 76, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: 26, fontWeight: 800 }}>{(view.name || "?")[0]}</div>}
            <div>
              <h2 style={{ margin: "0 0 5px", fontSize: 18 }}>{view.name}</h2>
              <Badge col="#2563EB">{view.id}</Badge>
              <div style={{ marginTop: 8, color: "#64748b", fontSize: 13 }}>{view.email}</div>
            </div>
          </div>
          {[
            ["Class", state.classes.find(c => c.id === view.classId)?.name || "-"],
            ["Phone", view.phone || "-"], ["Parent Phone", view.parentPhone || "-"],
            ["DOB", view.dob || "-"], ["Gender", view.gender || "-"], ["Address", view.address || "-"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
              <span style={{ color: "#64748b", width: 110, flexShrink: 0 }}>{k}</span>
              <span style={{ color: "#0F172A" }}>{v}</span>
            </div>
          ))}
          {(view.parentPhone || view.phone) && (
            <div style={{ marginTop: 14 }}>
              <Btn v="wa" icon="whatsapp" onClick={() => sendWA(view.parentPhone || view.phone, `Hello, message regarding student ${view.name} from ${state.college.name || "College"}.`)}>
                Message Parent
              </Btn>
            </div>
          )}
        </Modal>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────
// TEACHERS
// ─────────────────────────────────────────────
function Teachers({ state, update, showToast }) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);

  const filtered = state.teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const save = () => {
    if (!form.name || !form.email) { showToast("Name & email required", "error"); return; }
    if (state.teachers.some(t => t.email === form.email && t.id !== form.id)) { showToast("Email exists", "error"); return; }
    update(prev => {
      const teachers = form._ex
        ? prev.teachers.map(t => t.id === form.id ? { ...form } : t)
        : [...prev.teachers, { ...form, id: genId("TCH"), password: form.password || genPw(), createdAt: new Date().toISOString() }];
      return { ...prev, teachers };
    });
    showToast(form._ex ? "Updated" : "Teacher added");
    setForm(null);
  };

  return (
    <Section title="Teacher Management"
      actions={<Btn icon="plus" onClick={() => setForm({ name: "", email: "", phone: "", subjects: [], photo: "", qualification: "", password: "" })}>Add Teacher</Btn>}>
      <Card>
        <div style={{ marginBottom: 14 }}>
          <SSearch placeholder="Search teachers…" suggestions={state.teachers.map(t => t.name)} value={search} onChange={setSearch} onSelect={setSearch} />
        </div>
        <Tbl
          cols={["", "ID", "Name", "Email", "Subjects"]}
          rows={filtered.map(t => ({
            data: t,
            cells: [
              t.photo
                ? <img src={t.photo} style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover" }} alt="" />
                : <div style={{ width: 30, height: 30, borderRadius: 6, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", fontWeight: 700, fontSize: 11 }}>{(t.name || "?")[0]}</div>,
              <Badge col="#059669">{t.id}</Badge>,
              t.name, t.email,
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {(t.subjects || []).map(s => <Badge key={s} col="#8B5CF6">{s}</Badge>)}
                {!(t.subjects || []).length && <span style={{ color: "#94a3b8" }}>-</span>}
              </div>
            ]
          }))}
          actions={t => (
            <div style={{ display: "flex", gap: 4 }}>
              <Btn sz="sm" v="secondary" icon="edit" onClick={() => setForm({ ...t, _ex: true })}>Edit</Btn>
              <Btn sz="sm" v="danger" icon="trash" onClick={() => {
                if (window.confirm("Delete?")) { update(p => ({ ...p, teachers: p.teachers.filter(x => x.id !== t.id) })); showToast("Deleted"); }
              }} />
            </div>
          )}
        />
      </Card>

      {form && (
        <Modal title={form._ex ? "Edit Teacher" : "Add Teacher"} onClose={() => setForm(null)} sz="lg">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Fld label="Full Name" req><Inp value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Fld>
            <Fld label="Email" req><Inp type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Fld>
            <Fld label="Phone"><Inp value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Fld>
            <Fld label="Qualification"><Inp value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} /></Fld>
            <Fld label="Password">
              <div style={{ display: "flex", gap: 7 }}>
                <Inp value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Auto-generated" />
                <Btn sz="sm" v="secondary" icon="refresh" onClick={() => setForm(f => ({ ...f, password: genPw() }))} />
              </div>
            </Fld>
          </div>
          <Fld label="Subjects (comma-separated)">
            <Inp value={(form.subjects || []).join(", ")}
              onChange={e => setForm(f => ({ ...f, subjects: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
              placeholder="Math, Science, English" />
          </Fld>
          <Fld label="Photo"><ImgUp value={form.photo} onChange={v => setForm(f => ({ ...f, photo: v }))} /></Fld>
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
            <Btn v="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>{form._ex ? "Update" : "Add"}</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────
// CLASSES
// ─────────────────────────────────────────────
function Classes({ state, update, showToast }) {
  const [form, setForm] = useState(null);

  const save = () => {
    if (!form.name) { showToast("Class name required", "error"); return; }
    update(prev => {
      const classes = form._ex ? prev.classes.map(c => c.id === form.id ? form : c) : [...prev.classes, { ...form, id: genId("CLS") }];
      return { ...prev, classes };
    });
    showToast("Saved"); setForm(null);
  };

  return (
    <Section title="Classes & Sections"
      actions={<Btn icon="plus" onClick={() => setForm({ name: "", section: "", teacherId: "", subjects: [] })}>Add Class</Btn>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
        {state.classes.length === 0 && <Card><p style={{ color: "#94a3b8", textAlign: "center", margin: 0, padding: 20 }}>No classes yet.</p></Card>}
        {state.classes.map(c => (
          <Card key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}{c.section ? " — " + c.section : ""}</div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Teacher: {state.teachers.find(t => t.id === c.teacherId)?.name || "Unassigned"}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>Students: {state.students.filter(s => s.classId === c.id).length}</div>
                {(c.subjects || []).length > 0 && (
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 6 }}>
                    {c.subjects.map(s => <Badge key={s} col="#2563EB">{s}</Badge>)}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Btn sz="sm" v="secondary" icon="edit" onClick={() => setForm({ ...c, _ex: true })} />
                <Btn sz="sm" v="danger" icon="trash" onClick={() => {
                  if (window.confirm("Delete?")) { update(p => ({ ...p, classes: p.classes.filter(x => x.id !== c.id) })); showToast("Deleted"); }
                }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {form && (
        <Modal title={form._ex ? "Edit Class" : "Add Class"} onClose={() => setForm(null)}>
          <Fld label="Class Name" req><Inp value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Class 10" /></Fld>
          <Fld label="Section"><Inp value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="e.g. A" /></Fld>
          <Fld label="Class Teacher">
            <Sel value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
              <option value="">Select teacher</option>
              {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Sel>
          </Fld>
          <Fld label="Subjects (comma-separated)">
            <Inp value={(form.subjects || []).join(", ")}
              onChange={e => setForm(f => ({ ...f, subjects: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
              placeholder="Math, Science, English" />
          </Fld>
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
            <Btn v="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>Save</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────
function Attendance({ state, update, showToast }) {
  const [tab, setTab] = useState("mark");
  const [selCls, setSelCls] = useState("");
  const [selDate, setSelDate] = useState(new Date().toISOString().split("T")[0]);
  const [attMap, setAttMap] = useState({});

  useEffect(() => {
    if (!selCls || !selDate) return;
    const ex = {};
    state.attendance.filter(a => a.classId === selCls && a.date === selDate).forEach(a => { ex[a.studentId] = a.status; });
    setAttMap(ex);
  }, [selCls, selDate, state.attendance]);

  const clsStu = state.students.filter(s => s.classId === selCls);

  const getPct = sid => {
    const all = state.attendance.filter(a => a.studentId === sid);
    return all.length ? Math.round(all.filter(a => a.status === "present").length / all.length * 100) : null;
  };

  const saveAtt = () => {
    if (!selCls || !selDate) { showToast("Select class and date", "error"); return; }
    update(prev => {
      const filtered = prev.attendance.filter(a => !(a.classId === selCls && a.date === selDate));
      const newR = clsStu.map(s => ({ id: genId("ATT"), studentId: s.id, classId: selCls, date: selDate, status: attMap[s.id] || "absent" }));
      return { ...prev, attendance: [...filtered, ...newR] };
    });
    showToast("Attendance saved");
  };

  return (
    <Section title="Attendance">
      <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        <Btn v={tab === "mark" ? "primary" : "secondary"} onClick={() => setTab("mark")}>Mark Attendance</Btn>
        <Btn v={tab === "report" ? "primary" : "secondary"} onClick={() => setTab("report")}>View Report</Btn>
      </div>

      {tab === "mark" && (
        <Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <Sel value={selCls} onChange={e => setSelCls(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
              <option value="">Select Class</option>
              {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Sel>
            <Inp type="date" value={selDate} onChange={e => setSelDate(e.target.value)} style={{ flex: 1, minWidth: 140 }} />
          </div>

          {selCls && clsStu.length > 0 && <>
            <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
              <Btn sz="sm" v="success" onClick={() => { const m = {}; clsStu.forEach(s => m[s.id] = "present"); setAttMap(m); }}>All Present</Btn>
              <Btn sz="sm" v="danger" onClick={() => { const m = {}; clsStu.forEach(s => m[s.id] = "absent"); setAttMap(m); }}>All Absent</Btn>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {clsStu.map(s => {
                const pct = getPct(s.id);
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", background: "#f8fafc", borderRadius: 8, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9 }}>
                      {s.photo
                        ? <img src={s.photo} style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover" }} alt="" />
                        : <div style={{ width: 30, height: 30, borderRadius: 6, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontWeight: 700, fontSize: 11 }}>{(s.name || "?")[0]}</div>}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                        {pct !== null && <div style={{ fontSize: 11, color: pct < 75 ? "#DC2626" : "#059669" }}>{pct}% {pct < 75 ? "⚠ Low" : ""}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {["present", "absent", "late"].map(st => (
                        <button key={st} onClick={() => setAttMap(m => ({ ...m, [s.id]: st }))}
                          style={{
                            padding: "5px 10px", borderRadius: 6, border: "1.5px solid", cursor: "pointer",
                            fontSize: 11, fontWeight: 600, textTransform: "capitalize", fontFamily: "inherit",
                            background: attMap[s.id] === st ? (st === "present" ? "#D1FAE5" : st === "late" ? "#FEF3C7" : "#FEE2E2") : "#fff",
                            borderColor: attMap[s.id] === st ? (st === "present" ? "#059669" : st === "late" ? "#D97706" : "#DC2626") : "#e2e8f0",
                            color: attMap[s.id] === st ? (st === "present" ? "#059669" : st === "late" ? "#D97706" : "#DC2626") : "#64748b"
                          }}>{st}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14 }}><Btn onClick={saveAtt}>Save Attendance</Btn></div>
          </>}
          {selCls && clsStu.length === 0 && <p style={{ color: "#94a3b8", textAlign: "center" }}>No students in this class.</p>}
          {!selCls && <p style={{ color: "#94a3b8", textAlign: "center" }}>Select a class to mark attendance.</p>}
        </Card>
      )}

      {tab === "report" && (
        <Card>
          <Tbl
            cols={["Student", "Class", "Present", "Absent", "Late", "Attendance"]}
            rows={state.students.map(s => {
              const att = state.attendance.filter(a => a.studentId === s.id);
              const pr = att.filter(a => a.status === "present").length;
              const ab = att.filter(a => a.status === "absent").length;
              const la = att.filter(a => a.status === "late").length;
              const pct = att.length ? Math.round(pr / att.length * 100) : 0;
              return {
                data: s, cells: [
                  s.name, state.classes.find(c => c.id === s.classId)?.name || "-",
                  pr, ab, la,
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 70, height: 5, background: "#e2e8f0", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct < 75 ? "#EF4444" : "#10B981", borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, color: pct < 75 ? "#EF4444" : "#059669", fontWeight: 600 }}>{pct}%</span>
                    {pct < 75 && <Badge col="#EF4444">Low</Badge>}
                  </div>
                ]
              };
            })}
          />
        </Card>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────
// ASSIGNMENTS
// ─────────────────────────────────────────────
function Assignments({ state, update, showToast }) {
  const role = state.currentRole;
  const [form, setForm] = useState(null);
  const [viewSubs, setViewSubs] = useState(null);

  const myAssign = role === "student"
    ? state.assignments.filter(a => a.classId === state.currentUser?.classId)
    : role === "teacher"
      ? state.assignments.filter(a => a.teacherId === state.currentUser?.id)
      : state.assignments;

  const save = () => {
    if (!form.title || !form.classId) { showToast("Title & class required", "error"); return; }
    update(prev => {
      const assignments = form._ex
        ? prev.assignments.map(a => a.id === form.id ? form : a)
        : [...prev.assignments, { ...form, id: genId("ASN"), teacherId: prev.currentUser?.id, teacherName: prev.currentUser?.name, createdAt: new Date().toISOString() }];
      return { ...prev, assignments };
    });
    showToast("Saved"); setForm(null);
  };

  const submit = (assignId, text) => {
    if (state.submissions.some(s => s.assignmentId === assignId && s.studentId === state.currentUser?.id)) {
      showToast("Already submitted", "error"); return;
    }
    update(prev => ({
      ...prev, submissions: [...prev.submissions, {
        id: genId("SUB"), assignmentId: assignId, studentId: prev.currentUser?.id,
        studentName: prev.currentUser?.name, text, submittedAt: new Date().toISOString(), status: "submitted"
      }]
    }));
    showToast("Submitted!");
  };

  return (
    <Section title="Assignments"
      actions={(role === "admin" || role === "teacher") && (
        <Btn icon="plus" onClick={() => setForm({ title: "", description: "", classId: "", dueDate: "", maxMarks: 100 })}>Create</Btn>
      )}>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {myAssign.length === 0 && <Card><p style={{ textAlign: "center", color: "#94a3b8", margin: 0, padding: 20 }}>No assignments found.</p></Card>}
        {myAssign.map(a => {
          const subs = state.submissions.filter(s => s.assignmentId === a.id);
          const mySub = state.submissions.find(s => s.assignmentId === a.id && s.studentId === state.currentUser?.id);
          const overdue = a.dueDate && new Date(a.dueDate) < new Date();
          return (
            <Card key={a.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{a.title}</h3>
                    {overdue && <Badge col="#EF4444">Overdue</Badge>}
                    {mySub && <Badge col="#10B981">Submitted</Badge>}
                  </div>
                  {a.description && <p style={{ color: "#64748b", fontSize: 13, margin: "5px 0 0" }}>{a.description}</p>}
                  <div style={{ display: "flex", gap: 14, marginTop: 7, fontSize: 11, color: "#94a3b8", flexWrap: "wrap" }}>
                    <span>Class: {state.classes.find(c => c.id === a.classId)?.name || a.classId}</span>
                    {a.dueDate && <span>Due: {fmtDate(a.dueDate)}</span>}
                    {a.maxMarks && <span>Max: {a.maxMarks}</span>}
                    {(role === "admin" || role === "teacher") && <span>Submissions: {subs.length}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {(role === "admin" || role === "teacher") && (
                    <>
                      <Btn sz="sm" v="secondary" icon="eye" onClick={() => setViewSubs(a)}>Subs</Btn>
                      <Btn sz="sm" v="danger" icon="trash" onClick={() => {
                        if (window.confirm("Delete?")) { update(p => ({ ...p, assignments: p.assignments.filter(x => x.id !== a.id) })); showToast("Deleted"); }
                      }} />
                    </>
                  )}
                  {role === "student" && !mySub && <SubmitBtn assignment={a} onSubmit={submit} />}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {form && (
        <Modal title="Create Assignment" onClose={() => setForm(null)}>
          <Fld label="Title" req><Inp value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Fld>
          <Fld label="Description"><Txta value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Fld>
          <Fld label="Class" req>
            <Sel value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
              <option value="">Select class</option>
              {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Sel>
          </Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Fld label="Due Date"><Inp type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></Fld>
            <Fld label="Max Marks"><Inp type="number" value={form.maxMarks} onChange={e => setForm(f => ({ ...f, maxMarks: e.target.value }))} /></Fld>
          </div>
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
            <Btn v="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>Create</Btn>
          </div>
        </Modal>
      )}

      {viewSubs && (
        <Modal title={`Submissions: ${viewSubs.title}`} onClose={() => setViewSubs(null)} sz="lg">
          <Tbl
            cols={["Student", "Submitted", "Answer"]}
            rows={state.submissions.filter(s => s.assignmentId === viewSubs.id).map(sub => ({
              data: sub,
              cells: [sub.studentName || sub.studentId, fmtDate(sub.submittedAt),
              <span style={{ color: "#64748b" }}>{(sub.text || "").substring(0, 80)}{(sub.text || "").length > 80 ? "…" : ""}</span>]
            }))}
          />
        </Modal>
      )}
    </Section>
  );
}

function SubmitBtn({ assignment, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return <>
    <Btn sz="sm" onClick={() => setOpen(true)}>Submit</Btn>
    {open && (
      <Modal title="Submit Assignment" onClose={() => setOpen(false)}>
        <Fld label="Your Answer"><Txta value={text} onChange={e => setText(e.target.value)} placeholder="Type your answer…" /></Fld>
        <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
          <Btn v="secondary" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={() => { onSubmit(assignment.id, text); setOpen(false); }}>Submit</Btn>
        </div>
      </Modal>
    )}
  </>;
}

// ─────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────
function Announcements({ state, update, showToast }) {
  const role = state.currentRole;
  const [form, setForm] = useState(null);

  const save = () => {
    if (!form.title || !form.message) { showToast("Title & message required", "error"); return; }
    update(prev => ({
      ...prev, announcements: [...prev.announcements, {
        ...form, id: genId("ANN"), postedBy: prev.currentUser?.name || "Admin", date: new Date().toISOString()
      }]
    }));
    showToast("Posted"); setForm(null);
  };

  return (
    <Section title="Announcements"
      actions={(role === "admin" || role === "teacher") && (
        <Btn icon="plus" onClick={() => setForm({ title: "", message: "", priority: "normal", targetClass: "" })}>Post</Btn>
      )}>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {state.announcements.length === 0 && <Card><p style={{ textAlign: "center", color: "#94a3b8", margin: 0, padding: 24 }}>No announcements yet.</p></Card>}
        {[...state.announcements].reverse().map((a, i) => (
          <Card key={a.id || i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{a.title}</h3>
                  {a.priority === "urgent" && <Badge col="#EF4444">Urgent</Badge>}
                  {a.targetClass && <Badge col="#8B5CF6">{state.classes.find(c => c.id === a.targetClass)?.name || ""}</Badge>}
                </div>
                <p style={{ color: "#374151", fontSize: 13, margin: "7px 0 0" }}>{a.message}</p>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>{fmtDate(a.date)} · {a.postedBy}</div>
              </div>
              {role === "admin" && (
                <Btn sz="sm" v="danger" icon="trash" onClick={() => update(p => ({ ...p, announcements: p.announcements.filter(x => x.id !== a.id) }))} />
              )}
            </div>
          </Card>
        ))}
      </div>

      {form && (
        <Modal title="Post Announcement" onClose={() => setForm(null)}>
          <Fld label="Title" req><Inp value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Fld>
          <Fld label="Message" req><Txta value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Fld label="Priority">
              <Sel value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </Sel>
            </Fld>
            <Fld label="Target Class">
              <Sel value={form.targetClass} onChange={e => setForm(f => ({ ...f, targetClass: e.target.value }))}>
                <option value="">All Classes</option>
                {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Sel>
            </Fld>
          </div>
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
            <Btn v="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>Post</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────
// FEES
// ─────────────────────────────────────────────
function Fees({ state, update, showToast }) {
  const role = state.currentRole;
  const [fSt, setFSt] = useState("");
  const [form, setForm] = useState(null);

  const all = role === "student" ? state.fees.filter(f => f.studentId === state.currentUser?.id) : state.fees;
  const filtered = all.filter(f => !fSt || f.status === fSt);
  const paid = all.filter(f => f.status === "paid").reduce((s, f) => s + Number(f.amount || 0), 0);
  const pend = all.filter(f => f.status === "pending").reduce((s, f) => s + Number(f.amount || 0), 0);

  const save = () => {
    if (!form.studentId || !form.amount || !form.feeType) { showToast("Fill required fields", "error"); return; }
    update(prev => {
      const fees = form._ex ? prev.fees.map(f => f.id === form.id ? form : f) : [...prev.fees, { ...form, id: genId("FEE"), createdAt: new Date().toISOString() }];
      return { ...prev, fees };
    });
    showToast("Saved"); setForm(null);
  };

  const printRec = f => {
    const stu = state.students.find(s => s.id === f.studentId);
    doPrint(`
      <div style="max-width:400px;margin:auto;border:2px solid #2563EB;border-radius:12px;padding:24px">
        <div style="text-align:center;border-bottom:1px solid #e2e8f0;padding-bottom:14px;margin-bottom:14px">
          <h2 style="color:#2563EB;margin:0">${state.college.name || "College"}</h2>
          <h3 style="margin:6px 0 0">FEE RECEIPT</h3>
        </div>
        <table style="border:none">${[
        ["Receipt No", f.id], ["Date", fmtDate(f.createdAt)],
        ["Student", stu?.name || "-"], ["Student ID", f.studentId],
        ["Fee Type", f.feeType], ["Amount", "₹" + f.amount],
        ["Status", f.status], ["Remarks", f.remarks || "-"]
      ].map(([k, v]) => `<tr><td style="border:none;padding:5px;color:#64748b">${k}</td><td style="border:none;padding:5px;font-weight:600">${v}</td></tr>`).join("")}
        </table>
        <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px">Computer-generated receipt.</p>
      </div>`, "Fee Receipt");
  };

  return (
    <Section title="Fee Management"
      actions={role === "admin" && <Btn icon="plus" onClick={() => setForm({ studentId: "", amount: "", feeType: "", status: "pending", dueDate: "", remarks: "" })}>Add Fee</Btn>}>
      <Card>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <Sel value={fSt} onChange={e => setFSt(e.target.value)} style={{ width: 150 }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
          </Sel>
          <div style={{ marginLeft: "auto", display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
            <span>Collected: <strong style={{ color: "#059669" }}>₹{paid}</strong></span>
            <span>Pending: <strong style={{ color: "#EF4444" }}>₹{pend}</strong></span>
          </div>
        </div>
        <Tbl
          cols={["Student", "Type", "Amount", "Due", "Status", ""]}
          rows={filtered.map(f => {
            const stu = state.students.find(s => s.id === f.studentId);
            return {
              data: f, cells: [
                stu?.name || f.studentId, f.feeType, `₹${f.amount}`,
                f.dueDate ? fmtDate(f.dueDate) : "-",
                <Badge col={f.status === "paid" ? "#10B981" : f.status === "partial" ? "#F59E0B" : "#EF4444"}>{f.status}</Badge>,
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn sz="sm" v="secondary" icon="print" onClick={() => printRec(f)}>Print</Btn>
                  {(stu?.parentPhone || stu?.phone) && (
                    <Btn sz="sm" v="wa" icon="whatsapp" onClick={() => sendWA(stu.parentPhone || stu.phone,
                      `Fee reminder for ${stu.name}. Type: ${f.feeType}, Amount: ₹${f.amount}, Status: ${f.status}. — ${state.college.name || "College"}`)}>WA</Btn>
                  )}
                </div>
              ]
            };
          })}
          actions={role === "admin" ? f => (
            <div style={{ display: "flex", gap: 4 }}>
              <Btn sz="sm" v="secondary" icon="edit" onClick={() => setForm({ ...f, _ex: true })} />
              <Btn sz="sm" v="danger" icon="trash" onClick={() => update(p => ({ ...p, fees: p.fees.filter(x => x.id !== f.id) }))} />
            </div>
          ) : undefined}
        />
      </Card>

      {form && (
        <Modal title={form._ex ? "Edit Fee" : "Add Fee Record"} onClose={() => setForm(null)}>
          <Fld label="Student" req>
            <Sel value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
              <option value="">Select student</option>
              {state.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
            </Sel>
          </Fld>
          <Fld label="Fee Type" req><Inp value={form.feeType} onChange={e => setForm(f => ({ ...f, feeType: e.target.value }))} placeholder="e.g. Tuition, Exam" /></Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Fld label="Amount (₹)" req><Inp type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></Fld>
            <Fld label="Due Date"><Inp type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></Fld>
          </div>
          <Fld label="Status">
            <Sel value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </Sel>
          </Fld>
          <Fld label="Remarks"><Txta value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} /></Fld>
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
            <Btn v="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>Save</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────
// WHATSAPP
// ─────────────────────────────────────────────
function WhatsAppPanel({ state }) {
  const [tab, setTab] = useState("individual");
  const [selStu, setSelStu] = useState("");
  const [selCls, setSelCls] = useState("");
  const [tpl, setTpl] = useState("");
  const [msg, setMsg] = useState("");

  const TPLS = {
    fee: `Dear Parent, this is a fee reminder. Please clear dues at the earliest. — ${state.college.name || "College"}`,
    absent: `Dear Parent, your child was absent today (${new Date().toLocaleDateString()}). — ${state.college.name || "College"}`,
    announce: `Dear Parent, we have an important announcement. Please check the ERP portal. — ${state.college.name || "College"}`,
  };

  return (
    <Section title="WhatsApp Messaging">
      <div style={{ display: "flex", gap: 7, marginBottom: 18, flexWrap: "wrap" }}>
        {["individual", "class", "bulk"].map(t => (
          <Btn key={t} v={tab === t ? "primary" : "secondary"} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</Btn>
        ))}
      </div>
      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>Message Templates</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 9, marginBottom: 16 }}>
          {[["fee", "💳 Fee Reminder"], ["absent", "🚫 Absent Alert"], ["announce", "📢 Announcement"]].map(([k, lbl]) => (
            <button key={k} onClick={() => { setTpl(k); setMsg(TPLS[k]); }}
              style={{
                padding: "11px 14px", borderRadius: 8, border: `1.5px solid ${tpl === k ? "#25D366" : "#e2e8f0"}`,
                background: tpl === k ? "#F0FDF4" : "#fff", cursor: "pointer", textAlign: "left",
                fontSize: 13, fontWeight: 600, color: tpl === k ? "#059669" : "#374151", fontFamily: "inherit"
              }}>{lbl}</button>
          ))}
        </div>

        <Fld label="Message">
          <Txta value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type your message…" style={{ minHeight: 90 }} />
        </Fld>

        {tab === "individual" && <>
          <Fld label="Select Student">
            <Sel value={selStu} onChange={e => setSelStu(e.target.value)}>
              <option value="">Choose student</option>
              {state.students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.parentPhone || s.phone || "No phone"}</option>)}
            </Sel>
          </Fld>
          <Btn v="wa" icon="whatsapp" disabled={!selStu || !msg} onClick={() => {
            const s = state.students.find(x => x.id === selStu);
            sendWA(s?.parentPhone || s?.phone, msg);
          }}>Send via WhatsApp</Btn>
        </>}

        {tab === "class" && <>
          <Fld label="Select Class">
            <Sel value={selCls} onChange={e => setSelCls(e.target.value)}>
              <option value="">Choose class</option>
              {state.classes.map(c => <option key={c.id} value={c.id}>{c.name} ({state.students.filter(s => s.classId === c.id).length} students)</option>)}
            </Sel>
          </Fld>
          <Btn v="wa" icon="whatsapp" disabled={!selCls || !msg} onClick={() => {
            state.students.filter(s => s.classId === selCls).forEach(s => sendWA(s.parentPhone || s.phone, msg));
          }}>Send to Class</Btn>
        </>}

        {tab === "bulk" && <>
          <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 12px" }}>
            Sends to all {state.students.filter(s => s.parentPhone || s.phone).length} students with a phone number.
          </p>
          <Btn v="wa" icon="whatsapp" disabled={!msg} onClick={() => {
            state.students.forEach(s => { const p = s.parentPhone || s.phone; if (p) sendWA(p, msg); });
          }}>Bulk Send to All</Btn>
        </>}
      </Card>
    </Section>
  );
}

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────
function Analytics({ state }) {
  const paid = state.fees.filter(f => f.status === "paid").reduce((s, f) => s + Number(f.amount || 0), 0);
  const pend = state.fees.filter(f => f.status === "pending").reduce((s, f) => s + Number(f.amount || 0), 0);
  const clsData = state.classes.map(c => ({ l: c.name, v: state.students.filter(s => s.classId === c.id).length })).filter(d => d.v > 0);

  return (
    <Section title="Analytics Dashboard">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 22 }}>
        <Stat label="Total Students" value={state.students.length} icon="users" col="#2563EB" />
        <Stat label="Total Teachers" value={state.teachers.length} icon="user" col="#0EA5E9" />
        <Stat label="Total Classes" value={state.classes.length} icon="book" col="#8B5CF6" />
        <Stat label="Collected" value={`₹${paid}`} icon="dollar" col="#10B981" />
        <Stat label="Pending" value={`₹${pend}`} icon="dollar" col="#F59E0B" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700 }}>Students per Class</h3>
          <BarChart data={clsData} />
        </Card>
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700 }}>Attendance Overview</h3>
          <PieChart data={[
            { l: "Present", v: state.attendance.filter(a => a.status === "present").length },
            { l: "Absent", v: state.attendance.filter(a => a.status === "absent").length },
            { l: "Late", v: state.attendance.filter(a => a.status === "late").length },
          ]} />
        </Card>
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700 }}>Fee Status</h3>
          <PieChart data={[{ l: "Paid", v: paid }, { l: "Pending", v: pend }]} />
        </Card>
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700 }}>Assignments</h3>
          <PieChart data={[
            { l: "Created", v: state.assignments.length },
            { l: "Submitted", v: state.submissions.length },
          ]} />
        </Card>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────
function Documents({ state, update, showToast }) {
  const role = state.currentRole;
  const [form, setForm] = useState(null);
  const docs = role === "student" ? state.documents.filter(d => d.studentId === state.currentUser?.id) : state.documents;

  const upload = () => {
    if (!form.title || !form.file) { showToast("Title and file required", "error"); return; }
    update(prev => ({
      ...prev, documents: [...prev.documents, {
        ...form, id: genId("DOC"), studentId: prev.currentUser?.id,
        studentName: prev.currentUser?.name, uploadedAt: new Date().toISOString(), verified: false
      }]
    }));
    showToast("Uploaded"); setForm(null);
  };

  return (
    <Section title="Documents"
      actions={role === "student" && <Btn icon="upload" onClick={() => setForm({ title: "", docType: "id_proof", file: null })}>Upload</Btn>}>
      <Card>
        <Tbl
          cols={["Student", "Document", "Type", "Uploaded", "Status"]}
          rows={docs.map(d => ({
            data: d, cells: [
              d.studentName || d.studentId, d.title,
              <Badge col="#8B5CF6">{(d.docType || "").replace(/_/g, " ")}</Badge>,
              fmtDate(d.uploadedAt),
              <Badge col={d.verified ? "#10B981" : "#F59E0B"}>{d.verified ? "Verified" : "Pending"}</Badge>
            ]
          }))}
          actions={role === "admin" ? d => (
            <div style={{ display: "flex", gap: 4 }}>
              {!d.verified && <Btn sz="sm" v="success" onClick={() => {
                update(p => ({ ...p, documents: p.documents.map(x => x.id === d.id ? { ...x, verified: true } : x) }));
                showToast("Verified");
              }}>Verify</Btn>}
              <Btn sz="sm" v="danger" icon="trash" onClick={() => update(p => ({ ...p, documents: p.documents.filter(x => x.id !== d.id) }))} />
            </div>
          ) : undefined}
        />
      </Card>

      {form && (
        <Modal title="Upload Document" onClose={() => setForm(null)}>
          <Fld label="Document Title" req><Inp value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Fld>
          <Fld label="Type">
            <Sel value={form.docType} onChange={e => setForm(f => ({ ...f, docType: e.target.value }))}>
              <option value="id_proof">ID Proof</option>
              <option value="certificate">Certificate</option>
              <option value="marksheet">Marksheet</option>
              <option value="other">Other</option>
            </Sel>
          </Fld>
          <Fld label="Document Image"><ImgUp value={form.file} onChange={v => setForm(f => ({ ...f, file: v }))} label="Upload Document" /></Fld>
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
            <Btn v="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={upload}>Upload</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────
function Store({ state, update, showToast }) {
  const role = state.currentRole;
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const filtered = state.storeItems.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const save = () => {
    if (!form.name || !form.price) { showToast("Name & price required", "error"); return; }
    update(prev => {
      const storeItems = form._ex ? prev.storeItems.map(i => i.id === form.id ? form : i) : [...prev.storeItems, { ...form, id: genId("ITM") }];
      return { ...prev, storeItems };
    });
    showToast("Saved"); setForm(null);
  };

  return (
    <Section title="Store — Uniforms & Books"
      actions={role === "admin" && <Btn icon="plus" onClick={() => setForm({ name: "", category: "uniform", price: "", stock: 0, description: "", image: "" })}>Add Item</Btn>}>
      <Card>
        <div style={{ marginBottom: 14 }}>
          <SSearch placeholder="Search store…" suggestions={state.storeItems.map(i => i.name)} value={search} onChange={setSearch} onSelect={setSearch} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 14 }}>
          {filtered.length === 0 && <p style={{ color: "#94a3b8", gridColumn: "1/-1", textAlign: "center", padding: 20, margin: 0 }}>No items yet.</p>}
          {filtered.map(item => (
            <div key={item.id} style={{ background: "#f8fafc", borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
              {item.image
                ? <img src={item.image} alt="" style={{ width: "100%", height: 110, objectFit: "cover" }} />
                : <div style={{ width: "100%", height: 80, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic n="store" sz={26} col="#2563EB" /></div>}
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, alignItems: "center" }}>
                  <Badge col="#2563EB">{item.category}</Badge>
                  <span style={{ fontWeight: 700, color: "#059669", fontSize: 14 }}>₹{item.price}</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <Badge col={Number(item.stock) > 0 ? "#10B981" : "#EF4444"}>
                    {Number(item.stock) > 0 ? `${item.stock} in stock` : "Out of stock"}
                  </Badge>
                </div>
                {role === "admin" && (
                  <div style={{ display: "flex", gap: 4, marginTop: 9 }}>
                    <Btn sz="sm" v="secondary" icon="edit" onClick={() => setForm({ ...item, _ex: true })}>Edit</Btn>
                    <Btn sz="sm" v="danger" icon="trash" onClick={() => update(p => ({ ...p, storeItems: p.storeItems.filter(x => x.id !== item.id) }))} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {form && (
        <Modal title={form._ex ? "Edit Item" : "Add Item"} onClose={() => setForm(null)}>
          <Fld label="Item Name" req><Inp value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Fld>
          <Fld label="Category">
            <Sel value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="uniform">Uniform</option>
              <option value="book">Book</option>
              <option value="stationery">Stationery</option>
              <option value="other">Other</option>
            </Sel>
          </Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Fld label="Price (₹)" req><Inp type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></Fld>
            <Fld label="Stock"><Inp type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></Fld>
          </div>
          <Fld label="Description"><Txta value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Fld>
          <Fld label="Image"><ImgUp value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} /></Fld>
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
            <Btn v="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>Save</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────
// ID CARD
// ─────────────────────────────────────────────
function IDCard({ state }) {
  const role = state.currentRole;
  const [selStu, setSelStu] = useState(role === "student" ? state.currentUser?.id : "");
  const stu = state.students.find(s => s.id === selStu);
  const cls = state.classes.find(c => c.id === stu?.classId);
  const pri = state.theme.primary;

  const print = () => {
    if (!stu) return;
    doPrint(`
      <div style="width:340px;border:3px solid ${pri};border-radius:16px;overflow:hidden;font-family:Arial;margin:auto">
        <div style="background:${pri};padding:18px;text-align:center;color:#fff">
          ${state.college.logo ? `<img src="${state.college.logo}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;margin-bottom:7px;display:block;margin-left:auto;margin-right:auto">` : ""}
          <div style="font-weight:800;font-size:15px">${state.college.name || "College"}</div>
          <div style="font-size:11px;opacity:.75;margin-top:2px">STUDENT IDENTITY CARD</div>
        </div>
        <div style="padding:18px;display:flex;gap:14px;align-items:flex-start">
          ${stu.photo ? `<img src="${stu.photo}" style="width:76px;height:76px;border-radius:8px;object-fit:cover;flex-shrink:0">` :
        `<div style="width:76px;height:76px;border-radius:8px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:${pri};flex-shrink:0">${(stu.name || "?")[0]}</div>`}
          <div>
            <div style="font-weight:800;font-size:16px">${stu.name}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px">ID: <strong>${stu.id}</strong></div>
            <div style="font-size:12px;color:#64748b">Class: ${cls?.name || "-"}</div>
            <div style="font-size:12px;color:#64748b">Phone: ${stu.phone || "-"}</div>
          </div>
        </div>
        <div style="background:#f8fafc;padding:9px 16px;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0">
          ${state.college.address || ""} ${state.college.phone ? "| " + state.college.phone : ""}
        </div>
      </div>`, "Student ID Card");
  };

  return (
    <Section title="ID Card Generator">
      {role === "admin" && (
        <Card style={{ marginBottom: 18 }}>
          <Fld label="Select Student">
            <Sel value={selStu} onChange={e => setSelStu(e.target.value)}>
              <option value="">Choose student</option>
              {state.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
            </Sel>
          </Fld>
        </Card>
      )}

      {stu ? (
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ width: 310, border: `3px solid ${pri}`, borderRadius: 14, overflow: "hidden", boxShadow: `0 8px 24px ${pri}22`, flexShrink: 0 }}>
            <div style={{ background: pri, padding: 18, textAlign: "center", color: "#fff" }}>
              {state.college.logo && <img src={state.college.logo} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover", marginBottom: 7 }} />}
              <div style={{ fontWeight: 800, fontSize: 14 }}>{state.college.name || "College"}</div>
              <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>STUDENT IDENTITY CARD</div>
            </div>
            <div style={{ padding: 16, display: "flex", gap: 13, alignItems: "flex-start" }}>
              {stu.photo
                ? <img src={stu.photo} alt="" style={{ width: 68, height: 68, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                : <div style={{ width: 68, height: 68, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: pri, flexShrink: 0 }}>{(stu.name || "?")[0]}</div>}
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{stu.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>ID: <strong>{stu.id}</strong></div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Class: {cls?.name || "-"}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Ph: {stu.phone || "-"}</div>
              </div>
            </div>
            <div style={{ background: "#f8fafc", padding: "7px 14px", fontSize: 11, color: "#94a3b8", textAlign: "center", borderTop: "1px solid #e2e8f0" }}>
              {state.college.address || ""}
            </div>
          </div>
          <Btn icon="print" onClick={print}>Print ID Card</Btn>
        </div>
      ) : (
        <Card><p style={{ textAlign: "center", color: "#94a3b8", padding: 24, margin: 0 }}>
          {role === "admin" ? "Select a student to generate ID card." : "Your profile information not found."}
        </p></Card>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────
// REPORT CARD
// ─────────────────────────────────────────────
function ReportCard({ state, update, showToast }) {
  const role = state.currentRole;
  const [selStu, setSelStu] = useState(role === "student" ? state.currentUser?.id : "");
  const [gForm, setGForm] = useState(null);
  const stu = state.students.find(s => s.id === selStu);
  const cls = state.classes.find(c => c.id === stu?.classId);
  const stuGrades = state.grades.filter(g => g.studentId === selStu);

  const saveG = () => {
    if (!gForm.subject || gForm.marks === "") { showToast("Subject & marks required", "error"); return; }
    update(prev => {
      const idx = prev.grades.findIndex(g => g.studentId === selStu && g.subject === gForm.subject);
      const grades = idx >= 0
        ? prev.grades.map((g, i) => i === idx ? { ...g, ...gForm } : g)
        : [...prev.grades, { ...gForm, id: genId("GRD"), studentId: selStu }];
      return { ...prev, grades };
    });
    showToast("Saved"); setGForm(null);
  };

  const print = () => {
    if (!stu || !stuGrades.length) return;
    const avg = Math.round(stuGrades.reduce((s, g) => s + Number(g.marks) / (Number(g.maxMarks) || 100) * 100, 0) / stuGrades.length);
    doPrint(`
      <div style="max-width:580px;margin:auto;font-family:Arial">
        <div style="text-align:center;border-bottom:2px solid #2563EB;padding-bottom:14px;margin-bottom:14px">
          ${state.college.logo ? `<img src="${state.college.logo}" style="width:54px;height:54px;border-radius:8px;object-fit:cover">` : ""}
          <h2 style="color:#2563EB;margin:8px 0 2px">${state.college.name || "College"}</h2>
          <h3 style="margin:0">PROGRESS REPORT CARD</h3>
        </div>
        <table style="margin-bottom:14px;width:100%;border:none">
          <tr><td style="border:none;padding:4px"><b>Name:</b> ${stu.name}</td><td style="border:none;padding:4px"><b>ID:</b> ${stu.id}</td></tr>
          <tr><td style="border:none;padding:4px"><b>Class:</b> ${cls?.name || "-"}</td><td style="border:none;padding:4px"><b>Date:</b> ${fmtDate(new Date())}</td></tr>
        </table>
        <table>
          <thead><tr style="background:#EFF6FF"><th>Subject</th><th>Marks</th><th>Max</th><th>Grade</th></tr></thead>
          <tbody>${stuGrades.map(g => {
      const pct = Math.round(Number(g.marks) / (Number(g.maxMarks) || 100) * 100);
      return `<tr><td>${g.subject}</td><td style="text-align:center">${g.marks}</td><td style="text-align:center">${g.maxMarks || 100}</td><td style="text-align:center;font-weight:700;color:#2563EB">${grade(pct)}</td></tr>`;
    }).join("")}</tbody>
        </table>
        <div style="margin-top:14px;text-align:right;font-size:16px;font-weight:700">Overall: ${avg}% — ${grade(avg)}</div>
      </div>`, "Report Card");
  };

  return (
    <Section title="Report Card">
      {(role === "admin" || role === "teacher") && (
        <Card style={{ marginBottom: 18 }}>
          <Fld label="Select Student">
            <Sel value={selStu} onChange={e => setSelStu(e.target.value)}>
              <option value="">Choose student</option>
              {state.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
            </Sel>
          </Fld>
        </Card>
      )}

      {stu ? (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{stu.name}</h3>
              <div style={{ color: "#64748b", fontSize: 12 }}>{stu.id} · {cls?.name || "-"}</div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              {(role === "admin" || role === "teacher") && (
                <Btn sz="sm" icon="plus" onClick={() => setGForm({ subject: "", marks: "", maxMarks: 100 })}>Add Marks</Btn>
              )}
              {stuGrades.length > 0 && <Btn sz="sm" v="secondary" icon="print" onClick={print}>Print</Btn>}
            </div>
          </div>

          <Tbl
            cols={["Subject", "Marks", "Max", "%", "Grade"]}
            rows={stuGrades.map(g => {
              const pct = Math.round(Number(g.marks) / (Number(g.maxMarks) || 100) * 100);
              return {
                data: g, cells: [
                  g.subject, g.marks, g.maxMarks || 100,
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 55, height: 5, background: "#e2e8f0", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct < 50 ? "#EF4444" : pct < 75 ? "#F59E0B" : "#10B981", borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12 }}>{pct}%</span>
                  </div>,
                  <Badge col={pct >= 80 ? "#10B981" : pct >= 60 ? "#2563EB" : "#EF4444"}>{grade(pct)}</Badge>
                ]
              };
            })}
            actions={(role === "admin" || role === "teacher") ? g => (
              <div style={{ display: "flex", gap: 4 }}>
                <Btn sz="sm" v="secondary" icon="edit" onClick={() => setGForm({ ...g })} />
                <Btn sz="sm" v="danger" icon="trash" onClick={() => update(p => ({ ...p, grades: p.grades.filter(x => x.id !== g.id) }))} />
              </div>
            ) : undefined}
          />

          {stuGrades.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: 20, margin: 0 }}>No marks entered yet.</p>}

          {stuGrades.length > 0 && (() => {
            const avg = Math.round(stuGrades.reduce((s, g) => s + Number(g.marks) / (Number(g.maxMarks) || 100) * 100, 0) / stuGrades.length);
            return (
              <div style={{ marginTop: 14, padding: 14, background: "#f8fafc", borderRadius: 8, display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
                <span>Subjects: <strong>{stuGrades.length}</strong></span>
                <span>Average: <strong>{avg}%</strong></span>
                <span>Grade: <strong style={{ color: avg >= 80 ? "#059669" : avg >= 60 ? "#2563EB" : "#EF4444" }}>{grade(avg)}</strong></span>
              </div>
            );
          })()}
        </Card>
      ) : (
        <Card><p style={{ textAlign: "center", color: "#94a3b8", padding: 24, margin: 0 }}>Select a student to view report card.</p></Card>
      )}

      {gForm && (
        <Modal title="Add / Edit Marks" onClose={() => setGForm(null)}>
          <Fld label="Subject" req><Inp value={gForm.subject} onChange={e => setGForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" /></Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Fld label="Marks Obtained" req><Inp type="number" value={gForm.marks} onChange={e => setGForm(f => ({ ...f, marks: e.target.value }))} /></Fld>
            <Fld label="Maximum Marks"><Inp type="number" value={gForm.maxMarks} onChange={e => setGForm(f => ({ ...f, maxMarks: e.target.value }))} /></Fld>
          </div>
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
            <Btn v="secondary" onClick={() => setGForm(null)}>Cancel</Btn>
            <Btn onClick={saveG}>Save</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────
// TIMETABLE
// ─────────────────────────────────────────────
function Timetable({ state, update, showToast }) {
  const role = state.currentRole;
  const [selCls, setSelCls] = useState("");
  const [form, setForm] = useState(null);
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const PERIODS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];

  const slots = state.timetable.filter(t => t.classId === selCls);
  const getSlot = (d, p) => slots.find(s => s.day === d && s.period === p);

  const save = () => {
    if (!form.subject) { showToast("Subject required", "error"); return; }
    update(prev => {
      const filtered = prev.timetable.filter(t => !(t.classId === selCls && t.day === form.day && t.period === form.period));
      return { ...prev, timetable: [...filtered, { ...form, id: genId("TT"), classId: selCls }] };
    });
    showToast("Saved"); setForm(null);
  };

  const clear = () => {
    update(p => ({ ...p, timetable: p.timetable.filter(t => !(t.classId === selCls && t.day === form.day && t.period === form.period)) }));
    showToast("Cleared"); setForm(null);
  };

  return (
    <Section title="Timetable">
      <Card style={{ marginBottom: 18 }}>
        <Fld label="Select Class">
          <Sel value={selCls} onChange={e => setSelCls(e.target.value)}>
            <option value="">Choose class</option>
            {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Sel>
        </Fld>
      </Card>

      {selCls && (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: "9px 11px", background: "#f8fafc", fontWeight: 700, color: "#374151", border: "1px solid #e2e8f0", minWidth: 50 }}>Day</th>
                  {PERIODS.map(p => (
                    <th key={p} style={{ padding: "9px 11px", background: "#f8fafc", fontWeight: 700, color: "#374151", border: "1px solid #e2e8f0", minWidth: 90 }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  <tr key={day}>
                    <td style={{ padding: "9px 11px", fontWeight: 700, color: "#374151", border: "1px solid #e2e8f0", background: "#f8fafc", whiteSpace: "nowrap" }}>{day}</td>
                    {PERIODS.map(period => {
                      const slot = getSlot(day, period);
                      return (
                        <td key={period}
                          onClick={role === "admin" ? () => setForm({ day, period, subject: slot?.subject || "", teacherId: slot?.teacherId || "", time: slot?.time || "" }) : undefined}
                          style={{ padding: 7, border: "1px solid #e2e8f0", verticalAlign: "top", cursor: role === "admin" ? "pointer" : "default", minWidth: 90 }}
                          onMouseEnter={e => { if (role === "admin") e.currentTarget.style.background = "#f0f9ff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          {slot ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 12, color: "#1E3A5F" }}>{slot.subject}</div>
                              {slot.teacherId && <div style={{ fontSize: 10, color: "#94a3b8" }}>{state.teachers.find(t => t.id === slot.teacherId)?.name || ""}</div>}
                              {slot.time && <div style={{ fontSize: 10, color: "#94a3b8" }}>{slot.time}</div>}
                            </div>
                          ) : role === "admin" ? (
                            <div style={{ color: "#cbd5e1", fontSize: 10, textAlign: "center" }}>+</div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {role === "admin" && <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 10, marginBottom: 0 }}>Click any cell to add or edit a period.</p>}
        </Card>
      )}

      {form && (
        <Modal title={`${form.day} — ${form.period}`} onClose={() => setForm(null)}>
          <Fld label="Subject" req><Inp value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></Fld>
          <Fld label="Teacher">
            <Sel value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
              <option value="">Unassigned</option>
              {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Sel>
          </Fld>
          <Fld label="Time (e.g. 9:00–10:00)"><Inp value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></Fld>
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
            <Btn v="danger" onClick={clear}>Clear Slot</Btn>
            <Btn v="secondary" onClick={() => setForm(null)}>Cancel</Btn>
            <Btn onClick={save}>Save</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────
function Profile({ state, update, showToast }) {
  const role = state.currentRole;
  const u = state.currentUser;
  const [f, setF] = useState({ name: u?.name || "", email: u?.email || "", photo: u?.photo || "", newPw: "" });

  const save = () => {
    if (role === "admin") {
      update(p => ({
        ...p,
        admin: { ...p.admin, name: f.name, email: f.email, photo: f.photo, ...(f.newPw ? { password: f.newPw } : {}) },
        currentUser: { ...p.currentUser, name: f.name, email: f.email, photo: f.photo }
      }));
    } else if (role === "teacher") {
      update(p => ({
        ...p,
        teachers: p.teachers.map(t => t.id === u.id ? { ...t, name: f.name, email: f.email, photo: f.photo, ...(f.newPw ? { password: f.newPw } : {}) } : t),
        currentUser: { ...p.currentUser, name: f.name, email: f.email, photo: f.photo }
      }));
    } else {
      update(p => ({
        ...p,
        students: p.students.map(s => s.id === u.id ? { ...s, name: f.name, email: f.email, photo: f.photo, ...(f.newPw ? { password: f.newPw } : {}) } : s),
        currentUser: { ...p.currentUser, name: f.name, email: f.email, photo: f.photo }
      }));
    }
    showToast("Profile updated");
  };

  return (
    <Section title="My Profile">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 18 }}>
            {f.photo
              ? <img src={f.photo} alt="" style={{ width: 84, height: 84, borderRadius: 14, objectFit: "cover", marginBottom: 11 }} />
              : <div style={{ width: 84, height: 84, borderRadius: 14, background: state.theme.primary + "18", display: "flex", alignItems: "center", justifyContent: "center", color: state.theme.primary, fontSize: 30, fontWeight: 800, marginBottom: 11 }}>
                {(f.name || "U")[0]}
              </div>}
            <ImgUp value={f.photo} onChange={v => setF(x => ({ ...x, photo: v }))} label="Change Photo" />
          </div>
          <Fld label="Full Name"><Inp value={f.name} onChange={e => setF(x => ({ ...x, name: e.target.value }))} /></Fld>
          <Fld label="Email"><Inp type="email" value={f.email} onChange={e => setF(x => ({ ...x, email: e.target.value }))} /></Fld>
          <Btn onClick={save} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>Update Profile</Btn>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>Change Password</h3>
          <Fld label="New Password">
            <Inp type="password" value={f.newPw} onChange={e => setF(x => ({ ...x, newPw: e.target.value }))} placeholder="Leave blank to keep current" />
          </Fld>
          <Btn v="secondary" onClick={save} style={{ width: "100%", justifyContent: "center" }}>Update Password</Btn>
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 7 }}>Account Info</div>
            <div style={{ fontSize: 13 }}>Role: <Badge col={role === "admin" ? "#2563EB" : role === "teacher" ? "#059669" : "#8B5CF6"}>{role}</Badge></div>
            {u?.id && <div style={{ fontSize: 13, marginTop: 5 }}>ID: <strong>{u.id}</strong></div>}
          </div>
        </Card>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────
function Settings({ state, update, showToast }) {
  const [tab, setTab] = useState("college");
  const [college, setCollege] = useState({ ...state.college });
  const [theme, setTheme] = useState({ ...state.theme });
  const [labels, setLabels] = useState({ ...state.labels });

  return (
    <Section title="Settings">
      <div style={{ display: "flex", gap: 7, marginBottom: 18, flexWrap: "wrap" }}>
        {[["college", "College Profile", "book"], ["theme", "Theme & Colors", "palette"], ["labels", "Labels & Text", "edit"]].map(([id, lbl, icon]) => (
          <Btn key={id} v={tab === id ? "primary" : "secondary"} icon={icon} onClick={() => setTab(id)}>{lbl}</Btn>
        ))}
      </div>

      {tab === "college" && (
        <Card>
          <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700 }}>College Profile</h3>
          <Fld label="College Name"><Inp value={college.name} onChange={e => setCollege(c => ({ ...c, name: e.target.value }))} placeholder="Enter college name" /></Fld>
          <Fld label="Logo"><ImgUp value={college.logo} onChange={v => setCollege(c => ({ ...c, logo: v }))} label="Upload Logo" /></Fld>
          <Fld label="Address"><Txta value={college.address} onChange={e => setCollege(c => ({ ...c, address: e.target.value }))} /></Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Fld label="Phone"><Inp value={college.phone} onChange={e => setCollege(c => ({ ...c, phone: e.target.value }))} /></Fld>
            <Fld label="Email"><Inp type="email" value={college.email} onChange={e => setCollege(c => ({ ...c, email: e.target.value }))} /></Fld>
          </div>
          <Fld label="Description"><Txta value={college.description} onChange={e => setCollege(c => ({ ...c, description: e.target.value }))} /></Fld>
          <Btn onClick={() => { update({ college }); showToast("College profile updated"); }}>Save College Profile</Btn>
          {college.name && (
            <div style={{ marginTop: 18, padding: 14, background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 7 }}>Live Preview:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {college.logo && <img src={college.logo} alt="" style={{ width: 38, height: 38, borderRadius: 7, objectFit: "cover" }} />}
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
          <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700 }}>Theme & Colors</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
            {[["primary", "Primary"], ["bg", "Background"], ["accent", "Accent"], ["sidebar", "Sidebar"], ["text", "Text"]].map(([k, lbl]) => (
              <Fld key={k} label={lbl + " Color"}>
                <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                  <input type="color" value={theme[k]} onChange={e => setTheme(t => ({ ...t, [k]: e.target.value }))}
                    style={{ width: 42, height: 34, borderRadius: 6, border: "1.5px solid #e2e8f0", padding: 2, cursor: "pointer" }} />
                  <Inp value={theme[k]} onChange={e => setTheme(t => ({ ...t, [k]: e.target.value }))} style={{ flex: 1 }} />
                </div>
              </Fld>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: theme.bg, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 7 }}>Preview:</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {[["Primary", theme.primary], ["Accent", theme.accent], ["Sidebar", theme.sidebar]].map(([lbl, col]) => (
                <div key={lbl} style={{ padding: "7px 14px", background: col, color: "#fff", borderRadius: 7, fontSize: 12, fontWeight: 600 }}>{lbl}</div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Btn onClick={() => { update({ theme }); showToast("Theme applied"); }}>Apply Theme</Btn>
          </div>
        </Card>
      )}

      {tab === "labels" && (
        <Card>
          <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700 }}>UI Labels</h3>
          <Fld label="App Title"><Inp value={labels.appTitle} onChange={e => setLabels(l => ({ ...l, appTitle: e.target.value }))} /></Fld>
          <Fld label="Students Section"><Inp value={labels.studentSection} onChange={e => setLabels(l => ({ ...l, studentSection: e.target.value }))} /></Fld>
          <Fld label="Teachers Section"><Inp value={labels.teacherSection} onChange={e => setLabels(l => ({ ...l, teacherSection: e.target.value }))} /></Fld>
          <Fld label="Fees Section"><Inp value={labels.feeSection} onChange={e => setLabels(l => ({ ...l, feeSection: e.target.value }))} /></Fld>
          <Btn onClick={() => { update({ labels }); showToast("Labels saved"); }}>Save Labels</Btn>
        </Card>
      )}
    </Section>
  );
}
