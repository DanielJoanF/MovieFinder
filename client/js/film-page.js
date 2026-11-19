const $ = selector => document.querySelector(selector);
const api = import.meta.env.VITE_API ?? '/api';
const id = new URLSearchParams(location.search).get('id');
const img = 'https://image.tmdb.org/t/p';

if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
  $('#back').onclick = event => { event.preventDefault(); history.back(); };
}

const prefix = 'moviefinder.watchLater.';
const key = prefix + id;
function updateSave() {
  const saved = localStorage.getItem(key) !== null;
  $('#save').textContent = saved ? 'Hapus dari Watch Later' : '+ Watch Later';
  $('#save').setAttribute('aria-pressed', String(saved));
}
$('#library').onclick = () => {
  const items = $('#items');
  items.replaceChildren();
  try {
    for (const name of Object.keys(localStorage).filter(name => name.startsWith(prefix))) {
      const link = document.createElement('a');
      link.href = './detail.html?id=' + encodeURIComponent(name.slice(prefix.length));
      link.textContent = localStorage.getItem(name);
      const li = document.createElement('li');
      li.append(link);
      items.append(li);
    }
    if (!items.children.length) items.textContent = 'Belum ada film tersimpan.';
  } catch { items.textContent = 'Penyimpanan browser tidak tersedia.'; }
  $('#watch-list').showModal();
};
function setupSave(movie) {
  try { updateSave(); } catch { return; }
  $('#save').hidden = false;
  $('#save').onclick = () => {
    try {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, movie.title);
      else localStorage.removeItem(key);
      updateSave();
    } catch { $('#notice').textContent = 'Perubahan gagal disimpan.'; }
  };
  window.addEventListener('storage', updateSave);
}
function showVideo(movie) {
  const trailers = (movie.videos?.results || []).filter(v =>
    v.site === 'YouTube' && v.type === 'Trailer' && /^[\w-]{11}$/.test(v.key));
  const trailer = trailers.find(v => v.official) || trailers[0];
  if (!trailer) return;
  const frame = document.createElement('iframe');
  frame.title = 'Trailer ' + movie.title;
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  const autoplay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;
  frame.src = 'https://www.youtube-nocookie.com/embed/' + trailer.key +
    '?playsinline=1&mute=1&autoplay=' + autoplay;
  $('#media').replaceChildren(frame);
  $('#media').classList.add('playing');
  $('#media').hidden = false;
  $('#external').href = 'https://www.youtube.com/watch?v=' + trailer.key;
  $('#external').hidden = false;
}

async function load() {
  try {
    if (!/^\d+$/.test(id || '')) throw new Error();
    const response = await fetch(`${api}/movies/${id}`);
    if (!response.ok) throw new Error();
    const movie = await response.json();
    document.title = movie.title + ' · MovieFinder';
    $('#title').textContent = movie.title;
    $('#meta').textContent = [movie.release_date?.slice(0,4), movie.runtime && movie.runtime + ' menit',
      ...((movie.genres || []).map(g => g.name)), movie.vote_average > 0 && 'TMDB ' + movie.vote_average.toFixed(1)].filter(Boolean).join(' · ');
    $('#overview').textContent = movie.overview || 'Sinopsis belum tersedia.';
    if (movie.poster_path) {
      $('#poster').src = img + '/w342' + movie.poster_path;
      $('#media').hidden = false;
    }
    if (movie.backdrop_path) $('.detail-art').style.backgroundImage = `url("${img}/w1280${movie.backdrop_path}")`;
    setupSave(movie);
    showVideo(movie);
  } catch {
    $('#title').textContent = 'Detail film gagal dimuat';
    $('#overview').textContent = 'Kembali ke daftar film atau muat ulang halaman.';
  }
}
load();
