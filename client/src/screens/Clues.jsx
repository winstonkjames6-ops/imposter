import { useState } from "react";
import { socket } from "../socket.js";
import { Btn, Chip, TopBar, PlayerBadge, MenuOverlay, MenuTrigger } from "./ui.jsx";

export default function Clues({ view, onLeave }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { clueData, role, players } = view;

  function submit(e) {
    e.preventDefault();
    socket.emit("clue:submit", { text }, (res) => {
      if (!res.ok) setError(res.error);
      else setError(null);
    });
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      padding: '56px 22px 34px',
    }}>
      <TopBar
        title="Clue phase"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Chip tone="accent">{role?.category}</Chip>
            <MenuTrigger onClick={() => setMenuOpen(true)} />
          </div>
        }
      />
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} isHost={view.you.isHost} onRestart={() => socket.emit('game:reset')} onLeave={onLeave} players={view.players} myId={view.you.id} />
      {view.you.isSpectator && (
        <div style={{
          background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.3)',
          borderRadius: 12, padding: '8px 14px', marginBottom: 16,
          fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13.5,
          color: 'var(--accent2)', textAlign: 'center',
        }}>
          You're watching
        </div>
      )}

      {!view.you.isSpectator && (
        <>
          {/* Role reminder */}
          <div style={{
            textAlign: 'center',
            background: role?.isImposter ? 'rgba(255,77,109,0.08)' : 'var(--surface)',
            border: `1px solid ${role?.isImposter ? 'rgba(255,77,109,0.3)' : 'var(--border)'}`,
            borderRadius: 22, padding: '18px 16px', marginBottom: 22,
          }}>
            <div style={{
              fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 12.5,
              letterSpacing: 1, color: 'var(--faint)',
            }}>
              {role?.isImposter ? 'YOU ARE THE IMPOSTER' : 'CATEGORY'}
            </div>
            <div style={{
              fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 32,
              color: role?.isImposter ? 'var(--red)' : 'var(--text)', marginTop: 4,
            }}>
              {role?.isImposter ? 'Wing it 🎭' : role?.category}
            </div>
            <div style={{
              fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: 13.5,
              color: 'var(--muted)', marginTop: 6,
            }}>
              Give one clue — don't say the word itself.
            </div>
          </div>

          {/* Clue input or submitted confirmation */}
          {!clueData?.youSubmitted ? (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
              <input
                autoFocus
                type="text"
                maxLength={50}
                value={text}
                onChange={e => { setText(e.target.value); setError(null); }}
                placeholder="Your one-word clue…"
                style={{
                  borderRadius: 16, fontFamily: 'var(--display-font)', fontWeight: 500,
                  fontSize: 19, padding: '17px 18px', textAlign: 'center', width: '100%',
                }}
              />
              <Btn variant="primary" disabled={!text.trim()} onClick={submit}>
                Submit clue
              </Btn>
              {error && (
                <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--red)', textAlign: 'center' }}>
                  {error}
                </p>
              )}
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'rgba(60,224,160,0.1)',
                border: '1px solid rgba(60,224,160,0.3)', borderRadius: 16, padding: 16,
              }}>
                <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'var(--green)' }}>
                  ✓ Clue submitted
                </span>
              </div>
              {view.you.isHost && (
                <Btn variant="secondary" onClick={() => socket.emit("clue:skip")}>
                  Skip waiting players
                </Btn>
              )}
            </div>
          )}
        </>
      )}

      {/* Players header */}
      <div style={{
        fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 12.5,
        letterSpacing: 1, color: 'var(--faint)', margin: '16px 0 10px',
      }}>
        SUBMITTED {clueData?.submitted ?? 0}/{players.filter(p => !p.isSpectator).length}
      </div>

      {/* Player list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }} className="no-scrollbar">
        {players.map((p, i) => {
          const isYou = p.name === view.you.name;
          const submitted = isYou ? clueData?.youSubmitted : false;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '10px 14px',
            }}>
              <PlayerBadge name={p.name} size={40} />
              <span style={{
                flex: 1, fontFamily: 'var(--display-font)', fontWeight: 600,
                fontSize: 16, color: p.connected ? 'var(--text)' : 'var(--faint)',
              }}>
                {p.name}
                {isYou && <span style={{ color: 'var(--faint)', fontSize: 13 }}> (you)</span>}
              </span>
              {submitted ? (
                <Chip tone="green">✓ In</Chip>
              ) : (
                <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--faint)' }}>
                  {p.connected ? 'thinking…' : 'away'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
