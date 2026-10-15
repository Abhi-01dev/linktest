import { pool, isPostgresConnected, memoryStore } from '../db/index.js';
import crypto from 'crypto';

export const quizRepository = {
  // Public/Student method - SANITIZED: Strips correct_option_index and explanation!
  async getQuizForTaker(quizId) {
    if (isPostgresConnected && pool) {
      const quizRes = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
      if (quizRes.rows.length === 0) return null;

      const qRes = await pool.query(
        `SELECT id, quiz_id, question_text, options, position
         FROM questions
         WHERE quiz_id = $1
         ORDER BY position ASC`,
        [quizId]
      );

      return {
        ...quizRes.rows[0],
        questions: qRes.rows
      };
    }

    const quiz = memoryStore.quizzes.find(q => q.id === quizId);
    if (!quiz) return null;

    const questions = memoryStore.questions
      .filter(q => q.quiz_id === quizId)
      .sort((a, b) => a.position - b.position)
      .map(q => ({
        id: q.id,
        quiz_id: q.quiz_id,
        question_text: q.question_text,
        options: q.options,
        position: q.position
      }));

    return {
      ...quiz,
      questions
    };
  },

  // Internal server-only method - used strictly for scoring calculation
  async getQuizQuestionsInternal(quizId) {
    if (isPostgresConnected && pool) {
      const res = await pool.query('SELECT * FROM questions WHERE quiz_id = $1 ORDER BY position ASC', [quizId]);
      return res.rows;
    }
    return memoryStore.questions
      .filter(q => q.quiz_id === quizId)
      .sort((a, b) => a.position - b.position);
  },

  async getQuizzesByCourseId(courseId) {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `SELECT q.*, COUNT(qu.id)::int as question_count
         FROM quizzes q
         LEFT JOIN questions qu ON q.id = qu.quiz_id
         WHERE q.course_id = $1
         GROUP BY q.id
         ORDER BY q.created_at ASC`,
        [courseId]
      );
      return res.rows;
    }

    return memoryStore.quizzes
      .filter(q => q.course_id === courseId)
      .map(q => ({
        ...q,
        question_count: memoryStore.questions.filter(qu => qu.quiz_id === q.id).length
      }));
  },

  async getAllQuizzes() {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `SELECT q.*, c.title as course_title, COUNT(qu.id)::int as question_count
         FROM quizzes q
         JOIN courses c ON q.course_id = c.id
         LEFT JOIN questions qu ON q.id = qu.quiz_id
         GROUP BY q.id, c.title
         ORDER BY q.created_at DESC`
      );
      return res.rows;
    }

    return memoryStore.quizzes.map(q => {
      const c = memoryStore.courses.find(course => course.id === q.course_id);
      return {
        ...q,
        course_title: c ? c.title : 'General',
        question_count: memoryStore.questions.filter(qu => qu.quiz_id === q.id).length
      };
    });
  },

  // Atomic attempt persistence
  async saveAttemptAndAnswers({ userId, quizId, score, totalQuestions, results }) {
    const attemptId = crypto.randomUUID();
    const now = new Date().toISOString();

    if (isPostgresConnected && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query(
          `INSERT INTO quiz_attempts (id, user_id, quiz_id, score, total_questions, submitted_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [attemptId, userId, quizId, score, totalQuestions, now]
        );

        for (const r of results) {
          const ansId = crypto.randomUUID();
          await client.query(
            `INSERT INTO quiz_attempt_answers (id, attempt_id, question_id, selected_option_index, is_correct)
             VALUES ($1, $2, $3, $4, $5)`,
            [ansId, attemptId, r.question_id, r.selected_option_index, r.is_correct]
          );
        }

        await client.query('COMMIT');
        return attemptId;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const attempt = {
      id: attemptId,
      user_id: userId,
      quiz_id: quizId,
      score,
      total_questions: totalQuestions,
      submitted_at: now
    };
    memoryStore.quiz_attempts.push(attempt);

    for (const r of results) {
      memoryStore.quiz_attempt_answers.push({
        id: crypto.randomUUID(),
        attempt_id: attemptId,
        question_id: r.question_id,
        selected_option_index: r.selected_option_index,
        is_correct: r.is_correct
      });
    }

    return attemptId;
  },

  async getUserAttempts(userId) {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `SELECT qa.*, q.title as quiz_title, c.title as course_title
         FROM quiz_attempts qa
         JOIN quizzes q ON qa.quiz_id = q.id
         JOIN courses c ON q.course_id = c.id
         WHERE qa.user_id = $1
         ORDER BY qa.submitted_at DESC`,
        [userId]
      );
      return res.rows;
    }

    return memoryStore.quiz_attempts
      .filter(qa => qa.user_id === userId)
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
      .map(qa => {
        const quiz = memoryStore.quizzes.find(q => q.id === qa.quiz_id);
        const course = quiz ? memoryStore.courses.find(c => c.id === quiz.course_id) : null;
        return {
          ...qa,
          quiz_title: quiz ? quiz.title : 'Assessment',
          course_title: course ? course.title : 'Course'
        };
      });
  },

  async getAttemptDetails(attemptId, userId) {
    if (isPostgresConnected && pool) {
      const attRes = await pool.query(
        `SELECT qa.*, q.title as quiz_title, q.description as quiz_description
         FROM quiz_attempts qa
         JOIN quizzes q ON qa.quiz_id = q.id
         WHERE qa.id = $1 AND qa.user_id = $2`,
        [attemptId, userId]
      );
      if (attRes.rows.length === 0) return null;

      const answersRes = await pool.query(
        `SELECT qaa.selected_option_index, qaa.is_correct,
                qu.id as question_id, qu.question_text, qu.options,
                qu.correct_option_index, qu.explanation
         FROM quiz_attempt_answers qaa
         JOIN questions qu ON qaa.question_id = qu.id
         WHERE qaa.attempt_id = $1
         ORDER BY qu.position ASC`,
        [attemptId]
      );

      return {
        ...attRes.rows[0],
        results: answersRes.rows
      };
    }

    const att = memoryStore.quiz_attempts.find(a => a.id === attemptId && a.user_id === userId);
    if (!att) return null;

    const quiz = memoryStore.quizzes.find(q => q.id === att.quiz_id);
    const answers = memoryStore.quiz_attempt_answers.filter(qaa => qaa.attempt_id === attemptId);

    const results = answers.map(a => {
      const q = memoryStore.questions.find(question => question.id === a.question_id);
      return {
        question_id: a.question_id,
        question_text: q ? q.question_text : '',
        options: q ? q.options : [],
        selected_option_index: a.selected_option_index,
        correct_option_index: q ? q.correct_option_index : 0,
        is_correct: a.is_correct,
        explanation: q ? q.explanation : ''
      };
    });

    return {
      ...att,
      quiz_title: quiz ? quiz.title : 'Assessment',
      quiz_description: quiz ? quiz.description : '',
      results
    };
  },

  async createQuiz({ courseId, title, description, questions = [] }) {
    const quizId = crypto.randomUUID();
    const now = new Date().toISOString();

    if (isPostgresConnected && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO quizzes (id, course_id, title, description, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [quizId, courseId, title, description, now]
        );

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const qId = crypto.randomUUID();
          await client.query(
            `INSERT INTO questions (id, quiz_id, question_text, options, correct_option_index, explanation, position)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [qId, quizId, q.question_text, JSON.stringify(q.options), q.correct_option_index, q.explanation, i + 1]
          );
        }

        await client.query('COMMIT');
        return { id: quizId, course_id: courseId, title, description };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const newQuiz = { id: quizId, course_id: courseId, title, description, created_at: now };
    memoryStore.quizzes.push(newQuiz);

    questions.forEach((q, idx) => {
      memoryStore.questions.push({
        id: crypto.randomUUID(),
        quiz_id: quizId,
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index,
        explanation: q.explanation,
        position: idx + 1
      });
    });

    return newQuiz;
  }
};
