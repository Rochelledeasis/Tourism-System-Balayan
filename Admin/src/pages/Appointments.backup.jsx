
import { useCallback, useEffect, useState } from 'react';
import {
  getAppointments,
  confirmAppointment,
  declineAppointment,
} from '../api.js';

const STATUSES = [
  'All',
  'Pending',
  'Confirmed',
  'Rescheduled',
  'Declined',
  'Cancelled',
  'Completed',
];

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState('All');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAppointments({
        status: status === 'All' ? '' : status,
        date,
      });

      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Unable to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [status, date]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleConfirm = async (item) => {
    const approved = window.confirm(
      `Are you sure you want to confirm appointment ${item.reference}?`
    );

    if (!approved) return;

    setActionLoading(item.reference);
    setError('');
    setNotice('');

    try {
      const result = await confirmAppointment(item.reference);
      setNotice(result.message || 'Appointment confirmed successfully.');
      await loadAppointments();
    } catch (e) {
      setError(e.message || 'Unable to confirm appointment.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDecline = async (item) => {
    const remarks = window.prompt(
      `Enter the reason for declining appointment ${item.reference}:`
    );

    if (remarks === null) return;

    if (!remarks.trim()) {
      setError('Please provide a reason for declining.');
      return;
    }

    setActionLoading(item.reference);
    setError('');
    setNotice('');

    try {
      const result = await declineAppointment(
        item.reference,
        remarks.trim()
      );

      setNotice(result.message || 'Appointment declined successfully.');
      await loadAppointments();
    } catch (e) {
      setError(e.message || 'Unable to decline appointment.');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <>
      <h1>Appointment requests</h1>
      <p className="sub">
        Review, confirm, decline or reschedule what visitors have requested.
      </p>

      <div className="appointment-toolbar">
        <label className="appointment-filter">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="appointment-filter">
          Appointment date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <button
          type="button"
          className="btn primary refresh-btn"
          onClick={loadAppointments}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="alert" role="status">
          {notice}
        </div>
      )}

      <div className="card appointment-card">
        <div className="appointment-heading">
          <div>
            <h2>Appointment list</h2>
            <p className="muted small">
              {loading
                ? 'Loading appointment records...'
                : `${appointments.length} appointment(s) found`}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="center-note">Loading appointments...</p>
        ) : error ? (
          <p className="center-note">
            Unable to display appointment records.
          </p>
        ) : appointments.length === 0 ? (
          <p className="center-note">
            No appointments found for the selected filters.
          </p>
        ) : (
          <div className="appointment-table-wrap">
            <table className="appointment-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Visitor</th>
                  <th>Service</th>
                  <th>Appointment</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.reference}</strong>
                      <div className="muted small">
                        {item.visitor_type}
                      </div>
                    </td>

                    <td>
                      <strong>{item.full_name}</strong>
                      <div className="muted small">
                        {item.purpose || 'No purpose provided'}
                      </div>
                    </td>

                    <td>{item.service_name}</td>

                    <td>
                      <strong>{item.date}</strong>
                      <div className="muted small">
                        {item.time}
                      </div>
                    </td>

                    <td>
                      <div>{item.email}</div>
                      <div className="muted small">
                        {item.mobile}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`appointment-status status-${String(
                          item.status
                        ).toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>
                      {item.status === 'Pending' ? (
                        <div className="appointment-actions">
                          <button
                            type="button"
                            className="btn primary"
                            onClick={() => handleConfirm(item)}
                            disabled={Boolean(actionLoading)}
                          >
                            {actionLoading === item.reference
                              ? 'Processing...'
                              : 'Confirm'}
                          </button>

                          <button
                            type="button"
                            className="btn"
                            onClick={() => handleDecline(item)}
                            disabled={Boolean(actionLoading)}
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="muted small">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
