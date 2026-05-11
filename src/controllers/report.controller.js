const reportService = require('../services/report.service');

async function getStats(req, res, next) {
  try {
    res.json(await reportService.getStats(req.query.period));
  } catch (err) {
    next(err);
  }
}

async function getDailyRevenue(req, res, next) {
  try {
    res.json(await reportService.getDailyRevenue());
  } catch (err) {
    next(err);
  }
}

async function getMonthlyRevenue(req, res, next) {
  try {
    res.json(await reportService.getMonthlyRevenue());
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats, getDailyRevenue, getMonthlyRevenue };
