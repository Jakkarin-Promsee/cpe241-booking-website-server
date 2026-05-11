const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/stats',    requireAuth, requireAdmin, dashboardController.getStats);
router.get('/trend',    requireAuth, requireAdmin, dashboardController.getTrend);
router.get('/upcoming', requireAuth, requireAdmin, dashboardController.getUpcoming);

module.exports = router;
