import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE (эмуляция БД через localStorage с методами CRUD)
// ─────────────────────────────────────────────────────────────────────────────
class Database {
  constructor(dbName) {
    this.dbName = dbName;
    this.initDB();
  }

  initDB() {
    if (!localStorage.getItem(this.dbName)) {
      localStorage.setItem(this.dbName, JSON.stringify({
        users: {},
        templates: {},
        workouts: {},
        settings: {}
      }));
    }
  }

  getDB() {
    return JSON.parse(localStorage.getItem(this.dbName));
  }

  saveDB(data) {
    localStorage.setItem(this.dbName, JSON.stringify(data));
  }

  // Users
  async getUsers() {
    const db = this.getDB();
    return db.users;
  }

  async saveUser(username, userData) {
    const db = this.getDB();
    db.users[username] = userData;
    this.saveDB(db);
    return true;
  }

  async getUser(username) {
    const db = this.getDB();
    return db.users[username] || null;
  }

  // Templates
  async getTemplates(username) {
    const db = this.getDB();
    return db.templates[username] || [];
  }

  async saveTemplates(username, templates) {
    const db = this.getDB();
    db.templates[username] = templates;
    this.saveDB(db);
    return true;
  }

  // Workouts
  async getWorkouts(username) {
    const db = this.getDB();
    return db.workouts[username] || [];
  }

  async saveWorkouts(username, workouts) {
    const db = this.getDB();
    db.workouts[username] = workouts;
    this.saveDB(db);
    return true;
  }

  // Settings
  async getSetting(username, key, defaultValue = null) {
    const db = this.getDB();
    return db.settings[username]?.[key] ?? defaultValue;
  }

  async saveSetting(username, key, value) {
    const db = this.getDB();
    if (!db.settings[username]) db.settings[username] = {};
    db.settings[username][key] = value;
    this.saveDB(db);
    return true;
  }

  async clearUserData(username) {
    const db = this.getDB();
    delete db.templates[username];
    delete db.workouts[username];
    delete db.settings[username];
    this.saveDB(db);
  }
}

const db = new Database("ironlog_db");

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  primary: "#800020",
  primaryLight: "#A52A2A",
  bg: "#111111",
  surface: "#1A1A1A",
  surface2: "#222222",
  border: "#333333",
  text: "#FFFFFF",
  muted: "#888888",
  danger: "#FF4444",
  success: "#4DFF91",
  accent: "#E8E8E8",
  info: "#666666",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/icon?family=Material+Icons&family=Material+Icons+Outlined');
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }
  body {
    background: ${C.bg};
    color: ${C.text};
    font-family: 'Inter', sans-serif;
    min-height: 100dvh;
  }
  input, select {
    background: ${C.surface2};
    border: 1px solid ${C.border};
    color: ${C.text};
    padding: 10px 14px;
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    width: 100%;
    outline: none;
    transition: all 0.2s;
  }
  input:focus, select:focus {
    border-color: ${C.primary};
  }
  button {
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s;
    border: none;
    outline: none;
  }
  ::-webkit-scrollbar {
    width: 4px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: ${C.border};
    border-radius: 4px;
  }
  .fade {
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .material-icons, .material-icons-outlined {
    font-size: 18px;
    vertical-align: middle;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Icon({ name, outlined = false, className = "", style = {} }) {
  const iconClass = outlined ? "material-icons-outlined" : "material-icons";
  return <span className={`${iconClass} ${className}`} style={style}>{name}</span>;
}

function Btn({ children, onClick, variant = "primary", size = "md", style = {}, disabled, icon }) {
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 12, gap: 4 },
    md: { padding: "8px 14px", fontSize: 13, gap: 6 },
    lg: { padding: "10px 18px", fontSize: 14, gap: 6 }
  };
  const variants = {
    primary: { background: C.primary, color: "#FFFFFF" },
    secondary: { background: C.surface2, color: C.text, border: `1px solid ${C.border}` },
    danger: { background: "transparent", color: C.danger, border: `1px solid ${C.danger}` },
    ghost: { background: "transparent", color: C.muted },
    success: { background: C.success, color: "#111111" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 6,
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sizes[size].gap,
        ...sizes[size],
        ...variants[variant],
        opacity: disabled ? 0.5 : 1,
        ...style
      }}
    >
      {icon && <Icon name={icon} style={{ fontSize: size === "sm" ? 14 : 16 }} />}
      {children}
    </button>
  );
}

function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 14,
        ...style
      }}
    >
      {children}
    </div>
  );
}

