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
  cors: { origin: ['http://localhost:5173', 'https://imposter-silk-three.vercel.app'] },
});

// ------------------------------------------------------------
// Data
// ------------------------------------------------------------

const rooms = new Map(); // roomCode -> Room

const ALLOWED_COLORS = new Set([
  '#FF4000', '#E8A838', '#4CAF50', '#2196F3',
  '#9C27B0', '#E91E63', '#00BCD4', '#607D8B',
]);
const DEFAULT_COLOR = '#607D8B';

const VALID_EYES = new Set(['dots', 'happy', 'wide', 'wink']);
const VALID_MOUTHS = new Set(['smile', 'flat', 'open', 'smirk']);

function sanitizeCharacter(char) {
  if (!char || typeof char !== 'object') return null;
  return {
    bodyColor: ALLOWED_COLORS.has(char.bodyColor) ? char.bodyColor : null,
    eyes: VALID_EYES.has(char.eyes) ? char.eyes : 'dots',
    mouth: VALID_MOUTHS.has(char.mouth) ? char.mouth : 'smile',
  };
}

const WORD_PACKS = [
  {
    category: "Food",
    words: [
      { word: "Hot dog", clues: ["vendor", "ballpark", "bun", "ketchup", "baseball"] },
      { word: "Sushi", clues: ["rice", "raw", "chopsticks", "Japan", "rolls"] },
      { word: "Mambo sauce", clues: ["DC", "wings", "orange", "spicy", "condiment"] },
      { word: "Pancakes", clues: ["maple", "breakfast", "syrup", "fluffy", "griddle"] },
      { word: "Tacos", clues: ["shell", "Mexico", "Tuesday", "filling", "street"] },
      { word: "Pizza", clues: ["crust", "cheese", "oven", "slice", "delivery"] },
      { word: "Burger", clues: ["patty", "bun", "grill", "fast food", "sesame"] },
      { word: "Pasta", clues: ["noodles", "Italian", "sauce", "fork", "carbs"] },
      { word: "Chicken wings", clues: ["Buffalo", "sauce", "spicy", "drumstick", "sports bar"] },
      { word: "Donut", clues: ["glazed", "hole", "sprinkles", "coffee", "sweet"] },
      { word: "Spaghetti", clues: ["noodles", "meatballs", "twirl", "Italian", "Alfredo"] },
      { word: "Waffle", clues: ["syrup", "grid", "breakfast", "Belgian", "crispy"] },
      { word: "Steak", clues: ["rare", "grill", "meat", "expensive", "fork and knife"] },
      { word: "Soda", clues: ["fizzy", "sugar", "can", "pop", "Coke"] },
      { word: "Sandwich", clues: ["bread", "lunch", "filling", "deli", "two slices"] },
      { word: "Taco Bell", clues: ["fast food", "Mexico", "bell", "quesadilla", "purple"] },
      { word: "Candy", clues: ["sugar", "sweet", "wrapper", "Halloween", "chocolate"] },
      { word: "Ice cream", clues: ["cone", "melting", "cold", "flavor", "dairy"] },
      { word: "Cheese", clues: ["dairy", "sharp", "wheel", "cheddar", "mousetrap"] },
      { word: "Bacon", clues: ["crispy", "pork", "breakfast", "strip", "smoky"] }
    ]
  },
  {
    category: "Sports",
    words: [
      { word: "Volleyball", clues: ["net", "spike", "sand", "bump", "court"] },
      { word: "Bowling", clues: ["pins", "strike", "lane", "ball", "shoes"] },
      { word: "Track", clues: ["running", "field", "sprint", "relay", "finish line"] },
      { word: "Boxing", clues: ["gloves", "ring", "punch", "knockout", "rounds"] },
      { word: "Golf", clues: ["ball", "hole", "club", "green", "fairway"] },
      { word: "Basketball", clues: ["hoop", "dunk", "court", "bounce", "slam"] },
      { word: "Soccer", clues: ["goal", "field", "kick", "net", "World Cup"] },
      { word: "Tennis", clues: ["racket", "court", "love", "deuce", "serve"] },
      { word: "Football", clues: ["touchdown", "field", "quarterback", "tackle", "Super Bowl"] },
      { word: "Baseball", clues: ["bat", "glove", "diamond", "pitch", "home run"] },
      { word: "Skateboarding", clues: ["trick", "board", "wheels", "ramp", "kickflip"] },
      { word: "Swimming", clues: ["pool", "stroke", "lap", "goggles", "water"] },
      { word: "Gymnastics", clues: ["flip", "bars", "beam", "tumble", "flexibility"] },
      { word: "Surfing", clues: ["wave", "board", "ocean", "beach", "wipeout"] },
      { word: "Martial arts", clues: ["belt", "karate", "kick", "dojo", "discipline"] },
      { word: "Ice skating", clues: ["blade", "ice", "spin", "rink", "elegant"] },
      { word: "Cycling", clues: ["pedal", "chain", "bike", "gear", "helmet"] },
      { word: "Archery", clues: ["arrow", "bow", "target", "bullseye", "aim"] },
      { word: "Hiking", clues: ["trail", "mountain", "boots", "nature", "summit"] },
      { word: "Weightlifting", clues: ["dumbbell", "muscle", "gym", "bench", "strength"] }
    ]
  },
  {
    category: "Places",
    words: [
      { word: "Airport", clues: ["runway", "departure", "luggage", "terminal", "security"] },
      { word: "Library", clues: ["books", "quiet", "shelf", "card", "read"] },
      { word: "Barbershop", clues: ["haircut", "razor", "pole", "chair", "trim"] },
      { word: "Beach", clues: ["sand", "ocean", "wave", "sunburn", "boardwalk"] },
      { word: "Restaurant", clues: ["menu", "waiter", "table", "food", "reservation"] },
      { word: "Hospital", clues: ["doctor", "patient", "nurse", "surgery", "emergency"] },
      { word: "School", clues: ["teacher", "classroom", "homework", "bell", "students"] },
      { word: "Park", clues: ["grass", "playground", "bench", "trees", "picnic"] },
      { word: "Movie theater", clues: ["popcorn", "screen", "ticket", "dark", "film"] },
      { word: "Gym", clues: ["weights", "treadmill", "sweat", "membership", "fitness"] },
      { word: "Mall", clues: ["store", "shopping", "corridor", "food court", "clothing"] },
      { word: "Casino", clues: ["slots", "poker", "chips", "dealer", "gamble"] },
      { word: "Bank", clues: ["money", "account", "teller", "safe", "vault"] },
      { word: "Zoo", clues: ["animals", "cage", "ticket", "visitor", "enclosure"] },
      { word: "Museum", clues: ["art", "exhibit", "artifact", "history", "tour"] },
      { word: "Amusement park", clues: ["roller coaster", "thrills", "rides", "ticket", "fun"] },
      { word: "Office", clues: ["desk", "cubicle", "boss", "computer", "fluorescent"] },
      { word: "Gas station", clues: ["pump", "fuel", "convenience store", "attendant", "car"] },
      { word: "Pharmacy", clues: ["medicine", "prescription", "pills", "counter", "drugstore"] },
      { word: "Garden", clues: ["plants", "flowers", "soil", "seeds", "grow"] }
    ]
  },
  {
    category: "Animals",
    words: [
      { word: "Elephant", clues: ["trunk", "tusks", "gray", "large", "Africa"] },
      { word: "Penguin", clues: ["ice", "flightless", "tuxedo", "Antarctica", "waddle"] },
      { word: "Dolphin", clues: ["intelligent", "ocean", "click", "mammal", "playful"] },
      { word: "Platypus", clues: ["venomous", "duck bill", "Australia", "egg-laying", "strange"] },
      { word: "Lion", clues: ["mane", "roar", "Africa", "king", "pride"] },
      { word: "Giraffe", clues: ["long neck", "spots", "Africa", "tall", "leaves"] },
      { word: "Shark", clues: ["teeth", "ocean", "fins", "predator", "Jaws"] },
      { word: "Eagle", clues: ["wings", "talons", "bald", "majestic", "soars"] },
      { word: "Turtle", clues: ["shell", "slow", "water", "reptile", "ancient"] },
      { word: "Octopus", clues: ["tentacles", "intelligent", "ocean", "camouflage", "suction cups"] },
      { word: "Cheetah", clues: ["spots", "speed", "Africa", "cat", "hunt"] },
      { word: "Koala", clues: ["eucalyptus", "Australia", "cute", "marsupial", "fuzzy"] },
      { word: "Kangaroo", clues: ["pouch", "hopping", "Australia", "tail", "joey"] },
      { word: "Peacock", clues: ["feathers", "tail", "pride", "colorful", "bird"] },
      { word: "Wolf", clues: ["pack", "howl", "gray", "predator", "wild"] },
      { word: "Butterfly", clues: ["wings", "metamorphosis", "colorful", "insect", "flower"] },
      { word: "Bee", clues: ["honey", "sting", "hive", "pollinate", "buzz"] },
      { word: "Crocodile", clues: ["teeth", "water", "scales", "prehistoric", "tail"] },
      { word: "Owl", clues: ["night", "hooting", "eyes", "wise", "nocturnal"] },
      { word: "Rabbit", clues: ["ears", "hop", "fluffy", "carrot", "burrow"] }
    ]
  },
  {
    category: "Technology",
    words: [
      { word: "Smartphone", clues: ["screen", "apps", "wireless", "pocket", "internet"] },
      { word: "Cryptocurrency", clues: ["Bitcoin", "digital", "blockchain", "mining", "wallet"] },
      { word: "Chatbot", clues: ["AI", "conversation", "text", "automated", "response"] },
      { word: "Algorithm", clues: ["code", "logic", "computation", "step-by-step", "solve"] },
      { word: "Cloud storage", clues: ["internet", "data", "backup", "access", "server"] },
      { word: "Virtual reality", clues: ["headset", "immersive", "simulation", "goggles", "digital world"] },
      { word: "Artificial intelligence", clues: ["machine learning", "smart", "robot", "computer", "neural"] },
      { word: "Wifi", clues: ["internet", "wireless", "router", "connection", "signal"] },
      { word: "Drone", clues: ["flying", "camera", "unmanned", "remote control", "aerial"] },
      { word: "Laptop", clues: ["portable", "computer", "keyboard", "screen", "work"] },
      { word: "Printer", clues: ["paper", "ink", "document", "copy", "print"] },
      { word: "Router", clues: ["wifi", "connection", "network", "blinking lights", "modem"] },
      { word: "Server", clues: ["data", "website", "hosting", "computer", "request"] },
      { word: "USB", clues: ["plug", "data transfer", "stick", "port", "connection"] },
      { word: "Monitor", clues: ["screen", "display", "computer", "eyes", "refresh rate"] },
      { word: "Keyboard", clues: ["keys", "type", "input", "letters", "QWERTY"] },
      { word: "Mouse", clues: ["click", "pad", "pointer", "wireless", "cursor"] },
      { word: "Headphones", clues: ["ears", "sound", "music", "wire", "audio"] },
      { word: "Battery", clues: ["power", "charge", "acid", "portable", "drain"] },
      { word: "Website", clues: ["internet", "browser", "domain", "page", "HTML"] }
    ]
  },
  {
    category: "Occupations",
    words: [
      { word: "Chef", clues: ["cook", "kitchen", "food", "recipe", "restaurant"] },
      { word: "Detective", clues: ["investigate", "clues", "suspect", "crime", "solve"] },
      { word: "Astronaut", clues: ["space", "rocket", "moon", "suit", "weightless"] },
      { word: "Barista", clues: ["coffee", "espresso", "cafe", "latte", "barista"] },
      { word: "Plumber", clues: ["pipes", "water", "wrench", "drain", "leak"] },
      { word: "Firefighter", clues: ["fire", "truck", "hose", "helmet", "rescue"] },
      { word: "Nurse", clues: ["hospital", "patient", "care", "injection", "scrubs"] },
      { word: "Carpenter", clues: ["wood", "nails", "hammer", "build", "furniture"] },
      { word: "Surgeon", clues: ["scalpel", "hospital", "operation", "patient", "theater"] },
      { word: "Lawyer", clues: ["court", "case", "law", "defendant", "judge"] },
      { word: "Teacher", clues: ["classroom", "student", "grade", "lesson", "apple"] },
      { word: "Electrician", clues: ["wires", "electricity", "circuit", "breaker", "outlet"] },
      { word: "Pilot", clues: ["airplane", "cockpit", "flight", "landing", "wings"] },
      { word: "Artist", clues: ["paint", "canvas", "brush", "creative", "gallery"] },
      { word: "Photographer", clues: ["camera", "photo", "lens", "light", "shutter"] },
      { word: "Accountant", clues: ["math", "taxes", "numbers", "spreadsheet", "audit"] },
      { word: "Veterinarian", clues: ["animals", "pets", "clinic", "injection", "care"] },
      { word: "Security guard", clues: ["patrol", "watch", "uniform", "badge", "protect"] },
      { word: "Hairdresser", clues: ["salon", "scissors", "hair", "cut", "style"] },
      { word: "Mechanic", clues: ["car", "engine", "tools", "grease", "repair"] }
    ]
  }
];

