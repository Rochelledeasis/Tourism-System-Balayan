import { useEffect, useState } from 'react';
import { getAppointment } from '../api.js';
import Pill from './Pill.jsx';
import { fmtTime, shortDate, fmtStamp } from '../utils.js';

const STATUS_HELP = [
  ['Pending', 'Waiting for the office to review.'],
  ['Confirmed', 'Your slot is reserved.'],
  ['Rescheduled', 'Moved to a new date or time.'],
  ['Declined', 'The office could not accept it. See remarks.'],
  ['Cancelled', 'Cancelled by you or the office.'],
  ['Completed', 'Your visit is done.'],
];

export default function Track({ initialRef, flash, onChange }) {
  const [input, setInput] = useState(initialRef || '');
  const [appt, setAppt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const find = async (ref) => {
    if (!ref.trim()) { setAppt(null); return setError('Enter your reference number.'); }
    setLoading(true); setError('');
    try { setAppt(await getAppointment(ref)); }
    catch (e) { setAppt(null); setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (initialRef) find(initialRef); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <h1>Track your appointment</h1>
      <p className="sub">Enter the reference number you received after submitting your request.</p>

      <form className="card findbar" onSubmit={(e) => { e.preventDefault(); find(input); }}>
        <label className="field grow">Reference number
          <input placeholder="TOB-2026-0142" value={input} autoComplete="off"
            onChange={(e) => setInput(e.target.value)} />
        </label>
        <button className="btn primary" disabled={loading}>{loading ? 'Searching…' : 'Find appointment'}</button>
      </form>
      {error && <p className="err" role="alert">{error}</p>}
      {flash && <p className="notice success" role="status">{flash}</p>}

      <div className="layout track-layout">
        <div className="col">
          {loading && <div className="card empty">Looking for your appointment…</div>}
          {!loading && !appt && !error && (
            <div className="card empty">Your appointment details will appear here.</div>
          )}
          {!loading && appt && (
            <>
              <section className="card">
                <div className="row">
                  <div><small className="muted">Reference number</small><div className="ref">{appt.reference}</div></div>
                  <Pill status={appt.status} dot />
                </div>
                <div className="three">
                  <div className="item"><small>Service</small><b>{appt.service}</b></div>
                  <div className="item"><small>Date & time</small><b>{shortDate(appt.date)} · {fmtTime(appt.time)}</b></div>
                  <div className="item"><small>Visitor type</small><b>{appt.visitorType}</b></div>
                </div>
                <div className="item"><small>Name</small><b>{appt.fullName}</b></div>
                {appt.officeRemarks && <div className="item"><small>Office remarks</small><span>{appt.officeRemarks}</span></div>}
                <div className="divider" />
                <div className="btnrow">
                  <button className="btn dark" disabled={!appt.canChange} onClick={() => onChange(appt.reference)}>Reschedule</button>
                  <button className="btn danger" disabled={!appt.canChange} onClick={() => onChange(appt.reference)}>Cancel appointment</button>
                </div>
                <p className="hint">{appt.changeNotice}</p>
              </section>

              <section className="card">
                <h2>Status history</h2>
                <ol className="timeline">
                  {appt.history.map((h, i) => (
                    <li key={i} className={h.status.toLowerCase()}>
                      <b>{h.title}</b>
                      <small>{fmtStamp(h.at)}</small>
                      {h.remarks && <p>{h.remarks}</p>}
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </div>

        <aside>
          <div className="card legend-card">
            <h3>What each status means</h3>
            {STATUS_HELP.map(([s, d]) => (
              <div key={s} className="legend-row"><Pill status={s} /><span>{d}</span></div>
            ))}
          </div>
          <div className="help-card">
            <b>Can’t find your reference number?</b>
            <p>Check the SMS or email we sent after you submitted your request, or contact the Tourism Office.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
