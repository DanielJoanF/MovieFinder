// API client for communication with Express backend

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function searchMoviesAPI(query) {
  const res = await fetch(`${API_BASE}/movies/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Gagal mencari film');
  return res.json();
}

export async function fetchTrendingMoviesAPI() {
  const res = await fetch(`${API_BASE}/movies/trending`);
  if (!res.ok) throw new Error('Gagal mengambil film trending');
  return res.json();
}

export async function fetchMovieDetailsAPI(id) {
  const res = await fetch(`${API_BASE}/movies/${id}`);
  if (!res.ok) throw new Error('Gagal mengambil detail film');
  return res.json();
}
