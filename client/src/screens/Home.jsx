import { useState, useRef } from "react";
import { socket, saveSeat } from "../socket.js";
import { Btn, HowToPlay, PlayerBadge } from "./ui.jsx";

export default function Home() {
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(true);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const nameInputRef = useRef(null);

  function handleEditName() {
    setEditingName(true);
    requestAnimationFrame(() => nameInputRef.current?.focus());
  }

  function create() {
    socket.emit("room:create", { name }, (res) => {
      if (!res.ok) return setError(res.error);
      saveSeat(res.roomCode, res.token);
    });
  }

  function join() {
    socket.emit("room:join", { roomCode: code, name }, (res) => {
      if (!res.ok) return setError(res.error);
      saveSeat(res.roomCode, res.token);
    });
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: '100vh', padding: '58px 20px 32px',
    }}>
      {/* Hero */}
      <div>
        <div style={{ height: 5, width: 38, background: 'var(--accent)', borderRadius: 2, marginBottom: 18 }} />
        <div style={{
          fontWeight: 700, fontSize: 11.5, letterSpacing: '1.8px',
          textTransform: 'uppercase', color: 'var(--accent-ink)', marginBottom: 12,
        }}>
          Who's faking it?
        </div>
        <h1 style={{
          fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.9,
          textTransform: 'uppercase', fontSize: 72, margin: 0, color: 'var(--ink)',
        }}>
          Imposter<span style={{ color: 'var(--accent)' }}>.</span>
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--muted)', margin: '18px 0 0', maxWidth: 300 }}>
          Everyone gets the secret word — except one. Drop a one-word clue, then sniff out the fake.
        </p>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Name: input by default; "Playing as" card after blur with a name set */}
        {!editingName && name.trim() ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--surface)', borderRadius: 20, padding: 14,
          }}>
            <PlayerBadge name={name} size={52} isYou />
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 700, fontSize: 10, letterSpacing: '1.8px',
                textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2,
              }}>
                Playing as
              </div>
              <div style={{ fontWeight: 700, fontSize: 19, color: 'var(--ink)' }}>{name}</div>
            </div>
            <button
              onClick={handleEditName}
              style={{
                background: 'none', border: 'none',
                boxShadow: 'inset 0 0 0 1px var(--line2)',
                borderRadius: 999, padding: '5px 11px',
                fontFamily: 'inherit', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--muted)', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Edit
            </button>
          </div>
        ) : (
          <input
            ref={nameInputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => { if (name.trim()) setEditingName(false); }}
            onKeyDown={e => e.key === 'Enter' && name.trim() && !joining && create()}
            placeholder="Your name"
            maxLength={16}
            autoFocus={!joining}
            style={{ borderRadius: 14, fontWeight: 600, fontSize: 17, padding: '15px 18px', width: '100%' }}
          />
        )}

        {!joining ? (
          <>
            <Btn variant="primary" disabled={!name.trim()} onClick={create}>
              Create a room
            </Btn>
            <Btn variant="ghost" onClick={() => setJoining(true)}>
              Join with a code
            </Btn>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(null); }}
                onKeyDown={e => e.key === 'Enter' && name.trim() && code.length === 4 && join()}
                placeholder="CODE"
                maxLength={4}
                autoFocus
                style={{
                  flex: 1, borderRadius: 14, fontWeight: 700,
                  fontSize: 22, padding: '15px 12px', textAlign: 'center', letterSpacing: 6,
                }}
              />
              <Btn
                variant="primary"
                disabled={!name.trim() || code.length !== 4}
                onClick={join}
                full={false}
                style={{ flex: 1 }}
              >
                Join
              </Btn>
            </div>
            <Btn variant="ghost" onClick={() => { setJoining(false); setCode(""); setError(null); }}>
              ← Back
            </Btn>
          </>
        )}

        <button
          onClick={() => setShowRules(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontWeight: 600, fontSize: 14.5,
            textAlign: 'center', padding: '8px 0 2px', fontFamily: 'inherit',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          How to play →
        </button>

        {error && (
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)', textAlign: 'center', margin: 0 }}>
            {error}
          </p>
        )}
      </div>

      {showRules && <HowToPlay onClose={() => setShowRules(false)} />}
    </div>
  );
}
