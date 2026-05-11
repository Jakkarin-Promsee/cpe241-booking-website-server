const express = require('express');
const showingController = require('../controllers/showing.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/',       showingController.listShowings);
router.post('/',      requireAuth, requireAdmin, showingController.createShowing);
router.put('/:id',    requireAuth, requireAdmin, showingController.updateShowing);
router.delete('/:id', requireAuth, requireAdmin, showingController.deleteShowing);

module.exports = router;
