const dashboardModel = require('../models/dashboard.model');

async function getStats()    { return dashboardModel.getStats(); }
async function getTrend()    { return dashboardModel.getTrend(); }
async function getUpcoming() { return dashboardModel.getUpcoming(); }

module.exports = { getStats, getTrend, getUpcoming };
