import { useState, useEffect, useRef } from "react";

const PLAYER_COLORS = {
  "Pénélope": { main: "#7c3aed", light: "#e9d5ff", text: "white" },
  "Marie":    { main: "#db2777", light: "#fce7f3", text: "white" },
};
const PLAYER_EMOJIS = { "Pénélope": "🌸", "Marie": "🌺" };
const PLAYERS = ["Pénélope", "Marie"];

const INITIAL_EVENTS = [
  { id: 1, label: "Rhume", emoji: "🤧", points: 1, type: "galere" },
  { id: 2, label: "Scratch / bobo", emoji: "🩹", points: 0.5, type: "galere" },
  { id: 3, label: "Fièvre >40°", emoji: "🌡️", points: 3, type: "galere" },
  { id: 4, label: "Antibio", emoji: "💊", points: 3, type: "galere" },
  { id: 5, label: "Dent arrachée", emoji: "🦷", points: 5, type: "galere" },
  { id: 6, label: "Otite (crotte 🤌)", emoji: "👂", points: 7, type: "galere" },
  { id: 7, label: "Point de suture", emoji: "🧵", points: 15, type: "galere" },
  { id: 8, label: "Passage aux urgences", emoji: "🚨", points: 25, type: "galere" },
  { id: 9, label: "Café bu chaud", emoji: "☕", points: -10, type: "chance" },
  { id: 10, label: "Enfants sages un soir", emoji: "😇", points: -30, type: "chance" },
];

const BADGES = [
  { min: 0,  label: "Vacances de rêve 🌈", color: "#4ade80" },
  { min: 5,  label: "Ça commence...",       color: "#facc15" },
  { min: 15, label: "Maman courage 💪",     color: "#fb923c" },
  { min: 30, label: "Chef de guerre 🎖️",    color: "#f87171" },
  { min: 50, label: "Légende vivante 🏆",   color: "#c084fc" },
  { min: 80, label: "SURVIVANTE 🦸‍♀️",       color: "#ef4444" },
];

const EMOJIS = ["😱","🤢","💩","🔥","🌊","⚡","🎪","🎠","🏖️","🧸","🦟","🌧️","🚗","🛒","🎡","🧃","🍦","🥵","😤","🤕"];

function getBadge(score) {
  let badge = BADGES[0];
  for (const b of BADGES) { if (score >= b.min) badge = b; }
  return badge;
}

const DEFAULT_STATE = {
  scores: { "Pénélope": 0, "Marie": 0 },
  log: [],
  events: INITIAL_EVENTS,
};

