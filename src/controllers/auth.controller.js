const db = require('../config/db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { requireFields, sanitizeUser } = require('../utils/validators');

async function register(req, res) {
  const role = req.params.role;
  const requiredFields = ['first_name', 'last_name', 'email', 'password', 'phone', 'city'];
  if (role === 'doctor') {
    requiredFields.push('specialty');
  }

  const missing = requireFields(req.body, requiredFields);

  if (!['patient', 'doctor'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide.' });
  }

  if (missing.length > 0) {
    return res.status(400).json({
      message: `Champs obligatoires manquants: ${missing.join(', ')}.`
    });
  }

  const email = String(req.body.email).trim().toLowerCase();

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    return res.status(409).json({ message: 'Cet email existe déjà.' });
  }

  const insertResult = await db.query(
    `
      INSERT INTO users (role, first_name, last_name, email, password_hash, phone, city, specialty)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, role, first_name, last_name, email, phone, city, specialty, created_at
    `,
    [
      role,
      req.body.first_name.trim(),
      req.body.last_name.trim(),
      email,
      hashPassword(req.body.password),
      req.body.phone.trim(),
      req.body.city.trim(),
      role === 'doctor' ? req.body.specialty.trim() : null
    ]
  );

  const user = insertResult.rows[0];
  const token = signToken(user);

  return res.status(201).json({
    message: `${role === 'patient' ? 'Patient' : 'Docteur'} inscrit avec succès.`,
    token,
    user: sanitizeUser(user)
  });
}

async function login(req, res) {
  const missing = requireFields(req.body, ['email', 'password']);

  if (missing.length > 0) {
    return res.status(400).json({
      message: `Champs obligatoires manquants: ${missing.join(', ')}.`
    });
  }

  const email = String(req.body.email).trim().toLowerCase();

  const result = await db.query(
    `
      SELECT id, role, first_name, last_name, email, password_hash, phone, city, specialty, created_at
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
  }

  const user = result.rows[0];

  if (!verifyPassword(req.body.password, user.password_hash)) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
  }

  if (req.body.role && req.body.role !== user.role) {
    return res.status(401).json({ message: 'Le rôle ne correspond pas à ce compte.' });
  }

  const token = signToken(user);

  return res.json({
    message: 'Connexion réussie.',
    token,
    user: sanitizeUser(user)
  });
}

async function me(req, res) {
  return res.json({
    user: sanitizeUser(req.user)
  });
}

async function resetPassword(req, res) {
  const missing = requireFields(req.body, ['currentPassword', 'newPassword']);

  if (missing.length > 0) {
    return res.status(400).json({
      message: `Champs obligatoires manquants: ${missing.join(', ')}.`
    });
  }

  if (String(req.body.newPassword).length < 6) {
    return res.status(400).json({
      message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.'
    });
  }

  const result = await db.query(
    'SELECT id, password_hash FROM users WHERE id = $1',
    [req.user.id]
  );

  const user = result.rows[0];

  if (!verifyPassword(req.body.currentPassword, user.password_hash)) {
    return res.status(400).json({ message: 'Le mot de passe actuel est incorrect.' });
  }

  await db.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [hashPassword(req.body.newPassword), req.user.id]
  );

  return res.json({ message: 'Mot de passe mis à jour avec succès.' });
}

module.exports = {
  register,
  login,
  me,
  resetPassword
};
