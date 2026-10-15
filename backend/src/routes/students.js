import { Router } from 'express';
import { batchController } from '../controllers/batchController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Student search requires authentication (Admin or Teacher)
router.use(authenticateToken);

router.get('/search', batchController.searchStudents);

export default router;
