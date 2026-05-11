const reportModel = require('../models/report.model');

const VALID_PERIODS = ['weekly', 'monthly', 'yearly'];

async function getStats(period = 'weekly') {
  if (period && !VALID_PERIODS.includes(period)) {
    const err = new Error(`period must be one of: ${VALID_PERIODS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  return reportModel.getStats(period);
}

async function getDailyRevenue()   { return reportModel.getDailyRevenue(); }
async function getMonthlyRevenue() { return reportModel.getMonthlyRevenue(); }

module.exports = { getStats, getDailyRevenue, getMonthlyRevenue };
