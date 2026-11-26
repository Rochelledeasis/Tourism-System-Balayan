import { useEffect, useState } from 'react';
import Calendar from './Calendar.jsx';
import { getServices, getAvailability, getSlots } from '../api.js';
import { fmtTime, longDate, shortDate, monthKey } from '../utils.js';

const TYPES = [
  ['Citizen', 'For personal and public services.'],
  ['Student', 'For education-related visits.'],
  ['Government', 'For official government visits.'],
  ['Business', 'For business-related services.'],
];

export default function AppointmentForm({ form, setForm, onNext }) {
  const [services, setServices] = useState([]);
  const [month, setMonth] = useState(() => monthKey(new Date(form.date ? form.date + 'T00:00' : Date.now())));
  const [days, setDays] = useState({});
  const [slots, setSlots] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState('');

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    getServices()
      .then((list) => {
        setServices(list);
        if (!form.serviceId && list[0]) set({ serviceId: String(list[0].id), serviceName: list[0].name });
      })
      .catch(() => setLoadError('Could not load services. Please check that the server is running.'));
  }, []);

  useEffect(() => {
    if (!form.serviceId) return;
    getAvailability(form.serviceId, month).then((r) => setDays(r.days)).catch(() => setDays({}));
  }, [form.serviceId, month]);

  useEffect(() => {
    if (!form.serviceId || !form.date) return setSlots([]);
    getSlots(form.serviceId, form.date).then((r) => setSlots(r.slots)).catch(() => setSlots([]));
  }, [form.serviceId, form.date]);

  const pickService = (e) => {
    const s = services.find((x) => String(x.id) === e.target.value);
    set({ serviceId: e.target.value, serviceName: s?.name || '', date: '', time: '' });
  };

  const submit = () => {
    const err = {};
    if (!form.serviceId) err.serviceId = 'Select a service.';
    if (!form.date) err.date = 'Choose a date.';
    if (form.date && !form.time) err.time = 'Choose a time.';
    if (!form.purpose.trim()) err.purpose = 'Tell us what you need help with.';
    if (!form.fullName.trim()) err.fullName = 'Enter your full name.';
   const mobile = form.mobile.replace(/[\s-]/g, '');
   if (!/^09\d{9}$/.test(mobile)) {
  err.mobile = 'Contact number must start with 09 and contain exactly 11 digits.';
}
    if (
  form.email.trim() &&
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
) {
  err.email = 'Please enter a valid email address, e.g. juan@gmail.com.';
}
    setErrors(err);
    if (!Object.keys(err).length) onNext();
  };

  const Err = ({ k }) => (errors[k] ? <p className="err" role="alert">{errors[k]}</p> : null);

  return (
    <div className="layout">
      <div className="col">
        <section>
          <h2><b>01</b> Visitor type</h2>
          <p className="hint">Choose the option that best describes your visit.</p>
          <div className="types" role="radiogroup">
            {TYPES.map(([t, desc]) => (
              <label key={t} className={`type ${form.visitorType === t ? 'on' : ''}`}>
                <input type="radio" name="vt" checked={form.visitorType === t} onChange={() => set({ visitorType: t })} />
                <strong>{t}</strong><span>{desc}</span><i className="radio" />
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2><b>02</b> Appointment details</h2>
          {loadError && <p className="err">{loadError}</p>}
          <label className="field">Type of service *
            <select value={form.serviceId} onChange={pickService}>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <p className="hint">Available dates and times depend on the service you select.</p>
          <Err k="serviceId" />

          <div className="two">
            <div>
              <span className="lbl">Preferred date *</span>
              <Calendar month={month} setMonth={setMonth} days={days} value={form.date}
                onPick={(d) => set({ date: d, time: '' })} />
              <Err k="date" />
            </div>
            <div>
              <span className="lbl">Preferred time *</span>
              {form.date ? (
                <>
                  <p className="hint">Available times for <b>{longDate(form.date)}</b></p>
                  <div className="slots">
                    {slots.map((s) => (
                      <button key={s.time} type="button" disabled={s.full}
                        className={`slot ${form.time === s.time ? 'selected' : ''}`}
                        aria-pressed={form.time === s.time} onClick={() => set({ time: s.time })}>
                        <b>{fmtTime(s.time)}</b>
                        <small>{s.full ? 'Fully booked' : form.time === s.time ? 'Selected' : `${s.left} slot${s.left > 1 ? 's' : ''} left`}</small>
                      </button>
                    ))}
                  </div>
                  <p className="hint">Each slot is 1 hour. The office is open Mon–Fri, 8:00 AM–5:00 PM, with a lunch break from 12:00 PM.</p>
                </>
              ) : <p className="hint">Pick a date to see available times.</p>}
              <Err k="time" />
            </div>
          </div>

          <label className="field">Purpose of visit *
            <textarea rows="4" placeholder="Briefly describe what you need help with"
              value={form.purpose} onChange={(e) => set({ purpose: e.target.value })} />
          </label>
          <Err k="purpose" />
        </section>

        <section className="card">
          <h2><b>03</b> Contact details</h2>
          <label className="field">Full name *
            <input placeholder="Enter your full name" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} />
          </label>
          <Err k="fullName" />
          <div className="two">
            <label className="field">Email address <small>(optional)</small>
              <input type="email" placeholder="name@example.com" value={form.email} onChange={(e) => set({ email: e.target.value })} />
              <Err k="email" />
            </label>
            <label className="field">Mobile number *
              <input inputMode="tel" placeholder="09XX XXX XXXX" value={form.mobile} onChange={(e) => set({ mobile: e.target.value })} />
              <Err k="mobile" />
            </label>
          </div>
          <p className="hint">* Required fields</p>
        </section>

        <p className="notice">Your contact details will be used for appointment updates and follow-up about your visit.</p>
        <div className="actions">
          <span className="hint">You can review your details before submitting your request.</span>
          <button type="button" className="btn primary" onClick={submit}>Review appointment</button>
        </div>
      </div>

      <aside>
        <div className="summary">
          <h3>Your appointment</h3>
          <p>Review your choices before continuing.</p>
          <dl>
            <dt>Visitor type</dt><dd>{form.visitorType}</dd>
            <dt>Service</dt><dd>{form.serviceName || '—'}</dd>
            <dt>Purpose of visit</dt><dd>{form.purpose.trim() ? 'Provided' : 'Not provided'}</dd>
            <dt>Date & time</dt>
            <dd>{form.date && form.time ? `${shortDate(form.date).replace(/, \d{4}$/, '')} · ${fmtTime(form.time)}` : 'Not selected'}</dd>
          </dl>
        </div>
        <div className="tips">
          <h3>Before your visit</h3>
          <b>Prepare your documents</b><p>Check the selected service for required identification and supporting documents.</p>
          <b>Check your schedule</b><p>Choose a date and time that works for you. Fully booked slots are disabled.</p>
          <b>Keep your reference number</b><p>After you submit, you will get a reference number. Use it to track, reschedule or cancel.</p>
        </div>
      </aside>
    </div>
  );
}
