# Imposter — multiplayer scaffold

A room-code multiplayer skeleton for the Imposter party game.
Node + Socket.IO server, React + Tailwind v4 client.

## What works right now

- Create a room, get a 4-letter code
- Join from other devices/tabs with the code
- Live lobby with connect/disconnect indicators
- Host starts the game → server picks a word + imposter
- **Per-player role reveal** — the imposter's browser never receives the word

## Run it

Two terminals:

```bash
# Terminal 1 — server
cd server
npm install
npm run dev        # listens on :3001

# Terminal 2 — client
cd client
npm install
npm run dev        # Vite, usually :5173
```

Open the client URL in 3+ tabs (or your phone on the same wifi —
use your machine's LAN IP in `client/src/socket.js`).

## The architecture, in one paragraph

The server holds the only full copy of game state (`rooms` Map in
`server/index.js`). Clients hold a `view` — a per-player snapshot the
server computes in `buildView()` and pushes via `broadcastViews()`
whenever anything changes. Clients render the view and emit intent
("I vote for X"); they never compute or receive global truth. Players
are identified by a durable `token` (survives refresh, stored in
localStorage) separate from their `socketId` (dies on refresh) —
that split is what makes reconnects work.

## Your TODOs, in order

1. **`game:advance`** — host moves reveal → clues. Server handler +
   button in `Reveal.jsx`. (Smallest one; do it first to learn the loop.)
2. **Clue phase** — `clue:submit` handler, store in `room.clues`,
   auto-advance to voting when all connected players have submitted.
   Build `Clues.jsx` to replace the stub.
3. **Voting + results** — `vote:cast`, tally on the server, set phase
   to `results`, and only THEN include the imposter's identity in
   `buildView`. The reveal is a server decision, not a client one.
4. **Host migration** — host disconnects → promote next connected player.
5. **Room garbage collection** — delete rooms after ~10 min of everyone
   being disconnected, or the Map grows forever.

Rules for every handler you write are in the big comment block in
`server/index.js` ("TODO(you): the remaining phases").

## Deploying later

Vercel can't host the websocket server. Client → anywhere static;
server → Railway / Render / Fly. Then replace the hardcoded
`localhost:3001` in `socket.js` with an env var.
