import { $, initHeaderSize } from '../utils/dom.js';
import { initDrawer } from './drawer.js';

/**
 * Inisialisasi Navbar Global di semua halaman
 * @param {Object} [options]
 * @param {Function} [options.onSearch] - Custom search handler untuk halaman beranda
 * @param {Function} [options.onGenreClick] - Custom genre click handler
 */
export function initGlobalNavbar({ onSearch, onGenreClick } = {}) {
  // 1. Inisialisasi ukuran responsif header
  initHeaderSize();

  // 2. Inisialisasi menu drawer samping
  initDrawer({ onGenreClick });

  // 3. Tangani form pencarian
  const searchForm = $('#search-form');
  const searchInput = $('#search-input');

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();

      if (onSearch) {
        // Jika ada handler lokal (di index.html)
        onSearch(query);
      } else {
        // Jika di halaman lain (detail / library), arahkan ke beranda dengan query pencarian
        if (query) {
          location.assign(`./?q=${encodeURIComponent(query)}`);
        } else {
          location.assign('./');
        }
      }
    });
  }

  // 4. Highlight navigasi aktif
  function highlightActiveLinks() {
    const currentPath = location.pathname.toLowerCase();
    const currentHash = location.hash;

    document.querySelectorAll('.site-nav a').forEach((link) => {
      const href = link.getAttribute('href');
      const isHome = (href === './' || href === '/') && (currentPath.endsWith('index.html') || currentPath.endsWith('/')) && !currentHash;
      const isCurrentHash = currentHash && href.includes(currentHash);
      const isCurrentPage = href.includes('library.html') && currentPath.includes('library.html');

      if (isHome || isCurrentHash || isCurrentPage) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  window.addEventListener('hashchange', highlightActiveLinks);
  highlightActiveLinks();
}
