function notFound(req, res) {
  res.status(404).json({ error: 'Not founds' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  const message =
    status === 500 ? 'Internal server error' : err.message || 'Bad request';
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
