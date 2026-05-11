const reportModel = require('../models/report.model');

async function getStats(period)       { return reportModel.getStats(period); }
async function getDailyRevenue()      { return reportModel.getDailyRevenue(); }
async function getMonthlyRevenue()    { return reportModel.getMonthlyRevenue(); }

module.exports = { getStats, getDailyRevenue, getMonthlyRevenue };
