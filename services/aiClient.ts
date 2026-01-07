import { Question, UserResponse, AISettings } from '../types';

/**
 * 题目上下文信息
 */
export interface QuestionContext {
  questionId: string;
  stem: string; // 题干
  options?: Array<{ key: string; text: string }>; // 选项
  userAnswer?: any; // 用户答案
  correctAnswer?: any; // 正确答案
  isCorrect?: boolean; // 是否答对
  analysis?: string; // 解析
}

/**
 * 题库元信息
 */
export interface BankMeta {
  title: string;
  description?: string;
  tags?: string[];
}

/**
 * 流式聊天请求参数
 */
export interface StreamChatPayload {
  bankMeta?: BankMeta;
  questionContext?: QuestionContext;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  aiSettings?: AISettings;
}

/**
 * 流式响应回调
 */
export type OnDeltaCallback = (delta: string) => void;

/**
 * 清理消息内容，移除可能导致 JSON 解析错误的字符
 * 移除流式输出指示符●，确保 JSON 序列化正确
 */
function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  
  try {
    // 移除流式输出指示符●
    let cleaned = content.replace(/●/g, '');
    
    // 使用 TextEncoder/TextDecoder 来确保字符串是有效的 UTF-8
    // 这样可以自动处理孤立的代理对
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    
    // 编码再解码，会自动移除无效字符
    const encoded = encoder.encode(cleaned);
    cleaned = decoder.decode(encoded);
    
    // 额外清理：移除所有孤立的代理对字符（如果还有的话）
    // 代理对范围：0xD800-0xDFFF
    cleaned = cleaned.replace(/[\uD800-\uDFFF]/g, '');
    
    return cleaned;
  } catch (e) {
    // 如果清理失败，使用最保守的方法
    console.warn('Failed to sanitize message content', e);
    // 移除所有可能导致问题的字符
    return content
      .replace(/●/g, '')
      .replace(/[\uD800-\uDFFF]/g, '') // 移除所有代理对字符
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // 移除控制字符
  }
}

/**
 * 安全地序列化 JSON，处理特殊字符
 */
