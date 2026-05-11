const express = require('express');
const movieController = require('../controllers/movie.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', movieController.listMovies);
router.post('/',    requireAuth, requireAdmin, movieController.createMovie);
router.put('/:id',  requireAuth, requireAdmin, movieController.updateMovie);
router.delete('/:id', requireAuth, requireAdmin, movieController.deleteMovie);

module.exports = router;
