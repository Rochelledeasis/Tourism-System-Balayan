import { Router } from 'express';
import { requireAdminKey } from '../Middleware/surveyAdminKey.js';
import * as C from '../Controllers/surveyResponseController.js';

const router = Router();

router.use(requireAdminKey); // authorized personnel only

router.get('/', C.getAll);
router.get('/export', C.exportCsv); // must stay above "/:id"
router.get('/:id', C.getOne);

export default router;
