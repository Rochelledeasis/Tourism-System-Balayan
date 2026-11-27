import { useEffect, useState } from 'react';
import Calendar from './Calendar.jsx';
import Pill from './Pill.jsx';
import { getAppointment, getAvailability, getSlots, rescheduleAppointment, cancelAppointment } from '../api.js';
import { fmtTime, longDate, shortDate, monthKey } from '../utils.js';

const REASONS = ['Schedule conflict', 'No longer needed', 'Booked by mistake', 'Other'];

export default function Change({ reference, onBack, onDone }) {
  const [appt, setAppt] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [month, setMonth] = useState(monthKey(new Date()));
  const [days, setDays] = useState({});
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [cReason, setCReason] = useState('');
  const [cRemarks, setCRemarks] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [cError, setCError] = useState('');

  useEffect(() => {
    getAppointment(reference)
      .then((a) => { setAppt(a); setMonth(a.date.slice(0, 7)); })
      .catch((e) => setLoadError(e.message));
  }, [reference]);

  useEffect(() => {
    if (!appt) return;
    getAvailability(appt.serviceId, month).then((r) => setDays(r.days)).catch(() => setDays({}));
  }, [appt, month]);

  useEffect(() => {
    if (!appt || !date) return setSlots([]);
    getSlots(appt.serviceId, date).then((r) => setSlots(r.slots)).catch(() => setSlots([]));
  }, [appt, date]);

  const reschedule = async () => {
    if (!date || !time) return setError('Choose a new date and time.');
    setBusy('r'); setError('');
    try {
      await rescheduleAppointment(reference, { date, time, reason });
      onDone('Your appointment has been rescheduled. The office will review the new schedule.');
    } catch (e) { setError(e.message); setBusy(''); }
  };

  const cancel = async () => {
    if (!cReason) return setCError('Select a reason for cancelling.');
    if (!window.confirm('Cancel this appointment? This cannot be undone.')) return;
    setBusy('c'); setCError('');
    try {
      await cancelAppointment(reference, { reason: cReason, remarks: cRemarks });
      onDone('Your appointment has been cancelled.');
    } catch (e) { setCError(e.message); setBusy(''); }
  };

  const back = <button className="link back" onClick={onBack}>‹ Back to tracking</button>;

  if (loadError) return <>{back}<p className="err" role="alert">{loadError}</p></>;
  if (!appt) return <>{back}<div className="card empty">Loading your appointment…</div></>;

  const isCurrent = (t) => date === appt.date && t === appt.time;

  return (
    <>
      {back}
      <h1>Change your appointment</h1>
      <p className="sub">Pick a new schedule, or cancel if you can no longer attend.</p>

      <div className="changebar">
        <div><small>Reference number</small><b>{appt.reference}</b></div>
        <div><small>Service</small><b>{appt.service}</b></div>
        <div><small>Current schedule</small><b>{shortDate(appt.date)} · {fmtTime(appt.time)}</b></div>
        <Pill status={appt.status} dot />
      </div>

      {!appt.canChange ? (
        <p className="notice warn" role="alert">{appt.changeNotice}</p>
      ) : (
        <div className="change-grid">
          <section className="card">
            <h2>Reschedule</h2>
            <p className="hint">Choose a new date and time. Your request will be reviewed again by the office.</p>
            <div className="two">
              <div>
                <span className="lbl">New date</span>
                <Calendar month={month} setMonth={setMonth} days={days} value={date}
                  onPick={(d) => { setDate(d); setTime(''); setError(''); }} />
              </div>
              <div>
                <span className="lbl">New time</span>
                {date ? (
                  <>
                    <p className="hint">Available times for <b>{longDate(date)}</b></p>
                    {slots.length === 0 && <p className="hint">No available times on this date. Please pick another day.</p>}
                    <div className="slots">
                      {slots.map((s) => {
                        const cur = isCurrent(s.time);
                        return (
                          <button key={s.time} type="button" disabled={s.full || cur}
                            className={`slot ${time === s.time ? 'selected' : ''}`}
                            aria-pressed={time === s.time} onClick={() => { setTime(s.time); setError(''); }}>
                            <b>{fmtTime(s.time)}</b>
                            <small>{cur ? 'Current' : s.full ? 'Fully booked' : time === s.time ? 'Selected' : `${s.left} slot${s.left > 1 ? 's' : ''} left`}</small>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : <p className="hint">Pick a date to see available times.</p>}
              </div>
            </div>
            <label className="field">Reason for rescheduling <small>(optional)</small>
              <textarea rows="3" placeholder="Let the office know why you need a different time"
                value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            {error && <p className="err" role="alert">{error}</p>}
            <div className="actions">
              <span className="hint">New schedule: <b>{date && time ? `${shortDate(date).replace(/, \d{4}$/, '')} · ${fmtTime(time)}` : 'Not selected'}</b></span>
              <button className="btn primary" onClick={reschedule} disabled={busy === 'r' || busy === 'c'}>
                {busy === 'r' ? 'Saving…' : 'Confirm new schedule'}
              </button>
            </div>
          </section>

          <section className="card cancel-card">
            <h2>Cancel appointment</h2>
            <p className="hint">Cancelling frees up your slot for other visitors. This cannot be undone, but you can always book a new appointment.</p>
            <label className="field">Reason
              <select value={cReason} onChange={(e) => { setCReason(e.target.value); setCError(''); }}>
                <option value="">Select a reason</option>
                {REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label className="field">Remarks <small>(optional)</small>
              <textarea rows="3" placeholder="Add anything the office should know"
                value={cRemarks} onChange={(e) => setCRemarks(e.target.value)} />
            </label>
            {cError && <p className="err" role="alert">{cError}</p>}
            <button className="btn danger block" onClick={cancel} disabled={busy === 'r' || busy === 'c'}>
              {busy === 'c' ? 'Cancelling…' : 'Cancel this appointment'}
            </button>
            <button className="link keep" onClick={onBack}>Keep my appointment</button>
          </section>
        </div>
      )}
    </>
  );
}
