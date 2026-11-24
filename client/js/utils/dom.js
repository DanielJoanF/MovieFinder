export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

export const yearOf = (movie) => (movie?.release_date || movie?.first_air_date || '').slice(0, 4);
export const nameOf = (movie) => movie?.title || movie?.name || '';

/**
 * Mengatur CSS variable --nav-height berdasarkan tinggi elemen header
 */
export function initHeaderSize(selector = 'header.bar') {
  const header = document.querySelector(selector);
  if (!header) return;

  function measure() {
    document.documentElement.style.setProperty('--nav-height', `${header.offsetHeight}px`);
  }

  measure();
  new ResizeObserver(measure).observe(header);
}
