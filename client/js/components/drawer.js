import { GENRES } from '../constants/genres.js';
import { $ } from '../utils/dom.js';

/**
 * Inisialisasi Drawer Menu dan Daftar Genre
 * @param {Object} [options]
 * @param {Function} [options.onGenreClick] - Custom handler saat genre diklik
 */
export function initDrawer({ onGenreClick } = {}) {
  const drawer = $('#drawer');
  const scrim = $('#scrim');
  const menuBtn = $('#menu-btn');
  const menuClose = $('#menu-close');
  const genreList = $('#genre-list');

  if (!drawer || !menuBtn) return;

  function setMenu(open) {
    drawer.classList.toggle('open', open);
    drawer.inert = !open;
    if (scrim) scrim.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('no-scroll', open);
    if (open) {
      drawer.querySelector('summary, a')?.focus();
    } else {
      menuBtn.focus({ preventScroll: true });
    }
  }

  menuBtn.addEventListener('click', () => setMenu(true));
  if (menuClose) menuClose.addEventListener('click', () => setMenu(false));
  if (scrim) scrim.addEventListener('click', () => setMenu(false));

  drawer.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      setMenu(false);
    }
  });

  // Render daftar genre jika elemen tersedia dan masih kosong
  if (genreList && genreList.children.length === 0) {
    GENRES.forEach(([id, name]) => {
      if (onGenreClick) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = name;
        b.addEventListener('click', () => {
          setMenu(false);
          onGenreClick(id, name);
        });
        genreList.append(b);
      } else {
        const a = document.createElement('a');
        a.href = `./?genre=${id}`;
        a.textContent = name;
        genreList.append(a);
      }
    });
  }

  return { setMenu };
}
