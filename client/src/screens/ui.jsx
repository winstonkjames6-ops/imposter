// Shared UI primitives — extracted from the standalone design.
import { useState, useEffect } from "react";
import { socket, clearSeat } from "../socket.js";

// ── Btn ────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', onClick, style = {}, disabled, full = true }) {
  const base = {
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    width: full ? '100%' : 'auto',
    fontFamily: 'var(--display-font)',
    fontWeight: 600,
    fontSize: 19,
    letterSpacing: 0.2,
    padding: '17px 26px',
    borderRadius: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    whiteSpace: 'nowrap',
    transition: 'transform .12s ease',
    WebkitTapHighlightColor: 'transparent',
    opacity: disabled ? 0.4 : 1,
  };
  const variants = {
    primary: {
      color: '#fff',
      background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
      boxShadow: '0 10px 26px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.3)',
    },
    green: {
      color: '#06281C',
      background: 'linear-gradient(135deg, #4DEBAE, #28C98B)',
      boxShadow: '0 10px 26px -10px rgba(60,224,160,0.6), inset 0 1px 0 rgba(255,255,255,0.4)',
    },
    ghost: {
      color: 'var(--text)',
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
    },
    danger: {
      color: '#fff',
      background: 'linear-gradient(135deg,#FF6B86,#E23B57)',
      boxShadow: '0 10px 26px -10px rgba(255,77,109,0.55)',
    },
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = '')}
      onMouseLeave={e => (e.currentTarget.style.transform = '')}
      onTouchStart={e => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onTouchEnd={e => (e.currentTarget.style.transform = '')}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

// ── Chip ───────────────────────────────────────────────────
export function Chip({ children, tone = 'default', style = {} }) {
  const tones = {
    default: { background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' },
    accent:  { background: 'color-mix(in srgb, var(--accent) 22%, transparent)', color: '#D8CCFF',  border: '1px solid color-mix(in srgb, var(--accent) 45%, transparent)' },
    red:     { background: 'rgba(255,77,109,0.16)',  color: '#FF8DA2',  border: '1px solid rgba(255,77,109,0.35)' },
    green:   { background: 'rgba(60,224,160,0.16)',  color: '#7DEBC2',  border: '1px solid rgba(60,224,160,0.35)' },
    gold:    { background: 'rgba(255,194,61,0.16)',   color: '#FFD98A',  border: '1px solid rgba(255,194,61,0.35)' },
  };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 13px',
      borderRadius: 999,
      fontFamily: 'Nunito, sans-serif',
      fontWeight: 700,
      fontSize: 12.5,
      letterSpacing: 0.3,
      ...tones[tone],
      ...style,
    }}>
      {children}
    </span>
  );
}

// ── IconBtn ────────────────────────────────────────────────
export function IconBtn({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      color: 'var(--text)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent', ...style,
    }}>
      {children}
    </button>
  );
}

// ── TopBar ─────────────────────────────────────────────────
export function TopBar({ title, onBack, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px', marginBottom: 18 }}>
      {onBack ? (
        <IconBtn onClick={onBack}>
          <svg width="11" height="18" viewBox="0 0 11 18">
            <path d="M9 1L2 9l7 8" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconBtn>
      ) : <div style={{ width: 4 }} />}
      <div style={{
        flex: 1, fontFamily: 'var(--display-font)', fontWeight: 600,
        fontSize: 21, color: 'var(--text)',
      }}>
        {title}
      </div>
      {right || null}
    </div>
  );
}

// ── PlayerBadge ────────────────────────────────────────────
// Deterministic colored initial badge — used everywhere in place of avatars.
const BADGE_PALETTE = [
  '#7C5CFF','#3DA5F0','#FF5CA8','#5FC23D',
  '#FFC23D','#FF8A3D','#3CE0A0','#E23B57',
];

export function nameToColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % BADGE_PALETTE.length;
  return BADGE_PALETTE[h];
}

