import { useState } from "react";
import { socket, saveSeat } from "../socket.js";
import { Btn } from "./ui.jsx";

const RULES = [
  { n: 1, text: "Everyone gets a secret word except the Imposter, who only knows the category." },
  { n: 2, text: "Each player gives a one-word clue about the word without saying it directly." },
  { n: 3, text: "After all clues are in, vote for who you think the Imposter is." },
  { n: 4, text: "If the group catches the Imposter, crew wins. If not, Imposter wins." },
];

function HowToPlay({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '64px 22px 48px',
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 18, right: 18,
          width: 44, height: 44, borderRadius: 14,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--text)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-label="Close"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" />
        </svg>
      </button>

      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 13,
          letterSpacing: 3, color: 'var(--accent2)', marginBottom: 8, textTransform: 'uppercase',
        }}>
          How to play
        </div>
        <h2 style={{
          fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 42,
          letterSpacing: -0.5, textTransform: 'uppercase', lineHeight: 0.95,
          color: 'var(--text)', margin: 0,
        }}>
          The rules
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {RULES.map(({ n, text }) => (
          <div key={n} style={{
            display: 'flex', alignItems: 'flex-start', gap: 16,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '16px 18px',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
              boxShadow: '0 6px 16px -8px var(--accent-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 16, color: '#fff',
            }}>
              {n}
            </div>
            <p style={{
              fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: 15.5,
              color: 'var(--muted)', margin: 0, lineHeight: 1.5,
            }}>
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [showRules, setShowRules] = useState(false);

  function create() {
    socket.emit("room:create", { name }, (res) => {
      if (!res.ok) return setError(res.error);
      saveSeat(res.roomCode, res.token);
    });
  }

  function join() {
    socket.emit("room:join", { roomCode: code, name }, (res) => {
      if (!res.ok) return setError(res.error);
      saveSeat(res.roomCode, res.token);
    });
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: '100vh', padding: '64px 22px 48px',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 13,
          letterSpacing: 3, color: 'var(--accent2)', marginBottom: 8, textTransform: 'uppercase',
        }}>
          Who's faking it?
        </div>
        <h1 style={{
          fontFamily: 'var(--display-font)', fontWeight: 700, fontSize: 72,
          lineHeight: 0.92, letterSpacing: -1, textTransform: 'uppercase',
          margin: 0, color: 'var(--text)', textShadow: '0 4px 0 rgba(0,0,0,0.25)',
        }}>
          <span style={{ color: 'var(--red)' }}>IM</span>POSTER
        </h1>
        <p style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: 15.5,
          color: 'var(--muted)', maxWidth: 270, margin: '16px auto 0', lineHeight: 1.5,
        }}>
          Everyone gets the secret word — except one. Drop one-word clues, sniff out the fake.
        </p>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && create()}
          placeholder="Your name"
          maxLength={16}
          autoFocus
          style={{
            borderRadius: 16, fontFamily: 'var(--display-font)', fontWeight: 500,
            fontSize: 19, padding: '17px 18px', textAlign: 'center', width: '100%',
          }}
        />

        <Btn variant="primary" disabled={!name.trim()} onClick={create}>
          Create a room
        </Btn>

        {!joining ? (
          <Btn variant="ghost" onClick={() => setJoining(true)}>
            Join with a code
          </Btn>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(null); }}
              onKeyDown={e => e.key === 'Enter' && name.trim() && code.length === 4 && join()}
              placeholder="CODE"
              maxLength={4}
              autoFocus
              style={{
                flex: 1, borderRadius: 16, fontFamily: 'var(--display-font)',
                fontWeight: 700, fontSize: 22, padding: '17px 12px',
                textAlign: 'center', letterSpacing: 6,
              }}
            />
            <Btn
              variant="primary"
              disabled={!name.trim() || code.length !== 4}
              onClick={join}
              full={false}
              style={{ flex: 1 }}
            >
              Join
            </Btn>
          </div>
        )}

        <Btn variant="ghost" onClick={() => setShowRules(true)}>
          How to play
        </Btn>

        {error && (
          <p style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 14,
            color: 'var(--red)', textAlign: 'center', margin: 0,
          }}>
            {error}
          </p>
        )}
      </div>
      {showRules && <HowToPlay onClose={() => setShowRules(false)} />}
    </div>
  );
}
