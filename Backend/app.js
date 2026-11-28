import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { pool } from './Config/db.js';
import appointmentRoute from './Routes/appointmentRoute.js';
import adminRoute from './Routes/adminRoute.js';
import surveySubmissionRoute from './Routes/surveySubmissionRoute.js';
import surveyResponseRoute from './Routes/surveyResponseRoute.js';
import { describeDbError } from './Utils/dbError.js';

const REQUIRED_TABLES = [
  'services', 'blocked_dates', 'appointments', 'appointment_history', 'admins', 'survey_responses',
];

if (!process.env.JWT_SECRET) {
  console.error('\n[ERROR] JWT_SECRET is missing in Backend/.env. Add it and restart.\n');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

// Pinapayagan ang lahat ng localhost / 127.0.0.1 port (5173, 5174, atbp.)
// at ang mga naka-list sa CORS_ORIGIN.
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin) || localOrigin.test(origin));
  },
}));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Tourism System Balayan API is running.' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running.' });
});

async function checkDatabase() {
  await pool.query('SELECT 1');
  const [tables] = await pool.query('SHOW TABLES');
  const names = tables.map((row) => Object.values(row)[0].toLowerCase());
  const missingTables = REQUIRED_TABLES.filter((name) => !names.includes(name));
  let activeAdminAccounts = 0;
  if (names.includes('admins')) {
    [[{ c: activeAdminAccounts }]] = await pool.query('SELECT COUNT(*) AS c FROM admins WHERE active=1');
  }
  return { missingTables, activeAdminAccounts };
}

// Subukan sa browser: http://localhost:3001/api/health/db
app.get('/api/health/db', async (_req, res) => {
  try {
    const { missingTables, activeAdminAccounts } = await checkDatabase();
    res.json({
      status: missingTables.length ? 'incomplete' : 'ok',
      database: process.env.DB_NAME || 'visit_balayan',
      missingTables,
      activeAdminAccounts,
      hint: missingTables.length
        ? 'Run "npm run setup" in the Backend folder.'
        : activeAdminAccounts ? undefined : 'No admin account yet. Run: node createAdmin.js <username> <password> Admin "<Full Name>"',
    });
  } catch (e) {
    console.error(e);
    const known = describeDbError(e);
    res.status(known?.status || 500).json({ status: 'error', message: known?.message || e.message });
  }
});

app.use('/api', appointmentRoute);
app.use('/api/admin', adminRoute);
app.use('/api/survey', surveySubmissionRoute);          // 2.2.1 submit
app.use('/api/survey-responses', surveyResponseRoute);  // 2.2.2 manage

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found.', error: 'API route not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid request body.', error: 'Invalid request body.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error.', error: 'Internal server error.' });
});

app.listen(port, async () => {
  console.log(`Listening on port ${port}`);
  try {
    const { missingTables, activeAdminAccounts } = await checkDatabase();
    console.log(`Database connected (${process.env.DB_NAME || 'visit_balayan'}).`);
    if (missingTables.length) console.warn(`[WARNING] Missing tables: ${missingTables.join(', ')}. Run "npm run setup".`);
    else if (!activeAdminAccounts) console.warn('[WARNING] No admin account yet. Run: node createAdmin.js <username> <password> Admin "<Full Name>"');
  } catch (e) {
    console.error(`[WARNING] ${describeDbError(e)?.message || e.message}`);
  }
});
