import { useState } from 'react';
import { createAppointment } from '../api.js';
import { fmtTime, addHour, longDate } from '../utils.js';

export default function Review({ form, onEdit, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true); setError('');
    try {
      onDone(await createAppointment(form));
    } catch (e) {
      setError(e.errors ? Object.values(e.errors).join(' ') : e.message);
      setBusy(false);
    }
  };

  const Block = ({ title, children }) => (
    <section className="card">
      <div className="row"><h2>{title}</h2><button className="link" onClick={onEdit}>Edit</button></div>
      {children}
    </section>
  );
  const Item = ({ k, v }) => <div className="item"><small>{k}</small><b>{v}</b></div>;

  return (
    <div className="layout">
      <div className="col">
        <Block title="Visitor type"><b>{form.visitorType}</b></Block>
        <Block title="Appointment details">
          <div className="three">
            <Item k="Service" v={form.serviceName} />
            <Item k="Date" v={longDate(form.date)} />
            <Item k="Time" v={`${fmtTime(form.time)} – ${fmtTime(addHour(form.time))}`} />
          </div>
          <Item k="Purpose of visit" v={form.purpose} />
        </Block>
        <Block title="Contact details">
          <div className="three">
            <Item k="Full name" v={form.fullName} />
            <Item k="Mobile number" v={form.mobile} />
            <Item k="Email address" v={form.email || '—'} />
          </div>
        </Block>

        <p className="notice">Submitting this form sends a <b>request</b>. Your appointment is only confirmed once the Tourism Office approves it. We will use your contact details to update you.</p>
        {error && <p className="err" role="alert">{error}</p>}
        <div className="actions">
          <button className="btn outline" onClick={onEdit} disabled={busy}>Back to edit</button>
          <button className="btn primary" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
        </div>
      </div>

      <aside>
        <div className="summary">
          <h3>What happens next</h3>
          <p>Here is how your request moves through the office.</p>
          <ol className="next">
            <li><b>You submit</b>You receive a reference number. Status: Pending.</li>
            <li><b>Office reviews</b>Staff confirm, decline or suggest another time.</li>
            <li><b>You get an update</b>Check the status anytime using your reference number.</li>
          </ol>
        </div>
        <div className="tips">
          <h3>Need to change something later?</h3>
          <p>You can reschedule or cancel from the Track appointment page, as long as the office has not yet closed your request.</p>
        </div>
      </aside>
    </div>
  );
}
