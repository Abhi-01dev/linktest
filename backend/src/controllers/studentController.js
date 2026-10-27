import { lmsRepository } from '../repositories/lmsRepository.js';
import { progressRepository } from '../repositories/progressRepository.js';
import { quizRepository } from '../repositories/quizRepository.js';
import { logAudit } from '../repositories/auditRepository.js';
import { notificationService } from '../services/notificationService.js';
import { z } from 'zod';

const submitAssignmentSchema = z.object({
  content: z.string().optional().default(''),
  file_path: z.string().optional().nullable(),
  file_name: z.string().optional().nullable()
});

const createTicketSchema = z.object({
  category: z.enum(['academic', 'technical', 'administrative', 'other']).default('academic'),
  subject: z.string().min(3).max(255),
  description: z.string().min(10).max(2000)
});

export const studentController = {
  // ── Student Dashboard Overview ──────────────────────────────────────
  async getDashboard(req, res, next) {
    try {
      const studentId = req.user.id;
      const todayDayOfWeek = new Date().getDay();

      // Get enrolled classes
      const enrollments = await lmsRepository.getClassesForStudent(studentId);
      const classId = enrollments[0]?.class_id;
      const batchId = enrollments[0]?.batch_id;

      const [timetable, assignments, attendance, liveClasses, announcements, overallProgress, quizAttempts] = await Promise.all([
        classId ? lmsRepository.getTimetable({ classId, batchId, dayOfWeek: todayDayOfWeek }) : [],
        lmsRepository.getAssignments({ studentId, classId }),
        lmsRepository.getAttendance({ studentId }),
        classId ? lmsRepository.getLiveClasses({ classId, status: 'scheduled' }) : [],
        lmsRepository.getAnnouncements({ limit: 5 }),
        progressRepository.getUserProgressSummary(studentId),
        quizRepository.getUserAttempts(studentId)
      ]);

      // Calculate attendance percentage
      const totalAttendanceDays = attendance.length;
      const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
      const attendancePercentage = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 100;

      // Pending assignments (due in future, not submitted yet)
      const pendingAssignments = assignments.filter(a => !a.submission_status || a.submission_status === 'pending');

      res.status(200).json({
        success: true,
        data: {
          enrolled_classes: enrollments,
          attendance_stats: {
            total_days: totalAttendanceDays,
            present_days: presentDays,
            percentage: attendancePercentage
          },
          metrics: {
            enrolled_classes_count: enrollments.length,
            pending_assignments_count: pendingAssignments.length,
            attendance_percentage: attendancePercentage,
            today_classes_count: timetable.length,
            completed_quizzes_count: quizAttempts.length
          },
          summary: {
            enrolled_classes_count: enrollments.length,
            pending_assignments_count: pendingAssignments.length,
            attendance_percentage: attendancePercentage,
            today_classes_count: timetable.length,
            completed_quizzes_count: quizAttempts.length
          },
          today_schedule: timetable,
          pending_assignments: pendingAssignments.slice(0, 5),
          upcoming_live_classes: liveClasses.slice(0, 3),
          announcements: announcements.slice(0, 5),
          overall_progress: overallProgress
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // ── Enrolled Classes ────────────────────────────────────────────────
  async getEnrolledClasses(req, res, next) {
    try {
      const classes = await lmsRepository.getClassesForStudent(req.user.id);
      res.status(200).json({ success: true, data: classes });
    } catch (err) {
      next(err);
    }
  },

  // ── Timetable ────────────────────────────────────────────────────────
  async getTimetable(req, res, next) {
    try {
      const enrollments = await lmsRepository.getClassesForStudent(req.user.id);
      if (enrollments.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }

      const { dayOfWeek } = req.query;
      const classId = enrollments[0].class_id;
      const batchId = enrollments[0].batch_id;

      const entries = await lmsRepository.getTimetable({
        classId,
        batchId,
        dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek, 10) : undefined
      });

      res.status(200).json({ success: true, data: entries });
    } catch (err) {
      next(err);
    }
  },

  // ── Attendance Records ───────────────────────────────────────────────
  async getAttendance(req, res, next) {
    try {
      const records = await lmsRepository.getAttendance({ studentId: req.user.id });
      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const late = records.filter(r => r.status === 'late').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

      res.status(200).json({
        success: true,
        data: {
          summary: { total, present, late, absent, percentage },
          records
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // ── Assignments & Submissions ────────────────────────────────────────
  async getAssignments(req, res, next) {
    try {
      const enrollments = await lmsRepository.getClassesForStudent(req.user.id);
      const classId = enrollments[0]?.class_id;

      const assignments = await lmsRepository.getAssignments({
        classId,
        studentId: req.user.id
      });
      res.status(200).json({ success: true, data: assignments });
    } catch (err) {
      next(err);
    }
  },

  async submitAssignment(req, res, next) {
    try {
      const { id } = req.params;
      const parsed = submitAssignmentSchema.parse(req.body);

      // Enforce single assignment submission policy
      const existing = await lmsRepository.getSubmission(id, req.user.id);
      if (existing && ['submitted', 'graded'].includes(existing.status)) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ALREADY_SUBMITTED',
            message: 'You have already submitted this assignment. Resubmission is not permitted.'
          }
        });
      }

      const submission = await lmsRepository.submitAssignment({
        assignmentId: id,
        studentId: req.user.id,
        content: parsed.content,
        filePath: parsed.file_path,
        fileName: parsed.file_name
      });

      await logAudit(req.user, 'SUBMIT_ASSIGNMENT', 'assignment_submissions', submission.id, `Submitted assignment ${id}`);
      res.status(200).json({
        success: true,
        data: submission,
        message: 'Assignment submitted successfully.'
      });
    } catch (err) {
      next(err);
    }
  },

  // ── Study Materials ──────────────────────────────────────────────────
  async getMaterials(req, res, next) {
    try {
      const enrollments = await lmsRepository.getClassesForStudent(req.user.id);
      const classId = enrollments[0]?.class_id;

      const materials = await lmsRepository.getMaterials({
        classId,
        published: true
      });
      res.status(200).json({ success: true, data: materials });
    } catch (err) {
      next(err);
    }
  },

  // ── Live Classes ─────────────────────────────────────────────────────
  async getLiveClasses(req, res, next) {
    try {
      const liveClasses = await lmsRepository.getLiveClasses({
        studentId: req.user.id
      });
      res.status(200).json({ success: true, data: liveClasses });
    } catch (err) {
      next(err);
    }
  },

  // ── Announcements ────────────────────────────────────────────────────
  async getAnnouncements(req, res, next) {
    try {
      const announcements = await lmsRepository.getAnnouncements({ limit: 50 });
      res.status(200).json({ success: true, data: announcements });
    } catch (err) {
      next(err);
    }
  },

  // ── Notifications ────────────────────────────────────────────────────
  async getNotifications(req, res, next) {
    try {
      const { unreadOnly } = req.query;
      const data = await notificationService.getNotifications(req.user.id, {
        unreadOnly: unreadOnly === 'true'
      });
      // Maintain backwards compatibility: data can be array or object
      res.status(200).json({ success: true, data: data.notifications, unread_count: data.unread_count });
    } catch (err) {
      next(err);
    }
  },

  async markNotificationsRead(req, res, next) {
    try {
      const { ids } = req.body;
      const updated = await notificationService.markAsRead(req.user.id, ids || null);
      res.status(200).json({ success: true, data: updated, message: 'Notifications marked as read.' });
    } catch (err) {
      next(err);
    }
  },

  // ── Support / Feedback Tickets ───────────────────────────────────────
  async getTickets(req, res, next) {
    try {
      const tickets = await lmsRepository.getTickets({ submitterId: req.user.id });
      res.status(200).json({ success: true, data: tickets });
    } catch (err) {
      next(err);
    }
  },

  async createTicket(req, res, next) {
    try {
      const parsed = createTicketSchema.parse(req.body);
      const ticket = await lmsRepository.createTicket({
        submitterId: req.user.id,
        category: parsed.category,
        subject: parsed.subject,
        description: parsed.description
      });

      await logAudit(req.user, 'CREATE_TICKET', 'feedback_tickets', ticket.id, `Created support ticket "${parsed.subject}"`);
      res.status(201).json({
        success: true,
        data: ticket,
        message: 'Feedback/Support ticket submitted.'
      });
    } catch (err) {
      next(err);
    }
  }
};
