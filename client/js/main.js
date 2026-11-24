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
const navLinks = document.querySelectorAll("[data-page]");
const pages = document.querySelectorAll(".page");

function showPage(pageId) {
    pages.forEach(page => {
        page.classList.remove("active");
    });

    navLinks.forEach(link => {
        link.classList.remove("active");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active");
    }

    document.querySelectorAll(
        `.navbar nav [data-page="${pageId}"]`
    ).forEach(link => {
        link.classList.add("active");
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

navLinks.forEach(link => {
    link.addEventListener("click", function(event) {
        event.preventDefault();

        const pageId = this.dataset.page;

        showPage(pageId);
    });
});
