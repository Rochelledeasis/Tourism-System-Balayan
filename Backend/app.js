import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import appointmentRoute from './Routes/appointmentRoute.js';
import adminRoute from './Routes/adminRoute.js';

const app = express();
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174').split(',');
app.use(cors({ origin: origins }));
app.use(express.json());
app.use('/api', appointmentRoute);
app.use('/api/admin', adminRoute);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Listening on port ${port}`));
