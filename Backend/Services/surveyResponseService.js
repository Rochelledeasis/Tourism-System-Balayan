import * as M from '../Models/surveyModel.js';

// 2.2.2 Implement survey response management (Backend)

const COLUMNS = [
  'id', 'survey_date', 'client_type', 'sex', 'age', 'region', 'service',
  'cc1', 'cc2', 'cc3',
  'sqd0', 'sqd1', 'sqd2', 'sqd3', 'sqd4', 'sqd5', 'sqd6', 'sqd7', 'sqd8',
  'suggestions',
];

const buildFilters = ({ from, to, service, clientType } = {}) => {
  const where = [];
  const params = [];
  if (from) { where.push('DATE(survey_date) >= ?'); params.push(from); }
  if (to) { where.push('DATE(survey_date) <= ?'); params.push(to); }
  if (service) { where.push('service LIKE ?'); params.push(`%${service}%`); }
  if (clientType) { where.push('client_type = ?'); params.push(clientType); }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
};

// List responses, optionally filtered by date range, service, or client type
export const getAllResponses = async (filters) => {
  const { clause, params } = buildFilters(filters);
  return M.listResponses(clause, params);
};

// Details of one selected response (null when not found)
export const getResponseById = (id) => M.findResponse(id);

// Prepare responses as CSV text for export
const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  let s = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // avoid spreadsheet formula injection
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const exportResponsesCsv = async (filters) => {
  const rows = await getAllResponses(filters);
  const lines = [COLUMNS.join(',')];
  rows.forEach((r) => lines.push(COLUMNS.map((c) => csvCell(r[c])).join(',')));
  return '\uFEFF' + lines.join('\r\n');
};
