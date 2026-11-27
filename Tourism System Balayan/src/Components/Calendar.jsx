import { pad, monthLabel } from '../utils.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar({ month, setMonth, days, value, onPick }) {
  const [y, m] = month.split('-').map(Number);
  const lead = new Date(y, m - 1, 1).getDay();
  const total = new Date(y, m, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  const shift = (n) => {
    const d = new Date(y, m - 1 + n, 1);
    setMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };

  return (
    <div className="calendar">
      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
        <strong>{monthLabel(month)}</strong>
        <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Next month">›</button>
      </div>
      <div className="cal-grid">
        {DAYS.map((d) => <span key={d} className="dow">{d}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const key = `${month}-${pad(d)}`;
          const status = days[key] || 'closed';
          const cls = ['day', status, value === key ? 'selected' : ''].join(' ');
          return (
            <button key={key} type="button" className={cls} disabled={status !== 'available'}
              aria-pressed={value === key} onClick={() => onPick(key)}>
              {d}
            </button>
          );
        })}
      </div>
      <div className="legend">
        <span><i className="lg" /> Available</span>
        <span><i className="lg sel" /> Selected</span>
        <span><i className="lg full" /> Fully booked</span>
        <span><i className="lg closed" /> Closed / holiday</span>
      </div>
    </div>
  );
}
