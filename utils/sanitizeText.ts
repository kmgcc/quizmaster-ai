/**
 * 文本清洗工具 - 用于清理代码块中的 HTML 标签残片
 * 
 * 问题场景：
 * - 导入的题库可能包含被破坏的 HTML 标签（如 `color:#569cd6">for`）
 * - 这些残片会在代码高亮时显示为纯文本
 * 
 * 解决方案：
 * 1. 先解码 HTML 实体（有限次，避免无限循环）
 * 2. 删除完整的 HTML 标签
 * 3. 删除半截残片（如 `color:#xxxxxx">`、`#xxxxxx">` 等）
 */

/**
 * 清洗文本，移除所有 HTML 标签和残片，返回纯文本
 * @param text 原始文本
 * @returns 清洗后的纯文本
 */
export function sanitizeForCodeDisplay(text: string): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  let cleaned = text;

  // 步骤1: 有限次 HTML entity decode（最多3次，避免无限循环）
  for (let i = 0; i < 3; i++) {
    const before = cleaned;
    cleaned = cleaned
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
    
    // 如果不再变化，提前退出
    if (before === cleaned) {
      break;
    }
  }

  // 步骤2: 删除完整的 HTML 标签（包括自闭合标签）
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // 步骤3: 删除半截残片
  // 匹配 `color:#xxxxxx">` 或 `"color:#xxxxxx">` 或 `color:#xxxxxx"` 等
  cleaned = cleaned.replace(/["']?color:\s*#[0-9a-fA-F]{3,8}["']?>/g, '');
  
  // 匹配单独的 `#xxxxxx">` 残片（颜色值后跟引号和大于号）
  cleaned = cleaned.replace(/#[0-9a-fA-F]{3,8}["']?>/g, '');
  
  // 匹配 `style="` 或 `style='` 后跟颜色但标签不完整的残片
  cleaned = cleaned.replace(/style\s*=\s*["'][^"']*color[^"']*["']?/g, '');
  
  // 匹配 `span`、`div`、`font` 等标签关键字残留（但不在完整标签中）
  // 只匹配明显是残片的模式：标签名后跟空格或直接跟 `>` 但前面没有 `<`
  cleaned = cleaned.replace(/(?<!<)\b(span|div|font|color|style)\s*[>=:]/g, '');
  
  // 匹配孤立的 `">` 或 `'>`（可能是标签结束符残留）
  cleaned = cleaned.replace(/["']>/g, ' ');

  // 步骤4: 清理多余空格（但保留换行）
  cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/^ +| +$/gm, '');

  return cleaned;
}

/**
 * 检测文本是否包含 HTML 标签残片
 * @param text 待检测文本
 * @returns 如果包含残片返回 true
 */
export function hasHtmlFragments(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // 检测残片特征：
  // 1. 包含 `color:#` 但不包含完整的 `<span` 标签
  // 2. 包含 `#xxxxxx">` 模式
  const hasColorFragment = /color:\s*#[0-9a-fA-F]{3,8}/i.test(text);
  const hasColorHashFragment = /#[0-9a-fA-F]{3,8}["']?>/i.test(text);
  const hasIncompleteTag = /<[^>]*$/.test(text) || /[^<]*>/.test(text);
  
  // 如果包含 color 相关但缺少完整的 span 标签，可能是残片
  if (hasColorFragment && !/<span[^>]*style[^>]*color/i.test(text)) {
    return true;
  }
  
  return hasColorHashFragment || hasIncompleteTag;
}

/**
 * 清洗题库数据（递归清洗所有文本字段）
 */
export function sanitizeQuestionBank(bank: any): any {
  if (!bank || typeof bank !== 'object') {
    return bank;
  }

  const sanitized = { ...bank };

  // 清洗题目内容
  if (Array.isArray(sanitized.questions)) {
    sanitized.questions = sanitized.questions.map((q: any) => {
      const cleaned = { ...q };
      
      // 清洗题干
      if (cleaned.content) {
        cleaned.content = sanitizeForCodeDisplay(cleaned.content);
      }
      
      // 清洗选项文本
      if (Array.isArray(cleaned.options)) {
        cleaned.options = cleaned.options.map((opt: any) => ({
          ...opt,
          text: opt.text ? sanitizeForCodeDisplay(opt.text) : opt.text
        }));
      }
      
      // 清洗解析
      if (cleaned.explanation) {
        cleaned.explanation = sanitizeForCodeDisplay(cleaned.explanation);
      }
      
      return cleaned;
    });
  }

  return sanitized;
}

