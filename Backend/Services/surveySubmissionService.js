import * as M from '../Models/surveyModel.js';
import { validateSurvey } from './surveyValidation.js';

// 2.2.1 Implement survey form and response submission (Backend)
export const createResponse = async (input) => {
  const data = validateSurvey(input); // throws a 400 ValidationError when invalid
  const r = data.ratings || {};
  const sqd = (i) => (r[`SQD${i}`] !== undefined ? r[`SQD${i}`] : null);

  const id = await M.insertResponse([
    data.clientType || null,
    data.date || null,
    data.sex || null,
    data.age ? Number(data.age) : null,
    data.region || null,
    data.service || null,
    data.cc1 || null,
    data.cc2 || null,
    data.cc3 || null,
    sqd(0), sqd(1), sqd(2), sqd(3), sqd(4), sqd(5), sqd(6), sqd(7), sqd(8),
    data.suggestions || null,
  ]);
  return { id };
};
