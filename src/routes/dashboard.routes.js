const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/stats',    requireAuth, dashboardController.getStats);
router.get('/trend',    requireAuth, dashboardController.getTrend);
router.get('/upcoming', requireAuth, dashboardController.getUpcoming);

module.exports = router;
