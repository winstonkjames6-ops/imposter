import { useEffect, useState } from "react";
import { socket, loadSeat, clearSeat } from "./socket.js";
import Home from "./screens/Home.jsx";
import Lobby from "./screens/Lobby.jsx";
import Reveal from "./screens/Reveal.jsx";
import Clues from "./screens/Clues.jsx";
import Voting from "./screens/Voting.jsx";
import Results from "./screens/Results.jsx";

// DESIGN NOTE: no URL router here, on purpose. In a synced game the
// server's `phase` is the source of truth for what's on screen — if a
// player could change screens via the URL bar, their UI would lie about
// the game state. NQue routes by URL because it's a display app; a game
// routes by server state.

export default function App() {
  // `view` is the per-player snapshot the server sends us. We never
  // compute game state locally — we render whatever the server says.
  const [view, setView] = useState(null);
  const [reconnecting, setReconnecting] = useState(!!loadSeat());

  useEffect(() => {
    socket.on("game:view", setView);

    // On load: if we have a saved seat, try to reclaim it (refresh case).
    const seat = loadSeat();
    if (seat) {
      socket.emit("room:reclaim", seat, (res) => {
        if (!res.ok) clearSeat(); // room died; start fresh
        setReconnecting(false);
      });
    }

    return () => socket.off("game:view", setView);
  }, []);

  if (reconnecting) {
    return (
      <Shell>
        <p className="text-slate-400 animate-pulse">Rejoining your game…</p>
      </Shell>
    );
  }

  if (!view) return <Shell><Home /></Shell>;

  const screens = {
    lobby: <Lobby view={view} />,
    reveal: <Reveal view={view} />,
    clues: <Clues view={view} />,
    voting: <Voting view={view} />,
    results: <Results view={view} />,
  };

  return <Shell>{screens[view.phase] ?? <Home />}</Shell>;
}

function Shell({ children }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
