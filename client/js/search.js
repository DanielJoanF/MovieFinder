// Search & Movie Grid Handling
import { searchMoviesAPI, fetchTrendingMoviesAPI } from './api.js';
import { renderDetail } from './detail.js';

export function setupSearch() {
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    try {
      const data = await searchMoviesAPI(query);
      renderMoviesGrid(data.results || []);
    } catch (err) {
      console.error(err);
    }
  });
}

export async function loadTrendingMovies() {
  try {
    const data = await fetchTrendingMoviesAPI();
    renderMoviesGrid(data.results || []);
  } catch (err) {
    console.error(err);
  }
}

export function renderMoviesGrid(movies) {
  const grid = document.getElementById('movies-grid');
  grid.innerHTML = '';

  if (movies.length === 0) {
    grid.innerHTML = '<p>Tidak ada film ditemukan.</p>';
    return;
  }

  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    const poster = movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : 'https://via.placeholder.com/500x750?text=No+Poster';

    card.innerHTML = `
      <img src="${poster}" alt="${movie.title}" loading="lazy" />
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <p>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
      </div>
    `;

    card.addEventListener('click', () => {
      renderDetail(movie.id);
    });

    grid.appendChild(card);
  });
}
