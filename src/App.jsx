import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE
// ─────────────────────────────────────────────────────────────────────────────
class Database {
  constructor(dbName) {
    this.dbName = dbName;
    this.initDB();
  }
  initDB() {
    if (!localStorage.getItem(this.dbName)) {
      localStorage.setItem(this.dbName, JSON.stringify({ users: {}, templates: {}, workouts: {}, settings: {} }));
    }
  }
  getDB() { return JSON.parse(localStorage.getItem(this.dbName)); }
  saveDB(data) { localStorage.setItem(this.dbName, JSON.stringify(data)); }
  async getUsers() { return this.getDB().users; }
  async saveUser(username, userData) { const db = this.getDB(); db.users[username] = userData; this.saveDB(db); return true; }
  async getUser(username) { return this.getDB().users[username] || null; }
  async getTemplates(username) { return this.getDB().templates[username] || []; }
  async saveTemplates(username, templates) { const db = this.getDB(); db.templates[username] = templates; this.saveDB(db); return true; }
  async getWorkouts(username) { return this.getDB().workouts[username] || []; }
  async saveWorkouts(username, workouts) { const db = this.getDB(); db.workouts[username] = workouts; this.saveDB(db); return true; }
  async getSetting(username, key, defaultValue = null) { return this.getDB().settings[username]?.[key] ?? defaultValue; }
  async saveSetting(username, key, value) { const db = this.getDB(); if (!db.settings[username]) db.settings[username] = {}; db.settings[username][key] = value; this.saveDB(db); return true; }
}

const db = new Database("ironlog_db");

// ─────────────────────────────────────────────────────────────────────────────
// SOUND: короткий двойной бип через Web Audio API
// ─────────────────────────────────────────────────────────────────────────────
function playDoneSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    beep(880, 0, 0.18);
    beep(1100, 0.22, 0.22);
    setTimeout(() => ctx.close(), 1000);
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  primary: "#9B1C35",       // ярче бордового
  primaryLight: "#C0213F",
  bg: "#111111",
  surface: "#1A1A1A",
  surface2: "#222222",
  border: "#333333",
  text: "#FFFFFF",
  muted: "#999999",
  danger: "#FF4444",
  success: "#4DFF91",
  accent: "#E8E8E8",
  info: "#666666",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/icon?family=Material+Icons&family=Material+Icons+Outlined');
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { background: ${C.bg}; color: ${C.text}; font-family: 'Inter', sans-serif; min-height: 100dvh; font-size: 15px; }
  input, select {
    background: ${C.surface2}; border: 1px solid ${C.border}; color: ${C.text};
    padding: 11px 14px; border-radius: 8px; font-family: inherit; font-size: 15px;
    width: 100%; outline: none; transition: all 0.2s;
  }
  input:focus, select:focus { border-color: ${C.primary}; }
  button { cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; border: none; outline: none; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
  .fade { animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .material-icons, .material-icons-outlined { font-size: 20px; vertical-align: middle; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Icon({ name, outlined = false, style = {} }) {
  return <span className={outlined ? "material-icons-outlined" : "material-icons"} style={style}>{name}</span>;
}

function Btn({ children, onClick, variant = "primary", size = "md", style = {}, disabled, icon }) {
  const sizes = {
    sm: { padding: "7px 13px", fontSize: 13, gap: 4 },
    md: { padding: "10px 16px", fontSize: 14, gap: 6 },
    lg: { padding: "13px 20px", fontSize: 15, gap: 6 }
  };
  const variants = {
    primary: { background: C.primary, color: "#FFFFFF" },
    secondary: { background: C.surface2, color: C.text, border: `1px solid ${C.border}` },
    danger: { background: "transparent", color: C.danger, border: `1px solid ${C.danger}` },
    ghost: { background: "transparent", color: C.muted },
    success: { background: C.success, color: "#111111" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ borderRadius: 6, fontWeight: 500, display: "inline-flex", alignItems: "center", justifyContent: "center", ...sizes[size], ...variants[variant], opacity: disabled ? 0.5 : 1, ...style }}>
      {icon && <Icon name={icon} style={{ fontSize: size === "sm" ? 16 : 18 }} />}
      {children}
    </button>
  );
}

function Card({ children, style = {}, onClick }) {
  return <div onClick={onClick} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, ...style }}>{children}</div>;
}

