import { useState } from "react";
import { socket } from "../socket.js";

// Tap-to-reveal so nobody shoulder-surfs your role.
// The server filtered view.role for this player — the imposter's browser
// never received the word, so there is nothing here to leak.
export default function Reveal({ view }) {
  const [shown, setShown] = useState(false);
  const [error, setError] = useState(null);
  const { role } = view;

  function advance() {
    socket.emit("game:advance", {}, (res) => {
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-6 text-center">
      <p className="text-slate-400 text-sm">Category</p>
      <p className="text-2xl font-semibold">{role.category}</p>

      <button
        onClick={() => setShown(s => !s)}
        className="w-full bg-panel border border-line rounded-2xl py-16 hover:border-glow transition-colors"
      >
        {!shown ? (
          <span className="text-slate-400">Tap to reveal your card</span>
        ) : role.isImposter ? (
          <span className="text-red-400 text-3xl font-bold">You're the imposter</span>
        ) : (
          <span className="text-glow text-3xl font-bold">{role.word}</span>
        )}
      </button>

      {view.you.isHost ? (
        <div className="space-y-2">
          <button
            onClick={advance}
            className="w-full bg-glow text-ink font-semibold rounded-lg py-3"
          >
            Everyone's seen it — start clues
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      ) : (
        <p className="text-slate-500 text-sm animate-pulse">
          Waiting for the host to start clues…
        </p>
      )}
    </div>
  );
}
