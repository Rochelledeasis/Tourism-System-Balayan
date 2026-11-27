// Models: SQL queries lang. Walang business rules dito.
import { pool } from '../Config/db.js';

const ACTIVE = "('Pending','Confirmed','Rescheduled')"; // statuses na umookupa ng slot

export const getActiveServices = async () =>
  (await pool.query('SELECT id, name FROM services WHERE active=1 ORDER BY id'))[0];

export const findService = async (id, db = pool) =>
  (await db.query('SELECT * FROM services WHERE id=? AND active=1', [id]))[0][0];

export const lockService = async (conn, id) =>
  (await conn.query('SELECT * FROM services WHERE id=? AND active=1 FOR UPDATE', [id]))[0][0];

export const blockedDates = async (serviceId, db = pool) =>
  (await db.query('SELECT date FROM blocked_dates WHERE service_id=?', [serviceId]))[0].map((r) => r.date);

export const usedByMonth = async (serviceId, month) =>
  (await pool.query(
    `SELECT date, time, COUNT(*) c FROM appointments
     WHERE service_id=? AND date LIKE ? AND status IN ${ACTIVE} GROUP BY date, time`,
    [serviceId, `${month}-%`]
  ))[0];

export const usedByDate = async (serviceId, date) =>
  (await pool.query(
    `SELECT time, COUNT(*) c FROM appointments
     WHERE service_id=? AND date=? AND status IN ${ACTIVE} GROUP BY time`,
    [serviceId, date]
  ))[0];

export const countSlot = async (conn, serviceId, date, time) =>
  (await conn.query(
    `SELECT COUNT(*) c FROM appointments WHERE service_id=? AND date=? AND time=? AND status IN ${ACTIVE}`,
    [serviceId, date, time]
  ))[0][0].c;

export const insertAppointment = async (conn, a) =>
  (await conn.query(
    `INSERT INTO appointments (visitor_type, service_id, date, time, purpose, full_name, email, mobile)
     VALUES (?,?,?,?,?,?,?,?)`,
    [a.visitorType, a.serviceId, a.date, a.time, a.purpose, a.fullName, a.email, a.mobile]
  ))[0].insertId;

export const setReference = (conn, id, reference) =>
  conn.query('UPDATE appointments SET reference=? WHERE id=?', [reference, id]);

// ---- 1.1.3: tracking, reschedule, cancel, status history ----
const SELECT_APPT = `SELECT a.id, a.reference, a.visitor_type, a.service_id, s.name AS service_name,
  a.date, a.time, a.purpose, a.full_name, a.email, a.mobile, a.status, a.created_at
  FROM appointments a JOIN services s ON s.id = a.service_id WHERE a.reference=?`;

export const findByReference = async (reference, db = pool) =>
  (await db.query(SELECT_APPT, [reference]))[0][0];

export const lockByReference = async (conn, reference) =>
  (await conn.query(`${SELECT_APPT} FOR UPDATE`, [reference]))[0][0];

export const getHistory = async (appointmentId) =>
  (await pool.query(
    `SELECT status, title, remarks, actor, created_at FROM appointment_history
     WHERE appointment_id=? ORDER BY id DESC`,
    [appointmentId]
  ))[0];

export const addHistory = (conn, h) =>
  conn.query(
    `INSERT INTO appointment_history (appointment_id, status, title, remarks, actor) VALUES (?,?,?,?,?)`,
    [h.appointmentId, h.status, h.title, h.remarks || null, h.actor]
  );

export const updateSchedule = (conn, id, date, time, status) =>
  conn.query('UPDATE appointments SET date=?, time=?, status=? WHERE id=?', [date, time, status, id]);

export const updateStatus = (conn, id, status) =>
  conn.query('UPDATE appointments SET status=? WHERE id=?', [status, id]);

export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
