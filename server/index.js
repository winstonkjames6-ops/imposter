// ============================================================
// IMPOSTER — game server
//
// THE ONE IDEA THAT MATTERS IN THIS FILE:
// The server is the only place the full truth lives. Clients
// NEVER receive the whole game state. Every time state changes,
// we compute a filtered "view" PER PLAYER and emit it to that
// player's socket only. The imposter's client literally never
// receives the secret word. Open DevTools — nothing to leak.
//
// Search for "buildView" and "broadcastViews" — that's the pattern.
// ============================================================

import { createServer } from "http";
import { Server } from "socket.io";
import { randomUUID } from "crypto";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" }, // fine for local dev; lock down before deploying
});

// ------------------------------------------------------------
// Data
// ------------------------------------------------------------

const rooms = new Map(); // roomCode -> Room

const WORD_PACKS = [
  { category: "Food", words: ["Hot dog", "Sushi", "Mambo sauce", "Pancakes", "Tacos"] },
  { category: "Sports", words: ["Volleyball", "Bowling", "Track", "Boxing", "Golf"] },
  { category: "Places", words: ["Airport", "Library", "Barbershop", "Beach", "Rooftop"] },
];

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? makeRoomCode() : code;
}

function createRoom() {
  const room = {
    code: makeRoomCode(),
    phase: "lobby",
    hostToken: null,
    players: new Map(),     // token -> Player
    secret: null,           // { word, category, imposterToken } — NEVER sent raw
    clues: {},              // token -> clue text
    votes: {},              // token -> targetId (target's public .id, not auth token)
    _cleanupTimer: null,    // setTimeout handle for empty-room GC
  };
  rooms.set(room.code, room);
  return room;
}

// ------------------------------------------------------------
// THE PATTERN: per-player views
// ------------------------------------------------------------

function buildView(room, player) {
  const connectedPlayers = [...room.players.values()].filter(p => p.connected);

  // Clue information shaped per phase.
  // During "clues": progress counter only (don't reveal others' words early).
  // During "voting" / "results": the full named list so players can see and vote.
  let clueData = null;
  if (room.phase === "clues") {
    clueData = {
      submitted: Object.keys(room.clues).length,
      total: connectedPlayers.length,
      youSubmitted: !!room.clues[player.token],
    };
  } else if (room.phase === "voting" || room.phase === "results") {
    clueData = [...room.players.values()].map(p => ({
      id: p.id,
      name: p.name,
      clue: room.clues[p.token] || null,
    }));
  }

  // Vote tallies — only materialised in the results phase.
  let voteResults = null;
  if (room.phase === "results") {
    const tally = {};
    for (const votedId of Object.values(room.votes)) {
      tally[votedId] = (tally[votedId] || 0) + 1;
    }
    voteResults = [...room.players.values()].map(p => ({
      id: p.id,
      name: p.name,
      votes: tally[p.id] || 0,
    }));
  }

  return {
    roomCode: room.code,
    phase: room.phase,
    you: {
      name: player.name,
      token: player.token,
      id: player.id,       // public id, safe for the client to use when voting
      isHost: player.token === room.hostToken,
    },
    players: [...room.players.values()].map(p => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      isHost: p.token === room.hostToken,
    })),
    // Hidden information filtered per player.
    // During "results" the word is revealed to everyone (including the imposter,
    // who only now learns what they were bluffing about).
    role:
      room.phase === "lobby" || !room.secret
        ? null
        : room.phase === "results"
        ? {
            isImposter: room.secret.imposterToken === player.token,
            category: room.secret.category,
            word: room.secret.word,
          }
        : room.secret.imposterToken === player.token
        ? { isImposter: true, category: room.secret.category, word: null }
        : { isImposter: false, category: room.secret.category, word: room.secret.word },

    clueData,
    voteResults,

    // The imposter's public id is only revealed here, in the results phase.
    // Never send it earlier — clients have no reason to know.
    imposterId:
      room.phase === "results"
        ? (room.players.get(room.secret.imposterToken)?.id ?? null)
        : null,

    // Let the player know their voting state so they don't accidentally
    // double-vote after a page refresh.
    youVoted: room.phase === "voting" ? !!room.votes[player.token] : null,
  };
}

// Emit each player their own view. Only ever call this — never emit raw state.
function broadcastViews(room) {
  for (const player of room.players.values()) {
    if (player.connected && player.socketId) {
      io.to(player.socketId).emit("game:view", buildView(room, player));
    }
  }
}

// ------------------------------------------------------------
// Phase-completion helpers (called after every mutation + disconnect)
// ------------------------------------------------------------

function checkClueDone(room) {
  if (room.phase !== "clues") return;
  const connected = [...room.players.values()].filter(p => p.connected);
  if (connected.length > 0 && connected.every(p => room.clues[p.token])) {
    room.phase = "voting";
  }
}

function checkVoteDone(room) {
  if (room.phase !== "voting") return;
  const connected = [...room.players.values()].filter(p => p.connected);
  if (connected.length > 0 && connected.every(p => room.votes[p.token] !== undefined)) {
    room.phase = "results";
  }
}

// ------------------------------------------------------------
// Socket handlers
// ------------------------------------------------------------

