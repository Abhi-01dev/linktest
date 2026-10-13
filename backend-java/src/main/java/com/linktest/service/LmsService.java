package com.linktest.service;

import com.linktest.entity.*;
import com.linktest.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class LmsService {

    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final LoggingService loggingService;

    public LmsService(
            CourseRepository courseRepository,
            LessonRepository lessonRepository,
            QuizRepository quizRepository,
            QuestionRepository questionRepository,
            QuizAttemptRepository quizAttemptRepository,
            LoggingService loggingService) {
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.loggingService = loggingService;
    }

    public List<Course> getAllCourses(User user) {
        if (user != null && "ADMIN".equalsIgnoreCase(user.getRole())) {
            return courseRepository.findAll();
        }
        return courseRepository.findByPublishedTrueOrderByCreatedAtDesc();
    }

    public Map<String, Object> getCourseById(String id) {
        Course course = courseRepository.findById(id).orElse(null);
        if (course == null) return null;

        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByPositionAsc(id);
        List<Quiz> quizzes = quizRepository.findByCourseId(id);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("course", course);
        out.put("lessons", lessons);
        out.put("quizzes", quizzes);
        return out;
    }

    @Transactional
    public Course createCourse(Course course, User user) {
        course.setInstructorId(user.getId());
        course.setInstructorName(user.getFullName());
        Course saved = courseRepository.save(course);
        loggingService.logAudit(user.getId(), "COURSE_CREATED", "course", saved.getId(), Map.of("title", saved.getTitle()));
        return saved;
    }

    @Transactional
    public Course updateCourse(String id, Course courseUpdate, User user) {
        Course course = courseRepository.findById(id).orElse(null);
        if (course == null) throw new IllegalArgumentException("Course not found.");

        if (courseUpdate.getTitle() != null) course.setTitle(courseUpdate.getTitle());
        if (courseUpdate.getDescription() != null) course.setDescription(courseUpdate.getDescription());
        if (courseUpdate.getCategory() != null) course.setCategory(courseUpdate.getCategory());
        if (courseUpdate.getThumbnailUrl() != null) course.setThumbnailUrl(courseUpdate.getThumbnailUrl());
        if (courseUpdate.getStatus() != null) course.setStatus(courseUpdate.getStatus());
        if (courseUpdate.getPublished() != null) course.setPublished(courseUpdate.getPublished());

        Course saved = courseRepository.save(course);
        loggingService.logAudit(user.getId(), "COURSE_UPDATED", "course", id, Map.of("title", saved.getTitle()));
        return saved;
    }

    @Transactional
    public void deleteCourse(String id, User user) {
        courseRepository.deleteById(id);
        loggingService.logAudit(user.getId(), "COURSE_DELETED", "course", id, Map.of());
    }

    public List<Lesson> getLessonsByCourse(String courseId) {
        return lessonRepository.findByCourseIdOrderByPositionAsc(courseId);
    }

    public Lesson getLessonById(String id) {
        return lessonRepository.findById(id).orElse(null);
    }

    @Transactional
    public Lesson createLesson(String courseId, Lesson lesson) {
        lesson.setCourseId(courseId);
        return lessonRepository.save(lesson);
    }

    @Transactional
    public Lesson updateLesson(String id, Lesson lessonUpdate) {
        Lesson lesson = lessonRepository.findById(id).orElse(null);
        if (lesson == null) throw new IllegalArgumentException("Lesson not found.");

        if (lessonUpdate.getTitle() != null) lesson.setTitle(lessonUpdate.getTitle());
        if (lessonUpdate.getContent() != null) lesson.setContent(lessonUpdate.getContent());
        if (lessonUpdate.getVideoUrl() != null) lesson.setVideoUrl(lessonUpdate.getVideoUrl());
        if (lessonUpdate.getPosition() != null) lesson.setPosition(lessonUpdate.getPosition());

        return lessonRepository.save(lesson);
    }

    @Transactional
    public void deleteLesson(String id) {
        lessonRepository.deleteById(id);
    }

    public List<Quiz> getQuizzesByCourse(String courseId) {
        return quizRepository.findByCourseId(courseId);
    }

    public Map<String, Object> getQuizById(String id) {
        Quiz quiz = quizRepository.findById(id).orElse(null);
        if (quiz == null) return null;

        List<Question> questions = questionRepository.findByQuizIdOrderByPositionAsc(id);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("quiz", quiz);
        out.put("questions", questions);
        return out;
    }

    @Transactional
    public Quiz createQuiz(Quiz quiz) {
        return quizRepository.save(quiz);
    }

    public List<QuizAttempt> getMyAttempts(User user) {
        return quizAttemptRepository.findByUserIdOrderBySubmittedAtDesc(user.getId());
    }

    public QuizAttempt getAttemptDetails(String attemptId, User user) {
        return quizAttemptRepository.findById(attemptId).orElse(null);
    }

    @Transactional
    public Map<String, Object> submitQuizAttempt(String quizId, Map<String, Object> submission, User user) {
        Quiz quiz = quizRepository.findById(quizId).orElse(null);
        if (quiz == null) throw new IllegalArgumentException("Quiz not found.");

        List<Question> questions = questionRepository.findByQuizIdOrderByPositionAsc(quizId);
        int totalQuestions = questions.size();
        int score = 0;

        @SuppressWarnings("unchecked")
        Map<String, Object> answers = (Map<String, Object>) submission.getOrDefault("answers", Collections.emptyMap());

        for (Question q : questions) {
            Object selObj = answers.get(q.getId());
            if (selObj instanceof Number && q.getCorrectOptionIndex() != null) {
                if (((Number) selObj).intValue() == q.getCorrectOptionIndex()) {
                    score++;
                }
            }
        }

        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuizId(quizId);
        attempt.setUserId(user.getId());
        attempt.setScore(score);
        attempt.setTotalQuestions(totalQuestions);
        attempt.setSubmittedAt(OffsetDateTime.now());

        QuizAttempt saved = quizAttemptRepository.save(attempt);

        int passPct = quiz.getPassPercentage() != null ? quiz.getPassPercentage() : 60;
        int userPct = totalQuestions > 0 ? (score * 100) / totalQuestions : 0;
        boolean passed = userPct >= passPct;

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("attempt", saved);
        out.put("score", score);
        out.put("total_questions", totalQuestions);
        out.put("percentage", userPct);
        out.put("passed", passed);

        return out;
    }
}
