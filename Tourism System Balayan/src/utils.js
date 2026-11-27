export const pad = (n) => String(n).padStart(2, '0');
export const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
};
export const addHour = (t) => `${pad(+t.split(':')[0] + 1)}:${t.split(':')[1]}`;
export const fmtDate = (s, opts) => parse(s).toLocaleDateString('en-US', opts);
export const longDate = (s) => fmtDate(s, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
export const shortDate = (s) => fmtDate(s, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
export const monthLabel = (key) => fmtDate(`${key}-01`, { month: 'long', year: 'numeric' });
// 'YYYY-MM-DD HH:MM:SS' (galing sa DB) -> 'Nov 23, 2026 · 2:40 PM'
export const fmtStamp = (s) => {
  const [d, t] = String(s).split(/[ T]/);
  return `${fmtDate(d, { month: 'short', day: 'numeric', year: 'numeric' })} · ${fmtTime(t)}`;
};
