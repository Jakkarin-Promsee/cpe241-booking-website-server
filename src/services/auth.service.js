const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authModel = require('../models/auth.model');

async function login(email, password) {
  const user = await authModel.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  if (user.role !== 'Admin') {
    const err = new Error('Admin access only');
    err.statusCode = 403;
    throw err;
  }
  const token = jwt.sign(
    { userId: user.user_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  return {
    token,
    user: {
      id: user.user_id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    },
  };
}

module.exports = { login };