module.exports = WORD_PACKS;

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
    clues: {},              // token -> clue text (current clue round only)
    allClues: [],           // [{ round: N, clues: { token -> text } }, ...] one entry per completed round
    votes: {},              // token -> targetId (target's public .id, not auth token)
    autoAccept: false,      // if true, late joiners are queued for next game instead of staying spectators
    autoPending: new Set(), // tokens of spectators to promote when game:reset fires
    kickVotes: new Map(),   // targetToken -> Set<voterToken>
    packConfig: null,       // null = random | { type:'builtin', category } | { type:'custom', words[] }
    _cleanupTimer: null,    // setTimeout handle for empty-room GC
    _discussionTimer: null, // setTimeout handle for discussion countdown
    discussionEndsAt: null, // epoch ms when discussion phase auto-ends
    totalClueRounds: 1,     // how many clue rounds per game (1-3), configurable via room:set-rounds
    currentClueRound: 1,    // which clue round we're on within the current game
    discussionDuration: 60000, // ms; configurable via room:set-discussion-time
    lastActivity: Date.now(),
    lastChanceResult: null, // 'escaped' | 'failed' | null
  };
  rooms.set(room.code, room);
  return room;
}

// ------------------------------------------------------------
// THE PATTERN: per-player views
// ------------------------------------------------------------

