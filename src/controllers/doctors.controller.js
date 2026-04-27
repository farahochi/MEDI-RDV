const db = require('../config/db');

async function listDoctors(req, res) {
  const search = (req.query.search || '').trim();
  const specialty = (req.query.specialty || '').trim();

  const params = [];
  const conditions = [`role = 'doctor'`];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`
      (
        first_name ILIKE $${params.length}
        OR last_name ILIKE $${params.length}
        OR email ILIKE $${params.length}
        OR city ILIKE $${params.length}
        OR specialty ILIKE $${params.length}
      )
    `);
  }

  if (specialty) {
    params.push(`%${specialty}%`);
    conditions.push(`specialty ILIKE $${params.length}`);
  }

  const result = await db.query(
    `
      SELECT id, first_name, last_name, email, phone, city, specialty, created_at
      FROM users
      WHERE ${conditions.join(' AND ')}
      ORDER BY first_name, last_name
    `,
    params
  );

  return res.json({
    doctors: result.rows
  });
}

module.exports = {
  listDoctors
};
