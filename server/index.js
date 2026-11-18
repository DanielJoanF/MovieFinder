import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchMovies, getTrendingMovies, getMovieDetails } from './tmdb.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Movie Finder API server is running!' });
});

// 2. Search movies
app.get('/api/movies/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    const data = await searchMovies(query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Trending movies
app.get('/api/movies/trending', async (req, res) => {
  try {
    const data = await getTrendingMovies();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Movie details
app.get('/api/movies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = await getMovieDetails(id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Movie Finder API listening on http://localhost:${PORT}`);
});
