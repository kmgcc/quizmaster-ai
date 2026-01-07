import { QuestionBank, Question, QuestionType } from '../types';

interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: QuestionBank;
}

export const validateQuestionBank = (json: any): ValidationResult => {
  if (typeof json !== 'object' || json === null) {
    return { valid: false, error: "Root must be an object." };
  }

  // 1. Check Root Fields
  const validVersions = ["qb.v1", "1.0", "qb.v2", "2.0"];
  if (!json.schema_version || !validVersions.includes(json.schema_version)) {
    return { valid: false, error: "Invalid or missing 'schema_version'. Must be 'qb.v1', '1.0', 'qb.v2', or '2.0'." };
  }
  if (!json.id || typeof json.id !== 'string') return { valid: false, error: "Missing 'id' string." };
  if (!json.title || typeof json.title !== 'string') return { valid: false, error: "Missing 'title' string." };
  if (!Array.isArray(json.questions)) return { valid: false, error: "'questions' must be an array." };

  // 2. Check Questions
  const ids = new Set<string>();
  for (let i = 0; i < json.questions.length; i++) {
    const q = json.questions[i];
    const path = `questions[${i}]`;

    if (!q.id) return { valid: false, error: `${path}: Missing 'id'.` };
    if (ids.has(q.id)) return { valid: false, error: `${path}: Duplicate Question ID '${q.id}'.` };
    ids.add(q.id);

    if (!q.type) return { valid: false, error: `${path}: Missing 'type'.` };
    if (!q.content) return { valid: false, error: `${path}: Missing 'content'.` };
    if (!q.answer) return { valid: false, error: `${path}: Missing 'answer' object.` };

    // 3. Type-specific validation
    switch (q.type) {
      case QuestionType.SingleChoice:
        if (!Array.isArray(q.options) || q.options.length < 2) {
          return { valid: false, error: `${path}: SingleChoice requires at least 2 'options'.` };
        }
        if (!q.answer.correct_option_key) {
          return { valid: false, error: `${path}: SingleChoice requires 'answer.correct_option_key'.` };
        }
        break;

      case QuestionType.MultipleChoice:
        if (!Array.isArray(q.options) || q.options.length < 2) {
          return { valid: false, error: `${path}: MultipleChoice requires at least 2 'options'.` };
        }
        if (!Array.isArray(q.answer.correct_option_keys) || q.answer.correct_option_keys.length === 0) {
          return { valid: false, error: `${path}: MultipleChoice requires 'answer.correct_option_keys'.` };
        }
        break;

      case QuestionType.TrueFalse:
        if (typeof q.answer.correct_boolean !== 'boolean') {
          return { valid: false, error: `${path}: TrueFalse requires 'answer.correct_boolean'.` };
        }
        break;

      case QuestionType.FillBlank:
        if (!q.answer.expected_answers && !q.answer.llm_grading) {
           return { valid: false, error: `${path}: FillBlank requires 'expected_answers' OR 'llm_grading=true'.` };
        }
        break;
        
      default:
         return { valid: false, error: `${path}: Unknown question type '${q.type}'.` };
    }
  }

  return { valid: true, data: json as QuestionBank };
};
