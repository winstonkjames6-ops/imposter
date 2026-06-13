import { useState } from "react";
import { socket } from "../socket.js";
import { Btn, TopBar, PlayerBadge, MenuOverlay, MenuTrigger } from "./ui.jsx";

export default function ClueReview({ view, onLeave }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { allClues, currentClueRound, totalClueRounds } = view;

  const lastRound = allClues[allClues.length - 1];
  const entries = lastRound?.entries ?? [];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      padding: '56px 22px 34px',
    }}>
      <TopBar
        title={`Round ${currentClueRound} clues`}
        right={<MenuTrigger onClick={() => setMenuOpen(true)} />}
      />
      <MenuOverlay
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        isHost={view.you.isHost}
        onRestart={() => socket.emit('game:reset')}
        onLeave={onLeave}
        players={view.players}
        myId={view.you.id}
      />

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

      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 10,
      }} className="no-scrollbar">
        {entries.map((p, i) => (
          <div key={p.id ?? i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '12px 14px',
          }}>
            <PlayerBadge name={p.name} color={p.color} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--display-font)', fontWeight: 600,
                fontSize: 16, color: 'var(--text)',
              }}>
                {p.name}
                {p.id === view.you.id && (
                  <span style={{ color: 'var(--faint)', fontSize: 13 }}> (you)</span>
                )}
              </div>
              <div style={{
                fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 14,
                color: p.clue ? 'var(--text)' : 'var(--faint)',
                fontStyle: p.clue ? 'normal' : 'italic',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                marginTop: 2,
              }}>
                {p.clue || 'no clue'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ paddingTop: 16 }}>
        {view.you.isHost ? (
          <Btn variant="primary" onClick={() => socket.emit('game:advance')}>
            Next round →
          </Btn>
        ) : (
          <p style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 14,
            color: 'var(--faint)', textAlign: 'center', margin: 0,
          }}>
            Waiting for host to start round {currentClueRound + 1}…
          </p>
        )}
      </div>
    </div>
  );
}
