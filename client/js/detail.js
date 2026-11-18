// Movie Detail View Handling
import { fetchMovieDetailsAPI } from './api.js';

export async function renderDetail(movieId) {
  const detailView = document.getElementById('detail-view');
  const gridView = document.getElementById('movies-grid');

  try {
    const movie = await fetchMovieDetailsAPI(movieId);
    gridView.classList.add('hidden');
    detailView.classList.remove('hidden');

    detailView.innerHTML = `
      <button id="back-to-grid" class="back-btn">← Kembali</button>
      <div class="detail-container">
        <h2>${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : ''})</h2>
        <p>${movie.overview || 'Sinopsis belum tersedia.'}</p>
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
