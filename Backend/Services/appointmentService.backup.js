// Services: business rules (slots, capacity, validation)
import * as M from '../Models/appointmentModel.js';

export class HttpError extends Error {
  constructor(status, message, errors) { super(message); this.status = status; this.errors = errors; }
}

export const CHANGE_CUTOFF_HOURS = Number(process.env.CHANGE_CUTOFF_HOURS) || 24; // hanggang kailan pwede magbago
const CHANGEABLE = ['Pending', 'Confirmed', 'Rescheduled'];
export const CANCEL_REASONS = ['Schedule conflict', 'No longer needed', 'Booked by mistake', 'Other'];
const VISITOR_TYPES = ['Citizen', 'Student', 'Government', 'Business'];
const pad = (n) => String(n).padStart(2, '0');
const toMin = (t) => { const [h, m] = t.split(':'); return +h * 60 + +m; };
const fmt = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const dow = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getDay(); };

function genSlots(s) {
  const out = [];
  for (let m = toMin(s.open_time); m + s.slot_minutes <= toMin(s.close_time); m += s.slot_minutes) {
    if (m >= toMin(s.break_start) && m < toMin(s.break_end)) continue;
    out.push(fmt(m));
  }
  return out;
}

// Lumipas na ba ang slot na ito? (local time ng server)
const isPast = (date, time) => new Date(`${date}T${time}`) <= new Date();

const isClosed = (s, date, blocked) =>
  date < todayStr() || !s.operating_days.split(',').includes(String(dow(date))) || blocked.has(date);

async function requireService(id, db) {
  const s = id ? await M.findService(id, db) : null;
  if (!s) throw new HttpError(404, 'Service not found');
  return s;
}

export const listServices = () => M.getActiveServices();

export async function getAvailability(serviceId, month) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) throw new HttpError(400, 'Invalid month');
  const s = await requireService(serviceId);
  const blocked = new Set(await M.blockedDates(s.id));
  const used = {};
  (await M.usedByMonth(s.id, month)).forEach((r) => (used[`${r.date}|${r.time}`] = r.c));

  const slots = genSlots(s);
  const [y, m] = month.split('-').map(Number);
  const days = {};
  for (let d = 1; d <= new Date(y, m, 0).getDate(); d++) {
    const date = `${month}-${pad(d)}`;
    if (isClosed(s, date, blocked)) { days[date] = 'closed'; continue; }
    days[date] = slots.some((t) => !isPast(date, t) && (used[`${date}|${t}`] || 0) < s.capacity) ? 'available' : 'full';
  }
  return { days };
}

export async function getSlots(serviceId, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new HttpError(400, 'Invalid date');
  const s = await requireService(serviceId);
  if (isClosed(s, date, new Set(await M.blockedDates(s.id)))) return { slots: [] };
  const used = Object.fromEntries((await M.usedByDate(s.id, date)).map((r) => [r.time, r.c]));
  return {
    slots: genSlots(s).filter((time) => !isPast(date, time)).map((time) => {
      const left = Math.max(0, s.capacity - (used[time] || 0));
      return { time, left, full: left === 0 };
    }),
  };
}


function validate(b) {
  const e = {};
  const phone = String(b.mobile || '').replace(/[\s-]/g, '');

  if (!VISITOR_TYPES.includes(b.visitorType)) e.visitorType = 'Choose a visitor type.';
  if (!b.serviceId) e.serviceId = 'Select a service.';

  // Validate date format and actual calendar date
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b.date || '');

  if (!dateMatch) {
    e.date = 'Choose a valid date.';
  } else {
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      e.date = 'Choose a valid calendar date.';
    }
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(b.time || '')) e.time = 'Choose a time.';
  if (!String(b.purpose || '').trim()) e.purpose = 'Tell us what you need help with.';
  if (!String(b.fullName || '').trim()) e.fullName = 'Enter your full name.';

  if (!/^09\d{9}$/.test(phone)) {
    e.mobile = 'Contact number must start with 09 and contain exactly 11 digits.';
  }

  const email = String(b.email || '').trim();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    e.email = 'Please enter a valid email address.';
  }

  if (Object.keys(e).length) throw new HttpError(400, 'Please check your details.', e);

  return phone;
}


export async function createAppointment(body) {
  const phone = validate(body);
  const time = body.time.length === 5 ? `${body.time}:00` : body.time;

  return M.withTransaction(async (conn) => {
    const s = await M.lockService(conn, body.serviceId); // iwas double-booking
    if (!s) throw new HttpError(404, 'Service not found');
    const blocked = new Set(await M.blockedDates(s.id, conn));
    if (isClosed(s, body.date, blocked) || !genSlots(s).includes(time) || isPast(body.date, time))
      throw new HttpError(409, 'That date or time is not available.');
    if ((await M.countSlot(conn, s.id, body.date, time)) >= s.capacity)
      throw new HttpError(409, 'That time slot is already fully booked.');

    const id = await M.insertAppointment(conn, {
      visitorType: body.visitorType, serviceId: s.id, date: body.date, time,
      purpose: body.purpose.trim(), fullName: body.fullName.trim(),
      email: body.email?.trim() || null, mobile: phone,
    });
    const reference = `TOB-${body.date.slice(0, 4)}-${String(id).padStart(4, '0')}`;
    await M.setReference(conn, id, reference);
    await M.addHistory(conn, {
      appointmentId: id, status: 'Pending', title: 'Request submitted',
      remarks: 'Status set to Pending.', actor: 'Client',
    });
    return { reference, status: 'Pending', service: s.name };
  });
}


