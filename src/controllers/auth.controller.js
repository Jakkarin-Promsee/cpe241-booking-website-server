const authService = require('../services/auth.service');

function normalizePortal(portal) {
  if (portal === undefined || portal === null || portal === '') {
    return undefined;
  }
  const s = String(portal).trim().toLowerCase();
  if (s === 'admin' || s === 'customer') return s;
  return portal;
}

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;
    const portal = normalizePortal(req.body.portal);
    if (!email || !password) {
      const err = new Error('email and password are required');
      err.statusCode = 400;
      return next(err);
    }
    if (
      portal !== undefined &&
      portal !== null &&
      portal !== 'admin' &&
      portal !== 'customer'
    ) {
      const err = new Error('portal must be "admin" or "customer"');
      err.statusCode = 400;
      return next(err);
    }
    const result = await authService.login(email, password, portal);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** Customer sign-in — always uses customer role check (does not rely on body.portal). */
async function loginCustomer(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const err = new Error('email and password are required');
      err.statusCode = 400;
      return next(err);
    }
    const result = await authService.login(email, password, 'customer');
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { loginUser, loginCustomer };
