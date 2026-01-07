import { Question, QuestionType } from '../types';

export interface GradeResult {
  isCorrect: boolean;
  score: number;
  feedback?: string;
}

export const gradeQuestionLocally = (question: Question, userAnswer: any): GradeResult => {
  if (userAnswer === null || userAnswer === undefined) {
    return { isCorrect: false, score: 0, feedback: "No answer provided." };
  }

  switch (question.type) {
    case QuestionType.SingleChoice: {
      const correct = question.answer.correct_option_key === userAnswer;
      return { isCorrect: correct, score: correct ? 1 : 0 };
    }

    case QuestionType.TrueFalse: {
      const correct = question.answer.correct_boolean === userAnswer;
      return { isCorrect: correct, score: correct ? 1 : 0 };
    }

    case QuestionType.MultipleChoice: {
      // Strict: All must match exactly.
      // In a real app, partial scoring could be enabled via config.
      const correctKeys = new Set(question.answer.correct_option_keys || []);
      const userKeys = new Set(userAnswer as string[]);
      
      if (correctKeys.size !== userKeys.size) return { isCorrect: false, score: 0 };
      
      for (let k of userKeys) {
        if (!correctKeys.has(k)) return { isCorrect: false, score: 0 };
      }
      return { isCorrect: true, score: 1 };
    }

    case QuestionType.FillBlank: {
      const input = String(userAnswer).trim().toLowerCase();
      const expected = question.answer.expected_answers?.map(a => a.trim().toLowerCase()) || [];
      
      // 1. Direct Match
      if (expected.includes(input)) {
        return { isCorrect: true, score: 1, feedback: "Exact match." };
      }

      // 2. Regex Match
      if (question.answer.match_regexes) {
        for (const pattern of question.answer.match_regexes) {
          try {
            if (new RegExp(pattern, 'i').test(input)) {
              return { isCorrect: true, score: 1, feedback: "Regex match." };
            }
          } catch (e) {
            console.warn("Invalid regex in question", question.id);
          }
        }
      }

      // 3. Fallback (If LLM grading is requested, this local grade is "Correctness Unknown", returned as false for now)
      return { isCorrect: false, score: 0 };
    }
    
    default:
      return { isCorrect: false, score: 0 };
  }
};
