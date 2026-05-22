const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'ai-devops-infra-secret-key-2024';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Export a callable function so `const auth = require('../middleware/auth')` works as middleware,
// while still supporting destructured `{ authenticateToken, JWT_SECRET }` consumers.
authenticateToken.authenticateToken = authenticateToken;
authenticateToken.JWT_SECRET = JWT_SECRET;
module.exports = authenticateToken;
