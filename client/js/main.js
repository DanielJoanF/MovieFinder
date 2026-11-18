// Main Application Entry Point
import { initDB } from './db.js';
import { setupSearch, loadTrendingMovies } from './search.js';
import { setupLibraryNav } from './library.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Movie Finder App Initializing...');

  try {
    await initDB();
    console.log('Local SQLite DB initialized successfully');
  } catch (error) {
    console.error('Failed to initialize local DB:', error);
  }

  setupSearch();
  setupLibraryNav();
  loadTrendingMovies();
});
