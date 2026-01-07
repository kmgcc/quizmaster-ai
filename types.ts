// --- qb.v1 Schema Types ---

export enum QuestionType {
  SingleChoice = 'single_choice',
  MultipleChoice = 'multiple_choice',
  TrueFalse = 'true_false',
  FillBlank = 'fill_blank',
}

export interface Option {
  key: string;
  text: string;
}

export interface QuestionAnswer {
  // Single Choice
  correct_option_key?: string;
  // Multiple Choice
  correct_option_keys?: string[];
  // True/False
  correct_boolean?: boolean;
  // Fill Blank
  expected_answers?: string[];
  llm_grading?: boolean;
  match_regexes?: string[]; // Optional regex strings
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string; // The question text/markdown
  options?: Option[]; // For choice types
  answer: QuestionAnswer;
  explanation?: string; // Static explanation
  tags?: string[];
}

export interface QuestionBank {
  schema_version: string; // "1.0", "qb.v1", "2.0", or "qb.v2"
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  questions: Question[];
  created_at?: number;
}

// --- App State Types ---

export interface QuizConfig {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  instantFeedback: boolean;
  onlyMistakes: boolean; // Not implemented in this version's MVP flow, but reserved
}

export interface AISettings {
  roleName: string;
  customPrompt: string;
}

export interface UserResponse {
  questionId: string;
  userAnswer: any; // string, string[], boolean
  isCorrect: boolean;
  score: number; // 0 to 1
  feedback?: string; // AI Feedback
  timestamp: number;
  timeTakenMs?: number;
  isAiGraded?: boolean;
  isFlagged?: boolean; // User marked as confusing
  annotation?: string; // User's personal notes/thoughts
  chatHistory?: ChatMessage[]; // AI chat history for this question (deprecated, use localStorage instead)
  questionIndex?: number; // 题目在题库中的索引（0-based），用于显示真实题号
}

export interface QuizSession {
  id: string;
  bankId: string;
  startTime: number;
  endTime: number;
  responses: Record<string, UserResponse>; // Map QuestionID -> Response
  totalScore: number;
}

export interface AIAnalysisRequest {
  question: Question;
  userResponse: UserResponse;
  userQuery: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}