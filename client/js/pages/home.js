import { toggleFavorite, isFavorite } from '../services/db.js';
import { TMDB_IMG_BASE, GENRES } from '../constants/genres.js';
import { $, yearOf, nameOf } from '../utils/dom.js';
import { initGlobalNavbar } from '../components/navbar.js';
import { initCollectionShelves } from '../components/shelves.js';
import { apiRequest } from '../api/movies.js';
import { fetchMoviesByGenreAPI } from '../api/movies.js';

const ROTATE_MS = 9000;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

const el = {
  rail: $('#rail'),
  shelfTitle: $('#shelf-title'),
  title: $('#hero-title'),
  text: $('#hero-text'),
  meta: $('#hero-meta'),
  open: $('#hero-open'),
  fav: $('#hero-fav'),
  root: document.documentElement,
  layers: [$('#bg-a'), $('#bg-b')],
};

const state = {
  list: [],
  index: 0,
  layer: 0,
  token: 0,
  timer: null,
  details: new Map(),
  request: 0
};

function loadImage(src, cors = false) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* Warna suasana: rata-rata piksel poster */
async function ambientFrom(path) {
  if (!path) return null;
  try {
    const img = await loadImage(`${TMDB_IMG_BASE}/w92${path}`, true);
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 16, 16);
    const d = ctx.getImageData(0, 0, 16, 16).data;
    let r = 0, g = 0, b = 0, w = 0;
    for (let i = 0; i < d.length; i += 4) {
      const mx = Math.max(d[i], d[i + 1], d[i + 2]);
      const mn = Math.min(d[i], d[i + 1], d[i + 2]);
      const wt = 1 + (mx - mn) / 24;
      r += d[i] * wt; g += d[i + 1] * wt; b += d[i + 2] * wt; w += wt;
    }
    r /= w; g /= w; b /= w;
    const peak = Math.max(r, g, b) || 1;
    const k = Math.min(1.4, 150 / peak);
    return `rgb(${Math.round(r * k)} ${Math.round(g * k)} ${Math.round(b * k)})`;
  } catch {
    return null;
  }
}

async function swapBackdrop(path, token) {
  if (!path) return;
  const size = matchMedia('(max-width: 640px)').matches ? 'w780' : 'w1280';
  const url = `${TMDB_IMG_BASE}/${size}${path}`;
  try { await loadImage(url); } catch { return; }
  if (token !== state.token) return;
  const next = el.layers[1 - state.layer];
  const prev = el.layers[state.layer];
  next.style.backgroundImage = `url(${url})`;
  next.classList.remove('on');
  void next.offsetWidth;
  next.classList.add('on');
  prev.classList.remove('on');
  state.layer = 1 - state.layer;
}

function renderRail() {
  el.rail.replaceChildren();
  if (!state.list.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Tidak ada film yang ditemukan.';
    el.rail.append(p);
    return;
  }
  state.list.forEach((m, i) => {
    const b = document.createElement('a');
    b.href = `./detail.html?id=${encodeURIComponent(m.id)}`;
    b.className = 'card';
    b.dataset.i = i;
    const y = yearOf(m);
    b.innerHTML = `
      <span class="poster">
        ${m.poster_path ? `<img src="${TMDB_IMG_BASE}/w342${m.poster_path}" alt="" loading="lazy" />` : ''}
        ${y ? `<span class="year">${y}</span>` : ''}
      </span>
      <span class="card-title"></span>`;
    b.querySelector('.card-title').textContent = nameOf(m);
    b.setAttribute('aria-label', `${nameOf(m)} ${y}`.trim());

    let hoverTimer;
    b.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse' || i === state.index) return;
      hoverTimer = setTimeout(() => {
        if (b.isConnected && b.matches(':hover')) select(i, false, false);
      }, 120);
    });
    b.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
    b.addEventListener('pointerdown', () => clearTimeout(hoverTimer));
    el.rail.append(b);
  });
}

function paintHero(m, detail) {
  const logo = detail?.images?.logos?.find((l) => !l.iso_639_1 || l.iso_639_1 === 'en') || detail?.images?.logos?.[0];
  el.title.replaceChildren();
  if (logo) {
    const img = document.createElement('img');
    img.className = 'title-logo';
    img.alt = nameOf(m);
    img.src = `${TMDB_IMG_BASE}/w500${logo.file_path}`;
    img.onerror = () => { if (el.title.contains(img)) el.title.textContent = nameOf(m); };
    el.title.append(img);
  } else {
    el.title.textContent = nameOf(m);
  }
  el.text.textContent = m.overview || detail?.overview || '';

  el.meta.replaceChildren();
  const add = (txt, cls) => {
    if (!txt) return;
    const s = document.createElement('span');
    if (cls) s.className = cls;
    s.textContent = txt;
    el.meta.append(s);
  };
  add(yearOf(m));
  if (m.vote_average) add(`TMDB ${m.vote_average.toFixed(1)}`, 'score');
  add(m.media_type === 'tv' ? 'Serial' : 'Film');
  if (detail?.runtime) add(`${detail.runtime} menit`);
  (detail?.genres || []).slice(0, 3).forEach((g) => add(g.name));
}

