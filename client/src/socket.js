// One socket for the whole app. Screens import this instead of
// creating their own connections.
import { io } from "socket.io-client";

export const socket = io("http://localhost:3001", {
  autoConnect: true,
});

// ---- Seat persistence ----
// The server gives us a token when we join. We stash it so a page
// refresh can reclaim the same seat instead of creating a ghost player.
const KEY = "imposter_seat";

export function saveSeat(roomCode, token) {
  localStorage.setItem(KEY, JSON.stringify({ roomCode, token }));
}

export function loadSeat() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function clearSeat() {
  localStorage.removeItem(KEY);
}
