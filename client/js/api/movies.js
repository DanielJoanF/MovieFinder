// API Client untuk komunikasi dengan backend server
const API_BASE = import.meta.env?.VITE_API ?? '/api';

export async function apiRequest(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchHealth() {
  return apiRequest('/health');
}

export async function searchMoviesAPI(query) {
  return apiRequest(`/movies/search?q=${encodeURIComponent(query)}`);
}

export async function fetchTrendingMoviesAPI() {
  return apiRequest('/movies/trending');
}

export async function fetchMovieDetailsAPI(id) {
  return apiRequest(`/movies/${id}`);
}

export async function fetchMoviesByGenreAPI(genreId) {
  return apiRequest(`/movies/genre/${genreId}`);
}
