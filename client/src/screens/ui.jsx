import { useState, useEffect } from "react";
import { socket, clearSeat } from "../socket.js";

// ── Btn ────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', onClick, style = {}, disabled, full = true }) {
  const base = {
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    width: full ? '100%' : 'auto',
    fontFamily: 'inherit',
    fontWeight: 600,
    fontSize: 17,
    letterSpacing: 0,
    padding: '16px 24px',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    whiteSpace: 'nowrap',
    transition: 'transform .12s ease',
    WebkitTapHighlightColor: 'transparent',
    opacity: disabled ? 0.4 : 1,
  };
  const variants = {
    // Dark/ink bg — primary action
    primary: {
      color: 'var(--paper)',
      background: 'var(--ink)',
    },
    // Same as primary — "start game" style
    green: {
      color: 'var(--paper)',
      background: 'var(--ink)',
    },
    // Orange accent — CTA / danger / vote
    danger: {
      color: 'var(--on-accent)',
      background: 'var(--accent)',
    },
    accent: {
      color: 'var(--on-accent)',
      background: 'var(--accent)',
    },
    // Outline/ghost — secondary action
    ghost: {
      color: 'var(--ink)',
      background: 'transparent',
      boxShadow: 'inset 0 0 0 1.5px var(--line2)',
    },
    secondary: {
      color: 'var(--ink)',
      background: 'transparent',
      boxShadow: 'inset 0 0 0 1.5px var(--line2)',
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
      style={{ ...base, ...(variants[variant] ?? variants.primary), ...style }}
    >
      {children}
    </button>
  );
}

// ── Chip ───────────────────────────────────────────────────
export function Chip({ children, tone = 'default', style = {} }) {
  const tones = {
    default: { color: 'var(--muted)', boxShadow: 'inset 0 0 0 1px var(--line2)' },
    accent:  { background: 'rgba(255,64,0,.14)', color: 'var(--accent-ink)', boxShadow: 'inset 0 0 0 1px rgba(255,64,0,.4)' },
    red:     { background: 'rgba(255,64,0,.14)', color: 'var(--accent-ink)', boxShadow: 'inset 0 0 0 1px rgba(255,64,0,.4)' },
    green:   { background: 'var(--ink)', color: 'var(--paper)' },
    gold:    { color: 'var(--muted)', boxShadow: 'inset 0 0 0 1px var(--line2)' },
  };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 11px',
      borderRadius: 999,
      fontFamily: 'inherit',
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
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
      width: 42, height: 42, borderRadius: 13, flexShrink: 0,
      background: 'transparent',
      boxShadow: 'inset 0 0 0 1.5px var(--line2)',
      border: 'none',
      color: 'var(--ink)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent', ...style,
    }}>
      {children}
    </button>
  );
}

