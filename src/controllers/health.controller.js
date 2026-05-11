const healthService = require('../services/health.service');

async function getHealth(req, res, next) {
  try {
    const data = await healthService.getHealthStatus();
    res.json({
      ok: true,
      ...data,
      mysql: {
        ...data.mysql,
        database: process.env.MYSQL_DATABASE ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHealth };
