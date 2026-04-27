const db = require('../config/db');
const { requireFields } = require('../utils/validators');
const { canPatientEdit, canPatientCancel, isPastDate } = require('../utils/dateRules');

function decoratePatientRows(rows) {
  return rows.map((row) => ({
    ...row,
    can_patient_edit: canPatientEdit(row.appointment_date) && row.status !== 'cancelled',
    can_patient_cancel: canPatientCancel(row.appointment_date, row.status) && row.status !== 'cancelled'
  }));
}

async function getAppointmentForUser(appointmentId, user) {
  const params = [appointmentId];

  let whereClause = 'a.id = $1';
  if (user.role === 'patient') {
    params.push(user.id);
    whereClause += ` AND a.patient_id = $${params.length}`;
  }

  if (user.role === 'doctor') {
    params.push(user.id);
    whereClause += ` AND a.doctor_id = $${params.length}`;
  }

  const result = await db.query(
    `
      SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
        TO_CHAR(a.appointment_time, 'HH24:MI') AS appointment_time,
        a.reason,
        a.notes,
        a.status,
        a.created_at,
        a.updated_at
      FROM appointments a
      WHERE ${whereClause}
    `,
    params
  );

  return result.rows[0] || null;
}

async function ensureDoctorExists(doctorId) {
  const result = await db.query(
    `SELECT id, role FROM users WHERE id = $1 AND role = 'doctor'`,
    [doctorId]
  );

  return result.rows[0] || null;
}

async function hasConflict({ appointmentId = null, doctorId, appointmentDate, appointmentTime }) {
  const params = [doctorId, appointmentDate, appointmentTime];
  let condition = `
    doctor_id = $1
    AND appointment_date = $2
    AND appointment_time = $3
    AND status NOT IN ('cancelled', 'rejected')
  `;

  if (appointmentId) {
    params.push(appointmentId);
    condition += ` AND id <> $${params.length}`;
  }

  const result = await db.query(
    `SELECT id FROM appointments WHERE ${condition} LIMIT 1`,
    params
  );

  return result.rowCount > 0;
}

async function listAppointments(req, res) {
  const status = (req.query.status || '').trim();
  const search = (req.query.search || '').trim();

  const params = [req.user.id];
  const conditions = [];

  if (req.user.role === 'patient') {
    conditions.push('a.patient_id = $1');
  } else {
    conditions.push('a.doctor_id = $1');
  }

  if (status) {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;

    if (req.user.role === 'patient') {
      conditions.push(`
        (
          d.first_name ILIKE $${idx}
          OR d.last_name ILIKE $${idx}
          OR d.specialty ILIKE $${idx}
          OR a.reason ILIKE $${idx}
        )
      `);
    } else {
      conditions.push(`
        (
          p.first_name ILIKE $${idx}
          OR p.last_name ILIKE $${idx}
          OR p.email ILIKE $${idx}
          OR a.reason ILIKE $${idx}
        )
      `);
    }
  }

  const result = await db.query(
    `
      SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
        TO_CHAR(a.appointment_time, 'HH24:MI') AS appointment_time,
        a.reason,
        a.notes,
        a.status,
        a.created_at,
        a.updated_at,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.email AS patient_email,
        p.phone AS patient_phone,
        p.city AS patient_city,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name,
        d.email AS doctor_email,
        d.phone AS doctor_phone,
        d.city AS doctor_city,
        d.specialty AS doctor_specialty
      FROM appointments a
      INNER JOIN users p ON p.id = a.patient_id
      INNER JOIN users d ON d.id = a.doctor_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.appointment_date, a.appointment_time
    `,
    params
  );

  const rows = req.user.role === 'patient' ? decoratePatientRows(result.rows) : result.rows;

  return res.json({
    appointments: rows
  });
}

async function createAppointment(req, res) {
  const missing = requireFields(req.body, ['doctor_id', 'appointment_date', 'appointment_time', 'reason']);

  if (missing.length > 0) {
    return res.status(400).json({
      message: `Champs obligatoires manquants: ${missing.join(', ')}.`
    });
  }

  if (isPastDate(req.body.appointment_date)) {
    return res.status(400).json({
      message: 'La date du rendez-vous ne peut pas être dans le passé.'
    });
  }

  const doctor = await ensureDoctorExists(Number(req.body.doctor_id));
  if (!doctor) {
    return res.status(404).json({ message: 'Docteur introuvable.' });
  }

  const conflict = await hasConflict({
    doctorId: Number(req.body.doctor_id),
    appointmentDate: req.body.appointment_date,
    appointmentTime: req.body.appointment_time
  });

  if (conflict) {
    return res.status(409).json({
      message: 'Ce créneau est déjà réservé pour ce docteur.'
    });
  }

  const result = await db.query(
    `
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id
    `,
    [
      req.user.id,
      Number(req.body.doctor_id),
      req.body.appointment_date,
      req.body.appointment_time,
      req.body.reason.trim(),
      (req.body.notes || '').trim() || null
    ]
  );

  return res.status(201).json({
    message: 'Rendez-vous créé avec succès.',
    appointment_id: result.rows[0].id
  });
}