// ── TopBar ─────────────────────────────────────────────────
export function TopBar({ title, num, onBack, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
      {onBack ? (
        <IconBtn onClick={onBack}>
          <svg width="11" height="18" viewBox="0 0 11 18">
            <path d="M9 1L2 9l7 8" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconBtn>
      ) : <div style={{ width: 4 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        {num && (
          <div style={{
            fontWeight: 700, fontSize: 10.5, letterSpacing: '1.8px',
            textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2,
          }}>
            {num}
          </div>
        )}
        <div style={{
          fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em',
          color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title}
        </div>
      </div>
      {right || null}
    </div>
  );
}

// ── PlayerBadge ────────────────────────────────────────────
// Square rounded-corner avatar with deterministic warm tone.
const BADGE_PALETTE = [
  { bg: '#FF4000', text: '#fff' },
  { bg: '#2B2420', text: '#F3EEEB' },
  { bg: '#4A3E37', text: '#F3EEEB' },
  { bg: '#A4978C', text: '#23201D' },
  { bg: '#D8CFC7', text: '#3B312E' },
];

export function nameToColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % BADGE_PALETTE.length;
  return BADGE_PALETTE[h];
}

export function PlayerBadge({ name, size = 52, isYou = false }) {
  const { bg, text } = nameToColor(name);
  const r = Math.round(size * 0.27);
  const fs = Math.round(size * 0.46);
  return (
    <div style={{
      width: size, height: size, borderRadius: r, flexShrink: 0,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'inherit', fontWeight: 700, fontSize: fs,
      color: text, letterSpacing: '-0.03em', lineHeight: 1, overflow: 'hidden',
      outline: isYou ? '2.5px solid var(--accent)' : 'none',
      outlineOffset: isYou ? '2px' : '0',
    }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

// ── Rules data ─────────────────────────────────────────────
export const RULES = [
  { n: 1, heading: 'The setup',    text: "Everyone in the room gets the same secret word — everyone except one. That player is the Imposter, with no idea what the word is." },
  { n: 2, heading: 'Drop a clue',  text: "In turn, each player gives a single one-word clue that hints at the word without saying it. The Imposter has to bluff and blend in." },
  { n: 3, heading: 'Find the fake', text: "After all clues are in, vote for who you think the Imposter is. Read the room. Trust nobody." },
  { n: 4, heading: 'The verdict',  text: "If the group catches the Imposter, crew wins. If not, the Imposter wins." },
];

// ── HowToPlay overlay ──────────────────────────────────────
export function HowToPlay({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'var(--paper)',
      padding: '58px 22px 26px',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ height: 5, width: 38, background: 'var(--accent)', borderRadius: 2, marginBottom: 14 }} />
          <div style={{ fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.9, textTransform: 'uppercase', fontSize: 40, color: 'var(--ink)', margin: 0 }}>
            How to<br />play
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
            background: 'transparent', boxShadow: 'inset 0 0 0 1.5px var(--line2)',
            border: 'none', color: 'var(--ink)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
        {RULES.map(({ n, heading, text }) => (
          <div key={n} style={{ display: 'flex', gap: 16, padding: '16px 0', borderTop: '1px solid var(--line)' }}>
            <div style={{
              fontWeight: 800, letterSpacing: '-0.045em', textTransform: 'uppercase',
              fontSize: 26, color: 'var(--accent)', flexShrink: 0, width: 34, lineHeight: 1,
            }}>
              {String(n).padStart(2, '0')}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, color: 'var(--ink)' }}>{heading}</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--muted)', margin: 0 }}>{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ paddingTop: 18 }}>
        <Btn variant="primary" onClick={onClose}>Got it</Btn>
      </div>
    </div>
  );
}

// ── MenuTrigger ────────────────────────────────────────────
export function MenuTrigger({ onClick }) {
  return (
    <IconBtn onClick={onClick} aria-label="Open menu">
      <svg width="4" height="18" viewBox="0 0 4 18" fill="currentColor">
        <circle cx="2" cy="2" r="1.8" />
        <circle cx="2" cy="9" r="1.8" />
        <circle cx="2" cy="16" r="1.8" />
      </svg>
    </IconBtn>
  );
}

// ── MenuOverlay bottom sheet ───────────────────────────────
export function MenuOverlay({ isOpen, onClose, isHost, onRestart, onLeave, players = [], myId }) {
  const [sub, setSub] = useState(null);

  useEffect(() => {
    if (!isOpen) setSub(null);
  }, [isOpen]);

  if (!isOpen) return null;
  if (sub === 'rules') return <HowToPlay onClose={() => setSub(null)} />;

  const others = players.filter(p => p.id !== myId);

  const rowBase = {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '15px 6px',
    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
    borderBottom: '1px solid var(--line)',
    background: 'none',
    textAlign: 'left', cursor: 'pointer',
    fontFamily: 'inherit', fontWeight: 600, fontSize: 16.5,
    width: '100%', WebkitTapHighlightColor: 'transparent',
  };

  const chevron = (
    <svg width="7" height="12" viewBox="0 0 7 12" style={{ color: 'var(--faint)', flexShrink: 0 }}>
      <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const ic = (svg) => (
    <span style={{ width: 22, display: 'flex', justifyContent: 'center', color: 'inherit', flexShrink: 0 }}>
      {svg}
    </span>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.6)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
        background: 'var(--paper)', borderRadius: '26px 26px 0 0',
        padding: '14px 22px 40px', boxShadow: '0 -20px 50px -20px rgba(0,0,0,.4)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--line2)', margin: '0 auto 16px' }} />
        <div style={{ fontWeight: 700, fontSize: 11.5, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
          Menu
        </div>

        {sub === 'kick' ? (
          <>
            <button onClick={() => setSub(null)} style={{ ...rowBase, color: 'var(--accent-ink)' }}>
              ← Back
            </button>
            {others.length === 0 ? (
              <p style={{ margin: 0, padding: '16px 0', fontSize: 14, color: 'var(--faint)' }}>No other players</p>
            ) : others.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { socket.emit('vote:kick', { targetId: p.id }); onClose(); }}
                style={{ ...rowBase, color: 'var(--ink)', borderBottomColor: i === others.length - 1 ? 'transparent' : 'var(--line)' }}
              >
                <PlayerBadge name={p.name} size={36} />
                {p.name}
              </button>
            ))}
          </>
        ) : (
          <>
            <button onClick={() => setSub('rules')} style={{ ...rowBase, color: 'var(--ink)' }}>
              {ic(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.8"/><path d="M9.4 9.2a2.6 2.6 0 015.1.6c0 1.7-2.5 2.2-2.5 3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/><circle cx="12" cy="17" r="1.1" fill="currentColor"/></svg>)}
              <span style={{ flex: 1 }}>How to play</span>
              {chevron}
            </button>
            <button
              onClick={isHost ? () => { onRestart(); onClose(); } : undefined}
              style={{ ...rowBase, color: isHost ? 'var(--ink)' : 'var(--faint)', cursor: isHost ? 'pointer' : 'default', opacity: isHost ? 1 : 0.45 }}
            >
              {ic(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 108-8M4 12V6m0 6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
              <span style={{ flex: 1 }}>{isHost ? 'Restart game' : 'Restart game — host only'}</span>
              {isHost && chevron}
            </button>
            <button onClick={() => setSub('kick')} style={{ ...rowBase, color: 'var(--ink)' }}>
              {ic(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="10" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 19c0-3.3 2.7-5.5 6-5.5 1.2 0 2.3.3 3.2.8M16 10l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>)}
              <span style={{ flex: 1 }}>Vote kick</span>
              {chevron}
            </button>
            <button
              onClick={() => { socket.emit('room:leave'); clearSeat(); onLeave(); }}
              style={{ ...rowBase, color: 'var(--accent)', borderBottomColor: 'transparent' }}
            >
              {ic(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 4H6a2 2 0 00-2 2v12a2 2 0 002 2h8M11 12h9m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
              <span style={{ flex: 1 }}>Leave game</span>
            </button>
          </>
        )}
      </div>
    </>
  );
}
