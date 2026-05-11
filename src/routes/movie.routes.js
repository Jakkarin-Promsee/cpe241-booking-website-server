const express = require('express');
const movieController = require('../controllers/movie.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', movieController.listMovies);
router.post('/', requireAuth, movieController.createMovie);
router.put('/:id', requireAuth, movieController.updateMovie);
router.delete('/:id', requireAuth, movieController.deleteMovie);

module.exports = router;
