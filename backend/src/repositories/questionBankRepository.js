import crypto from 'crypto';
import { pool, isPostgresConnected, memoryStore } from '../db/index.js';

export const questionBankRepository = {
  /**
   * Insert a single question into the Question Bank
   */
  async createQuestion(questionData, client = null) {
    const id = questionData.id || `qb-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const options = Array.isArray(questionData.options) ? questionData.options : [];
    const correctOptionIndex = parseInt(questionData.correct_option_index, 10) || 0;
    const correctAnswer = (questionData.correct_answer || 'A').toUpperCase().trim();
    const marks = parseFloat(questionData.marks) || 4.0;
    const negativeMarks = parseFloat(questionData.negative_marks !== undefined ? questionData.negative_marks : 1.0);
    const difficulty = (questionData.difficulty || 'MEDIUM').toUpperCase().trim();

    if (isPostgresConnected && pool) {
      const dbClient = client || pool;
      const res = await dbClient.query(
        `INSERT INTO question_bank (
          id, question_text, options, correct_option_index, correct_answer,
          subject, topic, difficulty, explanation, marks, negative_marks,
          created_by, subject_id, course_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          id,
          questionData.question_text.trim(),
          JSON.stringify(options),
          correctOptionIndex,
          correctAnswer,
          questionData.subject.trim(),
          questionData.topic.trim(),
          difficulty,
          questionData.explanation ? questionData.explanation.trim() : '',
          marks,
          negativeMarks,
          questionData.created_by || null,
          questionData.subject_id || null,
          questionData.course_id || null,
          now,
          now
        ]
      );
      return res.rows[0];
    }

    const item = {
      id,
      question_text: questionData.question_text.trim(),
      options,
      correct_option_index: correctOptionIndex,
      correct_answer: correctAnswer,
      subject: questionData.subject.trim(),
      topic: questionData.topic.trim(),
      difficulty,
      explanation: questionData.explanation ? questionData.explanation.trim() : '',
      marks,
      negative_marks: negativeMarks,
      created_by: questionData.created_by || null,
      subject_id: questionData.subject_id || null,
      course_id: questionData.course_id || null,
      created_at: now,
      updated_at: now
    };
    memoryStore.question_bank.unshift(item);
    return item;
  },

  /**
   * Batch insert valid questions with full transaction safety
   * @param {Array<Object>} questions 
   * @param {string} userId 
   * @returns {Promise<Array<Object>>}
   */
  async batchInsert(questions, userId) {
    if (!questions || questions.length === 0) {
      return [];
    }

    if (isPostgresConnected && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const inserted = [];

        for (const q of questions) {
          const res = await this.createQuestion({ ...q, created_by: userId }, client);
          inserted.push(res);
        }

        await client.query('COMMIT');
        return inserted;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // In-memory fallback
    const inserted = [];
    for (const q of questions) {
      const res = await this.createQuestion({ ...q, created_by: userId });
      inserted.push(res);
    }
    return inserted;
  },

  /**
   * Find existing questions in question_bank matching question_text and subject
   * @param {Array<{ question_text: string, subject: string }>} candidates 
   * @returns {Promise<Array<Object>>}
   */
  async findExistingDuplicates(candidates) {
    if (!candidates || candidates.length === 0) return [];

    const normalizedTexts = candidates.map(c => (c.question_text || '').toLowerCase().trim()).filter(Boolean);
    if (normalizedTexts.length === 0) return [];

    if (isPostgresConnected && pool) {
      // Chunking if candidate list is large
      const res = await pool.query(
        `SELECT id, LOWER(TRIM(question_text)) as norm_text, LOWER(TRIM(subject)) as norm_subject, question_text, subject
         FROM question_bank
         WHERE LOWER(TRIM(question_text)) = ANY($1)`,
        [normalizedTexts]
      );
      return res.rows;
    }

    return (memoryStore.question_bank || []).filter(item => {
      const normText = (item.question_text || '').toLowerCase().trim();
      return normalizedTexts.includes(normText);
    }).map(item => ({
      id: item.id,
      norm_text: (item.question_text || '').toLowerCase().trim(),
      norm_subject: (item.subject || '').toLowerCase().trim(),
      question_text: item.question_text,
      subject: item.subject
    }));
  },

  /**
   * Retrieve paginated questions from question bank with filtering
   */
  async getQuestions({
    search = '',
    subject = '',
    topic = '',
    difficulty = '',
    createdBy = '',
    limit = 50,
    offset = 0
  } = {}) {
    const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const pageOffset = Math.max(parseInt(offset, 10) || 0, 0);

    if (isPostgresConnected && pool) {
      const conditions = [];
      const params = [];
      let paramIdx = 1;

      if (search && search.trim()) {
        conditions.push(`(question_text ILIKE $${paramIdx} OR topic ILIKE $${paramIdx} OR subject ILIKE $${paramIdx})`);
        params.push(`%${search.trim()}%`);
        paramIdx++;
      }

      if (subject && subject.trim() && subject !== 'all') {
        conditions.push(`LOWER(subject) = LOWER($${paramIdx})`);
        params.push(subject.trim());
        paramIdx++;
      }

      if (topic && topic.trim() && topic !== 'all') {
        conditions.push(`LOWER(topic) = LOWER($${paramIdx})`);
        params.push(topic.trim());
        paramIdx++;
      }

      if (difficulty && difficulty.trim() && difficulty !== 'all') {
        conditions.push(`LOWER(difficulty) = LOWER($${paramIdx})`);
        params.push(difficulty.trim());
        paramIdx++;
      }

      if (createdBy && createdBy.trim()) {
        conditions.push(`created_by = $${paramIdx}`);
        params.push(createdBy.trim());
        paramIdx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count query
      const countRes = await pool.query(
        `SELECT COUNT(*) as total FROM question_bank ${whereClause}`,
        params
      );
      const total = parseInt(countRes.rows[0]?.total || 0, 10);

      // Data query
      const queryParams = [...params, pageLimit, pageOffset];
      const dataRes = await pool.query(
        `SELECT qb.*, u.full_name as author_name, u.email as author_email
         FROM question_bank qb
         LEFT JOIN users u ON qb.created_by = u.id
         ${whereClause}
         ORDER BY qb.created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        queryParams
      );

      return {
        questions: dataRes.rows,
        total,
        limit: pageLimit,
        offset: pageOffset
      };
    }

    // In-memory fallback
    let list = [...(memoryStore.question_bank || [])];

    if (search && search.trim()) {
      const s = search.toLowerCase().trim();
      list = list.filter(q =>
        (q.question_text || '').toLowerCase().includes(s) ||
        (q.topic || '').toLowerCase().includes(s) ||
        (q.subject || '').toLowerCase().includes(s)
      );
    }

    if (subject && subject.trim() && subject !== 'all') {
      list = list.filter(q => (q.subject || '').toLowerCase() === subject.toLowerCase().trim());
    }

    if (topic && topic.trim() && topic !== 'all') {
      list = list.filter(q => (q.topic || '').toLowerCase() === topic.toLowerCase().trim());
    }

    if (difficulty && difficulty.trim() && difficulty !== 'all') {
      list = list.filter(q => (q.difficulty || '').toLowerCase() === difficulty.toLowerCase().trim());
    }

    if (createdBy && createdBy.trim()) {
      list = list.filter(q => q.created_by === createdBy.trim());
    }

    const total = list.length;
    const paginated = list.slice(pageOffset, pageOffset + pageLimit);

    return {
      questions: paginated,
      total,
      limit: pageLimit,
      offset: pageOffset
    };
  },

  /**
   * Find single question by id
   */
  async findById(id) {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `SELECT qb.*, u.full_name as author_name FROM question_bank qb LEFT JOIN users u ON qb.created_by = u.id WHERE qb.id = $1`,
        [id]
      );
      return res.rows[0] || null;
    }
    return (memoryStore.question_bank || []).find(q => q.id === id) || null;
  },

  /**
   * Delete a question from question bank
   */
  async deleteQuestion(id) {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `DELETE FROM question_bank WHERE id = $1 RETURNING *`,
        [id]
      );
      return res.rows[0] || null;
    }

    const idx = (memoryStore.question_bank || []).findIndex(q => q.id === id);
    if (idx !== -1) {
      const removed = memoryStore.question_bank.splice(idx, 1);
      return removed[0];
    }
    return null;
  },

  /**
   * Get distinct subjects and topics for search/filter dropdowns
   */
  async getFilterOptions() {
    if (isPostgresConnected && pool) {
      const subjectsRes = await pool.query(
        `SELECT DISTINCT subject FROM question_bank WHERE subject IS NOT NULL AND subject <> '' ORDER BY subject ASC`
      );
      const topicsRes = await pool.query(
        `SELECT DISTINCT topic, subject FROM question_bank WHERE topic IS NOT NULL AND topic <> '' ORDER BY topic ASC`
      );
      return {
        subjects: subjectsRes.rows.map(r => r.subject),
        topics: topicsRes.rows.map(r => ({ topic: r.topic, subject: r.subject }))
      };
    }

    const bank = memoryStore.question_bank || [];
    const subjects = Array.from(new Set(bank.map(q => q.subject).filter(Boolean))).sort();
    const topics = Array.from(new Set(bank.map(q => q.topic).filter(Boolean))).map(t => {
      const match = bank.find(q => q.topic === t);
      return { topic: t, subject: match?.subject || '' };
    });

    return { subjects, topics };
  },

  /**
   * Get authorized subjects for a teacher
   * Returns null if user is ADMIN (all subjects authorized)
   * Returns array of lowercase subject names/codes for TEACHER
   */
  async getTeacherAuthorizedSubjects(userId, role) {
    if (role === 'ADMIN') {
      return null; // Admins have unrestricted access to all subjects
    }

    if (isPostgresConnected && pool) {
      // 1. Subjects directly assigned via teacher_assignments
      const taRes = await pool.query(
        `SELECT DISTINCT s.name as subject_name, s.code as subject_code
         FROM teacher_assignments ta
         JOIN subjects s ON ta.subject_id = s.id
         WHERE ta.teacher_id = $1`,
        [userId]
      );

      // 2. Subjects linked to classes or batches taught by this teacher
      const btRes = await pool.query(
        `SELECT DISTINCT s.name as subject_name, s.code as subject_code
         FROM batch_teachers bt
         JOIN batches b ON bt.batch_id = b.id
         JOIN class_subjects cs ON b.class_id = cs.class_id
         JOIN subjects s ON cs.subject_id = s.id
         WHERE bt.teacher_id = $1`,
        [userId]
      );

      const subjects = new Set();
      [...taRes.rows, ...btRes.rows].forEach(r => {
        if (r.subject_name) subjects.add(r.subject_name.toLowerCase().trim());
        if (r.subject_code) subjects.add(r.subject_code.toLowerCase().trim());
      });

      return Array.from(subjects);
    }

    // In-memory fallback
    const assignments = (memoryStore.teacher_assignments || []).filter(ta => ta.teacher_id === userId);
    const subjects = new Set();
    assignments.forEach(ta => {
      const sub = (memoryStore.subjects || []).find(s => s.id === ta.subject_id);
      if (sub?.name) subjects.add(sub.name.toLowerCase().trim());
      if (sub?.code) subjects.add(sub.code.toLowerCase().trim());
    });

    return Array.from(subjects);
  }
};
