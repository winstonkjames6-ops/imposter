// One socket for the whole app. Screens import this instead of
// creating their own connections.
import { io } from "socket.io-client";

export const socket = io("https://imposter-production-800f.up.railway.app", {
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

// ---- Color persistence ----
const COLOR_KEY = "imposter_color";

export function saveColor(color) {
  localStorage.setItem(COLOR_KEY, color);
}

export function loadColor() {
  return localStorage.getItem(COLOR_KEY) || null;
}
