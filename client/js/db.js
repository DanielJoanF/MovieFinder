// Local Database Manager using sql.js + IndexedDB persistence

let db = null;

export async function initDB() {
  // Setup tables schema sesuai perancangan:
  // movies, favorites, watch_history, watch_progress
  console.log('Database init stub ready.');
}

export function getDB() {
  return db;
}
