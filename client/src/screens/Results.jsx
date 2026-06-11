import { useState } from "react";
import { socket } from "../socket.js";
import { TopBar, Chip, PlayerBadge, Btn, MenuOverlay, MenuTrigger } from "./ui.jsx";

export default function Results({ view, onLeave }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { clueData, voteResults, imposterId, role } = view;

  const sortedVotes = voteResults
    ? [...voteResults].sort((a, b) => b.votes - a.votes)
    : [];

  const topVoted = sortedVotes[0];
  const caughtRight = topVoted?.id === imposterId;
  const imposterName = voteResults?.find(p => p.id === imposterId)?.name ?? 'Unknown';

  return (
    <div style={{
      position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh',
      padding: '56px 22px 34px',
    }}>
      <div style={{ position: 'absolute', top: 14, right: 22 }}>
        <MenuTrigger onClick={() => setMenuOpen(true)} />
      </div>
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} isHost={view.you.isHost} onRestart={() => socket.emit('game:reset')} onLeave={onLeave} players={view.players} myId={view.you.id} />
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 12.5,
          letterSpacing: 2, color: 'var(--faint)',
        }}>
          RESULTS
        </div>
        <h2 style={{
          fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 40,
          letterSpacing: -0.5, textTransform: 'uppercase', lineHeight: 0.95,
          color: caughtRight ? 'var(--green)' : 'var(--red)',
          margin: '4px 0 0',
        }}>
          {caughtRight ? 'Imposter caught!' : 'Imposter got away!'}
        </h2>
      </div>

      {/* Imposter reveal card */}
      <div style={{
        textAlign: 'center',
        background: 'linear-gradient(160deg, rgba(255,77,109,0.12), var(--surface))',
        border: '1px solid rgba(255,77,109,0.28)',
        borderRadius: 24, padding: '20px 16px 22px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <PlayerBadge name={imposterName} size={80} />
        </div>
        <div style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 12.5,
          letterSpacing: 1, color: 'var(--faint)',
        }}>
          THE IMPOSTER WAS
        </div>
        <div style={{
          fontFamily: 'var(--display-font)', fontWeight: 700,
          fontSize: 30, color: 'var(--red)',
        }}>
          {imposterName}
        </div>
        <div style={{ height: 1, background: 'var(--border)', margin: '14px 30px' }} />
        <div style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 12.5,
          letterSpacing: 1, color: 'var(--faint)',
        }}>
          THE SECRET WORD
        </div>
        <div style={{
          fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 26, color: 'var(--text)',
        }}>
          {role?.word}{' '}
          <span style={{ color: 'var(--faint)', fontSize: 16, fontWeight: 500 }}>
            · {role?.category}
          </span>
        </div>
      </div>

      {/* Vote tallies + clues */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }} className="no-scrollbar">
        {sortedVotes.map(p => {
          const clue = clueData?.find(c => c.id === p.id)?.clue;
          const isImposter = p.id === imposterId;
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 13,
              background: isImposter ? 'rgba(255,77,109,0.1)' : 'var(--surface)',
              border: `1px solid ${isImposter ? 'rgba(255,77,109,0.3)' : 'var(--border)'}`,
              borderRadius: 16, padding: '10px 14px',
            }}>
              <PlayerBadge name={p.name} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--display-font)', fontWeight: 600,
                  fontSize: 16, color: 'var(--text)',
                }}>
                  {p.name}
                  {isImposter && (
                    <span style={{
                      color: 'var(--red)', fontSize: 11, fontWeight: 700,
                      marginLeft: 7, letterSpacing: 1,
                    }}>
                      IMPOSTER
                    </span>
                  )}
                </div>
                {clue ? (
                  <div style={{
                    fontFamily: 'Nunito, sans-serif', fontWeight: 700,
                    fontSize: 12.5, color: 'var(--faint)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {clue}
                  </div>
                ) : (
                  <div style={{
                    fontFamily: 'Nunito, sans-serif', fontWeight: 700,
                    fontSize: 12.5, color: 'var(--faint)', fontStyle: 'italic',
                  }}>
                    no clue
                  </div>
                )}
              </div>
              <Chip tone={p.votes > 0 ? 'accent' : 'default'}>
                {p.votes} {p.votes === 1 ? 'vote' : 'votes'}
              </Chip>
            </div>
          );
        })}
      </div>
      <div style={{ paddingTop: 4 }}>
        {view.you.isHost ? (
          <Btn onClick={() => socket.emit("game:reset")}>
            Play again
          </Btn>
        ) : (
          <p style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 14,
            color: 'var(--faint)', textAlign: 'center', margin: 0,
          }}>
            Waiting for host to restart…
          </p>
        )}
      </div>
    </div>
  );
}
