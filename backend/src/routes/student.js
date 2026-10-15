import { Router } from 'express';
import { studentController } from '../controllers/studentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All student routes require authentication
router.use(authenticateToken);

// ── Dashboard & Enrolled Classes ──
router.get('/dashboard', studentController.getDashboard);
router.get('/classes', studentController.getEnrolledClasses);

// ── Timetable ──
router.get('/timetable', studentController.getTimetable);

// ── Attendance ──
router.get('/attendance', studentController.getAttendance);

// ── Assignments & Submissions ──
router.get('/assignments', studentController.getAssignments);
router.post('/assignments/:id/submit', studentController.submitAssignment);

// ── Study Materials ──
router.get('/materials', studentController.getMaterials);

// ── Live Classes ──
router.get('/live-classes', studentController.getLiveClasses);

// ── Announcements & Notifications ──
router.get('/announcements', studentController.getAnnouncements);
router.get('/notifications', studentController.getNotifications);
router.post('/notifications/read', studentController.markNotificationsRead);

// ── Support / Feedback Tickets ──
router.get('/tickets', studentController.getTickets);
router.post('/tickets', studentController.createTicket);

export default router;
