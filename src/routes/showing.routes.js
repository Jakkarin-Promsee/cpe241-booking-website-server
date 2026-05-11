const express = require('express');
const showingController = require('../controllers/showing.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/',      showingController.listShowings);
router.post('/',     requireAuth, showingController.createShowing);
router.put('/:id',   requireAuth, showingController.updateShowing);
router.delete('/:id', requireAuth, showingController.deleteShowing);

module.exports = router;
