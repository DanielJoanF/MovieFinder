// Library: Favorites and Watch History

export function setupLibraryNav() {
  const libraryBtn = document.getElementById('nav-library');
  const trendingBtn = document.getElementById('nav-trending');

  libraryBtn.addEventListener('click', () => {
    libraryBtn.classList.add('active');
    trendingBtn.classList.remove('active');
    console.log('Open Library / Favorites');
  });

  trendingBtn.addEventListener('click', () => {
    trendingBtn.classList.add('active');
    libraryBtn.classList.remove('active');
  });
}
