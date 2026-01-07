import { Question, UserResponse, AISettings } from '../types';
import { AI_GRADER_SYSTEM_INSTRUCTION } from '../constants';

const API_URL = "https://api.deepseek.com/chat/completions";

// Helper to check for API Key from localStorage
const getApiKey = () => {
  const key = localStorage.getItem('qb_api_key');
  return key || '';
};

const callDeepSeek = async (messages: any[], jsonMode: boolean = false) => {
  const apiKey = getApiKey();
  if (!apiKey) {
      throw new Error("API Key 未配置。请在设置中配置你的 DeepSeek API Key。");
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  };

  const body: any = {
    model: "deepseek-chat", // DeepSeek V3
    messages: messages,
    stream: false,
    temperature: 1.0 // Standard temperature
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

// --- AI Grading ---

export const gradeWithAI = async (question: Question, userAnswer: string): Promise<{ isCorrect: boolean, score: number, feedback: string }> => {
  try {
    // Ensure system prompt mentions JSON for json_mode to work reliably
    // Although constants.ts likely has it, adding explicit instruction ensures DeepSeek compliance
    const systemPrompt = AI_GRADER_SYSTEM_INSTRUCTION;
    
    const userPrompt = `
题目内容: ${question.content}
参考答案 (若有): ${question.answer.expected_answers?.join(" OR ") || "未严格定义，请根据题目判断"}
用户回答: ${userAnswer}

请务必返回 JSON 格式。
`;

    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ];

    const content = await callDeepSeek(messages, true);
    const result = JSON.parse(content);

    return {
      isCorrect: !!result.is_correct,
      score: typeof result.score === 'number' ? result.score : 0,
      feedback: result.feedback || "无评语"
    };

  } catch (error) {
    console.error("AI Grading Error:", error);
    return { isCorrect: false, score: 0, feedback: "AI 判题服务暂时不可用 (DeepSeek)。" };
  }
};

// --- Ask AI Chat ---

export const getAIExplanation = async (
  question: Question, 
  userResponse: UserResponse, 
  history: {role: 'user'|'model', text: string}[],
  newMessage: string,
  aiSettings?: AISettings
) => {
    
    // Construct system context
    let correctInfo = "";
    if (question.type === 'single_choice') correctInfo = `正确选项 Key: ${question.answer.correct_option_key}`;
    else if (question.type === 'true_false') correctInfo = `正确答案: ${question.answer.correct_boolean}`;
    else if (question.type === 'fill_blank') correctInfo = `参考答案: ${question.answer.expected_answers?.join(', ')}`;
    else if (question.type === 'multiple_choice') correctInfo = `正确选项 Keys: ${question.answer.correct_option_keys?.join(', ')}`;
    
    const defaultRole = "你是一位乐于助人的计算机教师。";
    const userRole = aiSettings?.roleName ? `你现在的角色是: ${aiSettings.roleName}。` : defaultRole;
    const customInstruction = aiSettings?.customPrompt ? `额外指令: ${aiSettings.customPrompt}` : "";

    const contextPrompt = `
${userRole}
${customInstruction}

上下文信息:
题目: "${question.content}"
题型: ${question.type}
解析 (用户暂时不可见): "${question.explanation || '无'}"
用户的回答: "${JSON.stringify(userResponse.userAnswer)}" ，结果为: ${userResponse.isCorrect ? '正确' : '错误'}。
正确答案信息: ${correctInfo}。

请用中文有效易懂地回答用户的后续提问。态度要鼓励用户。
`;

    // Map history: Gemini 'model' -> DeepSeek 'assistant'
    const messages = [
        { role: "system", content: contextPrompt },
        ...history.map(h => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.text
        })),
        { role: "user", content: newMessage }
    ];

    try {
        const content = await callDeepSeek(messages, false);
        return content;
    } catch (e) {
        console.error("Chat Error", e);
        return "连接 AI 失败 (DeepSeek)。";
    }
};