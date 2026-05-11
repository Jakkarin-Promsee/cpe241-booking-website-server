const dashboardService = require('../services/dashboard.service');

async function getStats(req, res, next) {
  try {
    res.json(await dashboardService.getStats());
  } catch (err) {
    next(err);
  }
}

async function getTrend(req, res, next) {
  try {
    res.json(await dashboardService.getTrend());
  } catch (err) {
    next(err);
  }
}

async function getUpcoming(req, res, next) {
  try {
    res.json(await dashboardService.getUpcoming());
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats, getTrend, getUpcoming };
