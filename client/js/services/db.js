// Simple LocalStorage Database untuk MovieFinder (tanpa perlu login)
const KEYS = {
  FAVORITES: 'moviefinder_favorites',
  HISTORY: 'moviefinder_history',
  WATCHLATER: 'moviefinder_watchlater',
  PROGRESS: 'moviefinder_progress'
};

const get = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

const set = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Gagal menyimpan ke localStorage [${key}]:`, err);
  }
};

// 1. FAVORIT
export const getFavorites = () => get(KEYS.FAVORITES);

export const isFavorite = (id) => getFavorites().some((m) => m.id === id);

export const toggleFavorite = (movie) => {
  if (!movie?.id) return false;
  let list = getFavorites();
  const exists = list.some((m) => m.id === movie.id);

  if (exists) {
    list = list.filter((m) => m.id !== movie.id);
    set(KEYS.FAVORITES, list);
    return false;
  }

  list.unshift({
    id: movie.id,
    title: movie.title || movie.name,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    year: (movie.release_date || movie.first_air_date || '').slice(0, 4),
    added_at: new Date().toISOString()
  });
  set(KEYS.FAVORITES, list);
  return true;
};

// 2. WATCH LATER
export const getWatchLater = () => get(KEYS.WATCHLATER);

export const isWatchLater = (id) => getWatchLater().some((m) => m.id === id);

export const toggleWatchLater = (movie) => {
  if (!movie?.id) return false;
  let list = getWatchLater();
  const exists = list.some((m) => m.id === movie.id);

  if (exists) {
    list = list.filter((m) => m.id !== movie.id);
    set(KEYS.WATCHLATER, list);
    return false;
  }

  list.unshift({
    id: movie.id,
    title: movie.title || movie.name,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    year: (movie.release_date || movie.first_air_date || '').slice(0, 4),
    added_at: new Date().toISOString()
  });
  set(KEYS.WATCHLATER, list);
  return true;
};

// 3. RIWAYAT TONTONAN
export const getHistory = () => get(KEYS.HISTORY);

export const addToHistory = (movie) => {
  if (!movie?.id) return;
  let list = getHistory().filter((m) => m.id !== movie.id);
  list.unshift({
    id: movie.id,
    title: movie.title || movie.name,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    year: (movie.release_date || movie.first_air_date || '').slice(0, 4),
    watched_at: new Date().toISOString()
  });
  if (list.length > 50) list.pop();
  set(KEYS.HISTORY, list);
};

export const removeFromHistory = (id) => {
  set(KEYS.HISTORY, getHistory().filter((m) => m.id !== id));
};

export const clearHistory = () => {
  set(KEYS.HISTORY, []);
};

// 4. PROGRESS TONTONAN
export const getProgress = (id) => {
  try {
    const map = JSON.parse(localStorage.getItem(KEYS.PROGRESS)) || {};
    return map[id] || null;
  } catch {
    return null;
  }
};

export const saveProgress = (id, currentTime, duration) => {
  if (!id) return;
  try {
    const map = JSON.parse(localStorage.getItem(KEYS.PROGRESS)) || {};
    map[id] = { currentTime, duration, updated_at: new Date().toISOString() };
    localStorage.setItem(KEYS.PROGRESS, JSON.stringify(map));
  } catch {}
};