function buildView(room, player) {
  // Active (non-spectator) connected players are the source of truth for
  // phase-completion checks and counts shown to all clients.
  const activePlayers = [...room.players.values()].filter(p => !p.spectator);
  const connectedActive = activePlayers.filter(p => p.connected);

  // Clue information shaped per phase.
  // During "clues": progress counter only (don't reveal others' words early).
  // During "voting" / "results": the full named list so players can see and vote.
  // Spectators are excluded from counts and candidate lists.
  let clueData = null;
  if (room.phase === "clues") {
    const submittedCount = connectedActive.filter(p => room.clues[p.token]).length;
    clueData = {
      submitted: submittedCount,
      total: connectedActive.length,
      youSubmitted: !!room.clues[player.token],
    };
  } else if (room.phase === "clue-review") {
    const lastEntry = room.allClues[room.allClues.length - 1];
    clueData = activePlayers.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      character: p.character ?? null,
      clue: lastEntry?.clues[p.token] || null,
    }));
  } else if (room.phase === "discussion" || room.phase === "voting" || room.phase === "results") {
    clueData = activePlayers.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      character: p.character ?? null,
      clues: room.allClues.map(entry => entry.clues[p.token] || null),
    }));
  }

  // Vote tallies — only materialised in the results phase.
  // Spectators cannot be voted for, so they never appear here.
  let voteResults = null;
  if (room.phase === "results") {
    const tally = {};
    for (const votedId of Object.values(room.votes)) {
      tally[votedId] = (tally[votedId] || 0) + 1;
    }
    voteResults = activePlayers.map(p => ({
      id: p.id,
      name: p.name,
      votes: tally[p.id] || 0,
      color: p.color,
      character: p.character ?? null,
    }));
  }

  return {
    roomCode: room.code,
    phase: room.phase,
    you: {
      name: player.name,
      token: player.token,
      id: player.id,
      isHost: player.token === room.hostToken,
      isSpectator: !!player.spectator,
      isImposter: !!(room.secret && player.token === room.secret.imposterToken),
    },
    players: [...room.players.values()].map(p => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      isHost: p.token === room.hostToken,
      isSpectator: !!p.spectator,
      color: p.color,
      character: p.character ?? null,
      kickVoteCount: room.kickVotes.get(p.token)?.size ?? 0,
    })),
    kickVotes: Object.fromEntries(
      [...room.kickVotes.entries()]
        .filter(([token]) => room.players.has(token))
        .map(([token, voters]) => [room.players.get(token).name, voters.size])
    ),
    // Spectators get no role — they watch but have no secret identity.
    role:
      player.spectator || room.phase === "lobby" || !room.secret
        ? null
        : room.phase === "results"
        ? {
            isImposter: room.secret.imposterToken === player.token,
            category: room.secret.category,
            word: room.secret.word,
          }
        : room.secret.imposterToken === player.token
        ? { isImposter: true, category: room.secret.category, word: null, clues: room.secret.clues || [] }
        : { isImposter: false, category: room.secret.category, word: room.secret.word, clues: [] },

    clueData,
    voteResults,
    discussionEndsAt: room.phase === "discussion" ? room.discussionEndsAt : null,
    autoAccept: room.autoAccept,
    packName: room.packConfig == null
      ? 'Random'
      : room.packConfig.type === 'builtin'
        ? room.packConfig.category
        : 'Custom',

    imposterId:
      room.phase === "results"
        ? (room.players.get(room.secret.imposterToken)?.id ?? null)
        : null,

    lastChanceResult: room.phase === "results" ? room.lastChanceResult : null,

    result: room.phase === "results" ? {
      caught: (() => {
        const tally = {};
        for (const votedId of Object.values(room.votes)) {
          tally[votedId] = (tally[votedId] || 0) + 1;
        }
        const imposterPublicId = room.players.get(room.secret.imposterToken)?.id;
        const topVotedId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];
        return topVotedId === imposterPublicId;
      })(),
    } : null,

    youVoted: room.phase === "voting" ? !!room.votes[player.token] : null,
    currentClueRound: room.currentClueRound,
    totalClueRounds: room.totalClueRounds,
    discussionTime: room.discussionDuration / 1000,
    // All completed clue rounds with player data merged in — used by ClueReview and Discussion
    allClues: room.allClues.map(({ round, clues }) => ({
      round,
      entries: activePlayers.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        character: p.character ?? null,
        clue: clues[p.token] || null,
      })),
    })),
  };
}