async function getDetail(id) {
  if (state.details.has(id)) return state.details.get(id);
  try {
    const d = await apiRequest(`/movies/${id}`);
    state.details.set(id, d);
    return d;
  } catch {
    return null;
  }
}

async function select(i, byUser, centerCard = true) {
  const m = state.list[i];
  if (!m) return;
  const token = ++state.token;
  state.index = i;
  el.rail.querySelectorAll('.card').forEach((c) =>
    c.setAttribute('aria-current', String(Number(c.dataset.i) === i)));

  if (centerCard) {
    const card = el.rail.querySelector(`[data-i="${i}"]`);
    if (card) {
      const left = card.getBoundingClientRect().left - el.rail.getBoundingClientRect().left;
      el.rail.scrollBy({
        left: left - (el.rail.clientWidth - card.offsetWidth) / 2,
        behavior: reduceMotion.matches ? 'auto' : 'smooth'
      });
    }
  }

  paintHero(m, state.details.get(m.id));
  el.open.disabled = false;
  updateFavButton(m.id);

  if (byUser) restartTimer();

  swapBackdrop(m.backdrop_path || m.poster_path, token);
  const detailRequest = getDetail(m.id).then((detail) => {
    if (token === state.token && detail) paintHero(m, detail);
  });
  const color = await ambientFrom(m.poster_path || m.backdrop_path);
  if (token === state.token && color) el.root.style.setProperty('--ambient', color);
  await detailRequest;
}

function restartTimer() {
  clearInterval(state.timer);
  if (reduceMotion.matches || state.list.length < 2) return;
  if (localStorage.getItem('moviefinder_autorotate') === 'off') return;
  state.timer = setInterval(() => {
    if (document.hidden || el.rail.matches(':hover') || $('.stage')?.matches(':focus-within')) return;
    select((state.index + 1) % state.list.length, false);
  }, ROTATE_MS);
}

async function show(loader, title) {
  const request = ++state.request;
  ++state.token;
  clearInterval(state.timer);
  state.list = [];
  el.open.disabled = true;
  el.title.textContent = 'Memuat film...';
  el.text.textContent = '';
  el.meta.replaceChildren();
  el.shelfTitle.textContent = title;
  el.rail.replaceChildren();
  el.rail.setAttribute('aria-busy', 'true');

  try {
    const data = await loader();
    if (request !== state.request) return;
    state.list = (data.results || []).filter((m) => m.poster_path || m.backdrop_path).slice(0, 20);
    if (!state.list.length) el.title.textContent = 'Film tidak ditemukan';
    renderRail();
    if (state.list.length) select(0, true);
  } catch {
    if (request !== state.request) return;
    el.title.textContent = 'Daftar film gagal dimuat';
    el.text.textContent = 'Coba cari lagi atau muat ulang halaman.';
  } finally {
    if (request === state.request) el.rail.removeAttribute('aria-busy');
  }
}

function updateFavButton(movieId) {
  if (!el.fav) return;
  const isFav = isFavorite(movieId);
  el.fav.textContent = isFav ? 'Tersimpan' : 'Favorit';
  el.fav.classList.toggle('active', isFav);
}

function showGenre(id, name) {
  show(() => fetchMoviesByGenreAPI(id), `Genre: ${name}`);
  $('#shelf')?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
}

function handleSearch(query) {
  if (!query) return show(() => apiRequest('/movies/trending'), 'Trending');
  show(() => apiRequest(`/movies/search?q=${encodeURIComponent(query)}`), `Hasil untuk "${query}"`);
}

// Inisialisasi Aplikasi Halaman Utama
document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi Navbar Global (termasuk drawer, header size, dan search)
  initGlobalNavbar({
    onSearch: (q) => handleSearch(q),
    onGenreClick: (id, name) => showGenre(id, name)
  });

  initCollectionShelves();

  el.open?.addEventListener('click', () => {
    const movie = state.list[state.index];
    if (movie) {
      location.assign(`./detail.html?id=${encodeURIComponent(movie.id)}&play=1`);
    }
  });

  // Tombol Favorit (langsung simpan tanpa butuh login)
  el.fav?.addEventListener('click', () => {
    const m = state.list[state.index];
    if (!m) return;
    toggleFavorite(m);
    window.dispatchEvent(new Event('favoriteschange'));
    updateFavButton(m.id);
  });

  el.rail?.addEventListener('keydown', (e) => {
    const card = e.target.closest('.card');
    const direction = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!card || !direction) return;
    e.preventDefault();
    const index = Number(card.dataset.i) + direction;
    el.rail.querySelector(`[data-i="${index}"]`)?.focus({ preventScroll: true });
    select(index, true);
  });

  reduceMotion.addEventListener('change', restartTimer);

  // Periksa apakah ada parameter query pencarian atau genre di URL
  const searchParam = new URLSearchParams(location.search).get('q');
  const genreParam = new URLSearchParams(location.search).get('genre');
  const genreHit = GENRES.find(([id]) => String(id) === genreParam);

  if (searchParam) {
    const searchInput = $('#search-input');
    if (searchInput) searchInput.value = searchParam;
    handleSearch(searchParam);
  } else if (genreHit) {
    showGenre(genreHit[0], genreHit[1]);
  } else {
    show(() => apiRequest('/movies/trending'), 'Trending');
  }
});