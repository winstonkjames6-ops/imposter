import { useState } from "react";
import { socket } from "../socket.js";

export default function Clues({ view }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const { clueData, role } = view;

  function submit(e) {
    e.preventDefault();
    socket.emit("clue:submit", { text }, (res) => {
      if (!res.ok) setError(res.error);
    });
  }

  const remaining = (clueData?.total ?? 0) - (clueData?.submitted ?? 0);

  return (
    <div className="space-y-6">
      <header className="text-center space-y-1">
        <p className="text-slate-400 text-sm">Clue Phase · {role?.category}</p>
        {role?.isImposter ? (
          <p className="text-red-400 text-xl font-semibold">You're the imposter</p>
        ) : (
          <p className="text-glow text-xl font-semibold">{role?.word}</p>
        )}
        <p className="text-slate-500 text-sm">
          Give one clue about the {role?.isImposter ? "category" : "word"} without saying it directly
        </p>
      </header>

      {clueData?.youSubmitted ? (
        <div className="bg-panel border border-line rounded-2xl p-6 text-center space-y-3">
          <p className="text-emerald-400 font-semibold">Clue submitted!</p>
          <p className="text-slate-400 text-sm">
            {remaining > 0
              ? `Waiting for ${remaining} more player${remaining !== 1 ? "s" : ""}…`
              : "All clues in — moving to voting…"}
          </p>
          <div className="flex gap-1.5 justify-center pt-1">
            {Array.from({ length: clueData.total }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i < clueData.submitted ? "bg-emerald-400" : "bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input
            autoFocus
            type="text"
            maxLength={50}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Your clue…"
            className="w-full bg-panel border border-line rounded-lg px-4 py-3 text-center text-lg focus:border-glow focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-full bg-glow text-ink font-semibold rounded-lg py-3 disabled:opacity-40 transition-opacity"
          >
            Submit clue
          </button>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </form>
      )}

      <p className="text-slate-600 text-xs text-center">
        {clueData?.submitted} / {clueData?.total} submitted
      </p>
    </div>
  );
}
