// Movie Detail View Handling
import { fetchMovieDetailsAPI } from './api.js';

export async function renderDetail(movieId) {
  const detailView = document.getElementById('detail-view');
  const gridView = document.getElementById('movies-grid');

  try {
    const movie = await fetchMovieDetailsAPI(movieId);
    gridView.classList.add('hidden');
    detailView.classList.remove('hidden');

    const poster = movie.poster_url || (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '');
    const backdrop = movie.backdrop_url || (movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : '');

    detailView.innerHTML = `
      <button id="back-to-grid" class="back-btn">← Kembali</button>
      <div class="detail-container" style="${backdrop ? `background: linear-gradient(to bottom, rgba(15,16,21,0.8), #0f1015), url('${backdrop}') center/cover no-repeat;` : ''}">
        <div class="detail-content">
          ${poster ? `<img src="${poster}" alt="${movie.title}" class="detail-poster" />` : ''}
          <div class="detail-info">
            <h2>${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : ''})</h2>
            ${movie.tagline ? `<p class="tagline"><em>"${movie.tagline}"</em></p>` : ''}
            <p class="rating">${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'} / 10</p>
            <p class="genres"><strong>Genre:</strong> ${movie.genres ? movie.genres.map(g => g.name).join(', ') : '-'}</p>
            <p class="overview">${movie.overview || 'Sinopsis belum tersedia.'}</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('back-to-grid').addEventListener('click', () => {
      detailView.classList.add('hidden');
      gridView.classList.remove('hidden');
    });
  } catch (err) {
    console.error('Error fetching details:', err);
  }
}
