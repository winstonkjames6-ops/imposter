import { useState } from "react";
import { socket } from "../socket.js";
import { Btn, Chip, TopBar, PlayerBadge, MenuOverlay, MenuTrigger } from "./ui.jsx";

export default function Lobby({ view, onLeave }) {
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [packChoice, setPackChoice] = useState('random');
  const [customText, setCustomText] = useState('');
  const [packError, setPackError] = useState(null);
  const [roundsVal, setRoundsVal] = useState(String(view.totalClueRounds ?? 1));

  function emitRounds(n) {
    const clamped = Math.min(3, Math.max(1, n));
    setRoundsVal(String(clamped));
    socket.emit('room:set-rounds', { rounds: clamped });
  }

  function start() {
    socket.emit("game:start", {}, (res) => {
      if (!res.ok) setError(res.error);
    });
  }

  function copyCode() {
    navigator.clipboard?.writeText(view.roomCode).catch(() => {});
  }

  function openPackSheet() {
    const n = view.packName ?? 'Random';
    setPackChoice(n === 'Random' ? 'random' : n === 'Custom' ? 'custom' : n);
    setPackError(null);
    setPackOpen(true);
  }

  function savePack() {
    setPackError(null);
    if (packChoice === 'random') {
      socket.emit('room:set-pack', { type: 'random' }, res => {
        if (res.ok) setPackOpen(false); else setPackError(res.error);
      });
    } else if (['Food', 'Sports', 'Places'].includes(packChoice)) {
      socket.emit('room:set-pack', { type: 'builtin', category: packChoice }, res => {
        if (res.ok) setPackOpen(false); else setPackError(res.error);
      });
    } else {
      const words = [...new Set(customText.split(',').map(w => w.trim()).filter(w => w.length >= 2))];
      if (words.length < 4) { setPackError('Enter at least 4 words (min 2 chars each).'); return; }
      socket.emit('room:set-pack', { type: 'custom', words }, res => {
        if (res.ok) setPackOpen(false); else setPackError(res.error);
      });
    }
  }

  const activePlayers = view.players.filter(p => !p.isSpectator);
  const spectators = view.players.filter(p => p.isSpectator);
  const slots = [...activePlayers];
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
        PLAYERS · {activePlayers.length}
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
                <PlayerBadge name={p.name} color={p.color} size={64} />
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

      {/* Spectators */}
      {spectators.length > 0 && (
        <>
          <div style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 12.5,
            letterSpacing: 1, color: 'var(--faint)', margin: '16px 0 8px',
          }}>
            SPECTATORS · {spectators.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {spectators.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '10px 14px',
              }}>
                <PlayerBadge name={p.name} color={p.color} size={36} />
                <span style={{
                  flex: 1, fontFamily: 'var(--display-font)', fontWeight: 600,
                  fontSize: 15, color: p.connected ? 'var(--muted)' : 'var(--faint)',
                }}>
                  {p.name}
                  {p.name === view.you.name && (
                    <span style={{ color: 'var(--faint)', fontSize: 13 }}> (you)</span>
                  )}
                </span>
                {view.you.isHost ? (
                  <button
                    onClick={() => socket.emit('player:accept-join', { id: p.id })}
                    style={{
                      background: 'var(--accent)', border: 'none', borderRadius: 999,
                      padding: '5px 13px', fontFamily: 'inherit', fontWeight: 700,
                      fontSize: 12, letterSpacing: '0.05em', color: '#fff',
                      cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Allow
                  </button>
                ) : (
                  <span style={{
                    fontFamily: 'Nunito, sans-serif', fontWeight: 700,
                    fontSize: 11.5, letterSpacing: 0.5, color: 'var(--faint)',
                  }}>
                    WATCHING
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ paddingTop: 16 }}>

        {/* Word Pack row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '11px 14px', marginBottom: 14,
        }}>
          <div>
            <div style={{
              fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 10.5,
              letterSpacing: 1, color: 'var(--faint)', marginBottom: 2,
            }}>
              WORD PACK
            </div>
            <div style={{
              fontFamily: 'var(--display-font)', fontWeight: 600,
              fontSize: 15, color: 'var(--text)',
            }}>
              {view.packName ?? 'Random'}
            </div>
          </div>
          {view.you.isHost && (
            <button
              onClick={openPackSheet}
              style={{
                background: 'none', border: 'none',
                boxShadow: 'inset 0 0 0 1px var(--line2)',
                borderRadius: 999, padding: '5px 13px',
                fontFamily: 'inherit', fontWeight: 700, fontSize: 12,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--muted)', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Edit
            </button>
          )}
        </div>

        {/* Rounds row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '11px 14px', marginBottom: 14,
        }}>
          <div>
            <div style={{
              fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 10.5,
              letterSpacing: 1, color: 'var(--faint)', marginBottom: 2,
            }}>
              CLUE ROUNDS
            </div>
            <div style={{
              fontFamily: 'var(--display-font)', fontWeight: 600,
              fontSize: 15, color: 'var(--text)',
            }}>
              {view.totalClueRounds ?? 1} {(view.totalClueRounds ?? 1) === 1 ? 'clue round' : 'clue rounds'}
            </div>
          </div>
          {view.you.isHost && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => emitRounds(parseInt(roundsVal) - 1)}
                disabled={parseInt(roundsVal) <= 1}
                style={{
                  width: 34, height: 34, borderRadius: '50%', border: 'none',
                  background: 'var(--surface2)', color: 'var(--muted)',
                  fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 20,
                  lineHeight: 1, cursor: 'pointer', flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                  opacity: parseInt(roundsVal) <= 1 ? 0.35 : 1,
                }}
              >
                −
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={roundsVal}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setRoundsVal(raw);
                  const n = parseInt(raw);
                  if (!isNaN(n) && n >= 1 && n <= 3) {
                    socket.emit('room:set-rounds', { rounds: n });
                  }
                }}
                onBlur={() => {
                  const n = parseInt(roundsVal);
                  emitRounds(isNaN(n) ? 3 : n);
                }}
                style={{
                  width: 42, textAlign: 'center', border: '1px solid var(--border)',
                  borderRadius: 10, background: 'var(--surface2)',
                  fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 17,
                  color: 'var(--text)', padding: '4px 0', outline: 'none',
                }}
              />
              <button
                onClick={() => emitRounds(parseInt(roundsVal) + 1)}
                disabled={parseInt(roundsVal) >= 3}
                style={{
                  width: 34, height: 34, borderRadius: '50%', border: 'none',
                  background: 'var(--surface2)', color: 'var(--muted)',
                  fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 20,
                  lineHeight: 1, cursor: 'pointer', flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                  opacity: parseInt(roundsVal) >= 3 ? 0.35 : 1,
                }}
              >
                +
              </button>
            </div>
          )}
        </div>

        {view.you.isHost && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14, padding: '0 2px',
          }}>
            <span style={{
              fontFamily: 'Nunito, sans-serif', fontWeight: 700,
              fontSize: 14, color: 'var(--muted)',
            }}>
              Auto-join next game
            </span>
            <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 27, cursor: 'pointer', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={!!view.autoAccept}
                onChange={e => socket.emit('room:set-auto-accept', { value: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
              />
              <span style={{
                position: 'absolute', inset: 0, borderRadius: 27,
                background: view.autoAccept ? 'var(--accent)' : 'var(--border)',
                transition: 'background .15s',
              }} />
              <span style={{
                position: 'absolute', top: 3,
                left: view.autoAccept ? 'calc(100% - 24px)' : 3,
                width: 21, height: 21, borderRadius: '50%', background: '#fff',
                transition: 'left .15s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              }} />
            </label>
          </div>
        )}
        {view.you.isHost ? (
          <>
            <Btn
              variant="green"
              disabled={activePlayers.length < 3}
              onClick={start}
            >
              Start game · {activePlayers.length} players
            </Btn>
            {activePlayers.length < 3 && (
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
      {/* Pack picker bottom sheet */}
      {packOpen && (
        <>
          <div
            onClick={() => setPackOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.6)' }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
            background: 'var(--paper)', borderRadius: '26px 26px 0 0',
            padding: '14px 22px 40px', boxShadow: '0 -20px 50px -20px rgba(0,0,0,.4)',
            maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--line2)', margin: '0 auto 16px' }} />
            <div style={{
              fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 11.5,
              letterSpacing: '1.8px', textTransform: 'uppercase',
              color: 'var(--muted)', marginBottom: 14,
            }}>
              Word Pack
            </div>

            {['random', 'Food', 'Sports', 'Places', 'custom'].map((opt, i, arr) => {
              const label = opt === 'random' ? 'Random' : opt === 'custom' ? 'Custom' : opt;
              const sel = packChoice === opt;
              return (
                <div key={opt}>
                  <button
                    onClick={() => setPackChoice(opt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      width: '100%', background: 'none', border: 'none',
                      padding: '13px 2px', cursor: 'pointer', textAlign: 'left',
                      borderBottom: (opt !== 'custom' || !sel) && i < arr.length - 1
                        ? '1px solid var(--line)' : 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      border: sel ? 'none' : '2px solid var(--border)',
                      background: sel ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {sel && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </span>
                    <span style={{
                      fontFamily: 'var(--display-font)', fontWeight: 600,
                      fontSize: 16, color: 'var(--ink)',
                    }}>
                      {label}
                    </span>
                  </button>

                  {opt === 'custom' && sel && (
                    <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
                      <textarea
                        value={customText}
                        onChange={e => { setCustomText(e.target.value); setPackError(null); }}
                        placeholder="word1, word2, word3, word4…"
                        rows={3}
                        style={{
                          width: '100%', borderRadius: 12, padding: '12px 14px',
                          fontFamily: 'inherit', fontSize: 15, fontWeight: 500,
                          resize: 'vertical', lineHeight: 1.5,
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          color: 'var(--text)', outline: 'none',
                        }}
                      />
                      <p style={{
                        fontFamily: 'Nunito, sans-serif', fontSize: 12.5,
                        color: 'var(--faint)', margin: '4px 2px 0',
                      }}>
                        Separate words with commas. Minimum 4 words, 2 chars each.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {packError && (
              <p style={{
                fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13,
                color: 'var(--red)', margin: '12px 2px 0',
              }}>
                {packError}
              </p>
            )}

            <div style={{ marginTop: 18 }}>
              <Btn variant="primary" onClick={savePack}>Save</Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
