import * as S from '../Services/surveyResponseService.js';
import { describeDbError } from '../Utils/dbError.js';

const readFilters = (query) => ({
  from: query.from,
  to: query.to,
  service: query.service,
  clientType: query.clientType,
});

const fail = (res, err) => {
  console.error(err);
  const known = describeDbError(err);
  res.status(known?.status || 500).json({ success: false, message: known?.message || err.message });
};

export const getAll = async (req, res) => {
  try {
    res.json({ success: true, data: await S.getAllResponses(readFilters(req.query)) });
  } catch (err) {
    fail(res, err);
  }
};

export const getOne = async (req, res) => {
  try {
    const row = await S.getResponseById(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Survey response not found.' });
    res.json({ success: true, data: row });
  } catch (err) {
    fail(res, err);
  }
};

export const exportCsv = async (req, res) => {
  try {
    const csv = await S.exportResponsesCsv(readFilters(req.query));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="survey-responses.csv"');
    res.send(csv);
  } catch (err) {
    fail(res, err);
  }
};