function Tag({ children, color = C.primary }) {
  return <span style={{ background: color + "18", color, borderRadius: 4, padding: "3px 9px", fontSize: 11, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>{children}</span>;
}

function ScreenHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>{title}</h1>
        {action}
      </div>
      {subtitle && <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>{subtitle}</p>}
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <Icon name="fitness_center" style={{ fontSize: 44, marginBottom: 8, animation: "pulse 1.5s infinite", color: C.primary }} />
        <p style={{ color: C.muted, fontSize: 14 }}>Загрузка...</p>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, zIndex = 200 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fade" style={{ background: C.surface, borderRadius: "12px 12px 0 0", padding: 20, paddingBottom: "calc(20px + env(safe-area-inset-bottom,0px))", maxHeight: "92dvh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 3, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ background: C.surface2, border: "none", color: C.muted, width: 30, height: 30, borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="close" style={{ fontSize: 17 }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REST TIMER (компактный, фиксированный в углу)
// ─────────────────────────────────────────────────────────────────────────────
function RestTimer({ duration, onDone, onClose }) {
  const [remaining, setRemaining] = useState(duration);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);
  const endTimeRef = useRef(Date.now() + duration * 1000);
  const doneCalledRef = useRef(false);

  useEffect(() => {
    if (paused) { clearInterval(intervalRef.current); return; }
    endTimeRef.current = Date.now() + remaining * 1000;
    intervalRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0 && !doneCalledRef.current) {
        doneCalledRef.current = true;
        clearInterval(intervalRef.current);
        playDoneSound();
        onDone();
      }
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [paused]);

  function addTime() {
    endTimeRef.current += 15000;
    setRemaining(r => r + 15);
  }

  return (
    <div style={{ position: "fixed", bottom: 90, right: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", zIndex: 1000, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
      <div>
        <p style={{ fontSize: 11, color: C.muted }}>Отдых</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: C.primary, fontVariantNumeric: "tabular-nums" }}>{remaining}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>с</span></p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <button onClick={addTime} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 4, padding: "4px 8px", color: C.text, cursor: "pointer", fontSize: 12 }}>+15с</button>
        <button onClick={() => setPaused(p => !p)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 4, padding: "4px 8px", color: C.text, cursor: "pointer", fontSize: 12 }}>{paused ? "▶" : "⏸"}</button>
      </div>
      <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${C.danger}44`, borderRadius: 4, padding: "6px 8px", color: C.danger, cursor: "pointer" }}>
        <Icon name="close" style={{ fontSize: 14 }} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  async function handle() {
    setError(""); setLoading(true);
    const users = await db.getUsers();
    if (mode === "register") {
      if (!name.trim() || !password.trim()) { setError("Заполните все поля"); setLoading(false); return; }
      if (name.length < 2) { setError("Имя слишком короткое"); setLoading(false); return; }
      if (password.length < 4) { setError("Пароль минимум 4 символа"); setLoading(false); return; }
      if (users[name]) { setError("Пользователь уже существует"); setLoading(false); return; }
      await db.saveUser(name, { password, createdAt: Date.now() });
      onLogin(name);
    } else {
      if (!users[name] || users[name].password !== password) { setError("Неверный логин или пароль"); setLoading(false); return; }
      onLogin(name);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Icon name="fitness_center" style={{ fontSize: 52, marginBottom: 8, color: C.primary }} />
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>IRON<span style={{ color: C.primary }}>LOG</span></h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Трекер тренировок</p>
        </div>
        <Card style={{ padding: 22 }}>
          <div style={{ display: "flex", background: C.surface2, borderRadius: 6, padding: 2, marginBottom: 20 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: 9, borderRadius: 5, background: mode === m ? C.primary : "transparent", color: mode === m ? "#FFF" : C.muted, fontWeight: 500, fontSize: 13, border: "none", cursor: "pointer" }}>
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Имя пользователя" onKeyDown={e => e.key === "Enter" && handle()} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" onKeyDown={e => e.key === "Enter" && handle()} />
            {error && <p style={{ color: C.danger, fontSize: 13, textAlign: "center" }}>{error}</p>}
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
// BOTTOM NAV
// ─────────────────────────────────────────────────────────────────────────────
function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: "home", icon: "home", label: "Главная" },
    { id: "templates", icon: "format_list_bulleted", label: "Шаблоны" },
    { id: "history", icon: "history", label: "История" },
    { id: "profile", icon: "person", label: "Профиль" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom,8px)", paddingTop: 6 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 4px 4px", background: "transparent", border: "none", cursor: "pointer", gap: 2 }}>
          <Icon name={t.icon} style={{ fontSize: 22, color: tab === t.id ? C.primary : C.muted }} />
          <span style={{ fontSize: 10, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? C.primary : C.muted }}>{t.label}</span>
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
    onSave({ id: template?.id || Date.now().toString(), name: name.trim(), exercises: valid, createdAt: template?.createdAt || Date.now() });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={{ fontSize: 13, color: C.muted, marginBottom: 5, display: "block" }}>Название</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Например: День ног" />
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <label style={{ fontSize: 13, color: C.muted }}>Упражнения</label>
          <Btn variant="ghost" size="sm" onClick={addEx} icon="add">Добавить</Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {exercises.map((ex, i) => (
            <div key={i} style={{ background: C.surface2, borderRadius: 8, padding: 12, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: C.muted, minWidth: 20 }}>{i + 1}.</span>
                <input value={ex.name} onChange={e => updateEx(i, "name", e.target.value)} placeholder="Упражнение" style={{ flex: 1, padding: "8px 12px", fontSize: 14 }} />
                {exercises.length > 1 && (
                  <button onClick={() => removeEx(i)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", padding: "4px 6px" }}>
                    <Icon name="delete" style={{ fontSize: 16 }} />
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 28 }}>
                <span style={{ fontSize: 13, color: C.muted }}>Подходов:</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 8px" }}>
                  <button onClick={() => updateEx(i, "sets", Math.max(1, ex.sets - 1))} style={{ background: "none", border: "none", color: C.primary, cursor: "pointer", width: 24, lineHeight: 1 }}>
                    <Icon name="remove" style={{ fontSize: 16 }} />
                  </button>
                  <span style={{ minWidth: 20, textAlign: "center", fontSize: 15, fontWeight: 600, color: C.primary }}>{ex.sets}</span>
                  <button onClick={() => updateEx(i, "sets", ex.sets + 1)} style={{ background: "none", border: "none", color: C.primary, cursor: "pointer", width: 24, lineHeight: 1 }}>
                    <Icon name="add" style={{ fontSize: 16 }} />
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
// ACTIVE WORKOUT — с защитой от случайного выхода (beforeunload + confirm)
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

  // Защита: блокируем закрытие/перезагрузку страницы
  useEffect(() => {
    const handler = e => { e.preventDefault(); e.returnValue = ""; return ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Защита: перехватываем кнопку «назад» в браузере
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handler = () => {
      window.history.pushState(null, "", window.location.href);
      setConfirmDiscard(true);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  function fmt(s) { const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, "0")}`; }

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
          if (!n[ei].sets[k].done && (n[ei].sets[k][field] === "" || n[ei].sets[k][field] === 0 || n[ei].sets[k][field] === "0")) {
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
      if (!wasDone) setRestTimer({ ei, si });
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
          <div className="fade" style={{ background: C.surface, borderRadius: 12, padding: 24, width: "100%", maxWidth: 300 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Выйти без сохранения?</h3>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>Прогресс тренировки будет потерян.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" style={{ flex: 1 }} onClick={() => setConfirmDiscard(false)} icon="close">Нет</Btn>
              <Btn variant="danger" style={{ flex: 1 }} onClick={onDiscard} icon="check">Да, выйти</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 300, overflowY: "auto", paddingBottom: 100 }}>
        <div style={{ padding: "16px 14px 0", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>{template.name}</h2>
              <p style={{ color: C.primary, fontSize: 14, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Icon name="timer" style={{ fontSize: 14 }} /> {fmt(elapsed)}
              </p>
            </div>
            <button onClick={() => setConfirmDiscard(true)}
              style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "7px 12px", display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
              <Icon name="exit_to_app" style={{ fontSize: 16 }} /> Выйти
            </button>
          </div>

          <div style={{ background: C.surface2, borderRadius: 3, height: 4, marginBottom: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress * 100}%`, background: C.primary, borderRadius: 3, transition: "width 0.3s" }} />
          </div>
          <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>{totalDone} из {totalSets} подходов</p>

          {exercises.map((ex, ei) => {
            const lastEx = lastWorkout?.exercises?.[ei];
            return (
              <Card key={ei} style={{ marginBottom: 10, padding: 14 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="fitness_center" style={{ fontSize: 15, color: C.primary }} /> {ex.name}
                </p>
                {lastEx && (
                  <div style={{ background: C.surface2, borderRadius: 6, padding: "6px 10px", marginBottom: 10, fontSize: 12, color: C.muted, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span>Прошлый раз:</span>
                    {lastEx.sets.map((s, si) => (
                      <span key={si} style={{ color: C.info }}>{s.reps}×{s.weight}кг{si < lastEx.sets.length - 1 ? " ·" : ""}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 36px", gap: 5, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>#</span>
                  <span style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>Повторы</span>
                  <span style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>Вес, кг</span>
                  <span />
                </div>
                {ex.sets.map((s, si) => (
                  <div key={si} style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 36px", gap: 5, marginBottom: 7, alignItems: "center", opacity: s.done ? 0.5 : 1, transition: "opacity 0.2s" }}>
                    <span style={{ textAlign: "center", fontSize: 12, color: C.muted }}>{si + 1}</span>
                    <input type="number" value={s.reps} onChange={e => updateSet(ei, si, "reps", e.target.value)}
                      onBlur={e => handleSetBlur(ei, si, "reps", e.target.value)}
                      placeholder={lastEx?.sets?.[si]?.reps ? String(lastEx.sets[si].reps) : "0"}
                      style={{ textAlign: "center", padding: "7px 3px", fontSize: 14 }} />
                    <input type="number" value={s.weight} onChange={e => updateSet(ei, si, "weight", e.target.value)}
                      onBlur={e => handleSetBlur(ei, si, "weight", e.target.value)}
                      placeholder={lastEx?.sets?.[si]?.weight ? String(lastEx.sets[si].weight) : "0"}
                      style={{ textAlign: "center", padding: "7px 3px", fontSize: 14 }} />
                    <button onClick={() => toggleDone(ei, si)}
                      style={{ width: 36, height: 36, borderRadius: 6, border: `1.5px solid ${s.done ? C.success : C.border}`, background: s.done ? C.success + "18" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={s.done ? "check_circle" : "radio_button_unchecked"} style={{ fontSize: 18, color: s.done ? C.success : C.muted }} />
                    </button>
                  </div>
                ))}
              </Card>
            );
          })}

          <Btn onClick={finish} size="lg" style={{ width: "100%", marginTop: 6 }} icon="flag">Завершить тренировку</Btn>
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
    const d = new Date(ts), now = new Date();
    if (d.toDateString() === now.toDateString()) return "Сегодня";
    const y = new Date(now); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "Вчера";
    return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
  }
  function fmtDur(s) { const m = Math.floor(s / 60); return m < 60 ? `${m} мин` : `${Math.floor(m / 60)}ч ${m % 60}м`; }

  return (
    <div className="fade">
      <div style={{ background: `${C.primary}10`, borderRadius: 10, padding: "18px 16px", marginBottom: 22, border: `1px solid ${C.primary}20` }}>
        <p style={{ color: C.muted, fontSize: 13 }}>Привет,</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{user}</h2>
        <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
          <div>
            <span style={{ fontSize: 26, fontWeight: 700, color: C.primary }}>{thisWeek}</span>
            <p style={{ fontSize: 11, color: C.muted }}>на этой неделе</p>
          </div>
          <div>
            <span style={{ fontSize: 26, fontWeight: 700, color: C.accent }}>{workouts.length}</span>
            <p style={{ fontSize: 11, color: C.muted }}>всего</p>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 4 }}>
        <Icon name="play_circle" style={{ fontSize: 13 }} /> Начать тренировку
      </p>
      {templates.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <p style={{ color: C.muted, fontSize: 14 }}>Создайте шаблон во вкладке «Шаблоны»</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {templates.map(t => {
            const last = [...workouts].filter(w => w.templateId === t.id).sort((a, b) => b.date - a.date)[0];
            return (
              <Card key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                    <span><Icon name="fitness_center" style={{ fontSize: 11 }} /> {t.exercises.length} упр.</span>
                    <span><Icon name="replay" style={{ fontSize: 11 }} /> {t.exercises.reduce((a, e) => a + e.sets, 0)} подх.</span>
                  </p>
                  {last && <p style={{ fontSize: 11, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="event" style={{ fontSize: 11 }} /> {dateStr(last.date)} · {fmtDur(last.duration)}
                  </p>}
                </div>
                <Btn size="sm" onClick={() => onStartWorkout(t)} icon="play_arrow" />
              </Card>
            );
          })}
        </div>
      )}

      {recentWorkouts.length > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="history" style={{ fontSize: 13 }} /> Последние
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentWorkouts.map(w => (
              <Card key={w.id} style={{ padding: 14 }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{w.templateName}</p>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="event" style={{ fontSize: 12 }} /> {dateStr(w.date)} · {fmtDur(w.duration)}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Шаблоны</h1>
          {templates.length > 0 && <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>{templates.length} шаблона</p>}
        </div>
        <Btn size="sm" onClick={() => setModal("new")} icon="add">Создать</Btn>
      </div>

      {templates.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 50 }}>
          <Icon name="format_list_bulleted" style={{ fontSize: 52, marginBottom: 12, color: C.muted }} />
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 18 }}>Нет шаблонов тренировок</p>
          <Btn onClick={() => setModal("new")} icon="add">Создать</Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {templates.map(t => (
            <Card key={t.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10 }}>
                <p style={{ fontWeight: 600, fontSize: 16 }}>{t.name}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setModal(t.id)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 5, padding: "5px 10px", color: C.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                    <Icon name="edit" style={{ fontSize: 14 }} /> Изменить
                  </button>
                  <button onClick={() => setConfirmDel(t.id)} style={{ background: "transparent", border: `1px solid ${C.danger}30`, borderRadius: 5, padding: "5px 8px", color: C.danger, cursor: "pointer" }}>
                    <Icon name="delete" style={{ fontSize: 15 }} />
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {t.exercises.map((ex, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface2, borderRadius: 6, padding: "7px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: C.muted, minWidth: 16 }}>{i + 1}.</span>
                      <span style={{ fontSize: 14 }}>{ex.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="replay" style={{ fontSize: 12, color: C.primary }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>{ex.sets}</span>
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
        <Modal title="Удалить шаблон?" onClose={() => setConfirmDel(null)}>
          <p style={{ color: C.muted, marginBottom: 18, fontSize: 14 }}>История тренировок останется.</p>
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
// WORKOUT EDIT MODAL — редактирование тренировки из истории
// ─────────────────────────────────────────────────────────────────────────────
function WorkoutEditModal({ workout, onSave, onClose }) {
  const [exercises, setExercises] = useState(JSON.parse(JSON.stringify(workout.exercises)));
  // duration in minutes for edit
  const [durationMin, setDurationMin] = useState(Math.round(workout.duration / 60));

  function updateSet(ei, si, field, val) {
    setExercises(prev => {
      const n = JSON.parse(JSON.stringify(prev));
      n[ei].sets[si][field] = val;
      return n;
    });
  }

  function save() {
    onSave({
      ...workout,
      duration: (Number(durationMin) || 0) * 60,
      exercises: exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(s => ({ reps: Number(s.reps) || 0, weight: Number(s.weight) || 0 })),
      })),
    });
    onClose();
  }

  return (
    <Modal title="Редактировать тренировку" onClose={onClose} zIndex={250}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, color: C.muted, marginBottom: 5, display: "block" }}>Длительность (мин)</label>
          <input type="number" value={durationMin} onChange={e => setDurationMin(e.target.value)} style={{ width: 120 }} />
        </div>

        {exercises.map((ex, ei) => (
          <div key={ei}>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="fitness_center" style={{ fontSize: 14, color: C.primary }} /> {ex.name}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr", gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>#</span>
              <span style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>Повторы</span>
              <span style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>Вес, кг</span>
            </div>
            {ex.sets.map((s, si) => (
              <div key={si} style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr", gap: 6, marginBottom: 7, alignItems: "center" }}>
                <span style={{ textAlign: "center", fontSize: 12, color: C.muted }}>{si + 1}</span>
                <input type="number" value={s.reps} onChange={e => updateSet(ei, si, "reps", e.target.value)} style={{ textAlign: "center", padding: "7px 4px", fontSize: 14 }} />
                <input type="number" value={s.weight} onChange={e => updateSet(ei, si, "weight", e.target.value)} style={{ textAlign: "center", padding: "7px 4px", fontSize: 14 }} />
              </div>
            ))}
          </div>
        ))}

        <Btn onClick={save} size="lg" style={{ width: "100%" }} icon="save">Сохранить изменения</Btn>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function WorkoutDetail({ workout, onClose, onDelete, onEdit }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [editing, setEditing] = useState(false);

  function fmtDur(s) { const m = Math.floor(s / 60); return m < 60 ? `${m} мин` : `${Math.floor(m / 60)}ч ${m % 60}м`; }

  if (editing) {
    return <WorkoutEditModal workout={workout} onSave={onEdit} onClose={() => setEditing(false)} />;
  }

  return (
    <Modal title={workout.templateName} onClose={onClose}>
      {confirmDel ? (
        <div>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 18 }}>Удалить тренировку из истории?</p>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" style={{ flex: 1 }} onClick={() => setConfirmDel(false)} icon="close">Отмена</Btn>
            <Btn variant="danger" style={{ flex: 1 }} onClick={() => { onDelete(workout.id); onClose(); }} icon="delete">Удалить</Btn>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: C.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
              <Icon name="event" style={{ fontSize: 14 }} />
              {new Date(workout.date).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p style={{ color: C.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
              <Icon name="timer" style={{ fontSize: 14 }} /> {fmtDur(workout.duration)}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setEditing(true)}
                style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 5, padding: "6px 12px", color: C.text, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="edit" style={{ fontSize: 14 }} /> Изменить
              </button>
              <button onClick={() => setConfirmDel(true)}
                style={{ background: "transparent", border: `1px solid ${C.danger}30`, borderRadius: 5, padding: "6px 10px", color: C.danger, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="delete" style={{ fontSize: 14 }} /> Удалить
              </button>
            </div>
          </div>

          {workout.exercises.map((ex, ei) => (
            <div key={ei} style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="fitness_center" style={{ fontSize: 14, color: C.primary }} /> {ex.name}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {ex.sets.map((s, si) => (
                  <div key={si} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface2, borderRadius: 6, padding: "7px 12px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: C.muted }}>{si + 1}</span>
                      <span style={{ fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>{s.reps}</span>
                        <span style={{ color: C.muted }}> × </span>
                        <span style={{ fontWeight: 600, color: C.primary }}>{s.weight}</span>
                        <span style={{ color: C.muted }}> кг</span>
                      </span>
                    </div>
                    {s.reps > 0 && s.weight > 0 && (
                      <span style={{ fontSize: 11, color: C.info }}>{s.reps * s.weight} кг</span>
                    )}
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
function HistoryTab({ workouts, templates, onDeleteWorkout, onEditWorkout }) {
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [filterTpl, setFilterTpl] = useState("all");

  const sorted = [...workouts].sort((a, b) => b.date - a.date);
  const filtered = filterTpl === "all" ? sorted : sorted.filter(w => w.templateId === filterTpl);

  function fmtDur(s) { const m = Math.floor(s / 60); return m < 60 ? `${m} мин` : `${Math.floor(m / 60)}ч ${m % 60}м`; }
  function dateStr(ts) {
    const d = new Date(ts), now = new Date();
    if (d.toDateString() === now.toDateString()) return "Сегодня";
    const y = new Date(now); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "Вчера";
    return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
  }

  // sync selectedWorkout when workouts list updates (after edit)
  const currentSelected = selectedWorkout ? workouts.find(w => w.id === selectedWorkout.id) || null : null;

  return (
    <div className="fade">
      <ScreenHeader title="История" subtitle={`${workouts.length} тренировок`} />
      {workouts.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 50 }}>
          <Icon name="history" style={{ fontSize: 52, marginBottom: 12, color: C.muted }} />
          <p style={{ color: C.muted, fontSize: 14 }}>Пока нет тренировок</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 14, overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 4 }}>
            {[{ id: "all", name: "Все" }, ...templates].map(t => (
              <button key={t.id} onClick={() => setFilterTpl(t.id)}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 6, padding: "5px 12px", borderRadius: 14, border: "none", background: filterTpl === t.id ? C.primary : C.surface2, color: filterTpl === t.id ? "#FFF" : C.muted, fontSize: 13, cursor: "pointer" }}>
                {t.name}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(w => (
              <Card key={w.id} onClick={() => setSelectedWorkout(w)} style={{ cursor: "pointer", padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>{w.templateName}</p>
                    <p style={{ fontSize: 13, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                      <Icon name="event" style={{ fontSize: 13 }} /> {dateStr(w.date)} · {fmtDur(w.duration)}
                    </p>
                    <div style={{ marginTop: 6 }}>
                      <Tag><Icon name="fitness_center" style={{ fontSize: 10 }} /> {w.exercises.length} упр.</Tag>
                    </div>
                  </div>
                  <Icon name="chevron_right" style={{ color: C.muted, fontSize: 20 }} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      {currentSelected && (
        <WorkoutDetail
          workout={currentSelected}
          onClose={() => setSelectedWorkout(null)}
          onDelete={id => { onDeleteWorkout(id); setSelectedWorkout(null); }}
          onEdit={updated => { onEditWorkout(updated); }}
        />
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
    [...workouts].sort((a, b) => a.date - b.date).forEach(w => {
      w.exercises.forEach(ex => {
        if (!exerciseMap.has(ex.name)) exerciseMap.set(ex.name, []);
        let maxWeight = 0, maxReps = 0;
        ex.sets.forEach(s => { if (s.weight > maxWeight) maxWeight = s.weight; if (s.reps > maxReps) maxReps = s.reps; });
        exerciseMap.get(ex.name).push({ date: w.date, maxWeight, maxReps });
      });
    });
    const progress = [];
    for (const [name, data] of exerciseMap) {
      if (data.length >= 1) {
        const first = data[0], last = data[data.length - 1];
        progress.push({ name, firstWeight: first.maxWeight, lastWeight: last.maxWeight, firstReps: first.maxReps, lastReps: last.maxReps, weightDiff: last.maxWeight - first.maxWeight, improved: last.maxWeight > first.maxWeight || last.maxReps > first.maxReps, totalWorkouts: data.length });
      }
    }
    return progress.sort((a, b) => Math.abs(b.weightDiff) - Math.abs(a.weightDiff)).slice(0, 6);
  };

  const progress = getExerciseProgress();

  return (
    <div className="fade">
      <ScreenHeader title="Профиль" />
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <Icon name="person" style={{ fontSize: 30, color: "#FFF" }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>{user}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
        <Card style={{ padding: "12px 14px" }}>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="fitness_center" style={{ fontSize: 13 }} /> Тренировок
          </p>
          <p style={{ fontSize: 24, fontWeight: 700, color: C.primary }}>{total}</p>
        </Card>
        <Card style={{ padding: "12px 14px" }}>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="schedule" style={{ fontSize: 13 }} /> Часов
          </p>
          <p style={{ fontSize: 24, fontWeight: 700, color: C.accent }}>{(Math.round(totalTime / 360) / 10).toFixed(1)}</p>
        </Card>
      </div>

      {progress.length > 0 && (
        <Card style={{ marginBottom: 20, padding: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="trending_up" style={{ fontSize: 16 }} /> Прогресс упражнений
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {progress.map((ex, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{ex.name}</span>
                  <span style={{ fontSize: 12, color: ex.improved ? C.success : C.muted, display: "flex", alignItems: "center", gap: 3 }}>
                    {ex.improved ? <Icon name="arrow_upward" style={{ fontSize: 12 }} /> : <Icon name="remove" style={{ fontSize: 12 }} />}
                    {ex.improved ? `+${ex.weightDiff} кг` : "без изм."}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: C.muted }}>
                  💪 {ex.firstWeight} → {ex.lastWeight} кг &nbsp; 🔄 {ex.firstReps} → {ex.lastReps} повт
                </p>
                <p style={{ fontSize: 11, color: C.info, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="check_circle" style={{ fontSize: 11 }} /> {ex.totalWorkouts} тренировок
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 20, padding: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
          <Icon name="timer" style={{ fontSize: 16 }} /> Таймер отдыха
        </p>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Запускается автоматически после отметки подхода</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[30, 60, 90, 120, 180, 240].map(sec => (
            <button key={sec} onClick={() => onRestChange(sec)}
              style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${restDuration === sec ? C.primary : C.border}`, background: restDuration === sec ? C.primary : C.surface2, color: restDuration === sec ? "#FFF" : C.muted, fontSize: 13, cursor: "pointer" }}>
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
      if (currentUser) { setUser(currentUser); await loadData(currentUser); }
      setLoading(false);
    })();
  }, []);

  async function loadData(username) {
    const tpls = await db.getTemplates(username);
    const wks = await db.getWorkouts(username);
    const rd = await db.getSetting(username, "restDuration", 90);
    setTemplates(tpls); setWorkouts(wks); setRestDuration(rd);
  }

  async function handleLogin(username) {
    await db.saveSetting("global", "currentUser", username);
    setUser(username); await loadData(username);
  }

  async function handleLogout() {
    await db.saveSetting("global", "currentUser", null);
    setUser(null); setTemplates([]); setWorkouts([]); setTab("home");
  }

  async function saveTemplate(tpl) {
    const existing = templates.find(t => t.id === tpl.id);
    const next = existing ? templates.map(t => t.id === tpl.id ? tpl : t) : [...templates, tpl];
    setTemplates(next); await db.saveTemplates(user, next);
  }

  async function deleteTemplate(id) {
    const next = templates.filter(t => t.id !== id);
    setTemplates(next); await db.saveTemplates(user, next);
  }

  async function deleteWorkout(id) {
    const next = workouts.filter(w => w.id !== id);
    setWorkouts(next); await db.saveWorkouts(user, next);
  }

  async function editWorkout(updated) {
    const next = workouts.map(w => w.id === updated.id ? updated : w);
    setWorkouts(next); await db.saveWorkouts(user, next);
  }

  function startWorkout(template) {
    const last = [...workouts].filter(w => w.templateId === template.id).sort((a, b) => b.date - a.date)[0];
    setActiveWorkout({ template, lastWorkout: last || null });
  }

  async function finishWorkout(workout) {
    const next = [...workouts, workout];
    setWorkouts(next); await db.saveWorkouts(user, next);
    setActiveWorkout(null); setTab("history");
  }

  async function changeRest(val) {
    setRestDuration(val); await db.saveSetting(user, "restDuration", val);
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
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 14px 84px" }}>
        {tab === "home" && <HomeTab user={user} templates={templates} workouts={workouts} onStartWorkout={startWorkout} />}
        {tab === "templates" && <TemplatesTab templates={templates} onSave={saveTemplate} onDelete={deleteTemplate} />}
        {tab === "history" && <HistoryTab workouts={workouts} templates={templates} onDeleteWorkout={deleteWorkout} onEditWorkout={editWorkout} />}
        {tab === "profile" && <ProfileTab user={user} workouts={workouts} restDuration={restDuration} onRestChange={changeRest} onLogout={handleLogout} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </>
  );
}