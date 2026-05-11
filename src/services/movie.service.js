const movieModel = require('../models/movie.model');

const MOVIE_STATUSES = ['Active', 'Inactive'];

function assertMovieFields(data) {
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    const err = new Error('title is required');
    err.statusCode = 400;
    throw err;
  }
  const dur = Number(data.duration);
  if (!Number.isFinite(dur) || dur <= 0 || !Number.isInteger(dur)) {
    const err = new Error('duration must be a positive integer (minutes)');
    err.statusCode = 400;
    throw err;
  }
  const status = data.status !== undefined ? data.status : 'Active';
  if (!MOVIE_STATUSES.includes(status)) {
    const err = new Error(`status must be one of: ${MOVIE_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
}

async function listMovies(filters) {
  return movieModel.findAll(filters);
}

async function createMovie(data) {
  assertMovieFields(data);
  const id = await movieModel.create({ ...data, status: data.status || 'Active' });
  return movieModel.findById(id);
}

async function updateMovie(id, data) {
  const movie = await movieModel.findById(id);
  if (!movie) {
    const err = new Error('Movie not found');
    err.statusCode = 404;
    throw err;
  }
  assertMovieFields(data);
  await movieModel.update(id, { ...data });
  return movieModel.findById(id);
}

async function deleteMovie(id) {
  const movie = await movieModel.findById(id);
  if (!movie) {
    const err = new Error('Movie not found');
    err.statusCode = 404;
    throw err;
  }
  const busy = await movieModel.hasShowings(id);
  if (busy) {
    const err = new Error('Cannot delete a movie that has existing showings');
    err.statusCode = 409;
    throw err;
  }
  await movieModel.remove(id);
}

module.exports = { listMovies, createMovie, updateMovie, deleteMovie };
