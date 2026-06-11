// Placeholder for the phases you'll build: clues, voting, results.
export default function StubPhase({ view, name }) {
  return (
    <div className="text-center space-y-3">
      <h2 className="text-2xl font-bold">{name}</h2>
      <p className="text-slate-400">
        Not implemented yet. Server phase: <code>{view.phase}</code>
      </p>
    </div>
  );
}
