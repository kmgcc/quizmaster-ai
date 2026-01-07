import React, { useState, useEffect } from 'react';
import { validateQuestionBank } from '../services/validator';
import { gradeQuestionLocally } from '../services/gradingLogic';
import { QuestionType, Question } from '../types';

// Mock Data for Tests
const VALID_BANK = {
  schema_version: "qb.v1", id: "t1", title: "T", questions: [{ id: "q1", type: "single_choice", content: "C", options: [{key:"A", text:"A"}, {key:"B", text:"B"}], answer: {correct_option_key: "A"} }]
};

export const TestRunner: React.FC = () => {
  const [results, setResults] = useState<{name: string, passed: boolean, msg?: string}[]>([]);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = () => {
    const tests = [
      // Validator Tests
      {
        name: "Validator: Accepts valid bank",
        fn: () => validateQuestionBank(VALID_BANK).valid === true
      },
      {
        name: "Validator: Rejects missing ID",
        fn: () => validateQuestionBank({...VALID_BANK, id: undefined}).valid === false
      },
      {
        name: "Validator: Rejects invalid schema version",
        fn: () => validateQuestionBank({...VALID_BANK, schema_version: "v2"}).valid === false
      },
      {
        name: "Validator: Rejects duplicate question IDs",
        fn: () => {
            const bad = JSON.parse(JSON.stringify(VALID_BANK));
            bad.questions.push(bad.questions[0]); // Duplicate
            return validateQuestionBank(bad).valid === false;
        }
      },
      // Grading Tests
      {
        name: "Grading: Single Choice Correct",
        fn: () => {
          const q: Question = { id:"1", type: QuestionType.SingleChoice, content:"", options:[], answer: {correct_option_key: "A"} };
          return gradeQuestionLocally(q, "A").isCorrect === true;
        }
      },
      {
        name: "Grading: Single Choice Incorrect",
        fn: () => {
          const q: Question = { id:"1", type: QuestionType.SingleChoice, content:"", options:[], answer: {correct_option_key: "A"} };
          return gradeQuestionLocally(q, "B").isCorrect === false;
        }
      },
      {
        name: "Grading: Multiple Choice Exact Match",
        fn: () => {
          const q: Question = { id:"1", type: QuestionType.MultipleChoice, content:"", options:[], answer: {correct_option_keys: ["A", "B"]} };
          return gradeQuestionLocally(q, ["A", "B"]).isCorrect === true;
        }
      },
      {
        name: "Grading: Multiple Choice Partial (Strict Fail)",
        fn: () => {
          const q: Question = { id:"1", type: QuestionType.MultipleChoice, content:"", options:[], answer: {correct_option_keys: ["A", "B"]} };
          return gradeQuestionLocally(q, ["A"]).isCorrect === false; // Strict mode default
        }
      },
      {
        name: "Grading: Fill Blank Case Insensitive",
        fn: () => {
          const q: Question = { id:"1", type: QuestionType.FillBlank, content:"", answer: {expected_answers: ["React"]} };
          return gradeQuestionLocally(q, "react ").isCorrect === true;
        }
      },
      {
        name: "Grading: Fill Blank Regex",
        fn: () => {
          const q: Question = { id:"1", type: QuestionType.FillBlank, content:"", answer: {expected_answers: [], match_regexes: ["^\\d{3}$"]} };
          return gradeQuestionLocally(q, "123").isCorrect === true;
        }
      }
    ];

    const results = tests.map(t => {
      try {
        return { name: t.name, passed: t.fn() };
      } catch (e) {
        return { name: t.name, passed: false, msg: String(e) };
      }
    });

    setResults(results);
  };

  return (
    <div className="p-4 bg-slate-900 text-slate-200 font-mono text-sm rounded-lg shadow-inner">
      <h3 className="font-bold border-b border-slate-700 pb-2 mb-2">Internal Unit Tests</h3>
      <div className="grid grid-cols-1 gap-1">
        {results.map((r, i) => (
          <div key={i} className="flex justify-between">
            <span>{r.name}</span>
            <span className={r.passed ? "text-green-400" : "text-red-400"}>
              [{r.passed ? "PASS" : "FAIL"}] {r.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
