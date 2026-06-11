import { useState } from "react";
import { socket } from "../socket.js";
import { Btn, Chip, TopBar, PlayerBadge, MenuOverlay, MenuTrigger } from "./ui.jsx";

export default function Lobby({ view, onLeave }) {
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function start() {
    socket.emit("game:start", {}, (res) => {
      if (!res.ok) setError(res.error);
    });
  }

  function copyCode() {
    navigator.clipboard?.writeText(view.roomCode).catch(() => {});
  }

  const slots = [...view.players];
  while (slots.length < 6) slots.push(null);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      padding: '56px 22px 34px',
    }}>
      <TopBar
        title="Game lobby"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Chip tone="green">● Live</Chip>
            <MenuTrigger onClick={() => setMenuOpen(true)} />
          </div>
        }
      />
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} isHost={view.you.isHost} onRestart={() => socket.emit('game:reset')} onLeave={onLeave} players={view.players} myId={view.you.id} />

      {/* Room code */}
      <button
        onClick={copyCode}
        style={{
          textAlign: 'center', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 22,
          padding: '16px', marginBottom: 20, cursor: 'pointer', width: '100%',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 12.5,
          letterSpacing: 1.5, color: 'var(--faint)',
        }}>
          ROOM CODE
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 8 }}>
          {view.roomCode.split('').map((ch, i) => (
            <span key={i} style={{
              fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 38,
              color: 'var(--text)', width: 50, height: 60, lineHeight: '60px',
              borderRadius: 14, background: 'var(--surface2)',
              border: '1px solid var(--border)', display: 'inline-block', textAlign: 'center',
            }}>
              {ch}
            </span>
          ))}
        </div>
        <div style={{
          marginTop: 12, fontFamily: 'Nunito, sans-serif', fontWeight: 700,
          fontSize: 13.5, color: 'var(--accent2)',
        }}>
          Tap to copy &amp; share
        </div>
      </button>

      {/* Players header */}
      <div style={{
        fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 12.5,
        letterSpacing: 1, color: 'var(--faint)', marginBottom: 10,
      }}>
        PLAYERS · {view.players.length}
      </div>

      {/* Player grid */}
      <div style={{ flex: 1, overflowY: 'auto', margin: '0 -4px', padding: '0 4px' }} className="no-scrollbar">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {slots.map((p, i) => p ? (
            <div key={i} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '16px 12px 13px',
              textAlign: 'center', position: 'relative',
            }}>
              {p.isHost && (
                <span style={{ position: 'absolute', top: 9, right: 9 }}>
                  <Chip tone="gold" style={{ padding: '3px 8px', fontSize: 10.5 }}>HOST</Chip>
                </span>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <PlayerBadge name={p.name} size={64} />
              </div>
              <div style={{
                fontFamily: 'var(--display-font)', fontWeight: 600, fontSize: 16,
                color: p.connected ? 'var(--text)' : 'var(--faint)',
                textDecoration: p.connected ? 'none' : 'line-through',
              }}>
                {p.name}
                {p.name === view.you.name && (
                  <span style={{ color: 'var(--faint)', fontSize: 13 }}> (you)</span>
                )}
              </div>
              {!p.connected && (
                <div style={{
                  fontFamily: 'Nunito, sans-serif', fontSize: 11,
                  color: 'var(--faint)', marginTop: 2,
                }}>
                  away
                </div>
              )}
            </div>
          ) : (
            <div key={i} style={{
              border: '2px dashed var(--border)', borderRadius: 20, minHeight: 130,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13,
              color: 'var(--faint)',
            }}>
              Waiting…
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ paddingTop: 16 }}>
        {view.you.isHost ? (
          <>
            <Btn
              variant="green"
              disabled={view.players.length < 3}
              onClick={start}
            >
              Start game · {view.players.length} players
            </Btn>
            {view.players.length < 3 && (
              <p style={{
                fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: 13,
                color: 'var(--faint)', textAlign: 'center', marginTop: 8,
              }}>
                Need at least 3 players to start
              </p>
            )}
          </>
        ) : (
          <p style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: 14,
            color: 'var(--muted)', textAlign: 'center', padding: '17px 0',
          }}>
            Waiting for the host to start…
          </p>
        )}
        {error && (
          <p style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13,
            color: 'var(--red)', textAlign: 'center', marginTop: 8,
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
