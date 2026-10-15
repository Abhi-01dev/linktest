import { lessonRepository } from '../repositories/lessonRepository.js';
import { progressRepository } from '../repositories/progressRepository.js';
import { createLessonSchema, updateLessonSchema, setProgressSchema } from '../validators/index.js';

export const lessonController = {
  async getLessonsByCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const lessons = await lessonRepository.getByCourseId(courseId, req.user?.id);
      return res.status(200).json({
        success: true,
        data: { lessons },
        message: 'Course lessons retrieved.'
      });
    } catch (err) {
      next(err);
    }
  },

  async getLessonById(req, res, next) {
    try {
      const { id } = req.params;
      const lesson = await lessonRepository.getById(id, req.user?.id);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Lesson not found.' }
        });
      }
      return res.status(200).json({
        success: true,
        data: { lesson },
        message: 'Lesson retrieved.'
      });
    } catch (err) {
      next(err);
    }
  },

  async setProgress(req, res, next) {
    try {
      const validated = setProgressSchema.parse(req.body);
      const result = await progressRepository.setProgress(
        req.user.id,
        validated.lesson_id,
        validated.completed
      );
      return res.status(200).json({
        success: true,
        data: result,
        message: validated.completed ? 'Lesson marked as completed.' : 'Lesson marked as incomplete.'
      });
    } catch (err) {
      next(err);
    }
  },

  async createLesson(req, res, next) {
    try {
      const { courseId } = req.params;
      const validated = createLessonSchema.parse(req.body);
      const lesson = await lessonRepository.create({
        courseId,
        title: validated.title,
        content: validated.content,
        videoUrl: validated.video_url,
        position: validated.position
      });
      return res.status(201).json({
        success: true,
        data: { lesson },
        message: 'Lesson created successfully.'
      });
    } catch (err) {
      next(err);
    }
  },

  async updateLesson(req, res, next) {
    try {
      const { id } = req.params;
      const validated = updateLessonSchema.parse(req.body);
      const updated = await lessonRepository.update(id, validated);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Lesson not found.' }
        });
      }
      return res.status(200).json({
        success: true,
        data: { lesson: updated },
        message: 'Lesson updated successfully.'
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteLesson(req, res, next) {
    try {
      const { id } = req.params;
      const success = await lessonRepository.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Lesson not found.' }
        });
      }
      return res.status(200).json({
        success: true,
        data: { id },
        message: 'Lesson deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
};
