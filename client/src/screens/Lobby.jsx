import { useState } from "react";
import { socket } from "../socket.js";

export default function Lobby({ view }) {
  const [error, setError] = useState(null);

  function start() {
    socket.emit("game:start", {}, (res) => {
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <header className="text-center">
        <p className="text-slate-400 text-sm">Room code</p>
        <p className="text-5xl font-bold tracking-[0.3em] text-glow">
          {view.roomCode}
        </p>
      </header>

      <ul className="space-y-2">
        {view.players.map((p) => (
          <li
            key={p.name}
            className="flex items-center justify-between bg-panel border border-line rounded-lg px-4 py-3"
          >
            <span className={p.connected ? "" : "text-slate-500 line-through"}>
              {p.name} {p.isHost && <span className="text-glow text-xs ml-1">HOST</span>}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                p.connected ? "bg-emerald-400" : "bg-slate-600"
              }`}
            />
          </li>
        ))}
      </ul>

      {view.you.isHost ? (
        <button
          onClick={start}
          className="w-full bg-glow text-ink font-semibold rounded-lg py-3"
        >
          Start game ({view.players.length} players)
        </button>
      ) : (
        <p className="text-center text-slate-400 text-sm animate-pulse">
          Waiting for the host to start…
        </p>
      )}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  );
}