// Emit each player their own view. Only ever call this — never emit raw state.
function broadcastViews(room) {
  room.lastActivity = Date.now();
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
  const connected = [...room.players.values()].filter(p => p.connected && !p.spectator);
  if (connected.length > 0 && connected.every(p => room.clues[p.token])) {
    room.allClues.push({ round: room.currentClueRound, clues: { ...room.clues } });
    if (room.currentClueRound < room.totalClueRounds) {
      room.phase = "clue-review";
      broadcastViews(room);
    } else {
      room.phase = "discussion";
      room.discussionEndsAt = Date.now() + room.discussionDuration;
      broadcastViews(room);
      room._discussionTimer = setTimeout(() => {
        if (room.phase === "discussion") {
          room.phase = "voting";
          room._discussionTimer = null;
          broadcastViews(room);
        }
      }, room.discussionDuration);
    }
  }
}

function checkVoteDone(room) {
  if (room.phase !== "voting") return;
  const connected = [...room.players.values()].filter(p => p.connected && !p.spectator);
  if (connected.length > 0 && connected.every(p => room.votes[p.token] !== undefined)) {
    room.phase = "results";
  }
}

// ------------------------------------------------------------
// Socket handlers
// ------------------------------------------------------------

io.on("connection", (socket) => {
  // ---- Create a room ----
  socket.on("room:create", ({ name, color, character }, callback) => {
    const room = createRoom();
    const safeColor = ALLOWED_COLORS.has(color) ? color : DEFAULT_COLOR;
    const safeChar = sanitizeCharacter(character);
    const player = addPlayer(room, socket, name, false, safeColor, safeChar);
    room.hostToken = player.token;
    callback({ ok: true, roomCode: room.code, token: player.token });
    broadcastViews(room);
  });

  // ---- Join an existing room ----
  socket.on("room:join", ({ roomCode, name, color, character }, callback) => {
    const room = rooms.get(roomCode?.toUpperCase());
    if (!room) return callback({ ok: false, error: "Room not found." });
    if (room.players.size >= 10)
      return callback({ ok: false, error: "Room is full." });

    const midGame = room.phase !== "lobby";
    const safeColor = ALLOWED_COLORS.has(color) ? color : DEFAULT_COLOR;
    const safeChar = sanitizeCharacter(character);
    const player = addPlayer(room, socket, name, midGame, safeColor, safeChar);
    if (midGame && room.autoAccept) {
      room.autoPending.add(player.token);
    }
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

    let category, word, clues = [];
    if (room.packConfig?.type === 'builtin') {
      const pack = WORD_PACKS.find(p => p.category === room.packConfig.category)
                ?? WORD_PACKS[Math.floor(Math.random() * WORD_PACKS.length)];
      category = pack.category;
      const picked = pack.words[Math.floor(Math.random() * pack.words.length)];
      word = typeof picked === 'object' ? picked.word : picked;
      clues = typeof picked === 'object' ? (picked.clues || []) : [];
    } else if (room.packConfig?.type === 'custom') {
      category = 'Custom';
      const picked = room.packConfig.words[Math.floor(Math.random() * room.packConfig.words.length)];
      word = typeof picked === 'object' ? picked.word : picked;
      clues = typeof picked === 'object' ? (picked.clues || []) : [];
    } else {
      const pack = WORD_PACKS[Math.floor(Math.random() * WORD_PACKS.length)];
      category = pack.category;
      const picked = pack.words[Math.floor(Math.random() * pack.words.length)];
      word = typeof picked === 'object' ? picked.word : picked;
      clues = typeof picked === 'object' ? (picked.clues || []) : [];
    }
    const activeTokens = [...room.players.values()].filter(p => !p.spectator).map(p => p.token);
    const imposterToken = activeTokens[Math.floor(Math.random() * activeTokens.length)];

    room.secret = { word, clues, category, imposterToken };
    room.phase = "reveal";

    callback({ ok: true });
    broadcastViews(room);
  });

  // ---- Host advances reveal → clues, or skips discussion → voting ----
  socket.on("game:advance", (_, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (player.token !== room.hostToken)
      return callback?.({ ok: false, error: "Only the host can advance." });

    if (room.phase === "reveal") {
      room.phase = "clues";
      room.clues = {};
      room.allClues = [];
      room.currentClueRound = 1;
      room.votes = {};
    } else if (room.phase === "clue-review") {
      room.currentClueRound++;
      room.clues = {};
      room.phase = "clues";
    } else if (room.phase === "discussion") {
      if (room._discussionTimer) {
        clearTimeout(room._discussionTimer);
        room._discussionTimer = null;
      }
      room.phase = "voting";
    } else {
      return callback?.({ ok: false, error: "Can only advance from reveal, clue-review, or discussion phase." });
    }

    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Player submits a clue ----
  socket.on("clue:submit", ({ text }, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (player.spectator)
      return callback?.({ ok: false, error: "Spectators cannot submit clues." });
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
    if (player.spectator)
      return callback?.({ ok: false, error: "Spectators cannot vote." });
    if (room.phase !== "voting")
      return callback?.({ ok: false, error: "Not in voting phase." });
    if (room.votes[player.token] !== undefined)
      return callback?.({ ok: false, error: "Already voted." });

    const target = [...room.players.values()].find(p => p.id === targetId && !p.spectator);
    if (!target) return callback?.({ ok: false, error: "Invalid vote target." });

    room.votes[player.token] = targetId;
    checkVoteDone(room);
    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Player leaves the room voluntarily ----
  socket.on("room:leave", () => {
    const { room, player } = locate(socket);
    if (!room || !player) return;

    room.players.delete(player.token);
    socket.data = {};

    if (player.token === room.hostToken) {
      const nextHost = [...room.players.values()].find(p => p.connected);
      room.hostToken = nextHost?.token ?? null;
    }

    const anyConnected = [...room.players.values()].some(p => p.connected);
    if (!anyConnected) {
      room._cleanupTimer = setTimeout(() => {
        rooms.delete(room.code);
      }, 10 * 60 * 1000);
    }

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
      if (p.connected && !p.spectator && !room.clues[p.token]) {
        room.clues[p.token] = "";
      }
    }
    room.allClues.push({ round: room.currentClueRound, clues: { ...room.clues } });
    if (room.currentClueRound < room.totalClueRounds) {
      room.phase = "clue-review";
    } else {
      room.phase = "voting";
    }
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
    room.allClues = [];
    room.votes = {};
    room.secret = null;
    room.phase = "lobby";
    room.kickVotes = new Map();
    room.lastChanceResult = null;
    if (room._discussionTimer) {
      clearTimeout(room._discussionTimer);
      room._discussionTimer = null;
    }
    room.discussionEndsAt = null;
    room.currentClueRound = 1;
    for (const token of room.autoPending) {
      const p = room.players.get(token);
      if (p) p.spectator = false;
    }
    room.autoPending.clear();
    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Host manually promotes a spectator to full player ----
  socket.on("player:accept-join", ({ id }, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (player.token !== room.hostToken)
      return callback?.({ ok: false, error: "Only the host can accept players." });

    const target = [...room.players.values()].find(p => p.id === id && p.spectator);
    if (!target) return callback?.({ ok: false, error: "Spectator not found." });

    target.spectator = false;
    room.autoPending.delete(target.token);
    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Vote to kick a player ----
  socket.on("kick:vote", ({ targetId }, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (player.spectator) return callback?.({ ok: false, error: "Spectators cannot vote." });

    const target = [...room.players.values()].find(p => p.id === targetId && !p.spectator);
    if (!target) return callback?.({ ok: false, error: "Invalid target." });
    if (target.token === player.token) return callback?.({ ok: false, error: "Cannot vote to kick yourself." });

    if (!room.kickVotes.has(target.token)) room.kickVotes.set(target.token, new Set());
    room.kickVotes.get(target.token).add(player.token);

    const connectedActive = [...room.players.values()].filter(p => p.connected && !p.spectator);
    const reached = room.kickVotes.get(target.token).size > connectedActive.length / 2;

    if (reached) {
      const kickedName = target.name;
      const kickedId = target.id;
      const kickedSocketId = target.socketId;

      // Notify everyone (including the kicked player) before removing them.
      for (const p of room.players.values()) {
        if (p.socketId) io.to(p.socketId).emit("kick:result", { name: kickedName, kickedId });
      }
      if (kickedSocketId) io.to(kickedSocketId).emit("kick:result", { name: kickedName, kickedId });

      room.players.delete(target.token);
      room.kickVotes.delete(target.token);
      if (target.token === room.hostToken) {
        const nextHost = [...room.players.values()].find(p => p.connected);
        room.hostToken = nextHost?.token ?? null;
      }

      callback?.({ ok: true });
      broadcastViews(room);
    } else {
      callback?.({ ok: true });
      broadcastViews(room);
    }
  });

  // ---- Host sets the word pack ----
  socket.on("room:set-pack", ({ type, category, words }, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (player.token !== room.hostToken)
      return callback?.({ ok: false, error: "Only the host can set the word pack." });

    if (type === 'random') {
      room.packConfig = null;
    } else if (type === 'builtin') {
      if (!WORD_PACKS.find(p => p.category === category))
        return callback?.({ ok: false, error: "Unknown pack." });
      room.packConfig = { type: 'builtin', category };
    } else if (type === 'custom') {
      const cleaned = [...new Set(
        (words || []).map(w => String(w).trim()).filter(w => w.length >= 2)
      )];
      if (cleaned.length < 4)
        return callback?.({ ok: false, error: "Need at least 4 words (min 2 characters each)." });
      room.packConfig = { type: 'custom', words: cleaned };
    } else {
      return callback?.({ ok: false, error: "Invalid type." });
    }

    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Host sets the number of clue rounds per game ----
  socket.on("room:set-rounds", ({ rounds }, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (player.token !== room.hostToken)
      return callback?.({ ok: false, error: "Only the host can set rounds." });
    if (!Number.isInteger(rounds) || rounds < 1 || rounds > 3)
      return callback?.({ ok: false, error: "Clue rounds must be 1–3." });
    room.totalClueRounds = rounds;
    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Host sets the discussion timer ----
  socket.on("room:set-discussion-time", ({ seconds }, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (player.token !== room.hostToken)
      return callback?.({ ok: false, error: "Only the host can set the discussion time." });
    const n = Number(seconds);
    room.discussionDuration = (Number.isFinite(n) && n >= 10 && n <= 300 ? Math.round(n) : 60) * 1000;
    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Host toggles auto-accept for late joiners ----
  socket.on("room:set-auto-accept", ({ value }, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (player.token !== room.hostToken)
      return callback?.({ ok: false, error: "Only the host can change this setting." });
    room.autoAccept = !!value;
    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Host kicks a player directly ----
  socket.on("player:kick", ({ id }, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (player.token !== room.hostToken)
      return callback?.({ ok: false, error: "Only the host can kick players." });

    const target = [...room.players.values()].find(p => p.id === id);
    if (!target) return callback?.({ ok: false, error: "Player not found." });
    if (target.token === room.hostToken)
      return callback?.({ ok: false, error: "Cannot kick the host." });

    if (target.socketId) {
      io.to(target.socketId).emit("kick:result", { name: target.name, kickedId: target.id });
    }
    room.players.delete(target.token);
    room.kickVotes.delete(target.token);

    callback?.({ ok: true });
    broadcastViews(room);
  });

  // ---- Imposter last-chance guess ----
  socket.on("imposter:guess", ({ word }, callback) => {
    const { room, player } = locate(socket);
    if (!room) return callback?.({ ok: false, error: "Not in a room." });
    if (room.phase !== "results") return callback?.({ ok: false, error: "Not in results phase." });
    if (!room.secret) return callback?.({ ok: false, error: "No active game." });
    if (player.token !== room.secret.imposterToken) return callback?.({ ok: false, error: "You are not the imposter." });
    if (room.lastChanceResult) return callback?.({ ok: false, error: "Already guessed." });

    // Verify the imposter was actually caught (top vote-getter is the imposter).
    const tally = {};
    for (const votedId of Object.values(room.votes)) {
      tally[votedId] = (tally[votedId] || 0) + 1;
    }
    const imposterPublicId = room.players.get(room.secret.imposterToken)?.id;
    const topVotedId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topVotedId !== imposterPublicId) return callback?.({ ok: false, error: "You were not caught." });

    const trimmed = (word || "").trim();
    if (!trimmed) return callback?.({ ok: false, error: "Guess cannot be empty." });

    room.lastChanceResult = trimmed.toLowerCase() === room.secret.word.toLowerCase()
      ? 'escaped'
      : 'failed';

    callback?.({ ok: true, result: room.lastChanceResult });
    broadcastViews(room);
  });

  // ---- Disconnects ----
  socket.on("disconnect", () => {
    const { room, player } = locate(socket);
    if (!room || !player) return;

    player.connected = false;
    player.socketId = null;

    // Host migration: promote the first still-connected non-spectator.
    if (player.token === room.hostToken) {
      const nextHost = [...room.players.values()].find(p => p.connected && !p.spectator);
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
// Room garbage collection
// ------------------------------------------------------------

setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [code, room] of rooms) {
    const allDisconnected = [...room.players.values()].every(p => !p.connected);
    if (allDisconnected && room.lastActivity < cutoff) {
      rooms.delete(code);
      console.log(`Room ${code} deleted by GC (all disconnected, inactive > 10 min)`);
    }
  }
}, 5 * 60 * 1000);

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function addPlayer(room, socket, name, spectator = false, color = DEFAULT_COLOR, character = null) {
  const player = {
    token: randomUUID(), // auth identity — never shared with other clients
    id: randomUUID(),    // public identity — safe to expose for voting
    name: (name || "Player").trim().slice(0, 16),
    socketId: socket.id,
    connected: true,
    spectator,
    color,
    character,
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
