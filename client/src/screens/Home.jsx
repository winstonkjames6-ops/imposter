import { useState } from "react";
import { socket, saveSeat } from "../socket.js";
import { Btn } from "./ui.jsx";

export default function Home() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

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

        {error && (
          <p style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 14,
            color: 'var(--red)', textAlign: 'center', margin: 0,
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