export function PlayerBadge({ name, size = 52 }) {
  const color = nameToColor(name);
  const r = Math.round(size * 0.32);
  const fs = Math.round(size * 0.42);
  return (
    <div style={{
      width: size, height: size, borderRadius: r, flexShrink: 0,
      background: `radial-gradient(circle at 40% 35%, ${color}, color-mix(in srgb, ${color} 60%, #000))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: fs,
      color: '#fff', boxShadow: `0 6px 18px -8px ${color}`,
    }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

// ── Rules data ─────────────────────────────────────────────
export const RULES = [
  { n: 1, text: "Everyone gets a secret word except the Imposter, who only knows the category." },
  { n: 2, text: "Each player gives a one-word clue about the word without saying it directly." },
  { n: 3, text: "After all clues are in, vote for who you think the Imposter is." },
  { n: 4, text: "If the group catches the Imposter, crew wins. If not, Imposter wins." },
];

// ── HowToPlay overlay ──────────────────────────────────────
export function HowToPlay({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '64px 22px 48px',
      overflowY: 'auto',
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 18, right: 18,
          width: 44, height: 44, borderRadius: 14,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--text)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-label="Close"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 13,
          letterSpacing: 3, color: 'var(--accent2)', marginBottom: 8, textTransform: 'uppercase',
        }}>
          How to play
        </div>
        <h2 style={{
          fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 42,
          letterSpacing: -0.5, textTransform: 'uppercase', lineHeight: 0.95,
          color: 'var(--text)', margin: 0,
        }}>
          The rules
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {RULES.map(({ n, text }) => (
          <div key={n} style={{
            display: 'flex', alignItems: 'flex-start', gap: 16,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '16px 18px',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
              boxShadow: '0 6px 16px -8px var(--accent-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 16, color: '#fff',
            }}>
              {n}
            </div>
            <p style={{
              fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: 15.5,
              color: 'var(--muted)', margin: 0, lineHeight: 1.5,
            }}>
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MenuTrigger ────────────────────────────────────────────
export function MenuTrigger({ onClick }) {
  return (
    <IconBtn onClick={onClick} aria-label="Open menu">
      <svg width="4" height="16" viewBox="0 0 4 16" fill="currentColor">
        <circle cx="2" cy="2" r="1.8" />
        <circle cx="2" cy="8" r="1.8" />
        <circle cx="2" cy="14" r="1.8" />
      </svg>
    </IconBtn>
  );
}

// ── MenuOverlay bottom sheet ───────────────────────────────
export function MenuOverlay({ isOpen, onClose, isHost, onRestart, onLeave, players = [], myId }) {
  const [sub, setSub] = useState(null); // null | 'rules' | 'kick'

  useEffect(() => {
    if (!isOpen) setSub(null);
  }, [isOpen]);

  if (!isOpen) return null;

  if (sub === 'rules') return <HowToPlay onClose={() => setSub(null)} />;

  const others = players.filter(p => p.id !== myId);

  const btn = {
    display: 'flex', alignItems: 'center', gap: 14,
    width: '100%', minHeight: 56, padding: '0 22px',
    background: 'none', border: 'none',
    borderBottom: '1px solid var(--border)',
    textAlign: 'left', cursor: 'pointer',
    fontFamily: 'var(--display-font)', fontWeight: 600, fontSize: 18,
    WebkitTapHighlightColor: 'transparent',
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)' }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
        background: '#13102b',
        borderRadius: '20px 20px 0 0',
        padding: '12px 0 40px',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border)', margin: '0 auto 8px' }} />

        {sub === 'kick' ? (
          <>
            <button onClick={() => setSub(null)} style={{ ...btn, color: 'var(--accent2)' }}>
              ← Back
            </button>
            {others.length === 0 ? (
              <p style={{ margin: 0, padding: '16px 22px', fontFamily: 'Nunito, sans-serif', fontSize: 14, color: 'var(--faint)' }}>
                No other players
              </p>
            ) : others.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { socket.emit('vote:kick', { targetId: p.id }); onClose(); }}
                style={{ ...btn, color: 'var(--text)', borderBottom: i === others.length - 1 ? 'none' : '1px solid var(--border)' }}
              >
                <PlayerBadge name={p.name} size={36} />
                {p.name}
              </button>
            ))}
          </>
        ) : (
          <>
            <button onClick={() => setSub('rules')} style={{ ...btn, color: 'var(--text)' }}>
              How to play
            </button>
            <button
              onClick={isHost ? () => { onRestart(); onClose(); } : undefined}
              style={{ ...btn, color: isHost ? 'var(--text)' : 'var(--faint)', cursor: isHost ? 'pointer' : 'default', opacity: isHost ? 1 : 0.45 }}
            >
              {isHost ? 'Restart game' : 'Restart game — host only'}
            </button>
            <button onClick={() => setSub('kick')} style={{ ...btn, color: 'var(--text)' }}>
              Vote kick
            </button>
            <button
              onClick={() => { socket.emit('room:leave'); clearSeat(); onLeave(); }}
              style={{ ...btn, color: 'var(--red)', borderBottom: 'none' }}
            >
              Leave game
            </button>
          </>
        )}
      </div>
    </>
  );
}
