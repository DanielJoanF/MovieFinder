import { addToHistory, toggleWatchLater, isWatchLater } from '../services/db.js';
import { TMDB_IMG_BASE } from '../constants/genres.js';
import { $ } from '../utils/dom.js';
import { initGlobalNavbar } from '../components/navbar.js';
import { apiRequest } from '../api/movies.js';

const id = new URLSearchParams(location.search).get('id');
const prefix = 'moviefinder.watchLater.';
const legacyKey = prefix + id;

// Daftar domain VidSrc sebagai fallback pemutar
const VIDSRC_HOSTS = [
  'https://vidsrc.sh/embed',
  'https://vidsrc.to/embed',
  'https://vidsrc.cc/embed'
];

function getVidSrcUrl(tmdbId, hostIndex = 0) {
  const host = VIDSRC_HOSTS[hostIndex] || VIDSRC_HOSTS[0];
  return `${host}/movie/${tmdbId}`;
}

function updateSaveUI(movieId) {
  const isSaved = isWatchLater(movieId) || localStorage.getItem(legacyKey) !== null;
  const saveBtn = $('#save');
  if (!saveBtn) return;
  saveBtn.textContent = isSaved ? 'Hapus dari Watch Later' : '+ Watch Later';
  saveBtn.setAttribute('aria-pressed', String(isSaved));
}

function setupSaveButton(movie) {
  const saveBtn = $('#save');
  if (!saveBtn) return;
  updateSaveUI(movie.id);
  saveBtn.hidden = false;

  saveBtn.onclick = () => {
    try {
      const isCurrentlySaved = isWatchLater(movie.id) || localStorage.getItem(legacyKey) !== null;
      if (isCurrentlySaved) {
        localStorage.removeItem(legacyKey);
        if (isWatchLater(movie.id)) toggleWatchLater(movie);
      } else {
        localStorage.setItem(legacyKey, JSON.stringify({
          title: movie.title,
          poster: movie.poster_path || '',
          year: movie.release_date?.slice(0, 4) || '',
          time: Date.now()
        }));
        if (!isWatchLater(movie.id)) toggleWatchLater(movie);
      }
      updateSaveUI(movie.id);
    } catch {
      $('#notice').textContent = 'Perubahan gagal disimpan.';
    }
  };

  window.addEventListener('storage', () => updateSaveUI(movie.id));
}

function showTrailer(movie, allowAutoplay = true) {
  const trailers = (movie.videos?.results || []).filter(v =>
    v.site === 'YouTube' && v.type === 'Trailer' && /^[\w-]{11}$/.test(v.key)
  );
  const trailer = trailers.find(v => v.official) || trailers[0];
  if (!trailer) return;

  const frame = document.createElement('iframe');
  frame.title = `Trailer ${movie.title}`;
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  const autoplay = allowAutoplay && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0;
  frame.src = `https://www.youtube-nocookie.com/embed/${trailer.key}?playsinline=1&mute=1&autoplay=${autoplay}`;

  $('#media').replaceChildren(frame);
  $('#media').classList.add('playing');
  $('#media').hidden = false;

  const externalLink = $('#external');
  if (externalLink) {
    externalLink.href = `https://www.youtube.com/watch?v=${trailer.key}`;
    externalLink.hidden = false;
  }
}

async function loadDetail() {
  initGlobalNavbar();

  const backBtn = $('#back');
  if (backBtn && document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
    backBtn.onclick = (event) => {
      event.preventDefault();
      history.back();
    };
  }

  try {
    if (!/^\d+$/.test(id || '')) throw new Error('Invalid Movie ID');
    const movie = await apiRequest(`/movies/${id}`);

    document.title = `${movie.title} · MovieFinder`;
    $('#title').textContent = movie.title;
    $('#meta').textContent = [
      movie.release_date?.slice(0, 4),
      movie.runtime && `${movie.runtime} menit`,
      ...((movie.genres || []).map(g => g.name)),
      movie.vote_average > 0 && `TMDB ${movie.vote_average.toFixed(1)}`
    ].filter(Boolean).join(' · ');

    $('#overview').textContent = movie.overview || 'Sinopsis belum tersedia.';

    if (movie.poster_path) {
      $('#poster').src = `${TMDB_IMG_BASE}/w342${movie.poster_path}`;
      $('#media').hidden = false;
    }

    if (movie.backdrop_path) {
      const art = $('.detail-art');
      if (art) art.style.backgroundImage = `url("${TMDB_IMG_BASE}/w1280${movie.backdrop_path}")`;
    }

    setupSaveButton(movie);

    const dialog = $('#player-dialog');
    const body = $('#player-body');

    function buildVidSrcPlayer(tmdbId, hostIndex = 0) {
      const embedUrl = getVidSrcUrl(tmdbId, hostIndex);
      const wrapper = document.createElement('div');
      wrapper.className = 'vidsrc-wrapper';

      const frame = document.createElement('iframe');
      frame.src = embedUrl;
      frame.title = `Pemutar: ${movie.title}`;
      frame.allow = 'autoplay; encrypted-media; fullscreen';
      frame.allowFullscreen = true;
      frame.setAttribute('frameborder', '0');
      const switchSource = document.createElement('button');
      switchSource.type = 'button';
      switchSource.className = 'btn btn-quiet';
      switchSource.textContent = 'Ganti sumber pemutar';
      switchSource.onclick = () => {
        const next = (hostIndex + 1) % VIDSRC_HOSTS.length;
        body.replaceChildren(buildVidSrcPlayer(tmdbId, next));
        body.querySelector('button')?.focus();
      };

      wrapper.appendChild(frame);
      const player = document.createDocumentFragment();
      player.append(wrapper, switchSource);
      return player;
    }

    function openPlayer() {
      if (!dialog || !body || dialog.open) return;
      $('#media iframe')?.remove();
      dialog.showModal();
      $('#player-title').textContent = movie.title;
      body.replaceChildren(buildVidSrcPlayer(id));
      addToHistory(movie);

      try {
        localStorage.setItem(`moviefinder.history.${id}`, JSON.stringify({
          title: movie.title,
          poster: movie.poster_path || '',
          year: movie.release_date?.slice(0, 4),
          time: Date.now()
        }));
      } catch {}

    }

    if (dialog && body) {
      dialog.onclose = () => {
        body.replaceChildren();
        showTrailer(movie, false);
        $('#play')?.focus();
      };
      const playBtn = $('#play');
      playBtn.disabled = false;
      playBtn.onclick = openPlayer;
    }

    if (new URLSearchParams(location.search).get('play') === '1') {
      openPlayer();
    } else {
      showTrailer(movie);
    }

  } catch (err) {
    console.error(err);
    $('#title').textContent = 'Detail film gagal dimuat';
    $('#overview').textContent = 'Kembali ke daftar film atau muat ulang halaman.';
  }
}

document.addEventListener('DOMContentLoaded', loadDetail);
