const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Token manquant.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query(
      `
        SELECT id, role, first_name, last_name, email, phone, city, specialty, created_at
        FROM users
        WHERE id = $1
      `,
      [decoded.sub]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session invalide ou expirée.' });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Action non autorisée pour ce rôle.' });
    }

    next();
  };
}

module.exports = {
  authRequired,
  allowRoles
};
