// Shared UI primitives — extracted from the standalone design.

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
