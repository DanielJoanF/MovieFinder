import {
  getHistory,
  getFavorites,
  getWatchLater,
  toggleFavorite,
  toggleWatchLater,
  removeFromHistory,
  clearHistory
} from '../services/db.js';
import { TMDB_IMG_BASE } from '../constants/genres.js';
import { $ } from '../utils/dom.js';
import { initGlobalNavbar } from '../components/navbar.js';

const TABS = {
  riwayat: {
    title: 'Riwayat tontonan',
    get: getHistory,
    remove: (m) => removeFromHistory(m.id),
    empty: 'Belum ada film yang kamu buka.'
  },
  favorit: {
    title: 'Favorit',
    get: getFavorites,
    remove: (m) => toggleFavorite(m),
    empty: 'Belum ada film favorit. Tekan tombol Favorit pada film yang kamu suka.'
  },
  'watch-later': {
    title: 'Watch later',
    get: getWatchLater,
    remove: (m) => toggleWatchLater(m),
    empty: 'Belum ada film di daftar tonton nanti.'
  }
};

let currentTab = new URLSearchParams(location.search).get('tab');
if (!TABS[currentTab]) currentTab = 'riwayat';

function renderLibrary() {
  const t = TABS[currentTab];
  $('#page-title').textContent = t.title;
  document.title = `${t.title} | MovieFinder`;

  document.querySelectorAll('.tab').forEach((b) =>
    b.setAttribute('aria-selected', String(b.dataset.tab === currentTab))
  );

  const list = t.get();
  $('#count').textContent = list.length ? `${list.length} film` : '';
  $('#clear').hidden = currentTab !== 'riwayat' || !list.length;

  const grid = $('#grid');
  grid.replaceChildren();

  if (!list.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = t.empty;
    grid.append(p);
    return;
  }

  list.forEach((m) => {
    const card = document.createElement('div');
    card.className = 'lib-card';

    const a = document.createElement('a');
    a.href = `./detail.html?id=${encodeURIComponent(m.id)}`;
    a.innerHTML = `
      <span class="poster">
        ${m.poster_path ? `<img src="${TMDB_IMG_BASE}/w342${m.poster_path}" alt="" loading="lazy" />` : ''}
        ${m.year ? `<span class="year">${m.year}</span>` : ''}
      </span>
      <span class="card-title"></span>`;
    a.querySelector('.card-title').textContent = m.title || '';

    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'lib-remove';
    rm.textContent = 'Hapus';
    rm.setAttribute('aria-label', `Hapus ${m.title || 'film'} dari ${t.title}`);
    rm.addEventListener('click', () => {
      t.remove(m);
      renderLibrary();
    });

    card.append(a, rm);
    grid.append(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initGlobalNavbar();

  document.querySelectorAll('.tab').forEach((b) =>
    b.addEventListener('click', () => {
      currentTab = b.dataset.tab;
      history.replaceState(null, '', `?tab=${currentTab}`);
      renderLibrary();
    })
  );

  $('#clear')?.addEventListener('click', () => {
    if (confirm('Hapus semua riwayat tontonan?')) {
      clearHistory();
      renderLibrary();
    }
  });

  renderLibrary();
});
