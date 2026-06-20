import { useState, useRef, useEffect } from "react";
import { socket } from "../socket.js";
import { Btn, Chip, TopBar, MenuOverlay, MenuTrigger } from "./ui.jsx";

export default function Reveal({ view, onLeave }) {
  const [held, setHeld] = useState(false);
  const [prog, setProg] = useState(0);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clue, setClue] = useState(null);
  const timerRef = useRef(null);
  const { role } = view;

  function advance() {
    socket.emit("game:advance", {}, (res) => {
      if (!res.ok) setError(res.error);
    });
  }

  const startHold = () => {
    if (held) return;
    const t0 = Date.now();
    timerRef.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / 750);
      setProg(p);
      if (p >= 1) { clearInterval(timerRef.current); setHeld(true); }
    }, 16);
  };

  const stopHold = () => {
    if (!held) { clearInterval(timerRef.current); setProg(0); }
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    if (role?.isImposter && role.clues?.length > 0) {
      setClue(role.clues[Math.floor(Math.random() * role.clues.length)]);
    }
  }, []);

  const isSpectator = view.you.isSpectator;
  const accent = role ? (role.isImposter ? 'var(--red)' : 'var(--green)') : 'var(--accent)';
  const circum = 2 * Math.PI * 28;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: '100vh', padding: '56px 22px 40px',
    }}>
      <TopBar
        title="Your secret"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {role && <Chip tone="accent">{role.category}</Chip>}
            <MenuTrigger onClick={() => setMenuOpen(true)} />
          </div>
        }
      />
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} isHost={view.you.isHost} onRestart={() => socket.emit('game:reset')} onLeave={onLeave} players={view.players} myId={view.you.id} />
      {isSpectator && (
        <div style={{
          background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.3)',
          borderRadius: 12, padding: '8px 14px', marginBottom: 16,
          fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13.5,
          color: 'var(--accent2)', textAlign: 'center',
        }}>
          You're watching
        </div>
      )}

      {/* Reveal card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        {isSpectator ? (
          <div style={{
            width: 260, height: 320, borderRadius: 30,
            background: 'linear-gradient(160deg, #2A2342, #1C1730)',
            border: '2px solid var(--border)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textAlign: 'center', padding: 24, gap: 12,
          }}>
            <div style={{ fontFamily: 'var(--display-font)', fontWeight: 600, fontSize: 20, color: 'var(--muted)' }}>
              Players are revealing their cards
            </div>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--faint)' }}>
              Watching as spectator
            </div>
          </div>
        ) : <div
          onMouseDown={startHold}
          onTouchStart={e => { e.preventDefault(); startHold(); }}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchEnd={stopHold}
          style={{
            width: 260, height: 320, borderRadius: 30, position: 'relative',
            cursor: held ? 'default' : 'pointer',
            userSelect: 'none', WebkitUserSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            background: held
              ? `linear-gradient(160deg, color-mix(in srgb, ${accent} 20%, var(--surface)), var(--surface))`
              : 'linear-gradient(160deg, #2A2342, #1C1730)',
            border: held ? `2px solid ${accent}` : '2px solid var(--border)',
            boxShadow: held ? `0 24px 60px -22px ${accent}` : '0 20px 50px -24px #000',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textAlign: 'center', padding: 24,
            transition: 'background .3s, border-color .3s, box-shadow .3s',
          }}
        >
          {held ? (
            role.isImposter ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 52, lineHeight: 1 }}>🎭</div>
                <div style={{
                  fontFamily: 'var(--display-font)', fontWeight: 700,
                  fontSize: 26, lineHeight: 1.2, color: 'var(--red)',
                }}>
                  You're the<br />Imposter
                </div>
                <div style={{
                  fontFamily: 'Nunito, sans-serif', fontWeight: 600,
                  fontSize: 14, color: 'var(--muted)', lineHeight: 1.4, marginTop: 4,
                }}>
                  You don't know the word.<br />Blend in. Bluff your clues.
                </div>
                {clue && (
                  <div style={{
                    fontFamily: 'Nunito, sans-serif', fontWeight: 700,
                    fontSize: 13, color: 'var(--text)', lineHeight: 1.4,
                    marginTop: 6, textAlign: 'center',
                  }}>
                    Your clue: {clue}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{
                  fontFamily: 'Nunito, sans-serif', fontWeight: 800,
                  fontSize: 12.5, letterSpacing: 1.5, color: 'var(--green)',
                }}>
                  THE SECRET WORD IS
                </div>
                <div style={{
                  fontFamily: 'var(--display-font)', fontWeight: 700,
                  fontSize: 46, color: 'var(--text)', lineHeight: 1,
                }}>
                  {role.word}
                </div>
                <Chip tone="green">{role.category}</Chip>
                <div style={{
                  fontFamily: 'Nunito, sans-serif', fontWeight: 600,
                  fontSize: 14, color: 'var(--muted)',
                }}>
                  Don't say it out loud 🤫
                </div>
              </div>
            )
          ) : (
            <>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ marginBottom: 14 }}>
                <circle cx="32" cy="32" r="28" stroke="var(--border)" strokeWidth="4" fill="none" />
                <circle
                  cx="32" cy="32" r="28"
                  stroke="var(--accent)" strokeWidth="4" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circum}
                  strokeDashoffset={(1 - prog) * circum}
                  transform="rotate(-90 32 32)"
                  style={{ transition: 'stroke-dashoffset .05s linear' }}
                />
                <path d="M32 22v14M26 30l6 6 6-6" stroke="var(--text)" strokeWidth="3"
                  fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{
                fontFamily: 'var(--display-font)', fontWeight: 600,
                fontSize: 22, color: 'var(--text)',
              }}>
                Hold to reveal
              </div>
              <div style={{
                fontFamily: 'Nunito, sans-serif', fontWeight: 600,
                fontSize: 14, color: 'var(--faint)', marginTop: 8,
              }}>
                Make sure nobody's peeking
              </div>
            </>
          )}
        </div>}

      </div>

      {/* Footer action */}
      {!isSpectator && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {view.you.isHost ? (
            <>
              <Btn variant={held ? 'primary' : 'ghost'} disabled={!held} onClick={advance}>
                {held ? "Everyone's seen it — start clues" : 'Reveal your card first'}
              </Btn>
              {error && (
                <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--red)', textAlign: 'center' }}>
                  {error}
                </p>
              )}
            </>
          ) : (
            <Btn variant="ghost" disabled style={{ pointerEvents: 'none' }}>
              {held ? 'Waiting for host to start clues…' : 'Reveal your card first'}
            </Btn>
          )}
        </div>
      )}
    </div>
  );
}
