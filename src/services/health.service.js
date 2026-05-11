const healthModel = require('../models/health.model');

async function getHealthStatus() {
  const version = await healthModel.getMysqlVersion();
  return {
    mysql: {
      connected: true,
      version,
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT) || 3306,
    },
  };
}

module.exports = { getHealthStatus };
