import { useState } from "react";
import { socket } from "../socket.js";
import { Btn, TopBar, PlayerBadge, MenuOverlay, MenuTrigger } from "./ui.jsx";

export default function Voting({ view, onLeave }) {
  const [localVote, setLocalVote] = useState(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { clueData, youVoted } = view;

  function lockVote() {
    if (!localVote) return;
    socket.emit("vote:cast", { targetId: localVote }, (res) => {
      if (!res.ok) return setError(res.error);
      setLocked(true);
    });
  }

  const alreadyVoted = youVoted || locked;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      padding: '56px 22px 34px',
    }}>
      <TopBar title="Voting phase" right={<MenuTrigger onClick={() => setMenuOpen(true)} />} />
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

      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <h2 style={{
          fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 30,
          color: 'var(--text)', margin: 0,
        }}>
          Who's the imposter?
        </h2>
        <p style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: 14.5,
          color: 'var(--muted)', margin: '6px 0 0',
        }}>
          {alreadyVoted ? 'Vote cast — waiting for others…' : 'Tap a player to select, then lock in'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }} className="no-scrollbar">
        {clueData?.map(entry => {
          const isYou = entry.id === view.you.id;
          const sel = localVote === entry.id;

          const rowContent = (
            <>
              <PlayerBadge name={entry.name} size={52} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--display-font)', fontWeight: 600,
                  fontSize: 18, color: 'var(--text)',
                }}>
                  {entry.name}
                  {isYou && <span style={{ color: 'var(--faint)', fontSize: 13 }}> (you)</span>}
                </div>
                {entry.clue ? (
                  <div style={{
                    fontFamily: 'Nunito, sans-serif', fontWeight: 700,
                    fontSize: 13.5, color: 'var(--muted)', marginTop: 2,
                  }}>
                    clue: <span style={{ color: 'var(--accent2)' }}>{entry.clue}</span>
                  </div>
                ) : (
                  <div style={{
                    fontFamily: 'Nunito, sans-serif', fontWeight: 700,
                    fontSize: 13.5, color: 'var(--faint)', marginTop: 2, fontStyle: 'italic',
                  }}>
                    no clue submitted
                  </div>
                )}
              </div>
              {!view.you.isSpectator && (
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  border: sel ? 'none' : '2px solid var(--border)',
                  background: sel ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .12s',
                }}>
                  {sel && (
                    <svg width="14" height="14" viewBox="0 0 16 16">
                      <path d="M3 8.5l3.2 3.2L13 4.5" stroke="#fff" strokeWidth="2.6"
                        fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              )}
            </>
          );

          const rowStyle = {
            display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
            background: sel
              ? 'color-mix(in srgb, var(--accent) 16%, var(--surface))'
              : 'var(--surface)',
            border: sel ? '2px solid var(--accent)' : '2px solid var(--border)',
            borderRadius: 20, padding: '12px 15px',
            opacity: isYou && !view.you.isSpectator ? 0.5 : 1,
            transition: 'all .12s',
            boxShadow: sel ? '0 10px 24px -10px var(--accent-glow)' : 'none',
            width: '100%',
          };

          if (view.you.isSpectator) {
            return <div key={entry.id} style={rowStyle}>{rowContent}</div>;
          }

          return (
            <button
              key={entry.id}
              disabled={isYou || alreadyVoted}
              onClick={() => !isYou && !alreadyVoted && setLocalVote(sel ? null : entry.id)}
              style={{
                ...rowStyle,
                cursor: isYou || alreadyVoted ? 'default' : 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {rowContent}
            </button>
          );
        })}
      </div>

      {!view.you.isSpectator && (
        <div style={{ paddingTop: 14 }}>
          <Btn
            variant="danger"
            disabled={!localVote || alreadyVoted}
            onClick={lockVote}
          >
            {alreadyVoted ? 'Vote locked in' : localVote ? 'Lock in vote' : 'Pick someone first'}
          </Btn>
          {error && (
            <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--red)', textAlign: 'center', marginTop: 8 }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
