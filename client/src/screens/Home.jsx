import { useState } from "react";
import { socket, saveSeat } from "../socket.js";

export default function Home() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);

  function create() {
    socket.emit("room:create", { name }, (res) => {
      if (!res.ok) return setError(res.error);
      saveSeat(res.roomCode, res.token);
      // No navigation needed — the server's first game:view will
      // arrive and App.jsx will render the lobby.
    });
  }

  function join() {
    socket.emit("room:join", { roomCode: code, name }, (res) => {
      if (!res.ok) return setError(res.error);
      saveSeat(res.roomCode, res.token);
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Imposter</h1>
        <p className="text-slate-400 text-sm mt-1">
          Everyone gets the word. One of you doesn't.
        </p>
      </header>

      <input
        className="w-full bg-panel border border-line rounded-lg px-4 py-3 outline-none focus:border-glow"
        placeholder="Your name"
        maxLength={16}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        onClick={create}
        disabled={!name.trim()}
        className="w-full bg-glow text-ink font-semibold rounded-lg py-3 disabled:opacity-40"
      >
        Create room
      </button>

      <div className="flex gap-2">
        <input
          className="flex-1 bg-panel border border-line rounded-lg px-4 py-3 uppercase tracking-widest outline-none focus:border-glow"
          placeholder="CODE"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <button
          onClick={join}
          disabled={!name.trim() || code.length !== 4}
          className="px-6 border border-line rounded-lg disabled:opacity-40 hover:border-glow"
        >
          Join
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
