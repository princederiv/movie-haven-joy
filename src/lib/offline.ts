/**
 * Offline library: titles saved on the device so the app still works with no signal.
 */
export type SavedMovie = {
  id: string;
  title: string;
  year: number;
  rating: number;
  runtime: number;
  poster: string;
  genres: string[];
  overview: string;
  savedAt: number;
};

const KEY = "streambox.offline.v1";
const EVENT = "streambox-offline-change";

function read(): SavedMovie[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedMovie[]) : [];
  } catch {
    return [];
  }
}

function write(items: SavedMovie[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function listOffline(): SavedMovie[] {
  return read().sort((a, b) => b.savedAt - a.savedAt);
}

export function isSavedOffline(id: string): boolean {
  return read().some((m) => m.id === id);
}

export function saveOffline(movie: Omit<SavedMovie, "savedAt">) {
  const items = read().filter((m) => m.id !== movie.id);
  write([...items, { ...movie, savedAt: Date.now() }]);
}

export function removeOffline(id: string) {
  write(read().filter((m) => m.id !== id));
}

export function clearOffline() {
  write([]);
}

export function subscribeOffline(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
