const express = require('express');
const reportController = require('../controllers/report.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/stats',           requireAuth, requireAdmin, reportController.getStats);
router.get('/revenue/daily',   requireAuth, requireAdmin, reportController.getDailyRevenue);
router.get('/revenue/monthly', requireAuth, requireAdmin, reportController.getMonthlyRevenue);

module.exports = router;
