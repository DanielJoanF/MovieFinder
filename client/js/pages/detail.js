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

function showTrailer(movie) {
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
  const autoplay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;
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
      frame.loading = 'lazy';

      frame.onerror = () => {
        if (hostIndex + 1 < VIDSRC_HOSTS.length) {
          body.replaceChildren(buildVidSrcPlayer(tmdbId, hostIndex + 1));
        } else {
          body.innerHTML = `
            <p class="player-error">
              Pemutar gagal dimuat dari semua sumber.<br>
              <a href="https://vidsrc.to/embed/movie/${tmdbId}" target="_blank" rel="noopener">
                Coba buka langsung di VidSrc →
              </a>
            </p>`;
        }
      };

      wrapper.appendChild(frame);
      return wrapper;
    }

    function openPlayer() {
      if (!dialog || !body) return;
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

      dialog.showModal();
    }

    if (dialog && body) {
      dialog.onclose = () => body.replaceChildren();
    }

    const playBtn = $('#play');
    if (playBtn) {
      playBtn.disabled = false;
      playBtn.onclick = () => {
        $('#media iframe')?.remove();
        openPlayer();
      };
    }

    if (new URLSearchParams(location.search).get('play') === '1') {
      openPlayer();
    } else {
      showTrailer(movie);
    }

    if (dialog) {
      dialog.addEventListener('close', () => showTrailer(movie));
    }
  } catch (err) {
    console.error(err);
    $('#title').textContent = 'Detail film gagal dimuat';
    $('#overview').textContent = 'Kembali ke daftar film atau muat ulang halaman.';
  }
}

document.addEventListener('DOMContentLoaded', loadDetail);
