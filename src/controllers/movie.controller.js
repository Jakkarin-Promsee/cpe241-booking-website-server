const movieService = require('../services/movie.service');

async function listMovies(req, res, next) {
  try {
    const movies = await movieService.listMovies(req.query);
    res.json(movies);
  } catch (err) {
    next(err);
  }
}

async function createMovie(req, res, next) {
  try {
    const movie = await movieService.createMovie(req.body);
    res.status(201).json(movie);
  } catch (err) {
    next(err);
  }
}

async function updateMovie(req, res, next) {
  try {
    const movie = await movieService.updateMovie(req.params.id, req.body);
    res.json(movie);
  } catch (err) {
    next(err);
  }
}

async function deleteMovie(req, res, next) {
  try {
    await movieService.deleteMovie(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listMovies, createMovie, updateMovie, deleteMovie };
