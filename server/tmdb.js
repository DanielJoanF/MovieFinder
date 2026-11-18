import dotenv from 'dotenv';
dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function getHeaders() {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) {
    throw new Error('TMDB_READ_ACCESS_TOKEN is not configured in .env file');
  }

  return {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`
    }
  };
}

export async function searchMovies(query) {
  const options = getHeaders();
  const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=id-ID`;
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`TMDB error: ${res.statusText}`);
  return res.json();
}

export async function getTrendingMovies() {
  const options = getHeaders();
  const url = `${TMDB_BASE_URL}/trending/movie/week?language=id-ID`;
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`TMDB error: ${res.statusText}`);
  return res.json();
}

export async function getMovieDetails(id) {
  const options = getHeaders();
  const url = `${TMDB_BASE_URL}/movie/${id}?language=id-ID&append_to_response=videos,credits,images&include_image_language=en,null`;
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`TMDB error: ${res.statusText}`);
  return res.json();
}
