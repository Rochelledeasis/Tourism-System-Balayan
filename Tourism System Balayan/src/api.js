const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(path, options) {
  const res = await fetch(`${API}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { errors: data.errors });
  return data;
}
export const getServices = () => request('/services');
export const getAvailability = (serviceId, month) => request(`/availability?serviceId=${serviceId}&month=${month}`);
export const getSlots = (serviceId, date) => request(`/slots?serviceId=${serviceId}&date=${date}`);
const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const getAppointment = (reference) => request(`/appointments/${encodeURIComponent(reference.trim())}`);
export const rescheduleAppointment = (reference, body) => request(`/appointments/${encodeURIComponent(reference)}/reschedule`, json('PATCH', body));
export const cancelAppointment = (reference, body) => request(`/appointments/${encodeURIComponent(reference)}/cancel`, json('PATCH', body));
export const createAppointment = (body) =>
  request('/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