export default function BingoGaleres() {
  const [gameState, setGameState] = useState(DEFAULT_STATE);
  const [activePlayer, setActivePlayer] = useState("Pénélope");
  const [flash, setFlash]         = useState(null);
  const [showPropose, setShowPropose] = useState(false);
  const [proposal, setProposal]   = useState({ label: "", emoji: "😱", points: 5, type: "galere" });
  const [syncing, setSyncing]     = useState(false);
  const [lastSync, setLastSync]   = useState(null);
  const pollRef = useRef(null);

  async function loadState() {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        if (data) { setGameState(data); setLastSync(new Date()); }
      }
    } catch (e) {}
  }

  async function saveState(newState) {
    setSyncing(true);
    try {
      await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newState) });
      setLastSync(new Date());
    } catch (e) {}
    setSyncing(false);
  }

  useEffect(() => {
    loadState();
    pollRef.current = setInterval(loadState, 4000);
    return () => clearInterval(pollRef.current);
  }, []);

  function updateAndSave(updater) {
    setGameState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }

  function addEvent(event) {
    updateAndSave(prev => ({
      ...prev,
      scores: { ...prev.scores, [activePlayer]: Math.max(0, prev.scores[activePlayer] + event.points) },
      log: [{ player: activePlayer, event, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) }, ...prev.log],
    }));
    setFlash({ player: activePlayer, points: event.points });
    setTimeout(() => setFlash(null), 900);
  }

  function submitProposal() {
    if (!proposal.label.trim()) return;
    const pts = proposal.type === "galere" ? Math.abs(proposal.points) : -Math.abs(proposal.points);
    updateAndSave(prev => ({ ...prev, events: [...prev.events, { ...proposal, points: pts, id: Date.now(), custom: true }] }));
    setShowPropose(false);
    setProposal({ label: "", emoji: "😱", points: 5, type: "galere" });
  }

  function reset() {
    const fresh = { scores: { "Pénélope": 0, "Marie": 0 }, log: [], events: gameState.events };
    setGameState(fresh);
    saveState(fresh);
  }

  const { scores, log, events } = gameState;
  const maxScore = Math.max(...PLAYERS.map(p => scores[p]));
  const leader = PLAYERS.filter(p => scores[p] === maxScore && maxScore > 0);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fdf4ff 0%, #fef9ec 100%)", fontFamily: "'Segoe UI', sans-serif", padding: "16px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 34 }}>🎲</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#7c3aed", margin: "2px 0", letterSpacing: -0.5 }}>Bingo des Galères</h1>
        <p style={{ color: "#9ca3af", fontSize: 12, margin: "0 0 2px 0" }}>Vacances avec enfants — édition survie</p>
        <div style={{ fontSize: 11, color: syncing ? "#f59e0b" : "#4ade80", fontWeight: 600, marginTop: 4 }}>
          {syncing ? "⏳ Sync..." : lastSync ? `✅ ${lastSync.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, justifyContent: "center" }}>
        {PLAYERS.map(p => {
          const col = PLAYER_COLORS[p];
          const active = activePlayer === p;
          return (
            <button key={p} onClick={() => setActivePlayer(p)} style={{ padding: "9px 20px", borderRadius: 999, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", background: active ? col.main : col.light, color: active ? col.text : col.main, transition: "all 0.2s", boxShadow: active ? `0 2px 10px ${col.main}44` : "none" }}>
              {PLAYER_EMOJIS[p]} {p}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {PLAYERS.map(p => {
          const badge = getBadge(scores[p]);
          const col = PLAYER_COLORS[p];
          const isActive = activePlayer === p;
          const isLeader = leader.includes(p) && leader.length === 1;
          return (
            <div key={p} onClick={() => setActivePlayer(p)} style={{ flex: 1, background: "white", borderRadius: 16, padding: "12px 10px", textAlign: "center", border: `2px solid ${isActive ? col.main : "#f3f4f6"}`, boxShadow: isActive ? `0 4px 16px ${col.main}22` : "0 2px 8px #0001", position: "relative", transition: "all 0.2s", cursor: "pointer" }}>
              {isLeader && <div style={{ position: "absolute", top: -10, right: 8, fontSize: 18 }}>👑</div>}
              <div style={{ fontSize: 12, color: col.main, fontWeight: 700, marginBottom: 2 }}>{PLAYER_EMOJIS[p]} {p}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: col.main, lineHeight: 1 }}>{scores[p]}</div>
              <div style={{ fontSize: 10, marginTop: 4, color: badge.color, fontWeight: 700 }}>{badge.label}</div>
              {flash?.player === p && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 26, fontWeight: 900, color: flash.points > 0 ? "#ef4444" : "#4ade80", pointerEvents: "none", animation: "fadeup 0.9s ease forwards" }}>
                  {flash.points > 0 ? `+${flash.points}` : flash.points}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", letterSpacing: 1, marginBottom: 8 }}>💀 GALÈRES — ajoute des points</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          {events.filter(e => e.type === "galere").map(e => (
            <button key={e.id} onClick={() => addEvent(e)} style={{ background: e.custom ? "#fff7ed" : "white", border: `1.5px solid ${e.custom ? "#fed7aa" : "#fecaca"}`, borderRadius: 12, padding: "9px 8px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 1px 4px #0001" }}>
              <span style={{ fontSize: 20 }}>{e.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", lineHeight: 1.3 }}>{e.label}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#ef4444" }}>+{e.points} pt{e.points > 1 ? "s" : ""}</div>
              </div>
              {e.custom && <span style={{ fontSize: 12 }}>✨</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: 1, marginBottom: 8 }}>🌟 CHANCE — retire des points</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          {events.filter(e => e.type === "chance").map(e => (
            <button key={e.id} onClick={() => addEvent(e)} style={{ background: e.custom ? "#f0fdf4" : "white", border: `1.5px solid ${e.custom ? "#86efac" : "#bbf7d0"}`, borderRadius: 12, padding: "9px 8px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 1px 4px #0001" }}>
              <span style={{ fontSize: 20 }}>{e.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", lineHeight: 1.3 }}>{e.label}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#16a34a" }}>{e.points} pts</div>
              </div>
              {e.custom && <span style={{ fontSize: 12 }}>✨</span>}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setShowPropose(!showPropose)} style={{ width: "100%", padding: "11px", background: "linear-gradient(90deg, #7c3aed, #db2777)", border: "none", borderRadius: 12, fontWeight: 700, color: "white", cursor: "pointer", fontSize: 14, marginBottom: 10 }}>
        ✨ Ajouter une situation
      </button>

      {showPropose && (
        <div style={{ background: "white", borderRadius: 14, padding: 14, marginBottom: 14, border: "2px solid #e9d5ff" }}>
          <div style={{ fontWeight: 700, color: "#7c3aed", marginBottom: 10, fontSize: 14 }}>🆕 Nouvelle situation</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>Emoji</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EMOJIS.map(em => (
                <button key={em} onClick={() => setProposal(p => ({ ...p, emoji: em }))} style={{ fontSize: 20, background: proposal.emoji === em ? "#e9d5ff" : "transparent", border: proposal.emoji === em ? "2px solid #7c3aed" : "2px solid transparent", borderRadius: 8, padding: "2px 4px", cursor: "pointer" }}>{em}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>Description</div>
            <input value={proposal.label} onChange={e => setProposal(p => ({ ...p, label: e.target.value }))} placeholder="Ex: Gastro familiale, Voiture vomie..." style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>Type</div>
              <div style={{ display: "flex", gap: 6 }}>
                {["galere", "chance"].map(t => (
                  <button key={t} onClick={() => setProposal(p => ({ ...p, type: t }))} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", background: proposal.type === t ? (t === "galere" ? "#fee2e2" : "#d1fae5") : "#f3f4f6", color: proposal.type === t ? (t === "galere" ? "#ef4444" : "#16a34a") : "#6b7280" }}>{t === "galere" ? "💀 Galère" : "🌟 Chance"}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>Points</div>
              <input type="number" min="0" max="100" value={Math.abs(proposal.points)} onChange={e => setProposal(p => ({ ...p, points: +e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, fontWeight: 700, boxSizing: "border-box", outline: "none" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowPropose(false)} style={{ flex: 1, padding: "9px", background: "#f3f4f6", border: "none", borderRadius: 10, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>Annuler</button>
            <button onClick={submitProposal} style={{ flex: 2, padding: "9px", background: "linear-gradient(90deg, #7c3aed, #db2777)", border: "none", borderRadius: 10, fontWeight: 700, color: "white", cursor: "pointer" }}>✅ Ajouter</button>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div style={{ background: "white", borderRadius: 14, padding: 12, marginBottom: 12, boxShadow: "0 2px 8px #0001" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 8 }}>📋 Historique</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 150, overflowY: "auto" }}>
            {log.map((entry, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                <span style={{ color: "#9ca3af", flexShrink: 0 }}>{entry.time}</span>
                <span style={{ fontWeight: 700, color: PLAYER_COLORS[entry.player].main, flexShrink: 0 }}>{PLAYER_EMOJIS[entry.player]} {entry.player}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.event.emoji} {entry.event.label}</span>
                <span style={{ fontWeight: 700, color: entry.event.points > 0 ? "#ef4444" : "#16a34a", flexShrink: 0 }}>{entry.event.points > 0 ? `+${entry.event.points}` : entry.event.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={reset} style={{ width: "100%", padding: "11px", background: "#f3f4f6", border: "none", borderRadius: 12, fontWeight: 700, color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
        🔄 Recommencer les vacances (sigh)
      </button>

      <style>{`@keyframes fadeup { 0% { opacity:1; transform:translate(-50%,-50%); } 100% { opacity:0; transform:translate(-50%,-130%); } }`}</style>
    </div>
  );
}
