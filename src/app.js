require('./config/env');

const express = require('express');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(express.json());

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = app;
