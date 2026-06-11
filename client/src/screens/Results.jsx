export default function Results({ view }) {
  const { clueData, voteResults, imposterId, role } = view;

  const sortedVotes = voteResults
    ? [...voteResults].sort((a, b) => b.votes - a.votes)
    : [];

  const topVoted = sortedVotes[0];
  const caughtRight = topVoted?.id === imposterId;
  const imposterName = voteResults?.find(p => p.id === imposterId)?.name ?? "Unknown";

  return (
    <div className="space-y-6">
      <header className="text-center space-y-1">
        <p className="text-slate-400 text-sm">Results</p>
        <p className={`text-2xl font-bold ${caughtRight ? "text-emerald-400" : "text-red-400"}`}>
          {caughtRight ? "Imposter caught!" : "Imposter got away!"}
        </p>
      </header>

      {/* Reveal card */}
      <div className="bg-panel border border-line rounded-2xl py-6 px-4 text-center space-y-3">
        <p className="text-slate-400 text-sm">The imposter was</p>
        <p className="text-3xl font-bold text-red-400">{imposterName}</p>
        <div className="border-t border-line pt-3 space-y-1">
          <p className="text-slate-400 text-sm">The secret word</p>
          <p className="text-2xl font-semibold text-glow">{role?.word}</p>
          <p className="text-slate-500 text-xs">{role?.category}</p>
        </div>
      </div>

      {/* Vote tallies + clues */}
      <ul className="space-y-2">
        {sortedVotes.map(p => {
          const clue = clueData?.find(c => c.id === p.id)?.clue;
          const isImposter = p.id === imposterId;
          return (
            <li
              key={p.id}
              className={`bg-panel border rounded-lg px-4 py-3 space-y-1 ${
                isImposter ? "border-red-400/40" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium truncate">
                  {p.name}
                  {isImposter && (
                    <span className="text-red-400 text-xs ml-2">IMPOSTER</span>
                  )}
                </span>
                <span className="shrink-0 text-glow text-sm font-semibold">
                  {p.votes} vote{p.votes !== 1 ? "s" : ""}
                </span>
              </div>
              {clue ? (
                <p className="text-slate-400 text-sm">{clue}</p>
              ) : (
                <p className="text-slate-600 text-sm italic">no clue</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
