const header = document.querySelector('header.bar');
function measureHeader() {
  document.documentElement.style.setProperty('--nav-height', header.offsetHeight + 'px');
}
measureHeader();
new ResizeObserver(measureHeader).observe(header);
