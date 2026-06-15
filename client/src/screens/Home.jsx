import { useState } from "react";
import { socket, saveSeat } from "../socket.js";
import { Btn, HowToPlay, PlayerBadge, CharacterSVG } from "./ui.jsx";

const COLORS = ['#FF4000', '#E8A838', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#607D8B'];
const CHARACTER_KEY = 'imposter_character';
const DEFAULT_CHAR = { bodyColor: '#FF4000', eyes: 'dots', mouth: 'smile' };

function loadCharacter() {
  try { return JSON.parse(localStorage.getItem(CHARACTER_KEY)); } catch { return null; }
}
function persistCharacter(char) {
  localStorage.setItem(CHARACTER_KEY, JSON.stringify(char));
}

function EyePreview({ type }) {
  const L = 12, R = 36, Y = 10;
  const arcL = `M${L - 5},${Y} Q${L},${Y - 6} ${L + 5},${Y}`;
  const arcR = `M${R - 5},${Y} Q${R},${Y - 6} ${R + 5},${Y}`;
  const sp = { stroke: '#1a1a1a', strokeWidth: '2', fill: 'none', strokeLinecap: 'round' };
  switch (type) {
    case 'happy':
      return <svg viewBox="0 0 48 20" width="48" height="20"><path d={arcL} {...sp}/><path d={arcR} {...sp}/></svg>;
    case 'wide':
      return <svg viewBox="0 0 48 20" width="48" height="20"><circle cx={L} cy={Y} r="5.5" fill="white" stroke="#ccc" strokeWidth="1"/><circle cx={L} cy={Y} r="2.8" fill="#1a1a1a"/><circle cx={R} cy={Y} r="5.5" fill="white" stroke="#ccc" strokeWidth="1"/><circle cx={R} cy={Y} r="2.8" fill="#1a1a1a"/></svg>;
    case 'wink':
      return <svg viewBox="0 0 48 20" width="48" height="20"><circle cx={L} cy={Y} r="3.5" fill="#1a1a1a"/><path d={arcR} {...sp}/></svg>;
    default:
      return <svg viewBox="0 0 48 20" width="48" height="20"><circle cx={L} cy={Y} r="3.5" fill="#1a1a1a"/><circle cx={R} cy={Y} r="3.5" fill="#1a1a1a"/></svg>;
  }
}

function MouthPreview({ type }) {
  const MX = 24, MY = 9;
  const sp = { stroke: '#1a1a1a', strokeWidth: '2.5', fill: 'none', strokeLinecap: 'round' };
  switch (type) {
    case 'flat':
      return <svg viewBox="0 0 48 18" width="48" height="18"><line x1={MX - 9} y1={MY} x2={MX + 9} y2={MY} stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/></svg>;
    case 'open':
      return <svg viewBox="0 0 48 18" width="48" height="18"><path d={`M${MX - 9},${MY - 2} Q${MX},${MY + 8} ${MX + 9},${MY - 2}`} fill="#1a1a1a"/></svg>;
    case 'smirk':
      return <svg viewBox="0 0 48 18" width="48" height="18"><path d={`M${MX - 8},${MY + 2} Q${MX + 2},${MY + 7} ${MX + 9},${MY - 2}`} {...sp}/></svg>;
    default:
      return <svg viewBox="0 0 48 18" width="48" height="18"><path d={`M${MX - 9},${MY - 2} Q${MX},${MY + 8} ${MX + 9},${MY - 2}`} {...sp}/></svg>;
  }
}

export default function Home() {
  const [name, setName] = useState('');
  const [step, setStep] = useState('name'); // 'name' | 'character' | 'play'
  const [prevStep, setPrevStep] = useState('name');
  const [character, setCharacter] = useState(() => loadCharacter() || { ...DEFAULT_CHAR });
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [showRules, setShowRules] = useState(false);

  function goToCharacter(from) {
    setPrevStep(from);
    setStep('character');
  }

  function confirmName() {
    if (!name.trim()) return;
    goToCharacter('name');
  }

  function handleSaveCharacter() {
    const saved = { ...character, name };
    persistCharacter(saved);
    setStep('play');
  }

  function create() {
    const char = { ...character, name };
    socket.emit('room:create', { name, color: character.bodyColor, character: char }, (res) => {
      if (!res.ok) return setError(res.error);
      saveSeat(res.roomCode, res.token);
    });
  }

  function join() {
    const char = { ...character, name };
    socket.emit('room:join', { roomCode: code, name, color: character.bodyColor, character: char }, (res) => {
      if (!res.ok) return setError(res.error);
      saveSeat(res.roomCode, res.token);
    });
  }

  const labelStyle = {
    fontWeight: 700, fontSize: 10.5, letterSpacing: '1.8px',
    textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10,
  };

  const optBtnBase = {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 5, padding: '10px 6px',
    border: '1.5px solid', borderRadius: 14, cursor: 'pointer',
    fontFamily: 'Nunito, sans-serif', fontWeight: 700,
    fontSize: 10.5, letterSpacing: '0.03em',
    WebkitTapHighlightColor: 'transparent', flex: 1, background: 'none',
  };

  // ── Character creator ──────────────────────────────────────
  if (step === 'character') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '58px 20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setStep(prevStep)}
            style={{
              background: 'none', border: 'none',
              boxShadow: 'inset 0 0 0 1.5px var(--line2)',
              borderRadius: 13, width: 42, height: 42,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--ink)', flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="11" height="18" viewBox="0 0 11 18">
              <path d="M9 1L2 9l7 8" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 10.5, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--accent-ink)', marginBottom: 2 }}>
              Playing as {name}
            </div>
            <div style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
              Your character
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{
            width: 120, height: 120, borderRadius: 32,
            background: character.bodyColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: `0 12px 32px -8px ${character.bodyColor}88`,
          }}>
            <CharacterSVG character={character} size={120} />
          </div>
        </div>

        {/* Color */}
        <div style={{ marginBottom: 22 }}>
          <div style={labelStyle}>Color</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setCharacter(ch => ({ ...ch, bodyColor: c }))}
                style={{
                  width: 34, height: 34, borderRadius: '50%', background: c,
                  border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0,
                  boxShadow: character.bodyColor === c ? `0 0 0 3px var(--paper), 0 0 0 5.5px ${c}` : 'none',
                  transition: 'box-shadow .12s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              />
            ))}
          </div>
        </div>

        {/* Eyes */}
        <div style={{ marginBottom: 22 }}>
          <div style={labelStyle}>Eyes</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['dots', 'happy', 'wide', 'wink'].map(opt => {
              const sel = character.eyes === opt;
              return (
                <button key={opt} onClick={() => setCharacter(ch => ({ ...ch, eyes: opt }))}
                  style={{
                    ...optBtnBase,
                    borderColor: sel ? 'var(--accent)' : 'var(--line2)',
                    background: sel ? 'rgba(255,64,0,.1)' : 'var(--surface)',
                    color: sel ? 'var(--accent-ink)' : 'var(--muted)',
                  }}>
                  <EyePreview type={opt} />
                  <span style={{ textTransform: 'capitalize' }}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mouth */}
        <div style={{ marginBottom: 28 }}>
          <div style={labelStyle}>Mouth</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['smile', 'flat', 'open', 'smirk'].map(opt => {
              const sel = character.mouth === opt;
              return (
                <button key={opt} onClick={() => setCharacter(ch => ({ ...ch, mouth: opt }))}
                  style={{
                    ...optBtnBase,
                    borderColor: sel ? 'var(--accent)' : 'var(--line2)',
                    background: sel ? 'rgba(255,64,0,.1)' : 'var(--surface)',
                    color: sel ? 'var(--accent-ink)' : 'var(--muted)',
                  }}>
                  <MouthPreview type={opt} />
                  <span style={{ textTransform: 'capitalize' }}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Btn variant="primary" onClick={handleSaveCharacter}>Save character</Btn>
      </div>
    );
  }

  // ── Shared hero ────────────────────────────────────────────
  const hero = (
    <div>
      <div style={{ height: 5, width: 38, background: 'var(--accent)', borderRadius: 2, marginBottom: 18 }} />
      <div style={{ fontWeight: 700, fontSize: 11.5, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--accent-ink)', marginBottom: 12 }}>
        Who's faking it?
      </div>
      <h1 style={{ fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.9, textTransform: 'uppercase', fontSize: 72, margin: 0, color: 'var(--ink)' }}>
        Imposter<span style={{ color: 'var(--accent)' }}>.</span>
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--muted)', margin: '18px 0 0', maxWidth: 300 }}>
        Everyone gets the secret word — except one. Drop a one-word clue, then sniff out the fake.
      </p>
    </div>
  );

  // ── Name step ──────────────────────────────────────────────
  if (step === 'name') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100vh', padding: '58px 20px 32px' }}>
        {hero}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && confirmName()}
            placeholder="Your name"
            maxLength={16}
            autoFocus
            style={{ borderRadius: 14, fontWeight: 600, fontSize: 17, padding: '15px 18px', width: '100%' }}
          />
          <Btn variant="primary" disabled={!name.trim()} onClick={confirmName}>
            Continue →
          </Btn>
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
        </div>
        {showRules && <HowToPlay onClose={() => setShowRules(false)} />}
      </div>
    );
  }

  // ── Play step ──────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100vh', padding: '58px 20px 32px' }}>
      {hero}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Playing as card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', borderRadius: 20, padding: 14 }}>
          <PlayerBadge name={name} character={character} size={52} isYou />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 10, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
              Playing as
            </div>
            <div style={{ fontWeight: 700, fontSize: 19, color: 'var(--ink)' }}>{name}</div>
          </div>
          <button
            onClick={() => goToCharacter('play')}
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

        {!joining ? (
          <>
            <Btn variant="primary" onClick={create}>Create a room</Btn>
            <Btn variant="ghost" onClick={() => setJoining(true)}>Join with a code</Btn>
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
              <Btn variant="primary" disabled={!name.trim() || code.length !== 4} onClick={join} full={false} style={{ flex: 1 }}>
                Join
              </Btn>
            </div>
            <Btn variant="ghost" onClick={() => { setJoining(false); setCode(''); setError(null); }}>
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