function Tag({ children, color = C.primary }) {
  return (
    <span style={{
      background: color + "10",
      color,
      borderRadius: 4,
      padding: "2px 8px",
      fontSize: 10,
      fontWeight: 500,
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }}>
      {children}
    </span>
  );
}

function ScreenHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: subtitle ? 4 : 0
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>{title}</h1>
        {action}
      </div>
      {subtitle && <p style={{ color: C.muted, fontSize: 12 }}>{subtitle}</p>}
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <Icon name="fitness_center" style={{ fontSize: 40, marginBottom: 8, animation: "pulse 1.5s infinite", color: C.primary }} />
        <p style={{ color: C.muted, fontSize: 13 }}>Загрузка...</p>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, zIndex = 200 }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.95)",
        zIndex,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end"
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="fade" style={{
        background: C.surface,
        borderRadius: "12px 12px 0 0",
        padding: 20,
        paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
        maxHeight: "92dvh",
        overflowY: "auto"
      }}>
        <div style={{ width: 40, height: 3, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: C.surface2,
              border: "none",
              color: C.muted,
              width: 28,
              height: 28,
              borderRadius: 4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Icon name="close" style={{ fontSize: 16 }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REST TIMER
// ─────────────────────────────────────────────────────────────────────────────
function RestTimer({ duration, onDone, onClose }) {
  const [remaining, setRemaining] = useState(duration);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startInterval = () => {
    if (intervalRef.current) stopInterval();
    intervalRef.current = setInterval(() => {
      if (!endTimeRef.current || paused) return;
      const now = Date.now();
      const newRemaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setRemaining(newRemaining);
      if (newRemaining <= 0) {
        stopInterval();
        onDone();
      }
    }, 100);
  };

  useEffect(() => {
    if (paused || remaining <= 0) {
      stopInterval();
      return;
    }
    endTimeRef.current = Date.now() + (remaining * 1000);
    startInterval();
    return stopInterval;
  }, [paused, remaining]);

  const handleAddTime = () => {
    if (paused) {
      setRemaining(prev => prev + 15);
    } else {
      if (endTimeRef.current) {
        endTimeRef.current += 15000;
        const newRemaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setRemaining(newRemaining);
      } else {
        setRemaining(prev => prev + 15);
      }
    }
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      right: 20,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: "8px 14px",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      gap: 10,
      backdropFilter: "blur(10px)",
      background: `${C.surface}dd`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
    }}>
      <div>
        <p style={{ fontSize: 10, color: C.muted }}>Отдых</p>
        <p style={{ fontSize: 16, fontWeight: 600, color: C.primary }}>{remaining} сек</p>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={handleAddTime} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 4, padding: "3px 6px", color: C.text, cursor: "pointer", fontSize: 10 }}>+15</button>
        <button onClick={() => setPaused(p => !p)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 4, padding: "3px 6px", color: C.text, cursor: "pointer", fontSize: 10 }}>{paused ? "▶" : "⏸"}</button>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${C.danger}`, borderRadius: 4, padding: "3px 6px", color: C.danger, cursor: "pointer" }}><Icon name="close" style={{ fontSize: 10 }} /></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle() {
    setError("");
    setLoading(true);
    const users = await db.getUsers();
    
    if (mode === "register") {
      if (!name.trim() || !password.trim()) {
        setError("Заполните все поля");
        setLoading(false);
        return;
      }
      if (name.length < 2) {
        setError("Имя слишком короткое");
        setLoading(false);
        return;
      }
      if (password.length < 4) {
        setError("Пароль минимум 4 символа");
        setLoading(false);
        return;
      }
      if (users[name]) {
        setError("Пользователь уже существует");
        setLoading(false);
        return;
      }
      await db.saveUser(name, { password, createdAt: Date.now() });
      onLogin(name);
    } else {
      if (!users[name] || users[name].password !== password) {
        setError("Неверный логин или пароль");
        setLoading(false);
        return;
      }
      onLogin(name);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Icon name="fitness_center" style={{ fontSize: 48, marginBottom: 6, color: C.primary }} />
          <h1 style={{ fontSize: 26, fontWeight: 600 }}>IRON<span style={{ color: C.primary }}>LOG</span></h1>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Трекер тренировок</p>
        </div>
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", background: C.surface2, borderRadius: 6, padding: 2, marginBottom: 20 }}>
            {["login", "register"].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 5,
                  background: mode === m ? C.primary : "transparent",
                  color: mode === m ? "#FFFFFF" : C.muted,
                  fontWeight: 500,
                  fontSize: 12,
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Имя" onKeyDown={e => e.key === "Enter" && handle()} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" onKeyDown={e => e.key === "Enter" && handle()} />
            {error && <p style={{ color: C.danger, fontSize: 11, textAlign: "center" }}>{error}</p>}
            <Btn onClick={handle} size="lg" disabled={loading} style={{ width: "100%" }} icon="login">
              {loading ? "..." : mode === "login" ? "Войти" : "Создать"}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────
function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: "home", icon: "home", label: "Главная" },
    { id: "templates", icon: "format_list_bulleted", label: "Шаблоны" },
    { id: "history", icon: "history", label: "История" },
    { id: "profile", icon: "person", label: "Профиль" },
  ];
  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: C.surface,
      borderTop: `1px solid ${C.border}`,
      display: "flex",
      zIndex: 100,
      paddingBottom: "env(safe-area-inset-bottom, 8px)",
      paddingTop: 6
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 4px 4px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            gap: 2
          }}
        >
          <Icon name={t.icon} style={{ fontSize: 20, color: tab === t.id ? C.primary : C.muted }} />
          <span style={{ fontSize: 9, fontWeight: tab === t.id ? 500 : 400, color: tab === t.id ? C.primary : C.muted }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE FORM
// ─────────────────────────────────────────────────────────────────────────────
function TemplateForm({ template, onSave }) {
  const [name, setName] = useState(template?.name || "");
  const [exercises, setExercises] = useState(template?.exercises?.length ? template.exercises : [{ name: "", sets: 3 }]);

  function addEx() { setExercises(p => [...p, { name: "", sets: 3 }]); }
  function removeEx(i) { setExercises(p => p.filter((_, idx) => idx !== i)); }
  function updateEx(i, field, val) {
    setExercises(p => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n; });
  }
  function save() {
    if (!name.trim()) return;
    const valid = exercises.filter(e => e.name.trim());
    if (!valid.length) return;
    onSave({
      id: template?.id || Date.now().toString(),
      name: name.trim(),
      exercises: valid,
      createdAt: template?.createdAt || Date.now()
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={{ fontSize: 11, color: C.muted, marginBottom: 4, display: "block" }}>Название</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Например: День ног" />
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: C.muted }}>Упражнения</label>
          <Btn variant="ghost" size="sm" onClick={addEx} icon="add">Добавить</Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {exercises.map((ex, i) => (
            <div key={i} style={{ background: C.surface2, borderRadius: 6, padding: 10, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: C.muted, minWidth: 18 }}>{i + 1}.</span>
                <input
                  value={ex.name}
                  onChange={e => updateEx(i, "name", e.target.value)}
                  placeholder="Упражнение"
                  style={{ flex: 1, background: C.surface, padding: "6px 10px", fontSize: 12 }}
                />
                {exercises.length > 1 && (
                  <button onClick={() => removeEx(i)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", padding: "2px 6px" }}>
                    <Icon name="delete" style={{ fontSize: 14 }} />
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 24 }}>
                <span style={{ fontSize: 10, color: C.muted }}>Подходов:</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 4px" }}>
                  <button onClick={() => updateEx(i, "sets", Math.max(1, ex.sets - 1))} style={{ background: "none", border: "none", color: C.primary, cursor: "pointer", width: 20, lineHeight: 1 }}>
                    <Icon name="remove" style={{ fontSize: 14 }} />
                  </button>
                  <span style={{ minWidth: 18, textAlign: "center", fontSize: 12, fontWeight: 500, color: C.primary }}>{ex.sets}</span>
                  <button onClick={() => updateEx(i, "sets", ex.sets + 1)} style={{ background: "none", border: "none", color: C.primary, cursor: "pointer", width: 20, lineHeight: 1 }}>
                    <Icon name="add" style={{ fontSize: 14 }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Btn onClick={save} size="lg" style={{ width: "100%" }} icon="save">Сохранить</Btn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE WORKOUT
// ─────────────────────────────────────────────────────────────────────────────
function ActiveWorkout({ template, lastWorkout, restDuration, onFinish, onDiscard }) {
  const initSets = template.exercises.map((ex, ei) => {
    const lastEx = lastWorkout?.exercises?.[ei];
    return {
      name: ex.name,
      sets: Array.from({ length: ex.sets }, (_, si) => ({
        reps: lastEx?.sets?.[si]?.reps || "",
        weight: lastEx?.sets?.[si]?.weight || "",
        done: false,
      })),
    };
  });

  const [exercises, setExercises] = useState(initSets);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  function fmt(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  function updateSet(ei, si, field, val) {
    setExercises(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      n[ei].sets[si][field] = val;
      return n;
    });
  }

  function handleSetBlur(ei, si, field, val) {
    if (si === 0 && val !== "" && val !== "0" && val !== 0) {
      setExercises(prev => {
        const n = JSON.parse(JSON.stringify(prev));
        for (let k = 1; k < n[ei].sets.length; k++) {
          if (!n[ei].sets[k].done) {
            n[ei].sets[k][field] = val;
          }
        }
        return n;
      });
    }
  }

  function toggleDone(ei, si) {
    setExercises(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      const wasDone = n[ei].sets[si].done;
      n[ei].sets[si].done = !wasDone;
      if (!wasDone) {
        setRestTimer({ ei, si });
      }
      return n;
    });
  }

  function finish() {
    onFinish({
      id: Date.now().toString(),
      templateId: template.id,
      templateName: template.name,
      date: Date.now(),
      duration: elapsed,
      exercises: exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(s => ({ reps: Number(s.reps) || 0, weight: Number(s.weight) || 0 })),
      })),
    });
  }

  const totalDone = exercises.flatMap(e => e.sets).filter(s => s.done).length;
  const totalSets = exercises.flatMap(e => e.sets).length;
  const progress = totalSets ? totalDone / totalSets : 0;

  return (
    <>
      {restTimer && <RestTimer duration={restDuration} onDone={() => setRestTimer(null)} onClose={() => setRestTimer(null)} />}
      {confirmDiscard && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="fade" style={{ background: C.surface, borderRadius: 10, padding: 20, width: "100%", maxWidth: 280 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Выйти?</h3>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 20 }}>Прогресс будет потерян.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="secondary" style={{ flex: 1 }} onClick={() => setConfirmDiscard(false)} icon="close">Нет</Btn>
              <Btn variant="danger" style={{ flex: 1 }} onClick={onDiscard} icon="check">Да</Btn>
            </div>
          </div>
        </div>
      )}
      <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 300, overflowY: "auto", paddingBottom: 100 }}>
        <div style={{ padding: "14px 14px 0", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>{template.name}</h2>
              <p style={{ color: C.primary, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="timer" style={{ fontSize: 12 }} /> {fmt(elapsed)}
              </p>
            </div>
            <button onClick={() => setConfirmDiscard(true)} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "5px 10px", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <Icon name="exit_to_app" style={{ fontSize: 14 }} /> Выйти
            </button>
          </div>
          <div style={{ background: C.surface2, borderRadius: 3, height: 3, marginBottom: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress * 100}%`, background: C.primary, borderRadius: 3, transition: "width 0.3s" }} />
          </div>
          <p style={{ color: C.muted, fontSize: 10, marginBottom: 16 }}>{totalDone} из {totalSets}</p>
          {exercises.map((ex, ei) => {
            const lastEx = lastWorkout?.exercises?.[ei];
            return (
              <Card key={ei} style={{ marginBottom: 10, padding: 12 }}>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="fitness_center" style={{ fontSize: 14, color: C.primary }} /> {ex.name}
                </p>
                {lastEx && (
                  <div style={{ background: C.surface2, borderRadius: 5, padding: "5px 8px", marginBottom: 10, fontSize: 10, color: C.muted, display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                    <span>Прошлый раз:</span>
                    {lastEx.sets.map((s, si) => (
                      <span key={si} style={{ color: C.info }}>{s.reps}×{s.weight}кг{si < lastEx.sets.length - 1 ? " ·" : ""}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "22px 1fr 1fr 32px", gap: 5, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: C.muted, textAlign: "center" }}>#</span>
                  <span style={{ fontSize: 9, color: C.muted, textAlign: "center" }}>Повторы</span>
                  <span style={{ fontSize: 9, color: C.muted, textAlign: "center" }}>Вес</span>
                  <span />
                </div>
                {ex.sets.map((s, si) => (
                  <div key={si} style={{ display: "grid", gridTemplateColumns: "22px 1fr 1fr 32px", gap: 5, marginBottom: 6, alignItems: "center", opacity: s.done ? 0.5 : 1 }}>
                    <span style={{ textAlign: "center", fontSize: 10, color: C.muted }}>{si + 1}</span>
                    <input
                      type="number"
                      value={s.reps}
                      onChange={e => updateSet(ei, si, "reps", e.target.value)}
                      onBlur={e => handleSetBlur(ei, si, "reps", e.target.value)}
                      placeholder={lastEx?.sets?.[si]?.reps ? String(lastEx.sets[si].reps) : "0"}
                      style={{ textAlign: "center", padding: "5px 3px", fontSize: 12 }}
                    />
                    <input
                      type="number"
                      value={s.weight}
                      onChange={e => updateSet(ei, si, "weight", e.target.value)}
                      onBlur={e => handleSetBlur(ei, si, "weight", e.target.value)}
                      placeholder={lastEx?.sets?.[si]?.weight ? String(lastEx.sets[si].weight) : "0"}
                      style={{ textAlign: "center", padding: "5px 3px", fontSize: 12 }}
                    />
                    <button onClick={() => toggleDone(ei, si)} style={{ width: 32, height: 32, borderRadius: 5, border: `1px solid ${s.done ? C.success : C.border}`, background: s.done ? C.success + "10" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={s.done ? "check_circle" : "radio_button_unchecked"} style={{ fontSize: 14, color: s.done ? C.success : C.muted }} />
                    </button>
                  </div>
                ))}
              </Card>
            );
          })}
          <Btn onClick={finish} size="lg" style={{ width: "100%", marginTop: 4 }} icon="flag">Завершить</Btn>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME TAB
// ─────────────────────────────────────────────────────────────────────────────
function HomeTab({ user, templates, workouts, onStartWorkout }) {
  const recentWorkouts = [...workouts].sort((a, b) => b.date - a.date).slice(0, 3);
  const thisWeek = workouts.filter(w => Date.now() - w.date < 7 * 86400000).length;

  function dateStr(ts) {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Сегодня";
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "Вчера";
    return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
  }
  function fmtDur(s) {
    const m = Math.floor(s / 60);
    return m < 60 ? `${m} мин` : `${Math.floor(m / 60)}ч ${m % 60}м`;
  }

  return (
    <div className="fade">
      <div style={{ background: `${C.primary}08`, borderRadius: 10, padding: "16px 14px", marginBottom: 20, border: `1px solid ${C.primary}15` }}>
        <p style={{ color: C.muted, fontSize: 11 }}>Привет,</p>
        <h2 style={{ fontSize: 20, fontWeight: 600, alignItems: "center", gap: 6 }}>{user}</h2>
        <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
          <div>
            <span style={{ fontSize: 24, fontWeight: 600, color: C.primary }}>{thisWeek}</span>
            <p style={{ fontSize: 10, color: C.muted }}>на этой неделе</p>
          </div>
          <div>
            <span style={{ fontSize: 24, fontWeight: 600, color: C.accent }}>{workouts.length}</span>
            <p style={{ fontSize: 10, color: C.muted }}>всего</p>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="play_circle" style={{ fontSize: 12 }} /> Начать тренировку
        </p>
        {templates.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 24 }}>
            <p style={{ color: C.muted, fontSize: 12 }}>Создайте шаблон</p>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {templates.map(t => {
              const last = [...workouts].filter(w => w.templateId === t.id).sort((a, b) => b.date - a.date)[0];
              return (
                <Card key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</p>
                    <p style={{ fontSize: 10, color: C.muted, marginTop: 1, display: "flex", alignItems: "center", gap: 8 }}>
                      <span><Icon name="fitness_center" style={{ fontSize: 10 }} /> {t.exercises.length} упр.</span>
                      <span><Icon name="replay" style={{ fontSize: 10 }} /> {t.exercises.reduce((a, e) => a + e.sets, 0)} подх.</span>
                    </p>
                    {last && <p style={{ fontSize: 9, color: C.muted, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="event" style={{ fontSize: 9 }} /> {dateStr(last.date)} · {fmtDur(last.duration)}
                    </p>}
                  </div>
                  <Btn size="sm" onClick={() => onStartWorkout(t)} icon="play_arrow" />
                </Card>
              );
            })}
          </div>
        )}
      </div>
      {recentWorkouts.length > 0 && (
        <>
          <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="history" style={{ fontSize: 12 }} /> Последние
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentWorkouts.map(w => (
              <Card key={w.id} style={{ padding: 12 }}>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{w.templateName}</p>
                <p style={{ fontSize: 10, color: C.muted, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="event" style={{ fontSize: 10 }} /> {dateStr(w.date)} · {fmtDur(w.duration)}
                </p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES TAB
// ─────────────────────────────────────────────────────────────────────────────
function TemplatesTab({ templates, onSave, onDelete }) {
  const [modal, setModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  return (
    <div className="fade">
      <div style={{ alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Шаблоны</h1>
          {templates.length > 0 && <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{templates.length} шаблона</p>}
        </div>
        <Btn size="sm" onClick={() => setModal("new")} icon="add">Создать</Btn>
      </div>
      {templates.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 50 }}>
          <Icon name="format_list_bulleted" style={{ fontSize: 48, marginBottom: 10, color: C.muted }} />
          <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Нет шаблонов</p>
          <Btn onClick={() => setModal("new")} icon="add">Создать</Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {templates.map(t => (
            <Card key={t.id} style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10 }}>
                <p style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</p>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setModal(t.id)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 4, padding: "3px 8px", color: C.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                    <Icon name="edit" style={{ fontSize: 12 }} /> Изменить
                  </button>
                  <button onClick={() => setConfirmDel(t.id)} style={{ background: "transparent", border: `1px solid ${C.danger}30`, borderRadius: 4, padding: "3px 6px", color: C.danger, cursor: "pointer" }}>
                    <Icon name="delete" style={{ fontSize: 14 }} />
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {t.exercises.map((ex, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface2, borderRadius: 5, padding: "5px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 9, color: C.muted, minWidth: 14 }}>{i + 1}.</span>
                      <span style={{ fontSize: 12 }}>{ex.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Icon name="replay" style={{ fontSize: 10, color: C.primary }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.primary }}>{ex.sets}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      {(modal === "new" || templates.find(t => t.id === modal)) && (
        <Modal title={modal === "new" ? "Новый шаблон" : "Редактировать"} onClose={() => setModal(null)}>
          <TemplateForm template={modal !== "new" ? templates.find(t => t.id === modal) : null} onSave={t => { onSave(t); setModal(null); }} />
        </Modal>
      )}
      {confirmDel && (
        <Modal title="Удалить?" onClose={() => setConfirmDel(null)}>
          <p style={{ color: C.muted, marginBottom: 18, fontSize: 12 }}>История тренировок останется.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" style={{ flex: 1 }} onClick={() => setConfirmDel(null)} icon="close">Отмена</Btn>
            <Btn variant="danger" style={{ flex: 1 }} onClick={() => { onDelete(confirmDel); setConfirmDel(null); }} icon="delete">Удалить</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function WorkoutDetail({ workout, onClose, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false);

  function fmtDur(s) {
    const m = Math.floor(s / 60);
    return m < 60 ? `${m} мин` : `${Math.floor(m / 60)}ч ${m % 60}м`;
  }

  return (
    <Modal title={workout.templateName} onClose={onClose}>
      {confirmDel ? (
        <div>
          <p style={{ color: C.muted, fontSize: 12, marginBottom: 18 }}>Удалить тренировку?</p>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" style={{ flex: 1 }} onClick={() => setConfirmDel(false)} icon="close">Отмена</Btn>
            <Btn variant="danger" style={{ flex: 1 }} onClick={() => { onDelete(workout.id); onClose(); }} icon="delete">Удалить</Btn>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: C.muted, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="event" style={{ fontSize: 12 }} /> {new Date(workout.date).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p style={{ color: C.muted, fontSize: 11, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Icon name="timer" style={{ fontSize: 12 }} /> Длительность: {fmtDur(workout.duration)}
            </p>
            <button onClick={() => setConfirmDel(true)} style={{ background: "transparent", border: `1px solid ${C.danger}30`, borderRadius: 4, padding: "4px 8px", color: C.danger, cursor: "pointer", fontSize: 11, marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="delete" style={{ fontSize: 12 }} /> Удалить
            </button>
          </div>
          {workout.exercises.map((ex, ei) => (
            <div key={ei} style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="fitness_center" style={{ fontSize: 12, color: C.primary }} /> {ex.name}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {ex.sets.map((s, si) => (
                  <div key={si} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface2, borderRadius: 5, padding: "5px 8px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: C.muted }}>{si + 1}</span>
                      <span style={{ fontSize: 12 }}>
                        <span style={{ fontWeight: 500 }}>{s.reps}</span>
                        <span style={{ color: C.muted }}> × </span>
                        <span style={{ fontWeight: 500, color: C.primary }}>{s.weight}</span>
                        <span style={{ color: C.muted }}> кг</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY TAB
// ─────────────────────────────────────────────────────────────────────────────
function HistoryTab({ workouts, templates, onDeleteWorkout }) {
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [filterTpl, setFilterTpl] = useState("all");

  const sorted = [...workouts].sort((a, b) => b.date - a.date);
  const filtered = filterTpl === "all" ? sorted : sorted.filter(w => w.templateId === filterTpl);

  function fmtDur(s) {
    const m = Math.floor(s / 60);
    return m < 60 ? `${m} мин` : `${Math.floor(m / 60)}ч ${m % 60}м`;
  }

  function dateStr(ts) {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Сегодня";
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "Вчера";
    return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
  }

  return (
    <div className="fade">
      <ScreenHeader title="История" subtitle={`${workouts.length} тренировок`} />
      {workouts.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 50 }}>
          <Icon name="history" style={{ fontSize: 48, marginBottom: 10, color: C.muted }} />
          <p style={{ color: C.muted, fontSize: 12 }}>Пока нет тренировок</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 14, overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 4 }}>
            {[{ id: "all", name: "Все" }, ...templates].map(t => (
              <button
                key={t.id}
                onClick={() => setFilterTpl(t.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  marginRight: 6,
                  padding: "4px 10px",
                  borderRadius: 14,
                  border: "none",
                  background: filterTpl === t.id ? C.primary : C.surface2,
                  color: filterTpl === t.id ? "#FFFFFF" : C.muted,
                  fontSize: 11,
                  cursor: "pointer"
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(w => (
              <Card key={w.id} onClick={() => setSelectedWorkout(w)} style={{ cursor: "pointer", padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{w.templateName}</p>
                    <p style={{ fontSize: 10, color: C.muted, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="event" style={{ fontSize: 10 }} /> {dateStr(w.date)} · {fmtDur(w.duration)}
                    </p>
                    <div style={{ marginTop: 4 }}>
                      <Tag><Icon name="fitness_center" style={{ fontSize: 9 }} /> {w.exercises.length} упр.</Tag>
                    </div>
                  </div>
                  <Icon name="chevron_right" style={{ color: C.muted, fontSize: 18 }} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      {selectedWorkout && (
        <WorkoutDetail workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} onDelete={id => { onDeleteWorkout(id); setSelectedWorkout(null); }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────────────────────────────────────────
function ProfileTab({ user, workouts, restDuration, onRestChange, onLogout }) {
  const total = workouts.length;
  const totalTime = workouts.reduce((a, w) => a + w.duration, 0);

  const getExerciseProgress = () => {
    const exerciseMap = new Map();
    const sortedWorkouts = [...workouts].sort((a, b) => a.date - b.date);
    sortedWorkouts.forEach(w => {
      w.exercises.forEach(ex => {
        if (!exerciseMap.has(ex.name)) exerciseMap.set(ex.name, []);
        let maxWeight = 0;
        let maxReps = 0;
        ex.sets.forEach(s => {
          if (s.weight > maxWeight) maxWeight = s.weight;
          if (s.reps > maxReps) maxReps = s.reps;
        });
        exerciseMap.get(ex.name).push({ date: w.date, maxWeight, maxReps });
      });
    });
    const progress = [];
    for (const [name, data] of exerciseMap) {
      if (data.length >= 2) {
        const first = data[0];
        const last = data[data.length - 1];
        progress.push({
          name,
          firstWeight: first.maxWeight,
          lastWeight: last.maxWeight,
          firstReps: first.maxReps,
          lastReps: last.maxReps,
          weightDiff: last.maxWeight - first.maxWeight,
          improved: last.maxWeight > first.maxWeight || last.maxReps > first.maxReps,
          totalWorkouts: data.length
        });
      } else if (data.length === 1) {
        progress.push({
          name,
          firstWeight: data[0].maxWeight,
          lastWeight: data[0].maxWeight,
          firstReps: data[0].maxReps,
          lastReps: data[0].maxReps,
          weightDiff: 0,
          improved: false,
          totalWorkouts: 1
        });
      }
    }
    return progress.sort((a, b) => Math.abs(b.weightDiff) - Math.abs(a.weightDiff)).slice(0, 6);
  };

  const progress = getExerciseProgress();

  return (
    <div className="fade">
      <ScreenHeader title="Профиль" />
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <Icon name="person" style={{ fontSize: 28, color: "#FFFFFF" }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>{user}</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
        <Card style={{ padding: "10px 14px" }}>
          <p style={{ fontSize: 10, color: C.muted, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="fitness_center" style={{ fontSize: 12 }} /> Тренировок
          </p>
          <p style={{ fontSize: 20, fontWeight: 600, color: C.primary }}>{total}</p>
        </Card>
        <Card style={{ padding: "10px 14px" }}>
          <p style={{ fontSize: 10, color: C.muted, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="schedule" style={{ fontSize: 12 }} /> Часов
          </p>
          <p style={{ fontSize: 20, fontWeight: 600, color: C.accent }}>{(Math.round(totalTime / 360) / 10).toFixed(1)}</p>
        </Card>
      </div>
      {progress.length > 0 && (
        <Card style={{ marginBottom: 20, padding: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="trending_up" style={{ fontSize: 14 }} /> Прогресс упражнений
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {progress.map((ex, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{ex.name}</span>
                  <span style={{ fontSize: 9, color: ex.improved ? C.success : C.muted, display: "flex", alignItems: "center", gap: 2 }}>
                    {ex.improved ? <Icon name="arrow_upward" style={{ fontSize: 10 }} /> : <Icon name="remove" style={{ fontSize: 10 }} />}
                    {ex.improved ? `+${ex.weightDiff} кг` : "без изменений"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.muted }}>
                  <span>💪 {ex.firstWeight} → {ex.lastWeight} кг</span>
                  <span>🔄 {ex.firstReps} → {ex.lastReps} повт</span>
                </div>
                <div style={{ marginTop: 2, fontSize: 9, color: C.info, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="check_circle" style={{ fontSize: 9 }} /> выполнено {ex.totalWorkouts} раз
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card style={{ marginBottom: 20, padding: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="timer" style={{ fontSize: 14 }} /> Таймер отдыха
        </p>
        <p style={{ fontSize: 9, color: C.muted, marginBottom: 12 }}>Автоматический запуск</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {[30, 60, 90, 120, 180, 240].map(sec => (
            <button
              key={sec}
              onClick={() => onRestChange(sec)}
              style={{
                padding: "4px 10px",
                borderRadius: 5,
                border: `1px solid ${restDuration === sec ? C.primary : C.border}`,
                background: restDuration === sec ? C.primary : C.surface2,
                color: restDuration === sec ? "#FFFFFF" : C.muted,
                fontSize: 11,
                cursor: "pointer"
              }}
            >
              {sec < 60 ? `${sec}с` : `${sec / 60}мин`}
            </button>
          ))}
        </div>
      </Card>
      <Btn variant="danger" style={{ width: "100%" }} onClick={onLogout} icon="logout">Выйти</Btn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [templates, setTemplates] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [restDuration, setRestDuration] = useState(90);

  useEffect(() => {
    (async () => {
      const currentUser = await db.getSetting("global", "currentUser");
      if (currentUser) {
        setUser(currentUser);
        await loadData(currentUser);
      }
      setLoading(false);
    })();
  }, []);

  async function loadData(username) {
    const tpls = await db.getTemplates(username);
    const wks = await db.getWorkouts(username);
    const rd = await db.getSetting(username, "restDuration", 90);
    setTemplates(tpls);
    setWorkouts(wks);
    setRestDuration(rd);
  }

  async function handleLogin(username) {
    await db.saveSetting("global", "currentUser", username);
    setUser(username);
    await loadData(username);
  }

  async function handleLogout() {
    await db.saveSetting("global", "currentUser", null);
    setUser(null);
    setTemplates([]);
    setWorkouts([]);
    setTab("home");
  }

  async function saveTemplate(tpl) {
    const existing = templates.find(t => t.id === tpl.id);
    const next = existing ? templates.map(t => t.id === tpl.id ? tpl : t) : [...templates, tpl];
    setTemplates(next);
    await db.saveTemplates(user, next);
  }

  async function deleteTemplate(id) {
    const next = templates.filter(t => t.id !== id);
    setTemplates(next);
    await db.saveTemplates(user, next);
  }

  async function deleteWorkout(id) {
    const next = workouts.filter(w => w.id !== id);
    setWorkouts(next);
    await db.saveWorkouts(user, next);
  }

  function startWorkout(template) {
    const last = [...workouts].filter(w => w.templateId === template.id).sort((a, b) => b.date - a.date)[0];
    setActiveWorkout({ template, lastWorkout: last || null });
  }

  async function finishWorkout(workout) {
    const next = [...workouts, workout];
    setWorkouts(next);
    await db.saveWorkouts(user, next);
    setActiveWorkout(null);
    setTab("history");
  }

  async function changeRest(val) {
    setRestDuration(val);
    await db.saveSetting(user, "restDuration", val);
  }

  if (loading) return <><style>{css}</style><Loader /></>;
  if (!user) return <><style>{css}</style><AuthScreen onLogin={handleLogin} /></>;

  return (
    <>
      <style>{css}</style>
      {activeWorkout && (
        <ActiveWorkout
          template={activeWorkout.template}
          lastWorkout={activeWorkout.lastWorkout}
          restDuration={restDuration}
          onFinish={finishWorkout}
          onDiscard={() => setActiveWorkout(null)}
        />
      )}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 14px 80px" }}>
        {tab === "home" && <HomeTab user={user} templates={templates} workouts={workouts} onStartWorkout={startWorkout} />}
        {tab === "templates" && <TemplatesTab templates={templates} onSave={saveTemplate} onDelete={deleteTemplate} />}
        {tab === "history" && <HistoryTab workouts={workouts} templates={templates} onDeleteWorkout={deleteWorkout} />}
        {tab === "profile" && <ProfileTab user={user} workouts={workouts} restDuration={restDuration} onRestChange={changeRest} onLogout={handleLogout} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </>
  );
}