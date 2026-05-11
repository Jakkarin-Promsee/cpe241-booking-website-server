const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    return next(err);
  }
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    next(err);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'Admin') {
    const err = new Error('Admin access only');
    err.statusCode = 403;
    return next(err);
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
