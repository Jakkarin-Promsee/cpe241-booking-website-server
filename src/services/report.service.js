const reportModel = require('../models/report.model');

const VALID_PERIODS = ['weekly', 'monthly', 'yearly'];
const VALID_GROUP_BY = ['date', 'movie', 'venue'];
const VALID_METRICS = ['sales', 'occupancy'];

async function getStats(period = 'weekly') {
  if (period && !VALID_PERIODS.includes(period)) {
    const err = new Error(`period must be one of: ${VALID_PERIODS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  return reportModel.getStats(period);
}

async function getDailyRevenue(period = 'weekly') {
  if (period && !VALID_PERIODS.includes(period)) {
    const err = new Error(`period must be one of: ${VALID_PERIODS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  return reportModel.getDailyRevenue(period);
}
async function getMonthlyRevenue() { return reportModel.getMonthlyRevenue(); }

async function getBreakdown({ period = 'weekly', groupBy = 'date', metric = 'sales' } = {}) {
  if (period && !VALID_PERIODS.includes(period)) {
    const err = new Error(`period must be one of: ${VALID_PERIODS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  if (groupBy && !VALID_GROUP_BY.includes(groupBy)) {
    const err = new Error(`groupBy must be one of: ${VALID_GROUP_BY.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  if (metric && !VALID_METRICS.includes(metric)) {
    const err = new Error(`metric must be one of: ${VALID_METRICS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  return reportModel.getBreakdown(period, groupBy, metric);
}

module.exports = { getStats, getDailyRevenue, getMonthlyRevenue, getBreakdown };
