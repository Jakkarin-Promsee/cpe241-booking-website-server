require('./config/env');

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set in .env — auth endpoints will not work');
}

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;
const { waitForMysqlReady } = require('./db/mysqlColdStart');

async function start() {
  const db = await waitForMysqlReady();
  if (db.ok) {
    console.log('[mysql] pool is ready for requests');
  } else {
    console.warn(
      '[mysql] server starting without a working DB — requests that hit MySQL will error until connectivity is fixed'
    );
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] startup failed:', err);
  process.exit(1);
});

module.exports = app;
