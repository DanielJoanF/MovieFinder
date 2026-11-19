// Storage Manager Sederhana menggunakan localStorage bawaan browser
// Menggantikan SQLite/IndexedDB yang berat tanpa perlu file WASM

const STORAGE_KEYS = {
  FAVORITES: 'moviefinder_favorites',
  HISTORY: 'moviefinder_history',
  PROGRESS: 'moviefinder_progress'
};

function read(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (err) {
    console.warn(`Gagal membaca ${key}:`, err);
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Gagal menyimpan ${key}:`, err);
  }
}

// 1. Inisialisasi DB (Ringan, langsung siap pakai)
export async function initDB() {
  console.log('Local storage database siap digunakan.');
  return true;
}

// 2. Favorit
export function toggleFavorite(movie) {
  if (!movie?.id) return false;
  const list = read(STORAGE_KEYS.FAVORITES, []);
  const index = list.findIndex(m => m.id === movie.id);

  if (index >= 0) {
    list.splice(index, 1);
    write(STORAGE_KEYS.FAVORITES, list);
    return false; // Dihapus dari favorit
  } else {
    list.unshift({
      id: movie.id,
      title: movie.title || movie.name,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      year: (movie.release_date || movie.first_air_date || '').slice(0, 4),
      added_at: new Date().toISOString()
    });
    write(STORAGE_KEYS.FAVORITES, list);
    return true; // Ditambahkan ke favorit
  }
}

export function isFavorite(movieId) {
  const list = read(STORAGE_KEYS.FAVORITES, []);
  return list.some(m => m.id === movieId);
}

export function getFavorites() {
  return read(STORAGE_KEYS.FAVORITES, []);
}

// 3. Riwayat Tontonan
export function addToHistory(movie) {
  if (!movie?.id) return;
  let list = read(STORAGE_KEYS.HISTORY, []);
  // Hapus jika sudah pernah ditonton agar naik ke posisi teratas
  list = list.filter(m => m.id !== movie.id);
  list.unshift({
    id: movie.id,
    title: movie.title || movie.name,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    watched_at: new Date().toISOString()
  });
  // Batasi riwayat maksimal 50 film terakhir
  if (list.length > 50) list.pop();
  write(STORAGE_KEYS.HISTORY, list);
}

export function getHistory() {
  return read(STORAGE_KEYS.HISTORY, []);
}

// 4. Progress Pemutaran Video
export function saveProgress(movieId, currentTime, duration) {
  if (!movieId) return;
  const map = read(STORAGE_KEYS.PROGRESS, {});
  map[movieId] = {
    currentTime,
    duration,
    updated_at: new Date().toISOString()
  };
  write(STORAGE_KEYS.PROGRESS, map);
}

export function getProgress(movieId) {
  const map = read(STORAGE_KEYS.PROGRESS, {});
  return map[movieId] || null;
}
