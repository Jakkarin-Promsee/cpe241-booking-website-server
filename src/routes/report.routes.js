const express = require('express');
const reportController = require('../controllers/report.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/stats',           requireAuth, reportController.getStats);
router.get('/revenue/daily',   requireAuth, reportController.getDailyRevenue);
router.get('/revenue/monthly', requireAuth, reportController.getMonthlyRevenue);

module.exports = router;
