import { QuestionBank, QuestionType } from './types';

export const SAMPLE_BANK: QuestionBank = {
  schema_version: "2.0",
  id: "sample_001",
  title: "前端开发基础测试 (Schema V2)",
  description: "包含 React、TypeScript 和 Web 基础概念的示例题库，展示 Markdown 格式支持。",
  tags: ["前端", "javascript", "react"],
  questions: [
    {
      id: "q1",
      type: QuestionType.SingleChoice,
      content: "在 **React** 函数组件中，用于处理副作用（Side Effects）的 Hook 是？\n\n```javascript\nuseEffect(() => {\n  // 副作用代码\n}, [dependencies]);\n```",
      options: [
        { key: "A", text: "useState" },
        { key: "B", text: "useEffect" },
        { key: "C", text: "useContext" },
        { key: "D", text: "useReducer" }
      ],
      answer: { correct_option_key: "B" },
      explanation: "`useEffect` 专门设计用于处理数据获取、订阅等**副作用**。",
      tags: ["React", "Hooks"]
    },
    {
      id: "q2",
      type: QuestionType.MultipleChoice,
      content: "以下哪些是有效的 **CSS** `position` 属性值？（多选）",
      options: [
        { key: "A", text: "static" },
        { key: "B", text: "relative" },
        { key: "C", text: "dynamic" },
        { key: "D", text: "absolute" }
      ],
      answer: { correct_option_keys: ["A", "B", "D"] },
      explanation: "`dynamic` 不是标准的 CSS position 属性值。",
      tags: ["CSS", "布局"]
    },
    {
      id: "q3",
      type: QuestionType.TrueFalse,
      content: "在 TypeScript 中，`any` 和 `unknown` 是**完全相同**的类型。",
      answer: { correct_boolean: false },
      explanation: "不对。`unknown` 是 `any` 的**类型安全**版本。在使用 `unknown` 类型的值之前，必须先进行类型收窄。",
      tags: ["TypeScript", "类型系统"]
    },
    {
      id: "q4",
      type: QuestionType.FillBlank,
      content: "表示「未找到资源」的 HTTP 状态码是多少？\n\n提示：这是最常见的错误状态码之一。",
      answer: { 
        expected_answers: ["404", "404 Not Found"],
        llm_grading: false
      },
      tags: ["HTTP", "状态码"]
    },
    {
      id: "q5",
      type: QuestionType.FillBlank,
      content: "简要解释为什么 React 的**虚拟 DOM**（Virtual DOM）比直接操作真实 DOM 更快？",
      answer: {
        expected_answers: [],
        llm_grading: true
      },
      explanation: "虚拟 DOM 通过将多次更新**批量处理**，并使用 Diff 算法计算出最小变更集，从而减少了昂贵的浏览器重绘和回流。",
      tags: ["React", "性能优化"]
    }
  ],
  created_at: Date.now()
};

export const AI_GRADER_SYSTEM_INSTRUCTION = `
你是一位严格但公正的阅卷老师。
你将接收到一个问题、一个标准答案（可选参考）和一个用户的回答。
你的任务是给用户的回答打分。

请仅输出以下 JSON 格式：
{
  "is_correct": boolean,
  "score": number, // 0.0 到 1.0
  "feedback": string // 简短的中文评语（不超过一句话）
}

规则：
1. 如果意思符合标准答案的意图，给 1.0 分。
2. 如果部分正确，给部分分。
3. 如果完全错误，给 0 分。
4. feedback 必须使用中文。
`;