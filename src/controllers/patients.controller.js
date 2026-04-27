const db = require('../config/db');

async function listPatients(req, res) {
  const search = (req.query.search || '').trim();

  const params = [req.user.id];
  let whereClause = `
    u.role = 'patient'
    AND EXISTS (
      SELECT 1
      FROM appointments a
      WHERE a.patient_id = u.id AND a.doctor_id = $1
    )
  `;

  if (search) {
    params.push(`%${search}%`);
    whereClause += `
      AND (
        u.first_name ILIKE $${params.length}
        OR u.last_name ILIKE $${params.length}
        OR u.email ILIKE $${params.length}
        OR u.city ILIKE $${params.length}
      )
    `;
  }

  const result = await db.query(
    `
      SELECT DISTINCT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.city,
        u.created_at
      FROM users u
      WHERE ${whereClause}
      ORDER BY u.first_name, u.last_name
    `,
    params
  );

  return res.json({
    patients: result.rows
  });
}

module.exports = {
  listPatients
};
