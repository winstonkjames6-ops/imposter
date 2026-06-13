import { useState } from "react";
import { socket } from "../socket.js";
import { TopBar, Chip, PlayerBadge, Btn, MenuOverlay, MenuTrigger } from "./ui.jsx";

const RANK_COLORS = ['#E8A838', '#9B9BA8', '#C87533'];
const RANK_LABELS = ['1st', '2nd', '3rd'];

export default function Results({ view, onLeave }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { clueData, voteResults, imposterId, role } = view;
  const currentRound = view.currentRound ?? 1;
  const totalRounds = view.totalRounds ?? 1;
  const scores = view.scores ?? [];
  const isFinalRound = currentRound >= totalRounds;
  const isMultiRound = totalRounds > 1;

  const sortedVotes = voteResults ? [...voteResults].sort((a, b) => b.votes - a.votes) : [];
  const topVoted = sortedVotes[0];
  const caughtRight = topVoted?.id === imposterId;
  const imposterEntry = voteResults?.find(p => p.id === imposterId);
  const imposterName = imposterEntry?.name ?? 'Unknown';
  const imposterColor = imposterEntry?.color;

  return (
    <div style={{
      position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh',
      padding: '56px 22px 34px',
    }}>
      <div style={{ position: 'absolute', top: 14, right: 22 }}>
        <MenuTrigger onClick={() => setMenuOpen(true)} />
      </div>
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

      {/* Round + outcome header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 12.5,
          letterSpacing: 2, color: 'var(--faint)',
        }}>
          ROUND {currentRound} OF {totalRounds}
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
          <PlayerBadge name={imposterName} color={imposterColor} size={80} />
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

      {/* Scrollable section */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }} className="no-scrollbar">

        {/* Final standings podium — only on last round of a multi-round game */}
        {isFinalRound && isMultiRound && scores.length > 0 && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '14px 16px', marginBottom: 2,
          }}>
            <div style={{
              fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 12.5,
              letterSpacing: 1, color: 'var(--faint)', marginBottom: 12,
            }}>
              FINAL STANDINGS
            </div>
            {scores.slice(0, 3).map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                paddingTop: i > 0 ? 10 : 0, marginTop: i > 0 ? 10 : 0,
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 32, fontFamily: 'Nunito, sans-serif', fontWeight: 800,
                  fontSize: 15, color: RANK_COLORS[i] ?? 'var(--faint)',
                  textAlign: 'center', flexShrink: 0,
                }}>
                  {RANK_LABELS[i] ?? `${i + 1}`}
                </div>
                <PlayerBadge name={p.name} color={p.color} size={44} />
                <div style={{
                  flex: 1, fontFamily: 'var(--display-font)', fontWeight: 600,
                  fontSize: 16, color: 'var(--text)',
                }}>
                  {p.name}
                  {p.id === view.you.id && (
                    <span style={{ color: 'var(--faint)', fontSize: 13 }}> (you)</span>
                  )}
                </div>
                <div style={{
                  fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18,
                  color: RANK_COLORS[i] ?? 'var(--text)',
                }}>
                  {p.score} <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)' }}>pts</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mid-game standings — show between rounds */}
        {!isFinalRound && isMultiRound && scores.length > 0 && (
          <div style={{ marginBottom: 2 }}>
            <div style={{
              fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 12.5,
              letterSpacing: 1, color: 'var(--faint)', marginBottom: 8,
            }}>
              STANDINGS AFTER ROUND {currentRound}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scores.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '8px 13px',
                }}>
                  <span style={{
                    width: 20, fontFamily: 'Nunito, sans-serif', fontWeight: 800,
                    fontSize: 13, color: 'var(--faint)', textAlign: 'center', flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <PlayerBadge name={p.name} color={p.color} size={36} />
                  <span style={{
                    flex: 1, fontFamily: 'var(--display-font)', fontWeight: 600,
                    fontSize: 15, color: 'var(--text)',
                  }}>
                    {p.name}
                    {p.id === view.you.id && (
                      <span style={{ color: 'var(--faint)', fontSize: 12 }}> (you)</span>
                    )}
                  </span>
                  <span style={{
                    fontFamily: 'Nunito, sans-serif', fontWeight: 800,
                    fontSize: 16, color: 'var(--text)',
                  }}>
                    {p.score} <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)' }}>pts</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vote tallies + clues */}
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
              <PlayerBadge name={p.name} color={p.color} size={42} />
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

      {/* Footer */}
      <div style={{ paddingTop: 4 }}>
        {view.you.isHost ? (
          isFinalRound ? (
            <Btn onClick={() => socket.emit("game:reset")}>Play again</Btn>
          ) : (
            <Btn variant="primary" onClick={() => socket.emit("game:next-round")}>
              Next round · {currentRound + 1} of {totalRounds}
            </Btn>
          )
        ) : (
          <p style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 14,
            color: 'var(--faint)', textAlign: 'center', margin: 0,
          }}>
            {isFinalRound ? 'Waiting for host to restart…' : 'Waiting for next round…'}
          </p>
        )}
      </div>
    </div>
  );
}
