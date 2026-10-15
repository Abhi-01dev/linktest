import { Router } from 'express';
import { quizController } from '../controllers/quizController.js';
import { authenticateToken, requireAnyRole } from '../middleware/auth.js';

const router = Router();

router.get('/course/:courseId', authenticateToken, quizController.getQuizzesByCourse);
router.get('/attempts/me', authenticateToken, quizController.getMyAttempts);
router.get('/attempts/:attemptId', authenticateToken, quizController.getAttemptDetails);
router.get('/:id', authenticateToken, quizController.getQuizById);
router.post('/:id/attempts', authenticateToken, quizController.submitAttempt);

// Quiz Authoring
router.post('/', authenticateToken, requireAnyRole('ADMIN', 'TEACHER'), quizController.createQuiz);

export default router;
