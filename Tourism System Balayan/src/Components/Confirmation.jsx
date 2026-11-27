import { useState } from 'react';
import { fmtTime, shortDate } from '../utils.js';

export default function Confirmation({ form, result, onNew, onTrack }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(result.reference); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  const Item = ({ k, v }) => <div className="item"><small>{k}</small><b>{v}</b></div>;

  return (
    <div className="card done-card">
      <div className="done-top">
        <div className="check">✓</div>
        <h1>Your request has been submitted</h1>
        <p className="sub">The Tourism Office will review it and update you. Save your reference number to track, reschedule or cancel.</p>
      </div>
      <div className="refbar">
        <div><small>Reference number</small><strong>{result.reference}</strong></div>
        <div className="refactions">
          <button className="btn ghost" onClick={copy}>{copied ? 'Copied' : 'Copy number'}</button>
          <span className="badge pending">● Status: Pending</span>
        </div>
      </div>
      <div className="done-body">
        <h2>Appointment summary</h2>
        <div className="three">
          <Item k="Name" v={form.fullName} />
          <Item k="Visitor type" v={form.visitorType} />
          <Item k="Service" v={form.serviceName} />
        </div>
        <Item k="Requested date & time" v={`${shortDate(form.date)} · ${fmtTime(form.time)}`} />
        <p className="notice">A confirmation will be sent to <b>{form.mobile}</b>{form.email && <> and <b>{form.email}</b></>} once the office reviews your request. Please bring valid ID and supporting documents on your visit.</p>
      </div>
      <div className="actions foot">
        <button className="btn outline" onClick={onNew}>Book another appointment</button>
        <button className="btn primary" onClick={() => onTrack(result.reference)}>Track this appointment</button>
      </div>
    </div>
  );
}