function safeStringify(obj: any): string {
  try {
    // 深度清理所有消息内容
    if (obj.messages && Array.isArray(obj.messages)) {
      const cleanedMessages = obj.messages.map((msg: any) => {
        const cleanedContent = sanitizeMessageContent(String(msg.content || ''));
        return {
          role: msg.role,
          content: cleanedContent
        };
      });
      
      // 创建新对象，避免修改原对象
      const cleanedObj = {
        ...obj,
        messages: cleanedMessages
      };
      
      // 尝试序列化，如果失败则抛出更详细的错误
      const jsonString = JSON.stringify(cleanedObj);
      return jsonString;
    }
    return JSON.stringify(obj);
  } catch (e) {
    console.error('JSON stringify error', e);
    // 尝试找出问题消息
    if (obj.messages) {
      obj.messages.forEach((msg: any, idx: number) => {
        try {
          JSON.stringify({ role: msg.role, content: msg.content });
        } catch (err) {
          console.error(`Problematic message at index ${idx}:`, msg);
        }
      });
    }
    throw new Error(`消息内容包含无效字符，无法序列化: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * 流式聊天接口
 */
export async function streamChat(
  payload: StreamChatPayload,
  onDelta: OnDeltaCallback
): Promise<void> {
  const apiKey = localStorage.getItem('qb_api_key');
  if (!apiKey) {
    throw new Error("API Key 未配置。请在设置中配置你的 DeepSeek API Key。");
  }

  // 构建系统提示词（包含上下文）
  const systemContent = buildSystemPrompt(payload);
  
  // 清理消息内容，移除流式指示符●
  const cleanedMessages = payload.messages.map(msg => ({
    ...msg,
    content: sanitizeMessageContent(msg.content)
  }));
  
  const messages = [
    { role: 'system' as const, content: sanitizeMessageContent(systemContent) },
    ...cleanedMessages
  ];

  const requestBody = {
    model: 'deepseek-chat',
    messages,
    stream: true,
    temperature: 1.0
  };

  // 验证 JSON 是否可以正确序列化
  let requestBodyString: string;
  try {
    requestBodyString = safeStringify(requestBody);
    // 验证可以解析回来
    JSON.parse(requestBodyString);
  } catch (e) {
    console.error('Failed to serialize request body', e);
    console.error('Messages:', messages.map((m, i) => ({ index: i, role: m.role, contentLength: m.content?.length })));
    throw new Error(`无法序列化请求数据: ${e instanceof Error ? e.message : String(e)}`);
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: requestBodyString
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取流式响应');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个不完整的行

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              onDelta(delta);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 构建系统提示词（包含题目上下文）
 */
function buildSystemPrompt(payload: StreamChatPayload): string {
  const { bankMeta, questionContext, aiSettings } = payload;

  let prompt = '';

  // AI 角色设置
  const defaultRole = "你是一位乐于助人的计算机教师。";
  const userRole = aiSettings?.roleName 
    ? `你现在的角色是: ${aiSettings.roleName}。` 
    : defaultRole;
  const customInstruction = aiSettings?.customPrompt 
    ? `额外指令: ${aiSettings.customPrompt}` 
    : '';

  prompt += `${userRole}\n${customInstruction}\n\n`;

  // 题库上下文
  if (bankMeta) {
    prompt += `【题库信息】\n`;
    prompt += `标题: ${bankMeta.title}\n`;
    if (bankMeta.description) {
      prompt += `描述: ${bankMeta.description}\n`;
    }
    if (bankMeta.tags && bankMeta.tags.length > 0) {
      prompt += `标签: ${bankMeta.tags.join(', ')}\n`;
    }
    prompt += '\n';
  }

  // 题目上下文
  if (questionContext) {
    prompt += `【题目信息】\n`;
    prompt += `题目ID: ${questionContext.questionId}\n`;
    prompt += `题干: ${questionContext.stem}\n`;

    if (questionContext.options && questionContext.options.length > 0) {
      prompt += `选项:\n`;
      questionContext.options.forEach(opt => {
        prompt += `  ${opt.key}. ${opt.text}\n`;
      });
    }

    if (questionContext.userAnswer !== undefined) {
      prompt += `用户答案: ${JSON.stringify(questionContext.userAnswer)}\n`;
    }

    if (questionContext.correctAnswer !== undefined) {
      prompt += `正确答案: ${JSON.stringify(questionContext.correctAnswer)}\n`;
    }

    if (questionContext.isCorrect !== undefined) {
      prompt += `判题结果: ${questionContext.isCorrect ? '正确' : '错误'}\n`;
    }

    if (questionContext.analysis) {
      prompt += `解析: ${questionContext.analysis}\n`;
    }

    prompt += '\n';
  }

  prompt += `请用中文有效易懂地回答用户的提问。态度要鼓励用户。`;

  return prompt;
}

/**
 * Mock 流式 AI（用于测试，模拟流式输出）
 */
export async function mockStreamChat(
  payload: StreamChatPayload,
  onDelta: OnDeltaCallback
): Promise<void> {
  // 模拟 AI 回复
  const mockResponse = `你好！关于这道题，我来为你详细解释一下。

**核心概念**

这道题主要考察的是以下知识点：

1. 基础概念理解
2. 实际应用场景
3. 常见错误分析

**详细解答**

让我用一个表格来说明：

| 要点 | 说明 | 示例 |
|------|------|------|
| 关键点1 | 这是第一个重要概念 | \`示例代码\` |
| 关键点2 | 这是第二个重要概念 | 实际应用场景 |

**代码示例**

\`\`\`javascript
// 示例代码
function example() {
  return "Hello World";
}
\`\`\`

希望这个解释对你有帮助！如果还有疑问，随时问我。`;

  // 模拟流式输出（优化：批量输出，减少延迟）
  const words = mockResponse.split('');
  let index = 0;
  
  // 使用更快的输出速度（每批输出多个字符）
  const batchSize = 3; // 每次输出3个字符
  const delay = 10; // 每批延迟10ms，整体更快
  
  while (index < words.length) {
    const batch = words.slice(index, index + batchSize).join('');
    onDelta(batch);
    index += batchSize;
    
    if (index < words.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