io.on("connection", (socket) => {
  // ---- Create a room ----
  socket.on("room:create", ({ name }, callback) => {
    const room = createRoom();
    const player = addPlayer(room, socket, name);
    room.hostToken = player.token;
    callback({ ok: true, roomCode: room.code, token: player.token });
    broadcastViews(room);
  });

  // ---- Join an existing room ----
  socket.on("room:join", ({ roomCode, name }, callback) => {
    const room = rooms.get(roomCode?.toUpperCase());
    if (!room) return callback({ ok: false, error: "Room not found." });
    if (room.phase !== "lobby")
      return callback({ ok: false, error: "Game already started." });
    if (room.players.size >= 10)
      return callback({ ok: false, error: "Room is full." });

    const player = addPlayer(room, socket, name);
    callback({ ok: true, roomCode: room.code, token: player.token });
    broadcastViews(room);
  });

  // ---- Reclaim a seat after refresh/disconnect ----
  socket.on("room:reclaim", ({ roomCode, token }, callback) => {
    const room = rooms.get(roomCode?.toUpperCase());
    const player = room?.players.get(token);
    if (!room || !player)
      return callback({ ok: false, error: "Seat not found." });

    player.socketId = socket.id;
    player.connected = true;
    socket.data = { roomCode: room.code, token };

    // Cancel any pending room-deletion timer.
    if (room._cleanupTimer) {
      clearTimeout(room._cleanupTimer);
      room._cleanupTimer = null;
    }

    callback({ ok: true });
    broadcastViews(room);
  });

  // ---- Host starts the game ----
  socket.on("game:start", (_, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback({ ok: false, error: "Not in a room." });
    if (player.token !== room.hostToken)
      return callback({ ok: false, error: "Only the host can start." });
    if (room.players.size < 3)
      return callback({ ok: false, error: "Need at least 3 players." });

    const pack = WORD_PACKS[Math.floor(Math.random() * WORD_PACKS.length)];
    const word = pack.words[Math.floor(Math.random() * pack.words.length)];
    const tokens = [...room.players.keys()];
    const imposterToken = tokens[Math.floor(Math.random() * tokens.length)];

    room.secret = { word, category: pack.category, imposterToken };
    room.phase = "reveal";

    callback({ ok: true });
    broadcastViews(room);
  });

  // ---- Host advances reveal → clues ----
  socket.on("game:advance", (_, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (player.token !== room.hostToken)
      return callback?.({ ok: false, error: "Only the host can advance." });
    if (room.phase !== "reveal")
      return callback?.({ ok: false, error: "Can only advance from reveal phase." });

    room.phase = "clues";
    room.clues = {};
    room.votes = {};
    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Player submits a clue ----
  socket.on("clue:submit", ({ text }, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (room.phase !== "clues")
      return callback?.({ ok: false, error: "Not in clues phase." });
    if (room.clues[player.token])
      return callback?.({ ok: false, error: "Already submitted a clue." });

    const clueText = (text || "").trim().slice(0, 50);
    if (!clueText) return callback?.({ ok: false, error: "Clue cannot be empty." });

    room.clues[player.token] = clueText;
    checkClueDone(room);
    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Player casts a vote ----
  // targetId is the target player's public .id — never their auth token.
  socket.on("vote:cast", ({ targetId }, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (room.phase !== "voting")
      return callback?.({ ok: false, error: "Not in voting phase." });
    if (room.votes[player.token] !== undefined)
      return callback?.({ ok: false, error: "Already voted." });

    const target = [...room.players.values()].find(p => p.id === targetId);
    if (!target) return callback?.({ ok: false, error: "Invalid vote target." });

    room.votes[player.token] = targetId;
    checkVoteDone(room);
    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Host skips remaining clue submissions ----
  socket.on("clue:skip", (_, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (player.token !== room.hostToken)
      return callback?.({ ok: false, error: "Only the host can skip." });
    if (room.phase !== "clues")
      return callback?.({ ok: false, error: "Not in clues phase." });

    for (const p of room.players.values()) {
      if (p.connected && !room.clues[p.token]) {
        room.clues[p.token] = "";
      }
    }
    room.phase = "voting";
    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Host resets the game back to lobby ----
  socket.on("game:reset", (_, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (player.token !== room.hostToken)
      return callback?.({ ok: false, error: "Only the host can restart." });

    room.clues = {};
    room.votes = {};
    room.secret = null;
    room.phase = "lobby";
    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Disconnects ----
  socket.on("disconnect", () => {
    const { room, player } = locate(socket);
    if (!room || !player) return;

    player.connected = false;
    player.socketId = null;

    // Host migration: promote the first still-connected player.
    if (player.token === room.hostToken) {
      const nextHost = [...room.players.values()].find(p => p.connected);
      if (nextHost) room.hostToken = nextHost.token;
    }

    // A disconnect may satisfy the "everyone submitted/voted" condition.
    checkClueDone(room);
    checkVoteDone(room);

    broadcastViews(room);

    // Garbage collection: schedule deletion 10 min after the room goes dark.
    const anyConnected = [...room.players.values()].some(p => p.connected);
    if (!anyConnected) {
      room._cleanupTimer = setTimeout(() => {
        rooms.delete(room.code);
        console.log(`Room ${room.code} deleted (empty for 10 min)`);
      }, 10 * 60 * 1000);
    }
  });
});

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function addPlayer(room, socket, name) {
  const player = {
    token: randomUUID(), // auth identity — never shared with other clients
    id: randomUUID(),    // public identity — safe to expose for voting
    name: (name || "Player").trim().slice(0, 16),
    socketId: socket.id,
    connected: true,
  };
  room.players.set(player.token, player);
  socket.data = { roomCode: room.code, token: player.token };
  return player;
}

function locate(socket) {
  const { roomCode, token } = socket.data || {};
  const room = rooms.get(roomCode);
  return { room, player: room?.players.get(token) };
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Imposter server listening on :${PORT}`);
});
