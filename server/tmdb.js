const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function getApiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error('TMDB_API_KEY is not configured in .env file');
  }
  return key;
}

export async function searchMovies(query) {
  const apiKey = getApiKey();
  const url = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=id-ID`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.statusText}`);
  return res.json();
}

export async function getTrendingMovies() {
  const apiKey = getApiKey();
  const url = `${TMDB_BASE_URL}/trending/movie/week?api_key=${apiKey}&language=id-ID`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.statusText}`);
  return res.json();
}

export async function getMovieDetails(id) {
  const apiKey = getApiKey();
  const url = `${TMDB_BASE_URL}/movie/${id}?api_key=${apiKey}&language=id-ID&append_to_response=videos,credits`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.statusText}`);
  return res.json();
}
