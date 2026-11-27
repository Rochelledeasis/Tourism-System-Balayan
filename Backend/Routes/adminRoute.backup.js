
import { Router } from 'express';
import * as C from '../Controllers/adminController.js';
import {
  requireAuth,
  requireRole
} from '../Middleware/auth.js';

const router = Router();

// ================= ADMIN AUTHENTICATION =================

// Login - public route
router.post('/login', C.login);

// Get logged-in admin information
router.get('/me', requireAuth, C.me);

// Admin-only protection
const adminOnly = [requireAuth, requireRole('Admin')];

// ================= SERVICE MANAGEMENT =================

// Get all services
router.get('/services', ...adminOnly, C.getAllServices);

// Add service
router.post('/services', ...adminOnly, C.createService);

// Update service
router.put('/services/:id', ...adminOnly, C.updateService);

// Activate or deactivate service
router.patch('/services/:id/status', ...adminOnly, C.changeServiceStatus);

// ================= BLOCKED DATE MANAGEMENT =================

// Get blocked dates
router.get('/blocked-dates', ...adminOnly, C.getBlockedDates);

// Add blocked date
router.post('/blocked-dates', ...adminOnly, C.createBlockedDate);

// Delete blocked date
router.delete('/blocked-dates/:id', ...adminOnly, C.deleteBlockedDate);

export default router;