// ================= 1.1.3 Tracking, rescheduling, cancellation =================

function parseReference(ref) {
  const r = String(ref || '').trim().toUpperCase();
  if (!/^TOB-\d{4}-\d{4,}$/.test(r)) throw new HttpError(400, 'Enter a valid reference number, e.g. TOB-2026-0142.');
  return r;
}

// Kung bakit hindi na pwedeng baguhin (null = pwede pa)
function changeBlocker(a, now = new Date()) {
  if (!CHANGEABLE.includes(a.status))
    return `This appointment is already ${a.status.toLowerCase()} and can no longer be changed.`;
  const start = new Date(`${a.date}T${a.time}`);
  if (start.getTime() - now.getTime() < CHANGE_CUTOFF_HOURS * 3600 * 1000)
    return `Changes can only be made up to ${CHANGE_CUTOFF_HOURS} hours before your appointment. Please contact the Tourism Office.`;
  return null;
}

async function loadView(a) {
  const history = await M.getHistory(a.id);
  const blocker = changeBlocker(a);
  return {
    reference: a.reference,
    status: a.status,
    serviceId: a.service_id,
    service: a.service_name,
    visitorType: a.visitor_type,
    fullName: a.full_name,
    date: a.date,
    time: a.time,
    purpose: a.purpose,
    // pinakabagong remarks mula sa opisina
    officeRemarks: history.find((h) => h.actor === 'Tourism Office' && h.remarks)?.remarks || null,
    canChange: !blocker,
    changeNotice: blocker || `Changes can be made up to ${CHANGE_CUTOFF_HOURS} hours before your appointment.`,
    cutoffHours: CHANGE_CUTOFF_HOURS,
    history: history.map((h) => ({
      status: h.status, title: h.title, remarks: h.remarks, actor: h.actor, at: h.created_at,
    })),
  };
}

export async function getAppointment(reference) {
  const a = await M.findByReference(parseReference(reference));
  if (!a) throw new HttpError(404, "We couldn't find an appointment with that reference number.");
  return loadView(a);
}


export async function rescheduleAppointment(reference, body) {
  const ref = parseReference(reference);
  const e = {};

  // Validate actual calendar date
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(body.date || '');

  if (!dateMatch) {
    e.date = 'Choose a valid date.';
  } else {
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      e.date = 'Choose a valid calendar date.';
    }
  }

  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.exec(body.time || '');

if (!timeMatch) {
  e.time = 'Choose a valid time.';
}

  if (Object.keys(e).length) {
    throw new HttpError(400, 'Please choose a new date and time.', e);
  }

  const time = body.time.length === 5 ? `${body.time}:00` : body.time;
  const reason = String(body.reason || '').trim().slice(0, 500) || null;

  await M.withTransaction(async (conn) => {
    const a = await M.lockByReference(conn, ref);
    if (!a) throw new HttpError(404, "We couldn't find an appointment with that reference number.");

    const blocker = changeBlocker(a);
    if (blocker) throw new HttpError(409, blocker);

    if (a.date === body.date && a.time === time)
      throw new HttpError(409, 'That is your current schedule. Please choose a different date or time.');

    const s = await M.lockService(conn, a.service_id);
    if (!s) throw new HttpError(409, 'This service is no longer available. Please contact the Tourism Office.');

    const blocked = new Set(await M.blockedDates(s.id, conn));

    if (isClosed(s, body.date, blocked) || !genSlots(s).includes(time))
      throw new HttpError(409, 'That date or time is not available.');

    if ((await M.countSlot(conn, s.id, body.date, time)) >= s.capacity)
      throw new HttpError(409, 'That time slot is already fully booked.');

    if (changeBlocker({ ...a, date: body.date, time, status: 'Pending' }))
      throw new HttpError(409, `Please choose a schedule at least ${CHANGE_CUTOFF_HOURS} hours from now.`);

    await M.updateSchedule(conn, a.id, body.date, time, 'Rescheduled');

    await M.addHistory(conn, {
      appointmentId: a.id,
      status: 'Rescheduled',
      title: 'Rescheduled by client',
      remarks: `Moved from ${a.date} ${a.time.slice(0, 5)} to ${body.date} ${time.slice(0, 5)}.${reason ? ` Reason: ${reason}` : ''}`,
      actor: 'Client',
    });
  });

  return getAppointment(ref);
}


export async function cancelAppointment(reference, body) {
  const ref = parseReference(reference);
  if (!CANCEL_REASONS.includes(body.reason))
    throw new HttpError(400, 'Please select a reason for cancelling.', { reason: 'Select a reason.' });
  const remarks = String(body.remarks || '').trim().slice(0, 500);

  await M.withTransaction(async (conn) => {
    const a = await M.lockByReference(conn, ref);
    if (!a) throw new HttpError(404, "We couldn't find an appointment with that reference number.");
    const blocker = changeBlocker(a);
    if (blocker) throw new HttpError(409, blocker);

    await M.updateStatus(conn, a.id, 'Cancelled'); // lalaya ang slot (hindi na ACTIVE)
    await M.addHistory(conn, {
      appointmentId: a.id, status: 'Cancelled', title: 'Cancelled by client',
      remarks: `Reason: ${body.reason}.${remarks ? ` ${remarks}` : ''}`, actor: 'Client',
    });
  });
  return getAppointment(ref);
}