import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Authenticated users (Admins, Teachers, and Students) can retrieve the curriculum subjects catalog
router.get('/', authenticateToken, adminController.getSubjects);

// Only Administrators can create new curriculum subjects
router.post('/', authenticateToken, requireRole('ADMIN'), adminController.createSubject);

export default router;
