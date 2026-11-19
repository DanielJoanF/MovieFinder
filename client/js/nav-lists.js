import { getFavorites } from './db.js';
const api = import.meta.env.VITE_API ?? '/api';

function decode(value) {
  try {
    const movie = JSON.parse(value);
    if (typeof movie?.title === 'string') return movie;
  } catch { /* Older Watch Later entries store the title directly. */ }
  return { title: value };
}

function setupShelf(section, prefix, empty) {
  const rail = section.querySelector('.rail');
  const prev = section.querySelector('.prev');
  const next = section.querySelector('.next');
  function controls() {
    const end = rail.scrollWidth - rail.clientWidth;
    prev.hidden = next.hidden = end < 2;
    prev.disabled = rail.scrollLeft < 2;
    next.disabled = rail.scrollLeft >= end - 2;
  }
  function scroll(direction) {
    rail.scrollBy({ left: direction * rail.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  prev.onclick = () => scroll(-1);
  next.onclick = () => scroll(1);
  rail.addEventListener('scroll', controls, { passive: true });
  new ResizeObserver(controls).observe(rail);

  function render() {
    rail.replaceChildren();
    try {
      const entries = prefix === 'moviefinder_favorites' ? getFavorites().map(m => ({
        key: prefix + m.id, movie: { title: m.title, year: m.year, poster: m.poster_path || '' }
      })) : Object.keys(localStorage).filter(key => key.startsWith(prefix))
        .map(key => ({ key, value: localStorage.getItem(key) })).filter(entry => entry.value)
        .map(entry => ({ ...entry, movie: decode(entry.value) }))
        .sort((a,b) => (b.movie.time || 0) - (a.movie.time || 0));
      for (const { key, value, movie } of entries) {
        const id = key.slice(prefix.length);
        if (!/^\d+$/.test(id)) continue;
        const card = document.createElement('a');
        card.className = 'card';
        card.href = './detail.html?id=' + id + '&play=1';
        card.innerHTML = '<span class="poster"></span><span class="card-title"></span>';
        card.lastElementChild.textContent = movie.title;
        const poster = card.firstElementChild;
        poster.textContent = movie.title;
        function paint(data) {
          if (data.poster) {
            const img = new Image();
            img.alt = '';
            img.loading = 'lazy';
            img.src = 'https://image.tmdb.org/t/p/w342' + data.poster;
            poster.replaceChildren(img);
          }
          if (data.year) {
            const year = document.createElement('span');
            year.className = 'year';
            year.textContent = data.year;
            poster.append(year);
          }
        }
        rail.append(card);
        if ('poster' in movie) paint(movie);
        else fetch(api + '/movies/' + id).then(r => {
          if (!r.ok) throw new Error();
          return r.json();
        }).then(detail => {
          const data = { ...movie, poster: detail.poster_path || '', year: detail.release_date?.slice(0,4) || '' };
          paint(data);
          if (localStorage.getItem(key) === value) localStorage.setItem(key, JSON.stringify(data));
        }).catch(() => {});
      }
      if (!rail.childElementCount) rail.textContent = empty;
    } catch { rail.textContent = 'Penyimpanan browser tidak tersedia.'; }
    controls();
  }
  render();
  if (prefix === 'moviefinder_favorites') window.addEventListener('favoriteschange', render);
  window.addEventListener('pageshow', event => { if (event.persisted) render(); });
  window.addEventListener('storage', event => { if (!event.key || event.key.startsWith(prefix)) render(); });
}
setupShelf(document.querySelector('#watch-later'), 'moviefinder.watchLater.', 'Simpan film dari halaman detail untuk menambahkannya ke Watch Later.');
setupShelf(document.querySelector('#riwayat'), 'moviefinder.history.', 'Film yang kamu putar akan muncul di sini.');

setupShelf(document.querySelector('#favorites'), 'moviefinder_favorites', 'Film yang kamu tandai sebagai favorit akan muncul di sini.');
