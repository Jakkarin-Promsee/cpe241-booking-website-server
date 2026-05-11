const movieModel = require('../models/movie.model');

async function listMovies(filters) {
  return movieModel.findAll(filters);
}

async function createMovie(data) {
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
