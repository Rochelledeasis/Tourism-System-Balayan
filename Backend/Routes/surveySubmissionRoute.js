import { Router } from 'express';
import * as C from '../Controllers/surveySubmissionController.js';

const router = Router();

// Public: client submits the CSM form
router.post('/', C.create);

export default router;
