import { parseCSVToObjects, generateCSV } from '../utils/csvParser.js';
import { questionBankRepository } from '../repositories/questionBankRepository.js';
import { logAudit } from '../repositories/auditRepository.js';

const MAX_CSV_ROWS = 1000;
const VALID_ANSWERS = ['A', 'B', 'C', 'D'];
const ANSWER_INDEX_MAP = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

export const questionBankService = {
  /**
   * Returns a sample RFC 4180 compliant CSV string for download
   */
  getSampleTemplate() {
    const headers = [
      'question',
      'optionA',
      'optionB',
      'optionC',
      'optionD',
      'correctAnswer',
      'subject',
      'topic',
      'difficulty',
      'explanation',
      'marks'
    ];

    const sampleRows = [
      {
        question: 'Which of the following data structures operates on a Last-In First-Out (LIFO) basis?',
        optionA: 'Queue',
        optionB: 'Stack',
        optionC: 'Binary Search Tree',
        optionD: 'Priority Queue',
        correctAnswer: 'B',
        subject: 'Computer Science Fundamentals',
        topic: 'Linear Data Structures',
        difficulty: 'EASY',
        explanation: 'A stack operates strictly on the LIFO principle, where elements are inserted and removed from the same top end.',
        marks: 4
      },
      {
        question: 'What is the average time complexity of searching an element in a balanced Binary Search Tree (AVL / Red-Black Tree)?',
        optionA: 'O(1)',
        optionB: 'O(n)',
        optionC: 'O(log n)',
        optionD: 'O(n log n)',
        correctAnswer: 'C',
        subject: 'Computer Science Fundamentals',
        topic: 'Tree Structures & Algorithms',
        difficulty: 'MEDIUM',
        explanation: 'Because the height of a balanced BST is kept proportional to log2(n), search operations take O(log n) comparisons.',
        marks: 4
      },
      {
        question: 'In SQL relational databases, what does the ACID property "Isolation" ensure?',
        optionA: 'Changes are written permanently to disk after commit',
        optionB: 'Transactions execute independently without concurrent interference',
        optionC: 'Database constraints and integrity rules are never violated',
        optionD: 'All steps in a transaction succeed, or the entire operation is rolled back',
        correctAnswer: 'B',
        subject: 'Database Systems',
        topic: 'Transaction Management',
        difficulty: 'HARD',
        explanation: 'Isolation ensures that concurrent transactions execute as though they were run sequentially, preventing race conditions and dirty reads.',
        marks: 4
      },
      {
        question: 'In modern React, which hook is primarily used to manage side effects such as data fetching and subscriptions?',
        optionA: 'useState',
        optionB: 'useMemo',
        optionC: 'useContext',
        optionD: 'useEffect',
        correctAnswer: 'D',
        subject: 'Web Development',
        topic: 'React Component Lifecycle & Hooks',
        difficulty: 'EASY',
        explanation: 'useEffect serves the purpose of handling side effects, timers, subscriptions, and DOM mutations in functional components.',
        marks: 4
      }
    ];

    return generateCSV(headers, sampleRows);
  },

  /**
   * Validates parsed CSV rows against schema constraints, teacher permissions, and duplicate rules
   * @param {string} csvText 
   * @param {Object} user 
   * @returns {Promise<Object>}
   */
  async validateAndAnalyze(csvText, user) {
    if (!csvText || typeof csvText !== 'string' || csvText.trim() === '') {
      return {
        success: false,
        error: 'The uploaded CSV file is empty. Please choose a valid file containing question records.'
      };
    }

    const parsed = parseCSVToObjects(csvText);

    if (parsed.error) {
      return {
        success: false,
        error: parsed.error
      };
    }

    if (parsed.missingHeaders && parsed.missingHeaders.length > 0) {
      return {
        success: false,
        error: `Missing required CSV column headers: ${parsed.missingHeaders.join(', ')}. Please use the downloadable template.`
      };
    }

    if (parsed.rows.length === 0) {
      return {
        success: false,
        error: 'The CSV file contains column headers but no question data rows.'
      };
    }

    if (parsed.rows.length > MAX_CSV_ROWS) {
      return {
        success: false,
        error: `The CSV file contains ${parsed.rows.length} rows, which exceeds the maximum allowable limit of ${MAX_CSV_ROWS} questions per batch import.`
      };
    }

    // Determine teacher authorized subjects
    const authorizedSubjects = await questionBankRepository.getTeacherAuthorizedSubjects(user.id, user.role);
    const isUnrestricted = authorizedSubjects === null; // ADMIN

    // Query database for existing questions matching candidates to check duplicate questions
    const candidates = parsed.rows.map(r => ({
      question_text: r.data.question || '',
      subject: r.data.subject || ''
    }));
    const existingDbQuestions = await questionBankRepository.findExistingDuplicates(candidates);
    const existingDbMap = new Map();
    existingDbQuestions.forEach(ex => {
      const key = `${ex.norm_text}:::${ex.norm_subject}`;
      existingDbMap.set(key, ex);
    });

    const validatedRows = [];
    const seenInFile = new Map();

    let validCount = 0;
    let invalidCount = 0;
    let duplicateDbCount = 0;
    let duplicateFileCount = 0;

    for (const rowItem of parsed.rows) {
      const { rowNumber, data } = rowItem;
      const errors = [];
      const warnings = [];

      // 1. Validate Question Text
      const questionText = (data.question || '').trim();
      if (!questionText) {
        errors.push('Question text is required.');
      } else if (questionText.length < 3) {
        errors.push('Question text is too short (minimum 3 characters).');
      } else if (questionText.length > 2500) {
        errors.push('Question text exceeds maximum length of 2500 characters.');
      }

      // 2. Validate Options
      const optA = (data.optionA || '').trim();
      const optB = (data.optionB || '').trim();
      const optC = (data.optionC || '').trim();
      const optD = (data.optionD || '').trim();

      if (!optA) errors.push('Option A is required.');
      if (!optB) errors.push('Option B is required.');
      if (!optC) errors.push('Option C is required.');
      if (!optD) errors.push('Option D is required.');

      // Check distinct options warning
      const optionsArr = [optA, optB, optC, optD].filter(Boolean);
      const uniqueOptions = new Set(optionsArr.map(o => o.toLowerCase()));
      if (optionsArr.length === 4 && uniqueOptions.size < 4) {
        warnings.push('Duplicate option values detected within this question.');
      }

      // 3. Validate Correct Answer
      const rawAns = (data.correctAnswer || '').toUpperCase().trim();
      if (!rawAns) {
        errors.push('Correct answer is required (must be A, B, C, or D).');
      } else if (!VALID_ANSWERS.includes(rawAns)) {
        errors.push(`Invalid correct answer "${rawAns}". Allowed values are: A, B, C, D.`);
      }

      // 4. Validate Subject & Topic
      const subject = (data.subject || '').trim();
      const topic = (data.topic || '').trim();

      if (!subject) {
        errors.push('Subject is required.');
      } else if (subject.length < 2) {
        errors.push('Subject name must be at least 2 characters.');
      }

      if (!topic) {
        errors.push('Topic is required.');
      } else if (topic.length < 2) {
        errors.push('Topic name must be at least 2 characters.');
      }

      // 5. Teacher Authorization Check
      if (!isUnrestricted && subject) {
        const subNorm = subject.toLowerCase().trim();
        const hasPermission = authorizedSubjects.some(authSub => authSub === subNorm || subNorm.includes(authSub) || authSub.includes(subNorm));
        if (!hasPermission) {
          errors.push(
            `Permission Denied: You are not authorized to import questions for subject "${subject}".` +
            (authorizedSubjects.length > 0 ? ` Your authorized subjects are: ${authorizedSubjects.join(', ')}.` : ' You currently have no assigned subjects.')
          );
        }
      }

      // 6. Validate Difficulty
      let difficulty = (data.difficulty || 'MEDIUM').toUpperCase().trim();
      if (!VALID_DIFFICULTIES.includes(difficulty)) {
        if (data.difficulty && data.difficulty.trim() !== '') {
          errors.push(`Invalid difficulty "${data.difficulty}". Allowed values: EASY, MEDIUM, HARD.`);
        } else {
          difficulty = 'MEDIUM';
        }
      }

      // 7. Validate Marks
      let marks = 4.0;
      if (data.marks !== undefined && String(data.marks).trim() !== '') {
        const parsedMarks = parseFloat(data.marks);
        if (isNaN(parsedMarks) || parsedMarks <= 0) {
          errors.push(`Marks must be a positive number greater than 0 (received "${data.marks}").`);
        } else if (parsedMarks > 100) {
          errors.push('Marks per question cannot exceed 100.');
        } else {
          marks = parsedMarks;
        }
      }

      // 8. Negative marks calculation
      let negativeMarks = parseFloat((marks / 4).toFixed(2));
      if (data.negativeMarks !== undefined && String(data.negativeMarks).trim() !== '') {
        const parsedNeg = parseFloat(data.negativeMarks);
        if (!isNaN(parsedNeg) && parsedNeg >= 0) {
          negativeMarks = parsedNeg;
        }
      }

      // 9. Explanation
      const explanation = (data.explanation || '').trim();
      if (explanation.length > 3000) {
        errors.push('Explanation exceeds maximum allowed limit of 3000 characters.');
      }

      // 10. In-file duplicate check
      const fileKey = `${questionText.toLowerCase()}:::${subject.toLowerCase()}`;
      let isDuplicateInFile = false;
      if (questionText && subject) {
        if (seenInFile.has(fileKey)) {
          isDuplicateInFile = true;
          duplicateFileCount++;
          const prevRow = seenInFile.get(fileKey);
          errors.push(`Duplicate question: Identical to Row #${prevRow} in this CSV file.`);
        } else {
          seenInFile.set(fileKey, rowNumber);
        }
      }

      // 11. Database duplicate check
      let isDuplicateInDb = false;
      let existingDbMatch = null;
      if (questionText && subject && !isDuplicateInFile) {
        const dbMatch = existingDbMap.get(fileKey);
        if (dbMatch) {
          isDuplicateInDb = true;
          duplicateDbCount++;
          existingDbMatch = { id: dbMatch.id, question_text: dbMatch.question_text };
          warnings.push(`Matches existing question in Question Bank (ID: ${dbMatch.id}).`);
        }
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
      }

      validatedRows.push({
        rowNumber,
        isValid,
        isDuplicateInFile,
        isDuplicateInDb,
        existingDbMatch,
        errors,
        warnings,
        data: {
          question: questionText,
          optionA: optA,
          optionB: optB,
          optionC: optC,
          optionD: optD,
          correctAnswer: rawAns,
          correctOptionIndex: ANSWER_INDEX_MAP[rawAns] !== undefined ? ANSWER_INDEX_MAP[rawAns] : 0,
          options: [optA, optB, optC, optD],
          subject,
          topic,
          difficulty,
          marks,
          negativeMarks,
          explanation
        }
      });
    }

    const allErrors = [];
    validatedRows.forEach(r => {
      if (r.errors && r.errors.length) allErrors.push(...r.errors);
    });

    return {
      success: true,
      validCount,
      valid_count: validCount,
      totalRows: parsed.rows.length,
      total_rows: parsed.rows.length,
      invalidCount,
      invalid_count: invalidCount,
      errors: allErrors,
      summary: {
        totalRows: parsed.rows.length,
        validRows: validCount,
        invalidRows: invalidCount,
        duplicateInFileCount: duplicateFileCount,
        duplicateInDbCount: duplicateDbCount,
        unrestrictedUser: isUnrestricted,
        authorizedSubjects: isUnrestricted ? 'ALL' : authorizedSubjects
      },
      headers: parsed.headers,
      rows: validatedRows
    };
  },

  /**
   * Preview CSV import without modifying the database
   */
  async previewCSV(csvText, user) {
    return this.validateAndAnalyze(csvText, user);
  },

  /**
   * Commit questions into database with duplicate strategy and transaction safety
   * @param {string} csvText 
   * @param {Object} user 
   * @param {Object} options 
   * @param {string} [options.duplicateStrategy='skip'] - 'skip' | 'allow'
   * @param {Object} reqInfo - IP, user agent for audit log
   */
  async importCSV(csvText, user, options = {}, reqInfo = {}) {
    const duplicateStrategy = options.duplicateStrategy === 'allow' ? 'allow' : 'skip';

    // 1. Run authoritative server-side validation
    const validation = await this.validateAndAnalyze(csvText, user);
    if (!validation.success) {
      return validation;
    }

    const { rows, summary } = validation;

    const toInsert = [];
    const skippedRows = [];
    const failedRows = [];

    for (const r of rows) {
      if (!r.isValid) {
        failedRows.push({
          rowNumber: r.rowNumber,
          question: r.data.question,
          errors: r.errors
        });
        continue;
      }

      // Check DB duplicate handling
      if (r.isDuplicateInDb) {
        if (duplicateStrategy === 'skip') {
          skippedRows.push({
            rowNumber: r.rowNumber,
            question: r.data.question,
            reason: `Skipped: Duplicate of existing Question Bank item (${r.existingDbMatch?.id}).`
          });
          continue;
        }
      }

      // Prepare question record for insertion
      toInsert.push({
        question_text: r.data.question,
        options: r.data.options,
        correct_option_index: r.data.correctOptionIndex,
        correct_answer: r.data.correctAnswer,
        subject: r.data.subject,
        topic: r.data.topic,
        difficulty: r.data.difficulty,
        explanation: r.data.explanation,
        marks: r.data.marks,
        negative_marks: r.data.negativeMarks
      });
    }

    // 2. Batch insert into database with transaction
    let insertedQuestions = [];
    if (toInsert.length > 0) {
      insertedQuestions = await questionBankRepository.batchInsert(toInsert, user.id);
    }

    // 3. Write structured audit log
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: 'BULK_QUESTIONS_IMPORTED',
      resourceType: 'QUESTION_BANK',
      resourceId: null,
      summary: `Bulk CSV import completed: ${insertedQuestions.length} inserted, ${skippedRows.length} skipped, ${failedRows.length} failed. Strategy: ${duplicateStrategy}.`,
      ipAddress: reqInfo.ip || null
    });

    return {
      success: true,
      message: `Import completed. ${insertedQuestions.length} question(s) added successfully.`,
      result: {
        totalRows: summary.totalRows,
        importedCount: insertedQuestions.length,
        skippedCount: skippedRows.length,
        failedCount: failedRows.length,
        duplicateStrategy,
        importedQuestions: insertedQuestions,
        skippedRows,
        failedRows
      }
    };
  },

  /**
   * Generates a downloadable CSV error report for failed rows
   */
  generateErrorReport(failedRows) {
    const headers = ['Row Number', 'Question', 'Errors'];
    const rows = (failedRows || []).map(f => ({
      'Row Number': f.rowNumber,
      'Question': f.question || '',
      'Errors': Array.isArray(f.errors) ? f.errors.join('; ') : String(f.reason || '')
    }));
    return generateCSV(headers, rows);
  }
};
