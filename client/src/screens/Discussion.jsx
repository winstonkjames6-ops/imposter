import { useEffect, useState } from "react";
import { socket } from "../socket.js";
import { Btn, TopBar, PlayerBadge, MenuOverlay, MenuTrigger } from "./ui.jsx";

export default function Discussion({ view, onLeave }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { allClues, discussionEndsAt } = view;

  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((discussionEndsAt - Date.now()) / 1000))
  );

  useEffect(() => {
    const tick = () => {
      const remaining = Math.ceil((discussionEndsAt - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    };
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [discussionEndsAt]);

  const timerColor = secondsLeft <= 10 ? 'var(--red)' : secondsLeft <= 20 ? '#E8A838' : 'var(--text)';
  const multiRound = (allClues?.length ?? 0) > 1;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      padding: '56px 22px 34px',
    }}>
      <TopBar title="Discussion" right={<MenuTrigger onClick={() => setMenuOpen(true)} />} />
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

      {/* Countdown */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 72,
          color: timerColor, lineHeight: 1,
          transition: 'color 0.3s',
        }}>
          {secondsLeft}
        </div>
        <div style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: 14,
          color: 'var(--muted)', marginTop: 4,
        }}>
          seconds to discuss
        </div>
      </div>

      {/* Clue list — grouped by round when multiple rounds exist */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }} className="no-scrollbar">
        {(allClues ?? []).map(({ round, entries }) => (
          <div key={round}>
            <div style={{
              fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 12.5,
              letterSpacing: 1, color: 'var(--faint)', marginBottom: 8,
            }}>
              {multiRound ? `ROUND ${round} CLUES` : 'CLUES SUBMITTED'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {entries.map(entry => (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 16, padding: '10px 14px',
                }}>
                  <PlayerBadge name={entry.name} color={entry.color} size={44} character={entry.character} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--display-font)', fontWeight: 600,
                      fontSize: 16, color: 'var(--text)',
                    }}>
                      {entry.name}
                      {entry.id === view.you.id && (
                        <span style={{ color: 'var(--faint)', fontSize: 13 }}> (you)</span>
                      )}
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
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {view.you.isHost && (
        <div style={{ paddingTop: 14 }}>
          <Btn variant="secondary" onClick={() => socket.emit("game:advance")}>
            Skip to vote
          </Btn>
        </div>
      )}
    </div>
  );
}
