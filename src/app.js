require('./config/env');

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set in .env — auth endpoints will not work');
}

app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = app;
