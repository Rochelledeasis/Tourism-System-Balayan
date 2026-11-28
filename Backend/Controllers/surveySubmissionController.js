import * as S from '../Services/surveySubmissionService.js';
import { describeDbError } from '../Utils/dbError.js';

export const create = async (req, res) => {
  try {
    const result = await S.createResponse(req.body ?? {});
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (!err.status) console.error(err);
    const known = !err.status && describeDbError(err);
    res.status(err.status || known?.status || 500).json({
      success: false,
      message: known?.message || err.message,
      errors: err.errors,
    });
  }
};
