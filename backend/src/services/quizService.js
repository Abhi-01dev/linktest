import { quizRepository } from '../repositories/quizRepository.js';

export const quizService = {
  async submitAttempt({ userId, quizId, answers }) {
    const questions = await quizRepository.getQuizQuestionsInternal(quizId);
    if (!questions || questions.length === 0) {
      const err = new Error('Quiz not found or contains no questions.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Build map of user submitted answers by question_id
    const userAnswersMap = new Map();
    answers.forEach(a => {
      userAnswersMap.set(a.question_id, a.selected_option_index);
    });

    let score = 0;
    const totalQuestions = questions.length;
    const detailedResults = [];

    for (const q of questions) {
      const selectedIndex = userAnswersMap.has(q.id) ? userAnswersMap.get(q.id) : -1;
      const isCorrect = selectedIndex === q.correct_option_index;
      if (isCorrect) {
        score++;
      }

      detailedResults.push({
        question_id: q.id,
        question_text: q.question_text,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        selected_option_index: selectedIndex,
        correct_option_index: q.correct_option_index,
        is_correct: isCorrect,
        explanation: q.explanation
      });
    }

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const passed = percentage >= 60;

    // Persist to database atomically
    const attemptId = await quizRepository.saveAttemptAndAnswers({
      userId,
      quizId,
      score,
      totalQuestions,
      results: detailedResults
    });

    return {
      attempt_id: attemptId,
      quiz_id: quizId,
      score,
      total_questions: totalQuestions,
      percentage,
      passed,
      submitted_at: new Date().toISOString(),
      results: detailedResults
    };
  }
};