async function updateAppointment(req, res) {
  const appointmentId = Number(req.params.id);
  const appointment = await getAppointmentForUser(appointmentId, req.user);

  if (!appointment) {
    return res.status(404).json({ message: 'Rendez-vous introuvable.' });
  }

  if (appointment.status === 'cancelled') {
    return res.status(400).json({ message: 'Un rendez-vous annulé ne peut pas être modifié.' });
  }

  if (req.user.role === 'patient' && !canPatientEdit(appointment.appointment_date)) {
    return res.status(400).json({
      message: "Le patient ne peut pas modifier un rendez-vous à la date d'aujourd'hui."
    });
  }

  const nextDoctorId = req.user.role === 'patient'
    ? Number(req.body.doctor_id || appointment.doctor_id)
    : appointment.doctor_id;

  const nextDate = req.body.appointment_date || appointment.appointment_date;
  const nextTime = req.body.appointment_time || appointment.appointment_time;
  const nextReason = (req.body.reason || appointment.reason || '').trim();
  const nextNotes = (req.body.notes !== undefined ? req.body.notes : appointment.notes || '');
  const nextStatus = req.user.role === 'patient' ? 'pending' : appointment.status;

  if (!nextReason) {
    return res.status(400).json({ message: 'Le motif du rendez-vous est obligatoire.' });
  }

  if (isPastDate(nextDate)) {
    return res.status(400).json({ message: 'La nouvelle date ne peut pas être dans le passé.' });
  }

  if (req.user.role === 'patient') {
    const doctor = await ensureDoctorExists(nextDoctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Docteur introuvable.' });
    }
  }

  const conflict = await hasConflict({
    appointmentId,
    doctorId: nextDoctorId,
    appointmentDate: nextDate,
    appointmentTime: nextTime
  });

  if (conflict) {
    return res.status(409).json({
      message: 'Ce créneau est déjà réservé pour ce docteur.'
    });
  }

  await db.query(
    `
      UPDATE appointments
      SET doctor_id = $1,
          appointment_date = $2,
          appointment_time = $3,
          reason = $4,
          notes = $5,
          status = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `,
    [
      nextDoctorId,
      nextDate,
      nextTime,
      nextReason,
      String(nextNotes).trim() || null,
      nextStatus,
      appointmentId
    ]
  );

  return res.json({
    message: 'Rendez-vous modifié avec succès.'
  });
}

async function updateAppointmentStatus(req, res) {
  const appointmentId = Number(req.params.id);
  const appointment = await getAppointmentForUser(appointmentId, req.user);

  if (!appointment) {
    return res.status(404).json({ message: 'Rendez-vous introuvable.' });
  }

  if (appointment.status === 'cancelled') {
    return res.status(400).json({ message: 'Un rendez-vous annulé ne peut pas changer de statut.' });
  }

  const allowedStatuses = ['confirmed', 'rejected'];
  const nextStatus = String(req.body.status || '').trim();

  if (!allowedStatuses.includes(nextStatus)) {
    return res.status(400).json({
      message: `Le statut doit être parmi: ${allowedStatuses.join(', ')}.`
    });
  }

  await db.query(
    `
      UPDATE appointments
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
    [nextStatus, appointmentId]
  );

  return res.json({
    message: nextStatus === 'confirmed'
      ? 'Rendez-vous confirmé.'
      : 'Rendez-vous rejeté.'
  });
}

async function cancelAppointment(req, res) {
  const appointmentId = Number(req.params.id);
  const appointment = await getAppointmentForUser(appointmentId, req.user);

  if (!appointment) {
    return res.status(404).json({ message: 'Rendez-vous introuvable.' });
  }

  if (appointment.status === 'cancelled') {
    return res.status(400).json({ message: 'Ce rendez-vous est déjà annulé.' });
  }

  if (!canPatientCancel(appointment.appointment_date, appointment.status)) {
    return res.status(400).json({
      message: "Le patient ne peut pas annuler un rendez-vous confirmé à la date d'aujourd'hui."
    });
  }

  await db.query(
    `
      UPDATE appointments
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [appointmentId]
  );

  return res.json({
    message: 'Rendez-vous annulé avec succès.'
  });
}

module.exports = {
  listAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  cancelAppointment
};
