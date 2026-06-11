import { useState } from "react";
import { socket } from "../socket.js";

export default function Voting({ view }) {
  const [error, setError] = useState(null);
  const { clueData, youVoted } = view;

  function vote(targetId) {
    socket.emit("vote:cast", { targetId }, (res) => {
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <header className="text-center space-y-1">
        <p className="text-slate-400 text-sm">Voting Phase</p>
        <p className="text-xl font-semibold">Who's the imposter?</p>
        {!youVoted && (
          <p className="text-slate-500 text-sm">Tap a name to cast your vote</p>
        )}
      </header>

      <ul className="space-y-2">
        {clueData?.map(entry => {
          const isYou = entry.id === view.you.id;
          return (
            <li
              key={entry.id}
              className="bg-panel border border-line rounded-lg px-4 py-3 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium truncate">
                  {entry.name}
                  {isYou && (
                    <span className="text-slate-500 text-xs ml-2">(you)</span>
                  )}
                </span>
                {!youVoted && !isYou && (
                  <button
                    onClick={() => vote(entry.id)}
                    className="shrink-0 text-xs bg-line hover:bg-glow hover:text-ink px-3 py-1 rounded-full transition-colors"
                  >
                    Vote
                  </button>
                )}
              </div>
              {entry.clue ? (
                <p className="text-glow text-sm">{entry.clue}</p>
              ) : (
                <p className="text-slate-600 text-sm italic">no clue submitted</p>
              )}
            </li>
          );
        })}
      </ul>

      {youVoted && (
        <p className="text-center text-slate-400 text-sm animate-pulse">
          Vote cast — waiting for others…
        </p>
      )}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  );
}
